// MuradERP Database Seeder
// Creates a first admin user and a demo company so you can log in right away.

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../src/utils/password';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@wassel.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`User ${ADMIN_EMAIL} already exists — skipping seed.`);
    return;
  }

  const hashedPassword = await hashPassword(ADMIN_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      firstName: 'Murad',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const company = await prisma.company.create({
    data: {
      name: 'Wassel Demo Co',
      nameAr: 'شركة وصّل التجريبية',
      currency: 'SAR',
      country: 'SA',
      createdById: admin.id,
    },
  });

  console.log('Seed complete:');
  console.log(`  Admin email:    ${ADMIN_EMAIL}`);
  console.log(`  Admin password: ${ADMIN_PASSWORD}`);
  console.log(`  Company:        ${company.name} (${company.id})`);
  console.log('\n⚠️  Change this password after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
