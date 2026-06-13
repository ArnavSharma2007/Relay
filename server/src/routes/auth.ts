import { Router } from 'express';
import { findUserByEmail, verifyPassword, createCustomer } from '../services/userService.js';
import { getSessionByInviteCode } from '../services/sessionService.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(user, password))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (user.role === 'customer') {
    res.status(403).json({ error: 'Use invite code to join as customer' });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json({ token: generateToken(user), user: safeUser });
});

router.post('/join', async (req, res) => {
  const { inviteCode, name, email } = req.body;
  if (!inviteCode) {
    res.status(400).json({ error: 'Invite code required' });
    return;
  }

  const session = await getSessionByInviteCode(inviteCode);
  if (!session) {
    res.status(404).json({ error: 'Invalid invite code' });
    return;
  }

  if (session.status === 'ended' || session.status === 'failed') {
    res.status(400).json({ error: 'This session has ended' });
    return;
  }

  const customer = await createCustomer(name || session.customerName, email || session.customerEmail);
  const { password: _, ...safeUser } = customer;
  res.json({ token: generateToken(customer), session, user: safeUser });
});

export default router;
