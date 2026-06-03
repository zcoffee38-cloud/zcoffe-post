import prisma from '../../config/database';

export const settingsRepository = {
  findAll: async () => {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    return settingsMap;
  },

  updateMany: async (data: Record<string, string>) => {
    const transactions = Object.entries(data).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });
    await prisma.$transaction(transactions);
    return settingsRepository.findAll();
  },
};
