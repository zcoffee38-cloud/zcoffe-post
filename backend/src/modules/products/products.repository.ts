import prisma from '../../config/database';
import { getPagination } from '../../utils/response';

export const productsRepository = {
  findAll: async (page: string, limit: string, search: string, categoryId?: string, available?: string) => {
    const { skip, page: p, limit: l } = getPagination(page, limit);
    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (available !== undefined) where.isAvailable = available === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: l,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total, page: p, limit: l };
  },

  findById: (id: string) =>
    prisma.product.findUnique({ where: { id }, include: { category: true } }),

  create: (data: { categoryId: string; name: string; image?: string; price: number; hpp: number; stock: number; isAvailable?: boolean }) =>
    prisma.product.create({ data, include: { category: true } }),

  update: (id: string, data: Partial<{ categoryId: string; name: string; image: string; price: number; hpp: number; stock: number; isAvailable: boolean }>) =>
    prisma.product.update({ where: { id }, data, include: { category: true } }),

  delete: (id: string) => prisma.product.delete({ where: { id } }),

  updateStock: async (id: string, qty: number, type: 'in' | 'out' | 'adjustment', note?: string) => {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) throw new Error('Product not found');

      let newStock = product.stock;
      if (type === 'in') newStock += qty;
      else if (type === 'out') newStock = Math.max(0, newStock - qty);
      else newStock = qty;

      const [updated] = await Promise.all([
        tx.product.update({ where: { id }, data: { stock: newStock, isAvailable: newStock > 0 } }),
        tx.stockLog.create({ data: { productId: id, type, qty, note } }),
      ]);
      return updated;
    });
  },
};
