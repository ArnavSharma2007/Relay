import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Sidebar } from './Sidebar';

interface PageWrapperProps {
  title: string;
  description?: string;
  section?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  children: ReactNode;
}

export function PageWrapper({
  title,
  description,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  section: _section,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  breadcrumbs: _breadcrumbs,
  actions,
  children,
}: PageWrapperProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top nav */}
      <Sidebar />

      {/* Page content — padded below nav */}
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingTop: 'var(--nav-h)' }}
      >
        <div className="px-8 pt-8 pb-8 max-w-[1400px] mx-auto">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                {title}
              </h1>
              {description && (
                <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--muted)' }}>
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
            )}
          </div>

          {/* Divider */}
          <div
            className="mb-7"
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, rgba(124,92,252,0.3) 0%, transparent 70%)',
            }}
          />

          {children}
        </div>
      </motion.main>
    </div>
  );
}
