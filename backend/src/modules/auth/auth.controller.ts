import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 'Email and password are required', 400);
  }
  try {
    const result = await authService.login(email, password);
    return sendSuccess(res, 'Login successful', result);
  } catch (err: unknown) {
    return sendError(res, (err as Error).message, 401);
  }
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.userId);
  return sendSuccess(res, 'Profile retrieved', user);
});
