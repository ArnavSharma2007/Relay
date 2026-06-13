import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Radio,
  HardDrive,
  History,
  BarChart3,
  Shield,
  Settings,
  User,
  Bell,
  Plus,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/live-sessions',  label: 'Live',           icon: Radio },
  { to: '/recordings',     label: 'Recordings',     icon: HardDrive },
  { to: '/session-history',label: 'History',        icon: History },
  { to: '/analytics',      label: 'Analytics',      icon: BarChart3 },
  { to: '/admin',          label: 'Admin',          icon: Shield, adminOnly: true },
];

const statusColors: Record<string, string> = {
  online:  'bg-[var(--success)]',
  away:    'bg-[var(--warning)]',
  busy:    'bg-[var(--danger)]',
  offline: 'bg-[var(--muted)]',
};

export function Sidebar() {
  const user           = useAuthStore((s) => s.user);
  const logout         = useAuthStore((s) => s.logout);
  const notifications  = useUIStore((s) => s.notifications);
  const markAllRead    = useUIStore((s) => s.markAllRead);
  const unreadCount    = notifications.filter((n) => !n.read).length;

  const [showNotifs,  setShowNotifs]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifsRef.current  && !notifsRef.current.contains(e.target as Node))  setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleItems = navItems.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || user?.role === 'admin'
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center px-6 nav-enter"
      style={{ height: 'var(--nav-h)' }}
    >
      {/* ── Pill container ───────────────────────────────── */}
      <div
        className="relative flex items-center gap-2 px-3 py-2 w-full max-w-[900px]"
        style={{
          background:   'rgba(11, 12, 22, 0.82)',
          border:       '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-pill)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.55), 0 0 0 1px var(--primary-dim) inset',
        }}
      >
        {/* ── Logo ─────────────────────────────────────── */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 pl-1 pr-3 flex-shrink-0"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--primary-dim) 0%, var(--cyan-dim) 100%)',
              border: '1px solid var(--border-accent)',
              boxShadow: '0 0 12px var(--primary-glow)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <circle cx="8"  cy="16" r="4"  fill="var(--primary)" />
              <circle cx="24" cy="8"  r="3"  fill="var(--cyan)" opacity="0.8" />
              <circle cx="24" cy="24" r="3"  fill="var(--cyan)" opacity="0.8" />
              <line x1="12" y1="14" x2="21" y2="9.5"  stroke="url(#ng1)" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="21" y2="22.5" stroke="url(#ng2)" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="ng1" x1="12" y1="14" x2="21" y2="9.5"  gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--cyan)" />
                </linearGradient>
                <linearGradient id="ng2" x1="12" y1="18" x2="21" y2="22.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--cyan)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span
            className="text-[15px] font-bold tracking-wider gradient-text hidden sm:block"
            style={{ letterSpacing: '0.1em' }}
          >
            RELAY
          </span>
        </Link>

        {/* ── Divider ───────────────────────────────────── */}
        <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--border-accent)' }} />

        {/* ── Nav links ─────────────────────────────────── */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'text-white'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'linear-gradient(135deg, var(--primary-dim) 0%, var(--cyan-dim) 100%)',
                      boxShadow: '0 0 12px var(--primary-glow)',
                      border: '1px solid var(--border-accent)',
                    }
                  : {}
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={14}
                    className="flex-shrink-0"
                    style={isActive ? { color: 'var(--primary-light)' } : {}}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill-indicator"
                      className="sr-only"
                      transition={{ duration: 0.25, type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Right side controls ───────────────────────── */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto pl-2">
          {/* Status badge */}
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              background: 'var(--success-dim)',
              color: 'var(--success)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--success)' }} />
            Online
          </span>

          {/* New Session */}
          {user?.role !== 'customer' && (
            <Link
              to="/live-sessions"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                color: 'var(--muted)',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'white';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,92,252,0.3)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Plus size={13} />
              New
            </Link>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifsRef}>
            <button
              onClick={() => { setShowNotifs((v) => !v); setShowProfile(false); }}
              className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'white';
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: 'var(--danger)', boxShadow: '0 0 6px var(--danger)' }}
                />
              )}
            </button>

            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-3 w-80 rounded-[var(--radius-lg)] overflow-hidden z-50"
                  style={{
                    background: 'rgba(13, 15, 26, 0.95)',
                    border: '1px solid rgba(124,92,252,0.25)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs hover:underline"
                        style={{ color: 'var(--primary-light)' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--muted)' }}>
                        No recent notifications
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 text-sm"
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: !n.read ? 'rgba(124,92,252,0.06)' : 'transparent',
                          }}
                        >
                          <p style={{ color: 'var(--text)' }}>{n.text}</p>
                          <p className="text-[11px] mt-1 font-mono" style={{ color: 'var(--muted)' }}>
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile((v) => !v); setShowNotifs(false); }}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-all"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,92,252,0.3)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <div
                  className="relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #7c5cfc, #00e5ff)',
                    color: 'white',
                  }}
                >
                  {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[rgba(11,12,22,0.9)] ${statusColors[user.status]}`}
                  />
                </div>
                <ChevronDown size={11} style={{ color: 'var(--muted)' }} />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-3 w-56 rounded-[var(--radius-lg)] overflow-hidden z-50"
                    style={{
                      background: 'rgba(13, 15, 26, 0.95)',
                      border: '1px solid rgba(124,92,252,0.25)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* User info */}
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <p className="text-[13px] font-semibold truncate">{user.name}</p>
                      <p className="text-[11px] capitalize" style={{ color: 'var(--muted)' }}>
                        {user.role} · {user.status}
                      </p>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      {[
                        { to: '/profile',  label: 'Profile',  icon: User },
                        { to: '/settings', label: 'Settings', icon: Settings },
                      ].map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors"
                          style={{ color: 'var(--muted)', textDecoration: 'none' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = 'white';
                            (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          <Icon size={14} />
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)' }} className="py-1">
                      <button
                        onClick={() => { logout?.(); setShowProfile(false); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] w-full text-left transition-colors"
                        style={{ color: 'var(--danger)' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
