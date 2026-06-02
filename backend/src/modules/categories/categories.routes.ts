import { Response, Router } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middlewares/auth';

const getAll = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  return sendSuccess(res, 'Categories retrieved', categories);
});

const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return sendError(res, 'Name is required', 400);
  try {
    const category = await prisma.category.create({ data: { name } });
    return sendSuccess(res, 'Category created', category, 201);
  } catch {
    return sendError(res, 'Category already exists', 409);
  }
});

const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await prisma.category.update({ where: { id: req.params.id }, data: { name: req.body.name } });
  return sendSuccess(res, 'Category updated', category);
});

const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  return sendSuccess(res, 'Category deleted');
});

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.post('/', authorize('admin'), create);
router.put('/:id', authorize('admin'), update);
router.delete('/:id', authorize('admin'), remove);

export default router;
