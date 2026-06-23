import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const schemaPath = path.join(__dirname, 'schema.prisma');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not defined in backend/.env');
  process.exit(1);
}

let provider = '';
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  provider = 'postgresql';
} else if (databaseUrl.startsWith('mysql://')) {
  provider = 'mysql';
} else {
  console.warn(`⚠️ Warning: Unknown database protocol in DATABASE_URL. Defaulting schema provider to 'postgresql'.`);
  provider = 'postgresql';
}

try {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Find the provider = "..." line in datasource db block
  const datasourceRegex = /datasource\s+db\s*{[^}]*provider\s*=\s*"([^"]+)"[^}]*}/s;
  const match = datasourceRegex.exec(schemaContent);
  
  if (match) {
    const currentProvider = match[1];
    if (currentProvider !== provider) {
      console.log(`🔄 Switching database provider in schema.prisma: ${currentProvider} -> ${provider}`);
      
      // Replace the provider line
      const updatedSchemaContent = schemaContent.replace(
        /(datasource\s+db\s*{[^}]*provider\s*=\s*")([^"]+)("[^}]*})/s,
        `$1${provider}$3`
      );
      
      fs.writeFileSync(schemaPath, updatedSchemaContent, 'utf8');
      console.log('✅ schema.prisma updated successfully.');
    } else {
      console.log(`ℹ️ Database provider in schema.prisma is already configured as '${provider}'.`);
    }
  } else {
    console.error('❌ Error: Could not find datasource db block with provider in schema.prisma');
  }
} catch (error) {
  console.error('❌ Error updating schema.prisma:', error);
  process.exit(1);
}
