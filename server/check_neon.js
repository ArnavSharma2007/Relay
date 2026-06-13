import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USERS ---');
  console.log(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('--- RECENT SESSIONS ---');
  console.log(sessions.map(s => ({
    id: s.id,
    sessionCode: s.sessionCode,
    inviteCode: s.inviteCode,
    customerEmail: s.customerEmail,
    status: s.status,
    createdAt: s.createdAt
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
