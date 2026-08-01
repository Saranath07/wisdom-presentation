import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHOWS } from './ShowdownSlide';
import { runShowSimulation } from '../simulation/wisdom';

const SEED = 238;
const BUDGET = 50;
const M = 3;

const springAnim = { type: 'spring' as const, stiffness: 120, damping: 20 };

// Precompute all simulation states
const ALL_STATES = runShowSimulation(SEED, BUDGET, M);
// Phase 2 states only (includes bracket end state as first item for reference)
const PHASE2_STATES = ALL_STATES.filter(s => s.phase === 'phase2' || s.phase === 'done');

export function RescueSlide() {
  const [stateIdx, setStateIdx] = useState(0);
  const [winnerShown, setWinnerShown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset on mount
    setStateIdx(0);
    setWinnerShown(false);

    timerRef.current = setInterval(() => {
      setStateIdx(prev => {
        const next = prev + 1;
        if (next >= PHASE2_STATES.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setWinnerShown(true);
          return prev;
        }
        return next;
      });
    }, 400);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const current = PHASE2_STATES[Math.min(stateIdx, PHASE2_STATES.length - 1)];
  const elos = current.elos;
  const topM = current.topM;
  const budgetUsed = current.budgetUsed;

  // Sorted leaderboard
  const leaderboard = [...elos]
    .map((elo, i) => ({ show: SHOWS[i], elo, id: i }))
    .sort((a, b) => b.elo - a.elo);

  const replyRank = leaderboard.findIndex(x => x.id === 0) + 1;
  const replyIsTop = replyRank === 1;

  const maxElo = Math.max(...elos);
  const minElo = Math.min(...elos);

  const replyInTopM = topM.includes(0);

  const totalBudget = BUDGET;
  const phase2Budget = budgetUsed - ALL_STATES.filter(s => s.phase === 'bracket').slice(-1)[0].budgetUsed;
  const budgetPct = Math.round((budgetUsed / totalBudget) * 100);

  const currentMatchup = current.matchup;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 50px 30px',
      background: 'var(--bg)',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="label" style={{ marginBottom: 6 }}>Phase 2: Optimal Design</div>
        <h1 style={{ fontSize: 42, lineHeight: 1.1 }}>
          The Algorithm{' '}
          <span style={{ color: 'var(--cyan)' }}>Sees Through</span>{' '}
          the Noise
        </h1>
      </motion.div>

      {/* Main panels */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

        {/* LEFT: Leaderboard (40%) */}
        <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
            LIVE LEADERBOARD
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {leaderboard.map((item, rank) => {
              const isReply = item.id === 0;
              const isInTopM = topM.includes(item.id);
              const barPct = maxElo === minElo ? 0.5 : (item.elo - minElo) / (maxElo - minElo);
              const isTargeted = currentMatchup &&
                (currentMatchup.a === item.id || currentMatchup.b === item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  transition={springAnim}
                  style={{
                    background: isReply
                      ? 'rgba(232,197,71,0.1)'
                      : isInTopM
                        ? 'rgba(79,195,247,0.05)'
                        : 'var(--glass-03)',
                    border: `1px solid ${
                      isReply ? 'rgba(232,197,71,0.4)'
                        : isInTopM ? 'rgba(79,195,247,0.2)'
                        : 'var(--glass-06)'
                    }`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: isReply && replyIsTop ? '0 0 16px rgba(232,197,71,0.25)' : 'none',
                  }}
                >
                  <span style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: isReply ? 'var(--gold)' : isInTopM ? 'var(--cyan)' : 'var(--text-secondary)',
                    width: 22,
                    textAlign: 'center',
                    flexShrink: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    #{rank + 1}
                  </span>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.show.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isReply ? 'var(--gold)' : 'var(--text-primary)',
                      fontFamily: "'Space Grotesk', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      {item.show.name}
                      {isTargeted && (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}
                        >
                          ⚡ QUERIED
                        </motion.span>
                      )}
                    </div>
                    <div style={{
                      height: 4,
                      background: 'var(--glass-08)',
                      borderRadius: 2,
                      marginTop: 4,
                    }}>
                      <motion.div
                        animate={{ width: `${barPct * 100}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                        style={{
                          height: '100%',
                          background: isReply ? 'var(--gold)' : 'var(--cyan)',
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    color: isReply ? 'var(--gold)' : 'var(--text-secondary)',
                    flexShrink: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                  }}>
                    {Math.round(item.elo)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Bar chart (40%) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
            ELO SCORES
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            paddingBottom: 30,
            position: 'relative',
          }}>
            {leaderboard.map(item => {
              const isReply = item.id === 0;
              const heightPct = maxElo === minElo
                ? 50
                : ((item.elo - minElo) / (maxElo - minElo)) * 70 + 15;
              const isTargeted = currentMatchup &&
                (currentMatchup.a === item.id || currentMatchup.b === item.id);

              return (
                <div
                  key={item.id}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: 4,
                  }}
                >
                  <AnimatePresence>
                    {isTargeted && (
                      <motion.div
                        key="flash"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ fontSize: 12, color: 'var(--red)' }}
                      >
                        ⚡
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span style={{ fontSize: 14 }}>{item.show.emoji}</span>
                  <motion.div
                    animate={{ height: `${heightPct}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                    style={{
                      width: '100%',
                      background: isReply
                        ? 'linear-gradient(180deg, var(--gold), rgba(232,197,71,0.4))'
                        : `linear-gradient(180deg, var(--cyan), rgba(79,195,247,0.2))`,
                      borderRadius: '4px 4px 0 0',
                      boxShadow: isReply ? '0 0 12px rgba(232,197,71,0.3)' : 'none',
                      position: 'relative',
                    }}
                  />
                  <span style={{
                    fontSize: 8,
                    color: isReply ? 'var(--gold)' : 'var(--text-secondary)',
                    textAlign: 'center',
                    position: 'absolute',
                    bottom: 0,
                  }}>
                    {item.show.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Phase 2 entry note */}
          <AnimatePresence>
            {replyInTopM && !replyIsTop && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={springAnim}
                style={{
                  background: 'rgba(232,197,71,0.08)',
                  border: '1px solid rgba(232,197,71,0.3)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🇰🇷</span>
                <span>Reply 1988 entered top-{M} — being closely evaluated!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Budget counter (20%) */}
        <div style={{
          width: 160,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em', textAlign: 'center' }}>
            PHASE 2: OPTIMAL DESIGN
          </div>

          {/* Budget ring */}
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <svg width={110} height={110} style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle cx={55} cy={55} r={46} fill="none" stroke="var(--glass-08)" strokeWidth={6} />
              <motion.circle
                cx={55} cy={55} r={46}
                fill="none"
                stroke="var(--cyan)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 46}`}
                animate={{ strokeDashoffset: `${2 * Math.PI * 46 * (1 - budgetPct / 100)}` }}
                style={{ transformOrigin: '55px 55px', rotate: '-90deg' }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--cyan)',
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1,
              }}>
                {totalBudget - budgetUsed}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>left</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Used</div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {budgetUsed}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>of {totalBudget}</div>
          </div>

          <div style={{
            background: 'var(--glass-04)',
            border: '1px solid var(--glass-08)',
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
            width: '100%',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>Reply 1988</div>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--gold)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              #{replyRank}
            </div>
            <div style={{ fontSize: 9, color: replyIsTop ? 'var(--gold)' : 'var(--text-secondary)' }}>
              {replyIsTop ? '🏆 #1 WINNER' : `rank of 7`}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Phase 2 queries: {phase2Budget < 0 ? 0 : phase2Budget}
          </div>
        </div>
      </div>

      {/* WINNER OVERLAY */}
      <AnimatePresence>
        {winnerShown && replyRank === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10,10,15,0.88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div style={{
              textAlign: 'center',
              padding: 40,
              background: 'rgba(232,197,71,0.08)',
              border: '2px solid var(--gold)',
              borderRadius: 20,
              boxShadow: '0 0 60px rgba(232,197,71,0.3)',
              maxWidth: 600,
            }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: 60, marginBottom: 16 }}
              >
                🏆
              </motion.div>
              <h1 style={{ fontSize: 52, color: 'var(--gold)', marginBottom: 8 }}>
                Reply 1988 🇰🇷
              </h1>
              <p style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>
                IMDb: 9.2 ★ — True Best Show
              </p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                Found with just {BUDGET} comparisons
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                (out of {Math.ceil(7 * 6 / 2)} possible pairs)
              </p>
              <div style={{
                marginTop: 20,
                padding: '10px 20px',
                background: 'rgba(232,197,71,0.1)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--gold)',
              }}>
                Phase 2 Optimal Design rescued the true winner from rank #5 → #1
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
