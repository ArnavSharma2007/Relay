import { prisma } from './src/db/client.js';

async function main() {
  console.log('Cleaning up mock/placeholder data from the database...');

  // 1. Delete all sessions (cascades to ChatMessage, TimelineEvent, SessionFile, Recording, Participant)
  const sessionDelete = await prisma.session.deleteMany();
  console.log(`Deleted ${sessionDelete.count} sessions.`);

  // 2. Delete all customer users
  const customerDelete = await prisma.user.deleteMany({
    where: { role: 'customer' }
  });
  console.log(`Deleted ${customerDelete.count} customer users.`);

  // 3. Delete all activities
  const activityDelete = await prisma.activityEvent.deleteMany();
  console.log(`Deleted ${activityDelete.count} activity events.`);

  // 4. Delete all admin events
  const adminDelete = await prisma.adminEvent.deleteMany();
  console.log(`Deleted ${adminDelete.count} admin events.`);

  console.log('Database clean completed successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
