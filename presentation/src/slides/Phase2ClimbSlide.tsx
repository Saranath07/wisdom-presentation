import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { runWiSDoM } from '../simulation/wisdom';
import type { SimState } from '../simulation/types';
import { Leaderboard } from '../components/Leaderboard';
import { BudgetMeter } from '../components/BudgetMeter';

const SIM_CONFIG = { n: 16, budgetMultiplier: 6, t: 3, eloK: 32, seed: 77 };

function BudgetCounter({ value, total }: { value: number; total: number }) {
  const mv = useMotionValue(total);

  useEffect(() => {
    const controls = animate(mv, total - value, {
      duration: 0.4,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [value, total, mv]);

  const display = useTransform(mv, v => Math.round(v).toString());

  return (
    <motion.span style={{
      fontSize: 36,
      fontWeight: 700,
      fontFamily: "'Space Grotesk', monospace",
      color: value / total > 0.8 ? 'var(--red)' : value / total > 0.5 ? 'var(--gold)' : 'var(--cyan)',
    }}>
      {display}
    </motion.span>
  );
}

export function Phase2ClimbSlide() {
  const states = useMemo(() => runWiSDoM(SIM_CONFIG), []);
  const [stateIdx, setStateIdx] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current: SimState = states[Math.min(stateIdx, states.length - 1)];

  useEffect(() => {
    const t = setTimeout(() => setAutoPlaying(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!autoPlaying) return;

    const playNext = () => {
      setStateIdx(i => {
        const next = i + 1;
        if (next >= states.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          timerRef.current = setTimeout(() => setLocked(true), 400);
          return states.length - 1;
        }
        return next;
      });
    };

    // Speed: bracket states faster, design states medium
    intervalRef.current = setInterval(() => {
      setStateIdx(i => {
        const s = states[i];
        if (!s) return i;
        // slow for design batches, fast for individual queries
        return i;
      });
      playNext();
    }, 80);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoPlaying, states.length]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const sorted = useMemo(() =>
    [...current.items].sort((a, b) => b.eloScore - a.eloScore),
    [current.items]
  );

  const trueWinner = current.items[current.trueWinnerId];
  const trueWinnerRank = sorted.findIndex(it => it.id === current.trueWinnerId);
  const predictedWinner = sorted[0];
  const isCorrect = predictedWinner.id === current.trueWinnerId;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 48px 30px',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            {current.phase === 'bracket' ? 'Phase 1: Bracket' : current.phase === 'design' ? 'Phase 2: Climb' : 'Complete'}
          </div>
          <h1 style={{ fontSize: 34, marginBottom: 0 }}>
            The{' '}
            <span style={{ color: 'var(--gold)' }}>Climb</span>{' '}
            — Winner Rising
          </h1>
        </div>

        {/* Budget counter */}
        <div style={{ textAlign: 'right' }}>
          <div className="label" style={{ marginBottom: 4 }}>Budget Remaining</div>
          <BudgetCounter value={current.budgetUsed} total={current.budgetTotal} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            / {current.budgetTotal} total
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 24, minHeight: 0 }}>
        {/* Leaderboard — the star */}
        <div style={{
          width: 260,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div className="label" style={{ marginBottom: 10 }}>Live Rankings</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Leaderboard
              items={current.items}
              highlightId={current.trueWinnerId}
              showRankCentrality={current.phase === 'design'}
              maxItems={16}
              compact
            />
          </div>
        </div>

        {/* Rank Centrality bars — the hero visual */}
        <div style={{
          flex: 1,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="label">Rank Centrality Scores</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Stationary distribution of win-probability Markov chain
            </div>
          </div>

          {/* Bars — sorted by rank centrality descending */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 24 }}>
            {[...current.items]
              .sort((a, b) => b.rankCentrality - a.rankCentrality)
              .map((item, i) => {
                const isWinner = item.id === current.trueWinnerId;
                const rcPct = item.rankCentrality / Math.max(...current.items.map(x => x.rankCentrality));
                const barH = Math.max(6, rcPct * 260);

                return (
                  <div
                    key={item.id}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {/* RC value */}
                    <motion.div
                      animate={{ opacity: 1 }}
                      style={{
                        fontSize: 8,
                        color: isWinner ? 'var(--gold)' : 'var(--text-secondary)',
                        marginBottom: 3,
                        fontFamily: "'Space Grotesk', monospace",
                      }}
                    >
                      {(item.rankCentrality * 100).toFixed(1)}
                    </motion.div>

                    {/* Bar */}
                    <motion.div
                      layout
                      layoutId={`rcbar-${item.id}`}
                      animate={{ height: barH }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      style={{
                        width: '100%',
                        borderRadius: '4px 4px 0 0',
                        background: isWinner
                          ? 'linear-gradient(180deg, #e8c547, rgba(232,197,71,0.6))'
                          : i === 0 && !isWinner
                          ? 'linear-gradient(180deg, #ef5350, rgba(239,83,80,0.5))'
                          : `rgba(79,195,247,${0.2 + (1 - i / current.items.length) * 0.5})`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {isWinner && (
                        <motion.div
                          animate={{ y: ['0%', '-100%', '0%'] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '30%',
                            background: 'linear-gradient(180deg, var(--glass-30), transparent)',
                          }}
                        />
                      )}
                    </motion.div>

                    {/* Label */}
                    <div style={{
                      fontSize: 8,
                      color: isWinner ? 'var(--gold)' : 'var(--text-secondary)',
                      marginTop: 4,
                      fontWeight: isWinner ? 700 : 400,
                    }}>
                      {item.id}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* X-axis label */}
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Items (sorted by rank centrality)
          </div>
        </div>

        {/* Right panel: stats + match flash */}
        <div style={{
          width: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Budget meter */}
          <div style={{
            padding: '14px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 14,
          }}>
            <BudgetMeter
              used={current.budgetUsed}
              total={current.budgetTotal}
              compact
            />
          </div>

          {/* True winner tracker */}
          <div style={{
            padding: '14px',
            background: trueWinnerRank === 0
              ? 'rgba(232,197,71,0.1)'
              : 'var(--glass-03)',
            border: `1px solid ${trueWinnerRank === 0 ? 'rgba(232,197,71,0.35)' : 'var(--glass-08)'}`,
            borderRadius: 14,
          }}>
            <div className="label" style={{ marginBottom: 8 }}>True Winner</div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--gold)',
              fontFamily: "'Space Grotesk', sans-serif",
              marginBottom: 4,
            }}>
              Item {current.trueWinnerId}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Elo: {Math.round(trueWinner?.eloScore ?? 1200)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
              }}>
                Current rank:
              </div>
              <motion.div
                animate={{
                  color: trueWinnerRank === 0 ? '#e8c547' : trueWinnerRank < 3 ? '#4fc3f7' : '#ef5350',
                }}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                #{trueWinnerRank + 1}
              </motion.div>
            </div>
          </div>

          {/* Last match */}
          <AnimatePresence mode="wait">
            {current.lastMatch && (
              <motion.div
                key={`${current.lastMatch[0]}-${current.lastMatch[1]}-${current.budgetUsed}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(79,195,247,0.07)',
                  border: '1px solid rgba(79,195,247,0.2)',
                  borderRadius: 12,
                  fontSize: 13,
                }}
              >
                <div className="label" style={{ marginBottom: 6 }}>Last Query</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: current.lastMatch[2] ? 'var(--gold)' : 'var(--neutral)', fontWeight: 600 }}>
                    #{current.lastMatch[0]}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {current.lastMatch[2] ? '>' : '<'}
                  </span>
                  <span style={{ color: !current.lastMatch[2] ? 'var(--gold)' : 'var(--neutral)', fontWeight: 600 }}>
                    #{current.lastMatch[1]}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Candidate set */}
          {current.candidateSet.length > 0 && (
            <div style={{
              padding: '12px 14px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
            }}>
              <div className="label" style={{ marginBottom: 8 }}>Top-M Focus</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {current.candidateSet.map((id, i) => (
                  <motion.div
                    key={id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.05 }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: i === 0 ? 'rgba(232,197,71,0.2)' : 'rgba(79,195,247,0.12)',
                      border: `1px solid ${i === 0 ? 'rgba(232,197,71,0.5)' : 'rgba(79,195,247,0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: i === 0 ? 'var(--gold)' : 'var(--cyan)',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {id}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Winner lock-in overlay */}
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10,10,15,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  fontSize: 64,
                  marginBottom: 16,
                }}
              >
                ★
              </motion.div>

              <div style={{
                fontSize: 56,
                fontWeight: 900,
                color: 'var(--gold)',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.02em',
                textShadow: '0 0 60px rgba(232,197,71,0.4)',
                marginBottom: 8,
              }}>
                WINNER LOCKED
              </div>

              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: "'Space Grotesk', sans-serif",
                marginBottom: 16,
              }}>
                Item {current.trueWinnerId}
              </div>

              <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                {isCorrect ? (
                  <span style={{ color: 'var(--green)' }}>
                    Correct! WiSDoM found the true best item.
                  </span>
                ) : (
                  <span style={{ color: 'var(--red)' }}>
                    Near-miss — predicted #{predictedWinner.id} (true: #{current.trueWinnerId})
                  </span>
                )}
              </div>

              <div style={{ marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
                Budget used: {current.budgetUsed} / {current.budgetTotal} queries
              </div>
            </motion.div>

            {/* Particle burst */}
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i / 16) * 2 * Math.PI) * (150 + Math.random() * 100),
                  y: Math.sin((i / 16) * 2 * Math.PI) * (150 + Math.random() * 100),
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 1.2, delay: i * 0.05, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i % 3 === 0 ? 'var(--gold)' : i % 3 === 1 ? 'var(--cyan)' : 'var(--text-primary)',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
