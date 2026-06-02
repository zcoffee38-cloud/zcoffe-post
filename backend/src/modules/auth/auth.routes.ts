import { Router } from 'express';
import { login, getProfile } from './auth.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.post('/login', login);
router.get('/profile', authenticate, getProfile);

export default router;
