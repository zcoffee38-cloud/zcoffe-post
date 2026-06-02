import { Response, Router } from 'express';
import { Server } from 'socket.io';
import prisma from '../../config/database';
import { sendSuccess, sendError, getPagination } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate } from '../../middlewares/auth';
import { generateInvoiceNumber } from '../../utils/invoice';

let io: Server;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

const createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, paymentMethod, cashAmount } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return sendError(res, 'Items are required', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    let total = 0;
    let totalProfit = 0;
    const itemsData: { productId: string; qty: number; price: number; hpp: number; subtotal: number }[] = [];

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.qty) throw new Error(`Insufficient stock for ${product.name}`);

      const subtotal = product.price * item.qty;
      const profit = (product.price - product.hpp) * item.qty;
      total += subtotal;
      totalProfit += profit;

      itemsData.push({ productId: product.id, qty: item.qty, price: product.price, hpp: product.hpp, subtotal });

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.qty }, isAvailable: product.stock - item.qty > 0 },
      });

      await tx.stockLog.create({
        data: { productId: product.id, type: 'out', qty: item.qty, note: `Sale transaction` },
      });
    }

    const invoiceNumber = generateInvoiceNumber();
    const transaction = await tx.transaction.create({
      data: {
        invoiceNumber,
        total,
        totalProfit,
        paymentMethod,
        cashAmount: cashAmount ? Number(cashAmount) : null,
        changeAmount: cashAmount ? Number(cashAmount) - total : null,
        createdById: req.user!.userId,
        items: { create: itemsData },
      },
      include: { items: { include: { product: true } }, createdBy: { select: { name: true } } },
    });

    // Get today's queue count for queue number
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const queueCount = await tx.queue.count({ where: { createdAt: { gte: today } } });

    const queue = await tx.queue.create({
      data: { queueNumber: queueCount + 1, transactionId: transaction.id },
    });

    return { transaction, queue };
  });

  // Emit new queue to all clients
  if (io) {
    io.emit('queue:new', {
      id: result.queue.id,
      queueNumber: result.queue.queueNumber,
      status: result.queue.status,
      transactionId: result.queue.transactionId,
      invoice: result.transaction.invoiceNumber,
      items: result.transaction.items.map(i => ({ name: i.product.name, qty: i.qty })),
      createdAt: result.queue.createdAt,
    });
  }

  return sendSuccess(res, 'Transaction created', result, 201);
});

const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', date } = req.query as Record<string, string>;
  const { skip, page: p, limit: l } = getPagination(page, limit);

  const where: Record<string, unknown> = {};
  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.createdAt = { gte: d, lt: nextDay };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where, skip, take: l,
      include: { items: { include: { product: { select: { name: true } } } }, createdBy: { select: { name: true } }, queue: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  return sendSuccess(res, 'Transactions retrieved', transactions, 200, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
});

const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, createdBy: { select: { name: true } }, queue: true },
  });
  if (!transaction) return sendError(res, 'Transaction not found', 404);
  return sendSuccess(res, 'Transaction retrieved', transaction);
});

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', createTransaction);

export default router;
