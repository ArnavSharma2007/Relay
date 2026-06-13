import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import type { User } from '../../../shared/types.js';

function toUser(row: {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  password?: string | null;
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User['role'],
    status: row.status as User['status'],
    password: row.password ?? undefined,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { email } });
  return row ? toUser(row) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toUser(row) : null;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.password) return false;
  if (user.password.startsWith('$2')) {
    return bcrypt.compare(password, user.password);
  }
  return user.password === password;
}

export async function getAgents(): Promise<Omit<User, 'password'>[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: ['agent', 'admin'] } },
  });
  return rows.map(({ password: _, ...u }) => toUser(u) as Omit<User, 'password'>);
}

export async function createCustomer(name: string, email: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: { name, status: 'online', role: existing.role === 'customer' ? 'customer' : existing.role },
    });
    return toUser(updated);
  }
  const row = await prisma.user.create({
    data: { email, name, role: 'customer', status: 'online' },
  });
  return toUser(row);
}

export async function updateUserStatus(id: string, status: User['status']) {
  await prisma.user.update({ where: { id }, data: { status } });
}
