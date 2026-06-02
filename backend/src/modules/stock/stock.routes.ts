import { Response, Router } from 'express';
import prisma from '../../config/database';
import { productsRepository } from '../products/products.repository';
import { sendSuccess, sendError, getPagination } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middlewares/auth';

const getStockLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', productId } = req.query as Record<string, string>;
  const { skip, page: p, limit: l } = getPagination(page, limit);

  const where = productId ? { productId } : {};
  const [logs, total] = await Promise.all([
    prisma.stockLog.findMany({
      where, skip, take: l,
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockLog.count({ where }),
  ]);

  return sendSuccess(res, 'Stock logs retrieved', logs, 200, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
});

const adjustStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, type, qty, note } = req.body;
  if (!productId || !type || qty === undefined) return sendError(res, 'Required fields missing', 400);

  const updated = await productsRepository.updateStock(productId, Number(qty), type, note);
  return sendSuccess(res, 'Stock adjusted', updated);
});

const router = Router();
router.use(authenticate);
router.get('/logs', getStockLogs);
router.post('/adjust', authorize('admin'), adjustStock);

export default router;
