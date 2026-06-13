import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { connectSocket } from '@/lib/socket';

type Tab = 'agent' | 'customer';

export function Login() {
  const [tab,        setTab]        = useState<Tab>('agent');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinLink,   setJoinLink]   = useState('');
  const [loading,    setLoading]    = useState(false);

  const setAuth  = useAuthStore((s) => s.setAuth);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setTab('customer');
      setInviteCode(code.toUpperCase());
    }
  }, [searchParams]);

  const handleAgentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.user);
      connectSocket();
      addToast('success', `Signed in as ${data.user.name}`);
      navigate('/dashboard');
    } catch {
      addToast('error', 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerJoin = async (code?: string) => {
    const finalCode = code || inviteCode;
    if (!finalCode) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/join', { inviteCode: finalCode });
      setAuth(data.token, data.user);
      connectSocket();
      navigate(`/call/${data.session.id}`);
    } catch {
      addToast('error', 'Invalid or expired invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkJoin = () => {
    const match = joinLink.match(/RELAY-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
    if (match) handleCustomerJoin(match[0]);
    else addToast('error', 'Could not find a valid invite code in that link');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Animated background orbs */}
      <div
        className="absolute float-orb pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 70%)',
          top: '-150px',
          left: '-150px',
          animationDuration: '10s',
        }}
      />
      <div
        className="absolute float-orb pointer-events-none"
        style={{
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)',
          bottom: '-100px',
          right: '-100px',
          animationDuration: '13s',
          animationDelay: '-5s',
        }}
      />

      {/* Grid lines decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124,92,252,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,92,252,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px]"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(13, 15, 26, 0.88)',
            border: '1px solid var(--border-accent)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--primary-dim) inset',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--primary-dim) 0%, var(--cyan-dim) 100%)',
                border: '1px solid var(--border-accent)',
                boxShadow: '0 0 20px var(--primary-glow)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <circle cx="8"  cy="16" r="4"  fill="var(--primary)" />
                <circle cx="24" cy="8"  r="3"  fill="var(--cyan)" opacity="0.8" />
                <circle cx="24" cy="24" r="3"  fill="var(--cyan)" opacity="0.8" />
                <line x1="12" y1="14" x2="21" y2="9.5"  stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="18" x2="21" y2="22.5" stroke="url(#lg2)" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="lg1" x1="12" y1="14" x2="21" y2="9.5"  gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--cyan)" />
                  </linearGradient>
                  <linearGradient id="lg2" x1="12" y1="18" x2="21" y2="22.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--cyan)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-wider gradient-text">RELAY</span>
          </motion.div>

          {/* Tab bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex rounded-full p-1 mb-7"
            style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
          >
            {(['agent', 'customer'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative flex-1 py-2 text-[13px] font-medium rounded-full transition-all"
                style={{
                  color: tab === t ? 'white' : 'var(--muted)',
                  zIndex: 1,
                }}
              >
                {tab === t && (
                  <motion.span
                    layoutId="login-tab-bg"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,92,252,0.35) 0%, rgba(0,229,255,0.18) 100%)',
                      border: '1px solid rgba(124,92,252,0.4)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">
                  {t === 'agent' ? 'Support Agent' : 'Customer Join'}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Form content */}
          <AnimatePresence mode="wait">
            {tab === 'agent' ? (
              <motion.form
                key="agent"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleAgentLogin}
                className="space-y-4"
              >
                <Input
                  label="Email"
                  type="email"
                  placeholder="agent@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>

                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  or
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                </div>

                <Button type="button" variant="secondary" className="w-full gap-3">
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--muted)' }}
                  >
                    SSO
                  </span>
                  Continue with SSO
                </Button>

                <button
                  type="button"
                  className="text-[13px] w-full text-center transition-opacity hover:opacity-70"
                  style={{ color: 'var(--primary-light)' }}
                >
                  Forgot password
                </button>

                <p className="text-[11px] text-center" style={{ color: 'var(--subtle)' }}>
                  Demo: priya.sharma@relay.io / agent123
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="customer"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                    Your invite code
                  </label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="RELAY-XXXX-XXXX"
                    className="h-12 px-4 text-lg font-mono tracking-[0.08em] text-center rounded-xl outline-none transition-all"
                    style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124,92,252,0.5)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleCustomerJoin()}
                  disabled={loading || !inviteCode}
                >
                  Join Session
                </Button>

                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  Or
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                    Join via link
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--subtle)' }}>
                    Paste your support link here
                  </p>
                  <Input
                    placeholder="https://relay.io/join/RELAY-…"
                    value={joinLink}
                    onChange={(e) => setJoinLink(e.target.value)}
                  />
                </div>
                <Button variant="secondary" className="w-full" onClick={handleLinkJoin} disabled={loading}>
                  Join from Link
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
