import { Response, Router } from 'express';
import { Server } from 'socket.io';
import prisma from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate } from '../../middlewares/auth';
import { QueueStatus } from '@prisma/client';

let io: Server;

export const setQueueSocketIO = (socketIO: Server) => {
  io = socketIO;
};

const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, date } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.createdAt = { gte: d, lt: nextDay };
  } else {
    // Default: today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.createdAt = { gte: today, lt: tomorrow };
  }

  const queues = await prisma.queue.findMany({
    where,
    include: {
      transaction: {
        include: {
          items: { include: { product: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
      },
    },
    orderBy: { queueNumber: 'asc' },
  });

  return sendSuccess(res, 'Queues retrieved', queues);
});

const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['waiting', 'processing', 'done'].includes(status)) {
    return sendError(res, 'Invalid status', 400);
  }

  const queue = await prisma.queue.update({
    where: { id },
    data: { status: status as QueueStatus },
    include: {
      transaction: {
        include: { items: { include: { product: { select: { name: true } } } } },
      },
    },
  });

  if (io) {
    io.emit('queue:updated', queue);
  }

  return sendSuccess(res, 'Queue status updated', queue);
});

const router = Router();
router.use(authenticate);
router.get('/', getAll);
router.patch('/:id/status', updateStatus);

export default router;
