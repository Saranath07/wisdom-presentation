import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

export function InsightSlide() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1700),
      setTimeout(() => setStep(4), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Two matchups to contrast
  const matchups = [
    {
      a: { label: 'Item A', elo: 2000 },
      b: { label: 'Item B', elo: 1900 },
      delta: 100,
      label: 'Close matchup',
      samplesNeeded: '1/Δ²≈16',
      value: 'HIGH',
      color: 'var(--gold)',
      width: 80,
    },
    {
      a: { label: 'Item A', elo: 2000 },
      b: { label: 'Item C', elo: 1000 },
      delta: 1000,
      label: 'Lopsided matchup',
      samplesNeeded: '1/Δ²≈0.16',
      value: 'LOW',
      color: 'var(--neutral)',
      width: 10,
    },
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 80px 30px',
      gap: 24,
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <div className="label" style={{ marginBottom: 12 }}>The Core Insight</div>
        <h1 style={{ fontSize: 52, marginBottom: 12, lineHeight: 1.1 }}>
          Ask the{' '}
          <span style={{ color: 'var(--gold)' }}>RIGHT</span>{' '}
          questions.
        </h1>
        {step >= 1 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 520 }}
          >
            Not all matchups are equally informative. Close matchups reveal more about the winner.
          </motion.p>
        )}
      </motion.div>

      {/* Matchup comparison */}
      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}
        >
          {matchups.map((m) => (
            <div
              key={m.label}
              style={{
                padding: '20px 28px',
                background: 'var(--card-bg)',
                border: `1px solid ${m.color === 'var(--gold)' ? 'rgba(232,197,71,0.25)' : 'var(--glass-08)'}`,
                borderRadius: 16,
                minWidth: 240,
              }}
            >
              <div style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                {m.label}
              </div>

              {/* Item comparison */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(79,195,247,0.1)',
                  borderRadius: 8,
                  fontSize: 18,
                  color: 'var(--cyan)',
                  fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {m.a.label} ({m.a.elo})
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 18 }}>vs</span>
                <div style={{
                  padding: '6px 12px',
                  background: 'var(--glass-04)',
                  borderRadius: 8,
                  fontSize: 18,
                  color: 'var(--text-secondary)',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {m.b.label} ({m.b.elo})
                </div>
              </div>

              {/* Gap */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <MathFormula formula={`\\Delta = ${m.delta}`} style={{ display: 'inline' }} />
                </div>
                <div style={{
                  height: 6,
                  background: 'var(--glass-06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <motion.div
                    animate={{ width: `${m.width}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
                    style={{
                      height: '100%',
                      background: m.color === 'var(--gold)'
                        ? 'linear-gradient(90deg, var(--gold), #f5d76e)'
                        : 'linear-gradient(90deg, var(--neutral), #78909c)',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>

              {/* Info value */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Samples needed:
                </div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: m.color,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {m.value}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Sample complexity */}
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            padding: '20px 40px',
            background: 'rgba(232,197,71,0.06)',
            border: '1px solid rgba(232,197,71,0.25)',
            borderRadius: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Sample complexity to distinguish winner from gap-<MathFormula formula="\Delta" style={{ display: 'inline' }} /> challenger
          </div>
          <MathFormula
            formula={String.raw`n^* \propto \frac{1}{\Delta^2}`}
            block
            style={{ fontSize: '1.4em' }}
          />
        </motion.div>
      )}

      {/* Key insight boxes */}
      {step >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ display: 'flex', gap: 20, flex: 1 }}
        >
          {[
            {
              emoji: '🎯',
              title: 'Design the matchups',
              desc: 'Allocate more queries to close challengers',
            },
            {
              emoji: '📐',
              title: 'Convex optimization',
              desc: 'Minimize worst-case gap uncertainty via SDP',
            },
            {
              emoji: '⚡',
              title: 'Near-optimal',
              desc: 'Matches information-theoretic lower bound',
            },
          ].map(item => (
            <div
              key={item.title}
              style={{
                flex: 1,
                padding: '16px 18px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 4,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
