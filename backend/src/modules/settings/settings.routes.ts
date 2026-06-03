import { Response, Router } from 'express';
import { settingsRepository } from './settings.repository';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middlewares/auth';

const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await settingsRepository.findAll();
  return sendSuccess(res, 'Settings retrieved', settings);
});

const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return sendError(res, 'Invalid settings format. Expected an object.', 400);
  }
  const updatedSettings = await settingsRepository.updateMany(settings);
  return sendSuccess(res, 'Settings updated', updatedSettings);
});

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('admin'), updateSettings);

export default router;
