import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';

const agents = [
  { email: 'priya.sharma@relay.io', name: 'Priya Sharma', role: 'agent', status: 'online', password: 'agent123' },
  { email: 'marcus.chen@relay.io', name: 'Marcus Chen', role: 'agent', status: 'online', password: 'agent123' },
  { email: 'elena.vasquez@relay.io', name: 'Elena Vasquez', role: 'agent', status: 'away', password: 'agent123' },
  { email: 'james.okonkwo@relay.io', name: 'James Okonkwo', role: 'agent', status: 'busy', password: 'agent123' },
  { email: 'admin@relay.io', name: 'Alex Rivera', role: 'admin', status: 'online', password: 'admin123' },
];

const customers = [
  { name: 'John Davis', email: 'john.davis@acmecorp.com' },
  { name: 'Alice Chen', email: 'alice.chen@techflow.io' },
  { name: 'Mike Ross', email: 'mike.ross@datastack.com' },
  { name: 'Sarah Mitchell', email: 'sarah.m@cloudnine.dev' },
  { name: 'David Park', email: 'david.park@fintech.co' },
];

function code() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const p = () => Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join('');
  return { sessionCode: `RLY-${p()}-${p()}`, inviteCode: `RELAY-${p()}-${p()}` };
}

export async function seedDatabase() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  console.log('Seeding database...');
  const baseUrl = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173';

  for (const a of agents) {
    await prisma.user.create({
      data: {
        ...a,
        password: await bcrypt.hash(a.password, 10),
      },
    });
  }

  console.log('Database seeded with agent accounts successfully.');
}
