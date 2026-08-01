import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateAccuracyData } from '../simulation/wisdom';

export function ResultsSlide() {
  const [step, setStep] = useState(0);
  const [revealIdx, setRevealIdx] = useState(0);

  const data = useMemo(() => generateAccuracyData(16, 30), []);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (step < 2) return;
    const t = setInterval(() => {
      setRevealIdx(i => {
        if (i >= data.length - 1) { clearInterval(t); return i; }
        return i + 1;
      });
    }, 120);
    return () => clearInterval(t);
  }, [step, data.length]);

  // SVG chart
  const W = 560;
  const H = 380;
  const pad = { top: 20, right: 24, bottom: 52, left: 55 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxBudget = Math.max(...data.map(d => d.budget));
  const xScale = (b: number) => (b / maxBudget) * chartW;
  const yScale = (p: number) => chartH - p * chartH;

  const subset = data.slice(0, revealIdx + 1);

  const wisdomPath = subset
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.budget)},${yScale(d.wisdomAccuracy)}`)
    .join(' ');

  const parwisPath = subset
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.budget)},${yScale(d.parwisAccuracy)}`)
    .join(' ');

  const randomPath = subset
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.budget)},${yScale(d.randomAccuracy)}`)
    .join(' ');

  const lastPoint = subset[subset.length - 1];

  const stats = [
    { label: 'WiSDoM at B=4N', value: data.find(d => d.budget === 4)?.wisdomAccuracy ?? 0, color: 'var(--gold)' },
    { label: 'PARWIS at B=4N', value: data.find(d => d.budget === 4)?.parwisAccuracy ?? 0, color: 'var(--cyan)' },
    { label: 'Random at B=4N', value: data.find(d => d.budget === 4)?.randomAccuracy ?? 0, color: 'var(--neutral)' },
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <div className="label" style={{ marginBottom: 12 }}>Experimental Results</div>
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>
          WiSDoM Dominates at Every Budget
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
          N=16 items, 30 trials per budget point, BTL model
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: 40, flex: 1, minHeight: 0, alignItems: 'stretch' }}>
        {/* Main chart */}
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
              Winner Identification Accuracy vs Budget
            </div>

            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ flex: 1 }}>
              <g transform={`translate(${pad.left},${pad.top})`}>
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
                  <g key={p}>
                    <line x1={0} y1={yScale(p)} x2={chartW} y2={yScale(p)}
                      stroke="var(--glass-05)" strokeWidth={1} />
                    <text x={-8} y={yScale(p) + 4} textAnchor="end"
                      fill="#546e7a" fontSize={10} fontFamily="Inter, sans-serif">
                      {(p * 100).toFixed(0)}%
                    </text>
                  </g>
                ))}

                {[1, 2, 4, 6, 8, 10].map(b => (
                  <g key={b}>
                    <line x1={xScale(b)} y1={0} x2={xScale(b)} y2={chartH}
                      stroke="var(--glass-04)" strokeWidth={1} />
                    <text x={xScale(b)} y={chartH + 16} textAnchor="middle"
                      fill="#546e7a" fontSize={10} fontFamily="Inter, sans-serif">
                      {b}N
                    </text>
                  </g>
                ))}

                {/* Random baseline */}
                {randomPath && (
                  <path d={randomPath} stroke="#546e7a" strokeWidth={1.5}
                    fill="none" strokeDasharray="3,4" opacity={0.7} />
                )}

                {/* PARWIS */}
                {parwisPath && (
                  <path d={parwisPath} stroke="#4fc3f7" strokeWidth={2}
                    fill="none" strokeDasharray="6,3" />
                )}

                {/* WiSDoM */}
                {wisdomPath && (
                  <path d={wisdomPath} stroke="#e8c547" strokeWidth={3} fill="none" />
                )}

                {/* Live endpoint dots */}
                {lastPoint && (
                  <>
                    <motion.circle
                      cx={xScale(lastPoint.budget)} cy={yScale(lastPoint.wisdomAccuracy)}
                      r={5} fill="#e8c547"
                      animate={{ r: [4, 7, 4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <motion.circle
                      cx={xScale(lastPoint.budget)} cy={yScale(lastPoint.parwisAccuracy)}
                      r={4} fill="#4fc3f7"
                    />
                    <motion.circle
                      cx={xScale(lastPoint.budget)} cy={yScale(lastPoint.randomAccuracy)}
                      r={3} fill="#546e7a"
                    />
                  </>
                )}

                {/* Axes */}
                <line x1={0} y1={0} x2={0} y2={chartH} stroke="var(--glass-15)" strokeWidth={1} />
                <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="var(--glass-15)" strokeWidth={1} />

                <text x={chartW / 2} y={chartH + 40} textAnchor="middle"
                  fill="#90a4ae" fontSize={11} fontFamily="Inter, sans-serif">
                  Query Budget
                </text>
                <text x={-40} y={chartH / 2} textAnchor="middle"
                  fill="#90a4ae" fontSize={11} fontFamily="Inter, sans-serif"
                  transform={`rotate(-90, -40, ${chartH / 2})`}>
                  P(correct winner)
                </text>
              </g>
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
              {[
                { color: '#e8c547', dash: false, label: 'WiSDoM' },
                { color: '#4fc3f7', dash: true, label: 'PARWIS' },
                { color: '#546e7a', dash: true, label: 'Random' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width={28} height={12}>
                    <line x1={0} y1={6} x2={28} y2={6}
                      stroke={item.color} strokeWidth={item.label === 'WiSDoM' ? 3 : 2}
                      strokeDasharray={item.dash ? '5,3' : 'none'}
                    />
                  </svg>
                  <span style={{ fontSize: 12, color: item.color }}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats panel */}
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 280, flex: '0 0 280px' }}
          >
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              At budget B = 4N:
            </div>
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 150, damping: 20 }}
                style={{
                  padding: '16px 20px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                }}
              >
                <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: stat.color,
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1,
                }}>
                  {(stat.value * 100).toFixed(0)}%
                </div>
                <div style={{
                  height: 4,
                  background: 'var(--glass-06)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginTop: 8,
                }}>
                  <motion.div
                    animate={{ width: `${stat.value * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 80, damping: 20 }}
                    style={{
                      height: '100%',
                      background: stat.color,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </motion.div>
            ))}

            {/* Key takeaway */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                padding: '14px 16px',
                background: 'rgba(232,197,71,0.08)',
                border: '1px solid rgba(232,197,71,0.25)',
                borderRadius: 12,
                fontSize: 18,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>WiSDoM</span>
              {' '}rises sharply with budget. PARWIS plateaus early due to path-graph structure.
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
