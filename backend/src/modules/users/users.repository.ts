import prisma from '../../config/database';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getPagination } from '../../utils/response';

export const usersRepository = {
  findAll: async (page: string, limit: string, search: string) => {
    const { skip, page: p, limit: l } = getPagination(page, limit);
    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: l, select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page: p, limit: l };
  },
  create: async (name: string, email: string, password: string, role: Role) => {
    const hashed = await bcrypt.hash(password, 10);
    return prisma.user.create({ data: { name, email, password: hashed, role }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  },
  update: async (id: string, data: { name?: string; email?: string; password?: string; role?: Role }) => {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  },
  delete: (id: string) => prisma.user.delete({ where: { id } }),
};
