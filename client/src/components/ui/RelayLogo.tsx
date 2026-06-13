interface RelayLogoProps {
  size?: 'sm' | 'md';
}

export function RelayLogo({ size = 'md' }: RelayLogoProps) {
  const box  = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const icon = size === 'sm' ? 14 : 16;

  return (
    <div
      className={`${box} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{
        background: 'linear-gradient(135deg, var(--primary-dim) 0%, var(--cyan-dim) 100%)',
        border: '1px solid var(--border-accent)',
        boxShadow: '0 0 14px var(--primary-glow)',
      }}
    >
      <svg width={icon} height={icon} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="8"  cy="16" r="4"  fill="var(--primary)" />
        <circle cx="24" cy="8"  r="3"  fill="var(--cyan)" opacity="0.8" />
        <circle cx="24" cy="24" r="3"  fill="var(--cyan)" opacity="0.8" />
        <line x1="12" y1="14" x2="21" y2="9.5"  stroke="url(#rl1)" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="18" x2="21" y2="22.5" stroke="url(#rl2)" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="rl1" x1="12" y1="14" x2="21" y2="9.5"  gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--cyan)" />
          </linearGradient>
          <linearGradient id="rl2" x1="12" y1="18" x2="21" y2="22.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
