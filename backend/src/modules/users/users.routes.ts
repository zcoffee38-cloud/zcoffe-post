import { Response, Router } from 'express';
import { usersRepository } from './users.repository';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middlewares/auth';

// Controller
const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', search = '' } = req.query as Record<string, string>;
  const { users, total, page: p, limit: l } = await usersRepository.findAll(page, limit, search);
  return sendSuccess(res, 'Users retrieved', users, 200, { page: p, limit: l, total, totalPages: Math.ceil(total / l) });
});

const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return sendError(res, 'All fields required', 400);
  try {
    const user = await usersRepository.create(name, email, password, role);
    return sendSuccess(res, 'User created', user, 201);
  } catch {
    return sendError(res, 'Email already exists', 409);
  }
});

const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = await usersRepository.update(id, req.body);
  return sendSuccess(res, 'User updated', user);
});

const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  await usersRepository.delete(req.params.id);
  return sendSuccess(res, 'User deleted');
});

// Routes
const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
