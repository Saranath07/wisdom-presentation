import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runWiSDoM } from '../simulation/wisdom';
import type { SimState } from '../simulation/types';
import { MathFormula } from '../components/MathFormula';

const SIM_CONFIG = { n: 16, budgetMultiplier: 4, t: 3, eloK: 32, seed: 77 };

export function Phase2DesignSlide() {
  const states = useMemo(() => runWiSDoM(SIM_CONFIG), []);
  const designStates = useMemo(
    () => states.filter(s => s.phase === 'design'),
    [states]
  );

  const [step, setStep] = useState(0);
  const [stateIdx, setStateIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (step < 3) return;
    const t = setTimeout(() => {
      setStateIdx(i => Math.min(i + 1, designStates.length - 1));
    }, 300);
    return () => clearTimeout(t);
  }, [step, stateIdx, designStates.length]);

  const current: SimState = designStates[Math.min(stateIdx, designStates.length - 1)]
    ?? states[states.length - 1];

  const candidateIds = current.candidateSet;
  const allocation = current.queryAllocation;
  const items = current.items;

  const pairKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

  // Compute node positions in circle
  const circleR = 120;
  const cx = 220;
  const cy = 200;

  const positions = useMemo(() => {
    return candidateIds.map((id, i) => {
      const angle = (2 * Math.PI * i) / candidateIds.length - Math.PI / 2;
      return {
        id,
        x: cx + circleR * Math.cos(angle),
        y: cy + circleR * Math.sin(angle),
      };
    });
  }, [candidateIds]);

  const posMap = useMemo(() => {
    const m = new Map<number, { x: number; y: number }>();
    for (const p of positions) m.set(p.id, { x: p.x, y: p.y });
    return m;
  }, [positions]);

  const edges = useMemo(() => {
    const edgeList: Array<{
      key: string;
      x1: number; y1: number; x2: number; y2: number;
      weight: number;
    }> = [];
    for (let i = 0; i < candidateIds.length; i++) {
      for (let j = i + 1; j < candidateIds.length; j++) {
        const a = candidateIds[i];
        const b = candidateIds[j];
        const key = pairKey(a, b);
        const weight = allocation.get(key) ?? 0;
        const pa = posMap.get(a);
        const pb = posMap.get(b);
        if (pa && pb) {
          edgeList.push({ key, x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, weight });
        }
      }
    }
    return edgeList;
  }, [candidateIds, allocation, posMap]);

  const maxWeight = Math.max(...edges.map(e => e.weight), 0.01);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 64px 30px',
      gap: 24,
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="label" style={{ marginBottom: 8 }}>Phase 2</div>
        <h1 style={{ fontSize: 40, marginBottom: 4 }}>
          Winner-Focused Experimental Design
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
          Solve: allocate budget to maximize certainty about the winner
        </p>
      </motion.div>

      <div style={{ flex: 1, display: 'flex', gap: 40, alignItems: 'flex-start' }}>
        {/* Left: Optimization formulation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Candidate set */}
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                padding: '16px 20px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 14,
              }}
            >
              <div className="label" style={{ marginBottom: 10 }}>Candidate Set C</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {candidateIds.map((id, i) => {
                  const item = items.find(it => it.id === id);
                  return (
                    <motion.div
                      key={id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                      style={{
                        padding: '8px 14px',
                        background: i === 0 ? 'rgba(232,197,71,0.15)' : 'rgba(79,195,247,0.1)',
                        border: `1px solid ${i === 0 ? 'rgba(232,197,71,0.4)' : 'rgba(79,195,247,0.3)'}`,
                        borderRadius: 10,
                        textAlign: 'center',
                        minWidth: 70,
                      }}
                    >
                      <div style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: i === 0 ? 'var(--gold)' : 'var(--cyan)',
                        fontFamily: "'Space Grotesk', sans-serif",
                        marginBottom: 2,
                      }}>
                        Item {id} {i === 0 ? '★' : ''}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        Elo: {Math.round(item?.eloScore ?? 1200)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                M = ⌈N^(1/4)⌉ = {candidateIds.length} items · Top by Elo
              </div>
            </motion.div>
          )}

          {/* Optimization objective */}
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                padding: '16px 20px',
                background: 'rgba(232,197,71,0.05)',
                border: '1px solid rgba(232,197,71,0.2)',
                borderRadius: 14,
              }}
            >
              <div className="label" style={{ marginBottom: 10, color: 'var(--gold)' }}>
                Optimization Objective
              </div>
              <MathFormula
                formula={String.raw`\lambda^* = \arg\min_{\lambda} \max_{j \in C\setminus\{w\}} \varphi_{wj}(\lambda)`}
                block
                style={{ fontSize: '1.3em' }}
              />
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                where{' '}
                <MathFormula formula="\varphi_{wj}" style={{ display: 'inline' }} />
                {' = relative gap uncertainty = '}
                <MathFormula formula={String.raw`\frac{\text{Var}(\hat{w}_w - \hat{w}_j)}{(w_w - w_j)^2}`} />
              </div>
            </motion.div>
          )}

          {/* Allocation table */}
          {step >= 3 && edges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                padding: '16px 20px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 14,
              }}
            >
              <div className="label" style={{ marginBottom: 10 }}>Optimal Allocation λ*</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {edges.map(edge => (
                  <div key={edge.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      minWidth: 80,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {edge.key}
                    </div>
                    <div style={{
                      flex: 1,
                      height: 6,
                      background: 'var(--glass-06)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        animate={{ width: `${(edge.weight / maxWeight) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--gold), #f5d76e)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--gold)',
                      fontWeight: 600,
                      minWidth: 40,
                      textAlign: 'right',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {(edge.weight * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Network visualization */}
        <div style={{
          width: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Network graph */}
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '16px',
            position: 'relative',
          }}>
            <div className="label" style={{ marginBottom: 12 }}>Query Network</div>

            <svg width={440} height={360}>
              {/* Background grid */}
              <circle cx={cx} cy={cy} r={circleR + 40} fill="none" stroke="var(--glass-03)" strokeDasharray="3,3" />

              {/* Edges */}
              <AnimatePresence>
                {step >= 3 && edges.map(edge => (
                  <motion.line
                    key={edge.key}
                    x1={edge.x1} y1={edge.y1}
                    x2={edge.x2} y2={edge.y2}
                    stroke="rgba(232,197,71,0.7)"
                    animate={{
                      strokeWidth: Math.max(1, edge.weight * 24),
                      opacity: 0.3 + edge.weight * 0.7,
                    }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                  />
                ))}
              </AnimatePresence>

              {/* Nodes */}
              {positions.map((pos, i) => {
                const item = items.find(it => it.id === pos.id);
                const isTop = i === 0;

                return (
                  <g key={pos.id}>
                    {/* Glow */}
                    <motion.circle
                      cx={pos.x} cy={pos.y}
                      r={32}
                      initial={{ r: 28 }}
                      fill={isTop ? 'rgba(232,197,71,0.12)' : 'rgba(79,195,247,0.08)'}
                      animate={{
                        r: [28, 36, 28],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                    />

                    {/* Main circle */}
                    <motion.circle
                      cx={pos.x} cy={pos.y} r={22}
                      fill={isTop ? 'rgba(232,197,71,0.2)' : 'rgba(79,195,247,0.15)'}
                      stroke={isTop ? 'var(--gold)' : 'var(--cyan)'}
                      strokeWidth={isTop ? 2 : 1.5}
                    />

                    <text
                      x={pos.x} y={pos.y - 5}
                      textAnchor="middle"
                      fill={isTop ? '#e8c547' : '#4fc3f7'}
                      fontSize={11}
                      fontWeight={700}
                      fontFamily="'Space Grotesk', sans-serif"
                    >
                      #{pos.id}
                    </text>
                    <text
                      x={pos.x} y={pos.y + 9}
                      textAnchor="middle"
                      fill={isTop ? '#e8c547' : '#4fc3f7'}
                      fontSize={9}
                      fontFamily="Inter, sans-serif"
                    >
                      {Math.round(item?.eloScore ?? 1200)}
                    </text>

                    {isTop && (
                      <text
                        x={pos.x}
                        y={pos.y - 30}
                        textAnchor="middle"
                        fill="var(--gold)"
                        fontSize={10}
                        fontWeight={600}
                        fontFamily="'Space Grotesk', sans-serif"
                        letterSpacing="0.08em"
                      >
                        WINNER?
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Frank-Wolfe note */}
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 14,
                padding: '12px 16px',
                background: 'rgba(79,195,247,0.06)',
                border: '1px solid rgba(79,195,247,0.2)',
                borderRadius: 12,
                fontSize: 13,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Solved via{' '}
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Frank-Wolfe</span>
              {' '}on convex SDP · 30 iterations
              <br />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Edge thickness ∝ query allocation λ*
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
