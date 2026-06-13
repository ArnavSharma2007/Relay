import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activity = await prisma.activityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log('=== ACTIVITY EVENTS ===');
  activity.forEach(a => {
    console.log(`[${a.createdAt.toISOString()}] (${a.type}) by ${a.actor}: ${a.text}`);
  });

  const admin = await prisma.adminEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log('\n=== ADMIN EVENTS ===');
  admin.forEach(a => {
    console.log(`[${a.createdAt.toISOString()}] [${a.severity}] from ${a.source}: ${a.message}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
