import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BootScreenProps {
  onDone: () => void;
}

export function BootScreen({ onDone }: BootScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'bar' | 'exit'>('logo');
  const [barWidth, setBarWidth] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    // phase timeline
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('bar'), 1100);

    // Animate bar fill
    const t3 = setTimeout(() => {
      let w = 0;
      const interval = setInterval(() => {
        w += Math.random() * 14 + 4;
        if (w >= 100) {
          w = 100;
          clearInterval(interval);
        }
        setBarWidth(Math.min(w, 100));
      }, 60);
    }, 1200);

    // Exit
    const t4 = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }, 500);
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="boot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'var(--bg)' }}
        >
          {/* Background radial pulse */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 50%, var(--primary-dim) 0%, transparent 70%)',
            }}
          />

          {/* Floating orbs */}
          <div
            className="absolute w-[500px] h-[500px] rounded-full float-orb"
            style={{
              background: 'radial-gradient(circle, var(--primary-dim) 0%, transparent 70%)',
              top: '10%',
              left: '10%',
              animationDuration: '9s',
            }}
          />
          <div
            className="absolute w-[360px] h-[360px] rounded-full float-orb"
            style={{
              background: 'radial-gradient(circle, var(--cyan-dim) 0%, transparent 70%)',
              bottom: '10%',
              right: '10%',
              animationDuration: '11s',
              animationDelay: '-4s',
            }}
          />

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-8 z-10">
            {/* Logo mark */}
            <motion.div
              initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ scale: [1, 1.6, 2.2], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  background: 'transparent',
                  border: '1.5px solid var(--border-accent)',
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ scale: [1, 1.6, 2.2], opacity: [0.4, 0.15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                style={{
                  background: 'transparent',
                  border: '1.5px solid var(--cyan-glow)',
                }}
              />

              {/* Logo box */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px var(--primary-glow), 0 0 60px var(--primary-dim)',
                    '0 0 50px var(--primary-glow), 0 0 90px var(--cyan-glow)',
                    '0 0 30px var(--primary-glow), 0 0 60px var(--primary-dim)',
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-dim) 0%, var(--cyan-dim) 100%)',
                  border: '1.5px solid var(--border-accent)',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                  <circle cx="8" cy="16" r="4" fill="var(--primary)" />
                  <circle cx="24" cy="8" r="3" fill="var(--cyan)" opacity="0.8" />
                  <circle cx="24" cy="24" r="3" fill="var(--cyan)" opacity="0.8" />
                  <line x1="12" y1="14" x2="21" y2="9.5" stroke="url(#g1)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="21" y2="22.5" stroke="url(#g2)" strokeWidth="2" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="g1" x1="12" y1="14" x2="21" y2="9.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--primary)" />
                      <stop offset="1" stopColor="var(--cyan)" />
                    </linearGradient>
                    <linearGradient id="g2" x1="12" y1="18" x2="21" y2="22.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--primary)" />
                      <stop offset="1" stopColor="var(--cyan)" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
            </motion.div>

            {/* Brand name */}
            <AnimatePresence>
              {(phase === 'text' || phase === 'bar') && (
                <motion.div
                  initial={{ opacity: 0, letterSpacing: '0.5em', filter: 'blur(8px)' }}
                  animate={{ opacity: 1, letterSpacing: '0.15em', filter: 'blur(0)' }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className="text-4xl font-bold tracking-[0.15em] gradient-text"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    RELAY
                  </span>
                  <span className="text-xs tracking-[0.35em] uppercase" style={{ color: 'var(--muted)' }}>
                    Technical Support Platform
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading bar */}
            <AnimatePresence>
              {phase === 'bar' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Bar track */}
                  <div
                    className="w-[220px] h-[3px] rounded-full overflow-hidden"
                    style={{ background: 'var(--primary-dim)' }}
                  >
                    {/* Bar fill */}
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${barWidth}%`,
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--cyan) 100%)',
                        boxShadow: '0 0 12px var(--primary-glow)',
                        transition: 'width 80ms linear',
                      }}
                    />
                  </div>

                  {/* Beam sweep on the bar */}
                  <p className="text-[11px] tracking-widest uppercase" style={{ color: 'var(--subtle)' }}>
                    Initialising...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Corner decoration */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--subtle)', opacity: 0.4 }}>
              Powered by Relay Labs
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
