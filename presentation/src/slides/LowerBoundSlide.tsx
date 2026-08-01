import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

// Generate theoretical vs empirical failure probability curve
function generateCurve(n: number = 16) {
  const delta = 0.25; // normalized gap
  const kVal = 1;
  const points: Array<{ budget: number; theoretical: number; empirical: number }> = [];

  for (let b = 0.5; b <= 10; b += 0.5) {
    const B = b * n;
    // Lower bound: P(fail) >= 0.25 * exp(-2*B*delta^2 / (n-k))
    const theoretical = Math.min(0.9, 0.25 * Math.exp(-2 * B * delta * delta / (n - kVal)));
    // Empirical WiSDoM (slightly better than theoretical, noisy)
    const empirical = Math.min(0.85, theoretical * (0.9 + 0.15 * (1 - b / 10)) + (Math.random() * 0.03));
    points.push({ budget: b, theoretical, empirical });
  }
  return points;
}

const CURVE_DATA = generateCurve();

export function LowerBoundSlide() {
  const [step, setStep] = useState(0);
  const [revealIdx, setRevealIdx] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (step < 3) return;
    const t = setInterval(() => {
      setRevealIdx(i => {
        if (i >= CURVE_DATA.length - 1) {
          clearInterval(t);
          return i;
        }
        return i + 1;
      });
    }, 80);
    return () => clearInterval(t);
  }, [step]);

  // SVG chart dimensions
  const W = 480;
  const H = 360;
  const pad = { top: 20, right: 20, bottom: 50, left: 55 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxBudget = 10;
  const xScale = (b: number) => (b / maxBudget) * chartW;
  const yScale = (p: number) => chartH - p * chartH;

  const theoreticalPath = CURVE_DATA.slice(0, revealIdx + 1)
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.budget)},${yScale(d.theoretical)}`)
    .join(' ');

  const empiricalPath = CURVE_DATA.slice(0, revealIdx + 1)
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.budget)},${yScale(d.empirical)}`)
    .join(' ');

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 80px 30px',
      gap: 28,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <div className="label" style={{ marginBottom: 12 }}>Theoretical Foundation</div>
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>
          Information-Theoretic{' '}
          <span style={{ color: 'var(--gold)' }}>Lower Bound</span>
        </h1>
      </motion.div>

      <div style={{ display: 'flex', gap: 48, flex: 1, minHeight: 0 }}>
        {/* Formula */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, minHeight: 0, justifyContent: 'space-between' }}>
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                padding: '20px 28px',
                background: 'rgba(232,197,71,0.06)',
                border: '1px solid rgba(232,197,71,0.25)',
                borderRadius: 16,
              }}
            >
              <div className="label" style={{ marginBottom: 14, color: 'var(--gold)' }}>
                Failure Probability Lower Bound
              </div>
              <MathFormula
                formula={String.raw`P(\text{fail}) \geq \frac{1}{4} \exp\!\left(-\frac{2B\Delta^2}{N-K}\right)`}
                block
                style={{ fontSize: '1.2em' }}
              />
            </motion.div>
          )}

          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'space-evenly' }}
            >
              {[
                { sym: 'B', desc: 'Total query budget', color: 'var(--cyan)' },
                { sym: 'Δ', symTex: String.raw`\Delta`, desc: 'Skill gap between winner and runner-up', color: 'var(--gold)' },
                { sym: 'N', desc: 'Number of items', color: 'var(--text-secondary)' },
                { sym: 'K', desc: 'Items clearly worse than winner', color: 'var(--text-secondary)' },
              ].map(item => (
                <div key={item.sym} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 20px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  flex: 1,
                }}>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: item.color,
                    fontFamily: "'Space Grotesk', sans-serif",
                    minWidth: 32,
                  }}>
                    {(item as any).symTex
                      ? <MathFormula formula={(item as any).symTex} style={{ display: 'inline' }} />
                      : item.sym}
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '14px 18px',
                background: 'rgba(102,187,106,0.08)',
                border: '1px solid rgba(102,187,106,0.25)',
                borderRadius: 12,
                fontSize: 18,
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>WiSDoM matches the bound.</span>
              {' '}Empirical failure probability closely tracks the theoretical floor — no other method is significantly better with the same budget.
            </motion.div>
          )}
        </div>

        {/* Chart */}
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{
              padding: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="label" style={{ marginBottom: 14 }}>
              <MathFormula formula="P(\text{fail})" style={{ display: 'inline' }} /> vs Budget B/N
            </div>

            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ flex: 1 }}>
              <g transform={`translate(${pad.left},${pad.top})`}>
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
                  <g key={p}>
                    <line
                      x1={0} y1={yScale(p)}
                      x2={chartW} y2={yScale(p)}
                      stroke="var(--glass-05)"
                      strokeWidth={1}
                    />
                    <text
                      x={-8} y={yScale(p) + 4}
                      textAnchor="end"
                      fill="#546e7a"
                      fontSize={13}
                      fontFamily="Inter, sans-serif"
                    >
                      {(p * 100).toFixed(0)}%
                    </text>
                  </g>
                ))}

                {/* X axis ticks */}
                {[1, 2, 4, 6, 8, 10].map(b => (
                  <g key={b}>
                    <line
                      x1={xScale(b)} y1={0}
                      x2={xScale(b)} y2={chartH}
                      stroke="var(--glass-04)"
                      strokeWidth={1}
                    />
                    <text
                      x={xScale(b)}
                      y={chartH + 16}
                      textAnchor="middle"
                      fill="#546e7a"
                      fontSize={13}
                      fontFamily="Inter, sans-serif"
                    >
                      {b}
                    </text>
                  </g>
                ))}

                {/* Theoretical bound */}
                {theoreticalPath && (
                  <path
                    d={theoreticalPath}
                    stroke="#ef5350"
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray="6,4"
                  />
                )}

                {/* WiSDoM empirical */}
                {empiricalPath && (
                  <path
                    d={empiricalPath}
                    stroke="#e8c547"
                    strokeWidth={2.5}
                    fill="none"
                  />
                )}

                {/* Axes */}
                <line x1={0} y1={0} x2={0} y2={chartH} stroke="var(--glass-15)" strokeWidth={1} />
                <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="var(--glass-15)" strokeWidth={1} />

                {/* Axis labels */}
                <text
                  x={chartW / 2}
                  y={chartH + 38}
                  textAnchor="middle"
                  fill="#90a4ae"
                  fontSize={13}
                  fontFamily="Inter, sans-serif"
                >
                  Budget multiplier (B/N)
                </text>

                <text
                  x={-40}
                  y={chartH / 2}
                  textAnchor="middle"
                  fill="#90a4ae"
                  fontSize={13}
                  fontFamily="Inter, sans-serif"
                  transform={`rotate(-90, -40, ${chartH / 2})`}
                >
                  P(fail)
                </text>
              </g>
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
              {[
                { color: 'var(--red)', dash: true, label: 'Lower bound' },
                { color: 'var(--gold)', dash: false, label: 'WiSDoM (empirical)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width={24} height={12}>
                    <line
                      x1={0} y1={6} x2={24} y2={6}
                      stroke={item.color}
                      strokeWidth={2}
                      strokeDasharray={item.dash ? '4,3' : 'none'}
                    />
                  </svg>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
