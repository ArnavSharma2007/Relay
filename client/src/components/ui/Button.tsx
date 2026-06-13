import { ButtonHTMLAttributes, forwardRef } from 'react';
import type React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

const variants: Record<Variant, string> = {
  primary:
    'text-white transition-all hover:opacity-90',
  secondary:
    'bg-[var(--panel)] border border-[var(--border-mid)] text-[var(--text)] hover:border-[var(--border-accent)] transition-all',
  ghost:
    'bg-transparent text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)] transition-all',
  danger:
    'bg-[var(--danger-dim)] text-[var(--danger)] border border-[rgba(244,63,94,0.25)] hover:opacity-90 transition-all',
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-glow) 100%)',
    boxShadow: '0 0 20px var(--primary-glow)',
  },
  secondary: {},
  ghost: {},
  danger: {},
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium disabled:opacity-50 ${sizeClass} ${variants[variant]} ${className}`}
        style={variantStyles[variant]}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
