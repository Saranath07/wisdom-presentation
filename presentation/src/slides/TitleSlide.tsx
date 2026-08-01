import { motion } from 'framer-motion';

export function TitleSlide() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,197,71,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* KDD badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: 32,
          padding: '6px 16px',
          border: '1px solid var(--border)',
          borderRadius: 20,
        }}
      >
        KDD 2026 · Research Track
      </motion.div>

      {/* Main title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100, damping: 20 }}
        style={{ textAlign: 'center', marginBottom: 16 }}
      >
        <div style={{
          fontSize: 'clamp(72px, 12vw, 140px)',
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          color: 'var(--gold)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          textShadow: '0 0 80px rgba(232,197,71,0.3)',
        }}>
          WiSDoM
        </div>
      </motion.div>

      {/* Full title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{
          fontSize: 'clamp(16px, 2vw, 22px)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          maxWidth: 600,
          lineHeight: 1.5,
          marginBottom: 48,
        }}
      >
        <span style={{ color: 'var(--text-primary)' }}>Frugal Winner Selection</span>
        {' '}by{' '}
        <span style={{ color: 'var(--text-primary)' }}>Design of Matchups</span>
      </motion.div>

      {/* Separator */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        style={{
          width: 200,
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          marginBottom: 48,
        }}
      />

      {/* Authors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
      >
        {[
          { name: 'Saranath P', role: 'MS Scholar, Dept of Data Science and AI, IIT Madras' },
          { name: 'Prof. Arun Rajkumar', role: 'Assistant Professor, Dept of Data Science and AI, IIT Madras' },
        ].map(a => (
          <div key={a.name} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {a.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {a.role}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Bottom pulse hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 48,
          fontSize: 12,
          color: 'var(--text-secondary)',
          letterSpacing: '0.1em',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <motion.span
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          →
        </motion.span>
        Press arrow key or space to continue
      </motion.div>
    </div>
  );
}
