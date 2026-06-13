import { prisma } from './db/client.js';

async function check() {
  await prisma.$connect();
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('--- Last 5 Sessions ---');
  sessions.forEach((s) => {
    console.log(`ID: ${s.id}`);
    console.log(`Code: ${s.sessionCode}`);
    console.log(`Customer: ${s.customerName} (${s.customerEmail})`);
    console.log(`Status: ${s.status}`);
    console.log(`Created: ${s.createdAt.toISOString()}`);
    console.log('-----------------------');
  });

  const activityEvents = await prisma.activityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('--- Last 5 Activity Events ---');
  activityEvents.forEach((ae) => {
    console.log(`Event: ${ae.text} (${ae.type}) at ${ae.createdAt.toISOString()}`);
  });
}

check().catch(console.error);
