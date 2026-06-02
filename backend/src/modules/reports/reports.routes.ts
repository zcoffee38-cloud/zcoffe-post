import { Response, Router } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middlewares/auth';

const getDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaySales, activeQueues, topProducts] = await Promise.all([
    prisma.transaction.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow } },
      _sum: { total: true, totalProfit: true },
      _count: { id: true },
    }),
    prisma.queue.count({ where: { status: { in: ['waiting', 'processing'] }, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.transactionItem.groupBy({
      by: ['productId'],
      where: { transaction: { createdAt: { gte: today, lt: tomorrow } } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: 5,
    }),
  ]);

  const topProductsWithNames = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true, image: true } });
      return { ...product, productId: item.productId, totalQty: item._sum.qty };
    })
  );

  return sendSuccess(res, 'Dashboard data retrieved', {
    todaySales: todaySales._sum.total || 0,
    todayTransactions: todaySales._count.id,
    todayProfit: todaySales._sum.totalProfit || 0,
    activeQueues,
    topProducts: topProductsWithNames,
  });
});

const getSalesReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;

  const start = startDate ? new Date(startDate) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { items: { include: { product: { select: { name: true } } } }, createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const summary = transactions.reduce((acc, t) => ({
    totalRevenue: acc.totalRevenue + t.total,
    totalProfit: acc.totalProfit + t.totalProfit,
    totalTransactions: acc.totalTransactions + 1,
  }), { totalRevenue: 0, totalProfit: 0, totalTransactions: 0 });

  return sendSuccess(res, 'Sales report retrieved', { summary, transactions });
});

const getTopProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, limit = '10' } = req.query as Record<string, string>;

  const start = startDate ? new Date(startDate) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
  const end = endDate ? new Date(endDate) : new Date();

  const topProducts = await prisma.transactionItem.groupBy({
    by: ['productId'],
    where: { transaction: { createdAt: { gte: start, lte: end } } },
    _sum: { qty: true, subtotal: true },
    orderBy: { _sum: { qty: 'desc' } },
    take: Number(limit),
  });

  const result = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true, image: true, price: true } });
      return { ...product, productId: item.productId, totalQty: item._sum.qty, totalRevenue: item._sum.subtotal };
    })
  );

  return sendSuccess(res, 'Top products retrieved', result);
});

const router = Router();
router.use(authenticate, authorize('admin', 'owner'));
router.get('/dashboard', authenticate, router.get.bind(router));
router.get('/sales', getSalesReport);
router.get('/top-products', getTopProducts);

// Re-export dashboard separately (accessible by all roles)
export { getDashboard };

const reportRouter = Router();
reportRouter.use(authenticate);
reportRouter.get('/dashboard', getDashboard);
reportRouter.get('/sales', authorize('admin', 'owner'), getSalesReport);
reportRouter.get('/top-products', authorize('admin', 'owner'), getTopProducts);

export default reportRouter;
