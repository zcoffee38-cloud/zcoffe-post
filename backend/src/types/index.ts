import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
