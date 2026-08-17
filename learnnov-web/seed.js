const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.create({ data: { name: 'سارة (مدير النظام)', email: 'sara.admin@learnnov.com', password: 'Password123!', role: 'admin' } });
  await prisma.user.create({ data: { name: 'د. علي', email: 'dr.ali@learnnov.com', password: 'Password123!', role: 'instructor' } });
  await prisma.user.create({ data: { name: 'طالب تجريبي', email: 'student.demo@learnnov.com', password: 'Password123!', role: 'student' } });
  console.log('Seeded users successfully!');
}
main().catch(console.error).finally(async () => await prisma.$disconnect());
