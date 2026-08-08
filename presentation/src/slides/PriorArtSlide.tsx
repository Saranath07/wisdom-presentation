import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  trueScore: i === 9 ? 2200 : 1000 + i * 80,
  label: `I${i}`,
}));

const trueWinner = ITEMS[9];

export function PriorArtSlide() {
  const [step, setStep] = useState(0);
  const [leader, setLeader] = useState(0);
  const [challenger, setChallenger] = useState(1);
  const [matchResult, setMatchResult] = useState<'leader' | 'challenger' | null>(null);
  const [rounds, setRounds] = useState(0);
  const [showFail, setShowFail] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 800);
    const t3 = setTimeout(() => setStep(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (step < 3) return;
    let currentLeader = 0;
    let currentChallenger = 1;
    let round = 0;

    const runStep = () => {
      setMatchResult(null);
      setLeader(currentLeader);
      setChallenger(currentChallenger);
      setTimeout(() => {
        const lScore = ITEMS[currentLeader].trueScore;
        const cScore = ITEMS[currentChallenger].trueScore;
        const leaderWins = Math.random() < (0.4 + (lScore > cScore ? 0.2 : -0.2));
        if (leaderWins) {
          setMatchResult('leader');
        } else {
          currentLeader = currentChallenger;
          setLeader(currentLeader);
          setMatchResult('challenger');
        }
        setRounds(r => r + 1);
        round++;
        currentChallenger = (currentChallenger + 1) % ITEMS.length;
        if (currentChallenger === currentLeader) currentChallenger = (currentChallenger + 1) % ITEMS.length;
        if (round < 15) setTimeout(runStep, 700);
        else setTimeout(() => { if (currentLeader !== trueWinner.id) setShowFail(true); }, 600);
      }, 500);
    };
    const t = setTimeout(runStep, 400);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      padding: '32px 72px', gap: 20,
    }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="label" style={{ marginBottom: 8 }}>Prior Art</div>
        <h1 style={{ fontSize: 48, marginBottom: 6 }}>PARWIS: King of the Hill</h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>
          Always challenge the current leader. If challenger wins, they become the new leader.
        </p>
      </motion.div>

      {/* Path visualization */}
      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '20px 24px',
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16,
          }}
        >
          {ITEMS.map((item, i) => (
            <React.Fragment key={item.id}>
              <motion.div
                animate={{
                  background: item.id === leader && step >= 3
                    ? 'rgba(232,197,71,0.28)' : item.id === challenger && step >= 3
                    ? 'rgba(239,83,80,0.2)' : item.id === trueWinner.id
                    ? 'rgba(79,195,247,0.1)' : 'var(--glass-05)',
                  scale: item.id === leader && step >= 3 ? 1.18 : 1,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  flex: 1, minWidth: 0, aspectRatio: '1',
                  borderRadius: 10,
                  border: `1px solid ${item.id === leader && step >= 3 ? 'rgba(232,197,71,0.6)' : item.id === trueWinner.id ? 'rgba(79,195,247,0.4)' : 'var(--glass-10)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, position: 'relative',
                  color: item.id === leader && step >= 3 ? 'var(--gold)' : 'var(--text-secondary)',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {item.id === trueWinner.id && (
                  <div style={{ fontSize: 9, color: 'var(--cyan)', position: 'absolute', top: 3, right: 5 }}>★</div>
                )}
                <div>{item.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{item.trueScore}</div>
              </motion.div>
              {i < ITEMS.length - 1 && (
                <div style={{ width: 16, height: 2, background: 'var(--glass-12)', flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </motion.div>
      )}

      {/* Battle arena - big and readable */}
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ flex: 1, display: 'flex', gap: 24, alignItems: 'stretch', minHeight: 0 }}
        >
          {/* Leader */}
          <motion.div
            animate={{ scale: matchResult === 'leader' ? 1.04 : 1 }}
            style={{
              flex: 1, padding: '28px 32px',
              background: 'rgba(232,197,71,0.07)',
              border: `2px solid ${matchResult === 'leader' ? 'var(--gold)' : 'rgba(232,197,71,0.3)'}`,
              borderRadius: 18, textAlign: 'center',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8,
            }}
          >
            <div className="label" style={{ color: 'var(--gold)' }}>LEADER</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--gold)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {ITEMS[leader]?.label}
            </div>
            <div style={{ fontSize: 20, color: 'var(--text-secondary)' }}>
              score: {ITEMS[leader]?.trueScore}
            </div>
            {ITEMS[leader]?.id === trueWinner.id && (
              <div style={{ fontSize: 16, color: 'var(--cyan)', fontWeight: 600 }}>← TRUE WINNER</div>
            )}
            <AnimatePresence>
              {matchResult === 'leader' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ fontSize: 24, color: 'var(--gold)' }}>👑 DEFENDED</motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
            <motion.div
              animate={{ rotate: matchResult === null ? [0, 6, -6, 0] : 0, scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: matchResult === null ? Infinity : 0 }}
              style={{ fontSize: 36, fontWeight: 900, color: 'var(--red)', fontFamily: "'Space Grotesk', sans-serif" }}
            >VS</motion.div>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>round {rounds}</div>
          </div>

          {/* Challenger */}
          <motion.div
            animate={{ scale: matchResult === 'challenger' ? 1.04 : 1 }}
            style={{
              flex: 1, padding: '28px 32px',
              background: 'var(--glass-04)',
              border: `2px solid ${matchResult === 'challenger' ? 'var(--red)' : 'var(--glass-12)'}`,
              borderRadius: 18, textAlign: 'center',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8,
            }}
          >
            <div className="label" style={{ color: 'var(--text-secondary)' }}>CHALLENGER</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {ITEMS[challenger]?.label}
            </div>
            <div style={{ fontSize: 20, color: 'var(--text-secondary)' }}>
              score: {ITEMS[challenger]?.trueScore}
            </div>
            <AnimatePresence>
              {matchResult === 'challenger' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ fontSize: 24, color: 'var(--red)' }}>UPSET! New leader</motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {/* Problems */}
      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 16 }}
        >
          {[
            'Path graph → high mixing time',
            'Noise drags leader to wrong candidate',
            'No budget-aware query allocation',
          ].map(text => (
            <div key={text} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.25)',
              borderRadius: 10, fontSize: 16, color: 'var(--red)',
            }}>
              <span style={{ fontSize: 18 }}>⚠</span> {text}
            </div>
          ))}
        </motion.div>
      )}

      {/* FAIL overlay */}
      <AnimatePresence>
        {showFail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 100, fontWeight: 900, color: 'var(--red)',
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 0 80px rgba(239,83,80,0.6)',
              pointerEvents: 'none', zIndex: 10,
            }}
          >
            FAIL
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
