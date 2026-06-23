const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  console.log('🔌 Connecting to PostgreSQL on Railway...');
  try {
    // Check connection by querying users count
    const userCount = await prisma.user.count();
    console.log(`✅ Connected! Found ${userCount} users in PostgreSQL.`);

    console.log('📦 Fetching all table data...');
    
    const users = await prisma.user.findMany();
    const categories = await prisma.category.findMany();
    const products = await prisma.product.findMany();
    const transactions = await prisma.transaction.findMany();
    const transactionItems = await prisma.transactionItem.findMany();
    const queues = await prisma.queue.findMany();
    const stockLogs = await prisma.stockLog.findMany();
    const settings = await prisma.setting.findMany();

    const data = {
      users,
      categories,
      products,
      transactions,
      transactionItems,
      queues,
      stockLogs,
      settings
    };

    const outputPath = path.join(__dirname, 'migration_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log('');
    console.log('🎉 Export Successful!');
    console.log(`📁 File saved to: ${outputPath}`);
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Transaction Items: ${transactionItems.length}`);
    console.log(`   - Queues: ${queues.length}`);
    console.log(`   - Stock Logs: ${stockLogs.length}`);
    console.log(`   - Settings: ${settings.length}`);
    console.log('');
    console.log('👉 Next step: Upload "migration_data.json" to cPanel alongside the "import.php" script.');
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
