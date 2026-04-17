require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Using connection string:', connectionString.replace(/:[^:@]+@/, ':***@')); // Hide password

  try {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log('Testing connection...');
    const result = await prisma.student.count();
    console.log('Connection successful! Total students:', result);

    const attendances = await prisma.attendance.count();
    console.log('Total attendances:', attendances);

  } catch (error) {
    console.error('Connection failed!');
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
