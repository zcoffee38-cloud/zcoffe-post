import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@zcoffee.id' },
    update: {},
    create: { name: 'Admin Z Coffee', email: 'admin@zcoffee.id', password: hashedPassword, role: Role.admin },
  });
  await prisma.user.upsert({
    where: { email: 'owner@zcoffee.id' },
    update: {},
    create: { name: 'Owner Z Coffee', email: 'owner@zcoffee.id', password: hashedPassword, role: Role.owner },
  });
  await prisma.user.upsert({
    where: { email: 'kasir@zcoffee.id' },
    update: {},
    create: { name: 'Kasir 1', email: 'kasir@zcoffee.id', password: hashedPassword, role: Role.kasir },
  });

  // Categories
  const categories = ['Kopi', 'Non-Kopi', 'Makanan', 'Minuman Botol'];
  const createdCategories: Record<string, string> = {};

  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    createdCategories[name] = cat.id;
  }

  // Products
  const products = [
    { name: 'Americano', categoryId: createdCategories['Kopi'], price: 20000, hpp: 8000, stock: 100 },
    { name: 'Cappuccino', categoryId: createdCategories['Kopi'], price: 25000, hpp: 10000, stock: 100 },
    { name: 'Latte', categoryId: createdCategories['Kopi'], price: 28000, hpp: 11000, stock: 100 },
    { name: 'V60 Filter', categoryId: createdCategories['Kopi'], price: 30000, hpp: 12000, stock: 50 },
    { name: 'Espresso', categoryId: createdCategories['Kopi'], price: 18000, hpp: 7000, stock: 100 },
    { name: 'Matcha Latte', categoryId: createdCategories['Non-Kopi'], price: 28000, hpp: 10000, stock: 80 },
    { name: 'Chocolate', categoryId: createdCategories['Non-Kopi'], price: 25000, hpp: 9000, stock: 80 },
    { name: 'Thai Tea', categoryId: createdCategories['Non-Kopi'], price: 22000, hpp: 8000, stock: 80 },
    { name: 'Croissant', categoryId: createdCategories['Makanan'], price: 20000, hpp: 10000, stock: 30 },
    { name: 'Sandwich', categoryId: createdCategories['Makanan'], price: 35000, hpp: 18000, stock: 20 },
    { name: 'Air Mineral', categoryId: createdCategories['Minuman Botol'], price: 8000, hpp: 3000, stock: 50 },
    { name: 'Teh Botol', categoryId: createdCategories['Minuman Botol'], price: 10000, hpp: 4000, stock: 50 },
  ];

  for (const product of products) {
    await prisma.product.create({ data: { ...product, isAvailable: true } });
  }

  // Settings
  const settings = [
    { key: 'shop_name', value: 'Z Coffee' },
    { key: 'shop_address', value: 'Jl. Contoh Alamat Toko No. 123, Jakarta' },
    { key: 'shop_phone', value: '0812-3456-7890' },
    { key: 'receipt_footer', value: 'Terima kasih atas kunjungan Anda!' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('👤 Accounts:');
  console.log('   admin@zcoffee.id  / password123 (admin)');
  console.log('   owner@zcoffee.id  / password123 (owner)');
  console.log('   kasir@zcoffee.id  / password123 (kasir)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
