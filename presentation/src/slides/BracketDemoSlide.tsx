import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHOWS } from './ShowdownSlide';
import { runShowSimulation } from '../simulation/wisdom';

const SEED = 238;
const BUDGET = 50;
const M = 3;

const springAnim = { type: 'spring' as const, stiffness: 120, damping: 20 };

// Precompute simulation states
const SIM_STATES = runShowSimulation(SEED, BUDGET, M);
// Only bracket states for this slide
const BRACKET_STATES = SIM_STATES.filter(s => s.phase === 'bracket');

interface MatchCardProps {
  showA: typeof SHOWS[0] | null;
  showB: typeof SHOWS[0] | null;
  winner: number | null;
  active: boolean;
  isBye: boolean;
}

function MatchCard({ showA, showB, winner, active, isBye }: MatchCardProps) {
  if (isBye && showA) {
    return (
      <div style={{
        background: 'var(--glass-04)',
        border: '1px solid var(--glass-08)',
        borderRadius: 10,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 200,
      }}>
        <span style={{ fontSize: 20 }}>{showA.emoji}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{showA.name}</div>
          <div style={{ fontSize: 10, color: 'var(--cyan)' }}>BYE → advances</div>
        </div>
      </div>
    );
  }
  if (!showA || !showB) return null;

  return (
    <div style={{
      background: active ? 'rgba(232,197,71,0.06)' : 'var(--glass-03)',
      border: `1px solid ${active ? 'var(--gold)' : 'var(--glass-08)'}`,
      borderRadius: 10,
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 240,
      boxShadow: active ? '0 0 12px rgba(232,197,71,0.2)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      {/* Show A */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        flex: 1,
        opacity: winner !== null && winner !== showA.id ? 0.4 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        <span style={{ fontSize: 18 }}>{showA.emoji}</span>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: winner === showA.id ? showA.color : 'var(--text-primary)',
            boxShadow: winner === showA.id ? `0 0 8px ${showA.color}66` : 'none',
          }}>
            {showA.name}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>★ {showA.rating}</div>
        </div>
        {winner === showA.id && <span style={{ fontSize: 14, marginLeft: 'auto' }}>👑</span>}
      </div>

      {/* VS */}
      <div style={{
        fontSize: 11,
        fontWeight: 900,
        color: 'var(--red)',
        flexShrink: 0,
        padding: '0 4px',
      }}>
        VS
      </div>

      {/* Show B */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        flex: 1,
        justifyContent: 'flex-end',
        opacity: winner !== null && winner !== showB.id ? 0.4 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        {winner === showB.id && <span style={{ fontSize: 14 }}>👑</span>}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: winner === showB.id ? showB.color : 'var(--text-primary)',
          }}>
            {showB.name}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>★ {showB.rating}</div>
        </div>
        <span style={{ fontSize: 18 }}>{showB.emoji}</span>
      </div>
    </div>
  );
}

export function BracketDemoSlide() {
  const [stateIdx, setStateIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStateIdx(prev => {
        if (prev >= BRACKET_STATES.length - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const current = BRACKET_STATES[Math.min(stateIdx, BRACKET_STATES.length - 1)];
  const elos = current.elos;

  // Build match history from states up to current
  const completedMatchups: Array<{ a: number; b: number; winner: number; isBye: boolean }> = [];
  for (let i = 0; i <= stateIdx && i < BRACKET_STATES.length; i++) {
    const s = BRACKET_STATES[i];
    if (s.matchup) {
      const isBye = s.matchup.b === -1;
      const existing = completedMatchups.find(m => m.a === s.matchup!.a && m.b === s.matchup!.b);
      if (!existing) {
        completedMatchups.push({ a: s.matchup.a, b: s.matchup.b, winner: s.matchup.winner, isBye });
      }
    }
  }

  const currentMatchup = current.matchup;

  // Build sorted leaderboard by Elo
  const leaderboard = [...elos]
    .map((elo, i) => ({ show: SHOWS[i], elo }))
    .sort((a, b) => b.elo - a.elo);

  // Check if all bracket matches done
  const bracketDone = stateIdx >= BRACKET_STATES.length - 1;
  const topM = current.topM;
  const replyRank = leaderboard.findIndex(x => x.show.id === 0) + 1;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '30px 60px 30px',
      background: 'var(--bg)',
      gap: 16,
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="label" style={{ marginBottom: 6 }}>Phase 1: Bracket Tournament</div>
        <h1 style={{ fontSize: 40, lineHeight: 1.1 }}>
          TV Show{' '}
          <span style={{ color: 'var(--gold)' }}>Face-Off</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Seed = {SEED} | Budget = {BUDGET} | M = {M} | BTL noisy comparisons
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Left: Bracket */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Current matchup highlight */}
          <AnimatePresence mode="wait">
            {currentMatchup && currentMatchup.b !== -1 && (
              <motion.div
                key={`matchup-${currentMatchup.a}-${currentMatchup.b}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springAnim}
                style={{
                  background: 'rgba(239,83,80,0.06)',
                  border: '1px solid rgba(239,83,80,0.3)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 30 }}>{SHOWS[currentMatchup.a].emoji}</div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: SHOWS[currentMatchup.a].color,
                  }}>
                    {SHOWS[currentMatchup.a].name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Elo {Math.round(elos[currentMatchup.a])}
                  </div>
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: 'var(--red)',
                  padding: '0 8px',
                  textShadow: '0 0 12px rgba(239,83,80,0.6)',
                }}>
                  VS
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 30 }}>{SHOWS[currentMatchup.b].emoji}</div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: SHOWS[currentMatchup.b].color,
                  }}>
                    {SHOWS[currentMatchup.b].name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Elo {Math.round(elos[currentMatchup.b])}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Match history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
              MATCH RESULTS
            </div>
            {completedMatchups.map((m, i) => (
              <motion.div
                key={`${m.a}-${m.b}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, ...springAnim }}
              >
                <MatchCard
                  showA={m.isBye ? SHOWS[m.a] : SHOWS[m.a]}
                  showB={m.isBye ? null : SHOWS[m.b]}
                  winner={m.winner}
                  active={false}
                  isBye={m.isBye}
                />
              </motion.div>
            ))}
          </div>

          {/* Warning: Reply 1988 eliminated */}
          <AnimatePresence>
            {bracketDone && !topM.includes(0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springAnim}
                style={{
                  background: 'rgba(239,83,80,0.1)',
                  border: '1px solid rgba(239,83,80,0.4)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 22 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
                    Reply 1988 is rank #{replyRank} — NOT in top-{M}!
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    The true best show was knocked out early by noise. Phase 2 will rescue it.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Live Elo Leaderboard */}
        <div style={{
          width: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
            LIVE ELO LEADERBOARD
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {leaderboard.map((item, rank) => {
              const isReply = item.show.id === 0;
              const isTopM = topM.includes(item.show.id);
              const maxElo = Math.max(...elos);
              const minElo = Math.min(...elos);
              const barPct = maxElo === minElo ? 0.5 : (item.elo - minElo) / (maxElo - minElo);

              return (
                <motion.div
                  key={item.show.id}
                  layout
                  transition={springAnim}
                  style={{
                    background: isReply ? 'rgba(232,197,71,0.08)' : 'var(--glass-03)',
                    border: `1px solid ${isReply ? 'rgba(232,197,71,0.3)' : 'var(--glass-06)'}`,
                    borderRadius: 8,
                    padding: '7px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isTopM ? 'var(--cyan)' : 'var(--text-secondary)',
                    width: 14,
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    #{rank + 1}
                  </span>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{item.show.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isReply ? 'var(--gold)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.show.name}
                    </div>
                    <div style={{
                      height: 3,
                      background: 'var(--glass-08)',
                      borderRadius: 2,
                      marginTop: 3,
                    }}>
                      <motion.div
                        animate={{ width: `${barPct * 100}%` }}
                        transition={{ duration: 0.4 }}
                        style={{
                          height: '100%',
                          background: isReply ? 'var(--gold)' : item.show.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9,
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {Math.round(item.elo)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Top-3 panel */}
          <AnimatePresence>
            {bracketDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springAnim}
                style={{
                  background: 'rgba(79,195,247,0.06)',
                  border: '1px solid rgba(79,195,247,0.2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700, marginBottom: 6 }}>
                  TOP-{M} CANDIDATES
                </div>
                {topM.map((id, i) => (
                  <div key={id} style={{
                    fontSize: 11,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 3,
                  }}>
                    <span style={{ color: 'var(--text-secondary)', width: 14 }}>{i + 1}.</span>
                    <span>{SHOWS[id].emoji}</span>
                    <span>{SHOWS[id].name}</span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
                  Advancing to Phase 2
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            Budget used: {current.budgetUsed} / {BUDGET}
          </div>
        </div>
      </div>
    </div>
  );
}
