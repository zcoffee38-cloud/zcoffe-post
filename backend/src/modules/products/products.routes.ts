import { Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import { productsRepository } from './products.repository';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';

const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', search = '', categoryId, available } = req.query as Record<string, string>;
  const result = await productsRepository.findAll(page, limit, search, categoryId, available);
  return sendSuccess(res, 'Products retrieved', result.products, 200, {
    page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit),
  });
});

const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await productsRepository.findById(req.params.id);
  if (!product) return sendError(res, 'Product not found', 404);
  return sendSuccess(res, 'Product retrieved', product);
});

const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId, name, price, hpp, stock, isAvailable } = req.body;
  if (!categoryId || !name || !price || !hpp) return sendError(res, 'Required fields missing', 400);
  const image = req.file ? req.file.filename : undefined;
  const product = await productsRepository.create({
    categoryId, name, image, price: Number(price), hpp: Number(hpp), stock: Number(stock || 0), isAvailable: isAvailable !== 'false',
  });
  return sendSuccess(res, 'Product created', product, 201);
});

const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await productsRepository.findById(req.params.id);
  if (!existing) return sendError(res, 'Product not found', 404);

  let image = existing.image ?? undefined;
  if (req.file) {
    image = req.file.filename;
    if (existing.image) {
      const oldPath = path.join(process.env.UPLOAD_PATH || 'uploads', existing.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  const { categoryId, name, price, hpp, stock, isAvailable } = req.body;
  const product = await productsRepository.update(req.params.id, {
    ...(categoryId && { categoryId }),
    ...(name && { name }),
    ...(image && { image }),
    ...(price && { price: Number(price) }),
    ...(hpp && { hpp: Number(hpp) }),
    ...(stock !== undefined && { stock: Number(stock) }),
    ...(isAvailable !== undefined && { isAvailable: isAvailable === 'true' || isAvailable === true }),
  });
  return sendSuccess(res, 'Product updated', product);
});

const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await productsRepository.findById(req.params.id);
  if (!existing) return sendError(res, 'Product not found', 404);
  if (existing.image) {
    const imgPath = path.join(process.env.UPLOAD_PATH || 'uploads', existing.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  await productsRepository.delete(req.params.id);
  return sendSuccess(res, 'Product deleted');
});

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('admin'), upload.single('image'), create);
router.post('/:id', authorize('admin'), upload.single('image'), update);
router.put('/:id', authorize('admin'), upload.single('image'), update);
router.delete('/:id', authorize('admin'), remove);

export default router;
