import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

export function ConclusionSlide() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1600),
      setTimeout(() => setStep(4), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const contributions = [
    {
      icon: '◉',
      color: 'var(--gold)',
      title: 'Phase 1: Bracket Warm Start',
      desc: 'Best-of-t tournament ensures true winner survives to candidate set with O(N) queries',
    },
    {
      icon: '◈',
      color: 'var(--cyan)',
      title: 'Phase 2: Optimal Design',
      desc: null,
      descJsx: <><MathFormula formula="\lambda^* = \arg\min_{\lambda} \max_j \varphi_{wj}(\lambda)" style={{display:'inline'}} />: Frank-Wolfe minimises worst-case gap uncertainty</>,
    },
    {
      icon: '◆',
      color: 'var(--green)',
      title: 'Near-Optimal Guarantee',
      desc: null,
      descJsx: <>Empirically matches <MathFormula formula="P(\text{fail}) \geq \tfrac{1}{4}e^{-2B\Delta^2/(N-K)}" style={{display:'inline'}} />, the information-theoretic floor</>,
    },
    {
      icon: '◇',
      color: 'var(--purple)',
      title: 'Frugal: O(N) Budget',
      desc: 'Linear budget is tight: no algorithm can do better without stronger assumptions',
    },
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 80px 30px',
      gap: 28,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background radial */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(232,197,71,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main tagline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        style={{ textAlign: 'center' }}
      >
        <div className="label" style={{ marginBottom: 16 }}>Conclusion</div>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 60px)',
          lineHeight: 1.15,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          The right matchup,
        </h1>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 60px)',
          lineHeight: 1.15,
          textAlign: 'center',
          color: 'var(--gold)',
        }}>
          at the right time.
        </h1>
      </motion.div>

      {/* Contributions */}
      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 20,
            width: '100%',
            flex: 1,
          }}
        >
          {contributions.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 150, damping: 20 }}
              style={{
                padding: '24px 28px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <div style={{
                fontSize: 26,
                color: item.color,
                marginTop: 2,
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: item.color,
                  marginBottom: 6,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {(item as any).descJsx ?? item.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Citation/conference */}
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            padding: '16px 32px',
            background: 'rgba(232,197,71,0.06)',
            border: '1px solid rgba(232,197,71,0.2)',
            borderRadius: 14,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
            KDD 2026 · Research Track
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--gold)',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            WiSDoM: Frugal Winner Selection by Design of Matchups
          </div>
        </motion.div>
      )}

      {/* Final tagline */}
      {step >= 4 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            fontSize: 20,
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Thank you · Questions?
        </motion.div>
      )}
    </div>
  );
}
