import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runWiSDoM } from '../simulation/wisdom';
import type { SimState } from '../simulation/types';
import { BracketViz } from '../components/BracketViz';
import { Leaderboard } from '../components/Leaderboard';
import { BudgetMeter } from '../components/BudgetMeter';

const SIM_CONFIG = { n: 16, budgetMultiplier: 4, t: 3, eloK: 32, seed: 77 };

export function Phase1Slide() {
  const states = useMemo(() => runWiSDoM(SIM_CONFIG), []);
  const bracketStates = useMemo(
    () => states.filter(s => s.phase === 'bracket'),
    [states]
  );

  const [stateIdx, setStateIdx] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showTopM, setShowTopM] = useState(false);

  const current: SimState = bracketStates[Math.min(stateIdx, bracketStates.length - 1)];

  useEffect(() => {
    // Start auto-play after short delay
    const t = setTimeout(() => setAutoPlaying(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!autoPlaying) return;
    if (stateIdx >= bracketStates.length - 1) {
      timerRef.current = setTimeout(() => setShowTopM(true), 600);
      return;
    }

    // Speed up as we progress
    const delay = stateIdx < 5 ? 500 : stateIdx < 20 ? 280 : 160;
    timerRef.current = setTimeout(() => {
      setStateIdx(i => i + 1);
    }, delay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [autoPlaying, stateIdx, bracketStates.length]);

  // Find completed matches for current state
  const completedMatches = current.bracketMatches.filter(m => m.completed && m.itemB !== -1 && m.itemA !== -1);
  const inProgressMatch = current.lastMatch;

  // Top M candidates from Elo
  const topM = useMemo(() => {
    return [...current.items]
      .sort((a, b) => b.eloScore - a.eloScore)
      .slice(0, Math.ceil(Math.pow(SIM_CONFIG.n, 0.25)))
      .map(it => it.id);
  }, [current.items]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 48px 30px',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Phase 1</div>
          <h1 style={{ fontSize: 36, marginBottom: 4 }}>
            Best-of-3 Bracket Warm Start
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            N=16 items · Best-of-3 matches · Elo updates after every query
          </p>
        </div>
        <div style={{ width: 200 }}>
          <BudgetMeter
            used={current.budgetUsed}
            total={current.budgetTotal}
            compact
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 24, minHeight: 0 }}>
        {/* Bracket */}
        <div style={{
          flex: 1.6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div className="label" style={{ marginBottom: 12, alignSelf: 'flex-start' }}>
            Tournament Bracket · Round {current.bracketRound}
          </div>

          <BracketViz
            matches={current.bracketMatches}
            items={current.items}
            highlightWinnerId={current.trueWinnerId}
            width={620}
            height={380}
          />

          {/* Last match flash */}
          {inProgressMatch && (
            <motion.div
              key={`${inProgressMatch[0]}-${inProgressMatch[1]}-${current.budgetUsed}`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 20px',
                background: inProgressMatch[2]
                  ? 'rgba(79,195,247,0.15)'
                  : 'rgba(239,83,80,0.15)',
                border: `1px solid ${inProgressMatch[2] ? 'rgba(79,195,247,0.4)' : 'rgba(239,83,80,0.4)'}`,
                borderRadius: 20,
                fontSize: 13,
                color: inProgressMatch[2] ? 'var(--cyan)' : 'var(--red)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Item {inProgressMatch[0]} {inProgressMatch[2] ? '>' : '<'} Item {inProgressMatch[1]}
            </motion.div>
          )}
        </div>

        {/* Leaderboard */}
        <div style={{
          width: 240,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px',
          overflow: 'hidden',
        }}>
          <div className="label" style={{ marginBottom: 12 }}>Live Elo Ranking</div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Leaderboard
              items={current.items}
              highlightId={current.trueWinnerId}
              maxItems={16}
              compact
            />
          </div>

          {/* Phase 1 stats */}
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Matches done</span>
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>
                {completedMatches.length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Queries used</span>
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                {current.budgetUsed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top-M reveal */}
      <AnimatePresence>
        {showTopM && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{
              padding: '16px 24px',
              background: 'rgba(232,197,71,0.08)',
              border: '1px solid rgba(232,197,71,0.3)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div>
              <div style={{
                fontSize: 12,
                color: 'var(--gold)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Phase 1 Complete: Top M = {topM.length} candidates selected
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Advancing to{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  Winner-Focused Experimental Design
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {topM.map(id => (
                <motion.div
                  key={id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: topM.indexOf(id) * 0.1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: id === current.trueWinnerId
                      ? 'rgba(232,197,71,0.2)'
                      : 'rgba(79,195,247,0.15)',
                    border: `1px solid ${id === current.trueWinnerId ? 'rgba(232,197,71,0.6)' : 'rgba(79,195,247,0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: id === current.trueWinnerId ? 'var(--gold)' : 'var(--cyan)',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {id}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
