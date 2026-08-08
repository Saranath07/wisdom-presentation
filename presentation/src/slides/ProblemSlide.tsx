import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const N = 20;
const SEED = 42;

function lcg(s: number) {
  let state = s >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateItems() {
  const rng = lcg(SEED);
  return Array.from({ length: N }, (_, i) => {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    const radius = 120 + rng() * 60;
    return {
      id: i,
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
      score: 1000 + rng() * 1200,
    };
  });
}

const items = generateItems();
const trueWinner = items.reduce((best, it) => it.score > best.score ? it : best, items[0]);

export function ProblemSlide() {
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const steps = [
      () => setStep(1), // show items
      () => setStep(2), // show budget
      () => setStep(3), // show oracle question
      () => setStep(4), // highlight winner with question mark
    ];
    let i = 0;
    const run = () => {
      if (i < steps.length) {
        steps[i]();
        i++;
        timerRef.current = setTimeout(run, 900);
      }
    };
    timerRef.current = setTimeout(run, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 80,
      padding: '0 80px',
    }}>
      {/* Left: text */}
      <div style={{ flex: 1, maxWidth: 420 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="label"
          style={{ marginBottom: 16 }}
        >
          The Problem
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ fontSize: 44, marginBottom: 24, lineHeight: 1.15 }}
        >
          Find the{' '}
          <span style={{ color: 'var(--gold)' }}>best item</span>{' '}
          on a tight budget
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {[
            {
              icon: '◉',
              color: 'var(--cyan)',
              title: `N = ${N} items`,
              desc: 'Unknown quality scores',
              show: step >= 1,
            },
            {
              icon: '⬡',
              color: 'var(--gold)',
              title: 'Budget B = cN',
              desc: 'Linear in N: every comparison costs',
              show: step >= 2,
            },
            {
              icon: '⚡',
              color: 'var(--red)',
              title: 'Noisy oracle',
              desc: 'P(i>j) = wᵢ/(wᵢ+wⱼ), Bradley-Terry-Luce',
              show: step >= 3,
            },
          ].map(item => (
            <AnimatePresence key={item.title}>
              {item.show && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <span style={{ fontSize: 18, color: item.color, marginTop: 2 }}>{item.icon}</span>
                  <div>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 3,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {item.desc}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </motion.div>
      </div>

      {/* Right: visualization */}
      <div style={{ position: 'relative', width: 400, height: 400 }}>
        <svg width={400} height={400}>
          {/* Background circle */}
          <circle cx={200} cy={200} r={170} fill="none" stroke="var(--glass-04)" strokeWidth={1} strokeDasharray="4,4" />

          {/* Items */}
          {items.map(item => {
            const isWinner = item.id === trueWinner.id;
            return (
              <g key={item.id}>
                {step >= 1 && (
                  <motion.circle
                    cx={item.x}
                    cy={item.y}
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: isWinner ? 10 : 7, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                      delay: item.id * 0.04,
                    }}
                    fill={
                      isWinner && step >= 4
                        ? 'var(--gold)'
                        : 'rgba(79, 195, 247, 0.7)'
                    }
                  />
                )}
                {step >= 1 && (
                  <motion.text
                    x={item.x}
                    y={item.y + 18}
                    textAnchor="middle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: item.id * 0.04 + 0.2 }}
                    fill={isWinner && step >= 4 ? '#e8c547' : '#546e7a'}
                    fontSize={9}
                    fontFamily="Inter, sans-serif"
                  >
                    {item.id}
                  </motion.text>
                )}
              </g>
            );
          })}

          {/* Question mark over winner */}
          {step >= 4 && (
            <motion.g>
              <motion.text
                x={trueWinner.x}
                y={trueWinner.y - 22}
                textAnchor="middle"
                initial={{ opacity: 0, scale: 0, y: trueWinner.y }}
                animate={{ opacity: 1, scale: 1, y: trueWinner.y - 22 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                fill="var(--gold)"
                fontSize={22}
                fontWeight={700}
                fontFamily="'Space Grotesk', sans-serif"
              >
                ?
              </motion.text>
              <motion.circle
                cx={trueWinner.x}
                cy={trueWinner.y}
                r={18}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={1.5}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.g>
          )}
        </svg>

        {/* Budget label */}
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 12,
              color: 'var(--gold)',
              fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.1em',
              textAlign: 'center',
            }}
          >
            Budget: B = cN queries
          </motion.div>
        )}
      </div>
    </div>
  );
}
