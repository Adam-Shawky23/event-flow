import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:@localhost:5432/eventflow',
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@eventflow.com',
      phone: '0000000000',
      address: 'Admin Street 1',
      city: 'Athens',
      country: 'Greece',
      vatNumber: '000000000',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  console.log('Admin user seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());