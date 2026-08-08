import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL;

// ── Data ─────────────────────────────────────────────────────────────────────

interface VideoMeta {
  algo: string;
  file: string;
  result: 'correct' | 'wrong';
  queries: number;
  isWisdom: boolean;
  color: string;
}

const ALGO_COLORS: Record<string, string> = {
  WiSDoM:    'var(--gold)',
  PARWiS:    '#4fc3f7',
  SELECT:    '#ef5350',
  RUCB:      '#ce93d8',
  MultiSort: '#80cbc4',
  Knockout:  '#ffb74d',
};

// Order: WiSDoM first (highlighted), then baselines sorted by T20 queries desc
const VIDEOS: Record<'T20' | 'T200', VideoMeta[]> = {
  T20: [
    { algo: 'WiSDoM',    file: 'algo_T20_Robust_FW_traj36_correct_n189.mp4',  result: 'correct', queries: 189, isWisdom: true,  color: 'var(--gold)' },
    { algo: 'Knockout',  file: 'algo_T20_Knockout_traj36_correct_n162.mp4',   result: 'correct', queries: 162, isWisdom: false, color: '#ffb74d' },
    { algo: 'PARWiS',    file: 'algo_T20_PARWiS_traj36_correct_n123.mp4',     result: 'correct', queries: 123, isWisdom: false, color: '#4fc3f7' },
    { algo: 'RUCB',      file: 'algo_T20_RUCB_traj0_wrong_n118.mp4',          result: 'wrong',   queries: 118, isWisdom: false, color: '#ce93d8' },
    { algo: 'SELECT',    file: 'algo_T20_SELECT_traj36_correct_n115.mp4',      result: 'correct', queries: 115, isWisdom: false, color: '#ef5350' },
    { algo: 'MultiSort', file: 'algo_T20_MultiSort_traj36_correct_n20.mp4',    result: 'correct', queries:  20, isWisdom: false, color: '#80cbc4' },
  ],
  T200: [
    { algo: 'WiSDoM',    file: 'algo_T200_Robust_FW_traj36_correct_n49.mp4',  result: 'correct', queries:  49, isWisdom: true,  color: 'var(--gold)' },
    { algo: 'RUCB',      file: 'algo_T200_RUCB_traj0_wrong_n244.mp4',         result: 'wrong',   queries: 244, isWisdom: false, color: '#ce93d8' },
    { algo: 'Knockout',  file: 'algo_T200_Knockout_traj36_correct_n20.mp4',   result: 'correct', queries:  20, isWisdom: false, color: '#ffb74d' },
    { algo: 'MultiSort', file: 'algo_T200_MultiSort_traj6_wrong_n14.mp4',      result: 'wrong',   queries:  14, isWisdom: false, color: '#80cbc4' },
    { algo: 'SELECT',    file: 'algo_T200_SELECT_traj36_correct_n14.mp4',      result: 'correct', queries:  14, isWisdom: false, color: '#ef5350' },
    { algo: 'PARWiS',    file: 'algo_T200_PARWiS_traj36_correct_n13.mp4',     result: 'correct', queries:  13, isWisdom: false, color: '#4fc3f7' },
  ],
};

// ── Sub-components ────────────────────────────────────────────────────────────

function VideoCard({ v, temp }: { v: VideoMeta; temp: 'T20' | 'T200' }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // Auto-play on mount, loop
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
    setPlaying(true);
  }, [v.file]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); }
    else           { el.pause(); setPlaying(false); }
  };

  const border = v.isWisdom
    ? '2px solid var(--gold)'
    : v.result === 'correct'
      ? '1.5px solid rgba(100,255,100,0.35)'
      : '1.5px solid rgba(255,80,80,0.4)';

  const glow = v.isWisdom ? '0 0 16px rgba(201,162,39,0.45)' : 'none';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={toggle}
      style={{
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
        border,
        boxShadow: glow,
        cursor: 'pointer',
        background: '#0a0a14',
        flexShrink: 0,
      }}
    >
      {/* Video */}
      <video
        ref={ref}
        src={`${BASE}videos/dmcontrol/${v.file}`}
        loop
        muted
        playsInline
        style={{ display: 'block', width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
      />

      {/* Algo label bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 7px',
        background: v.isWisdom
          ? 'rgba(201,162,39,0.85)'
          : 'rgba(10,10,20,0.82)',
        backdropFilter: 'blur(4px)',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: v.isWisdom ? '#0a0a14' : v.color,
          letterSpacing: 0.3,
        }}>
          {v.algo}
        </span>
        {/* Result badge */}
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '1px 5px', borderRadius: 4,
          background: v.result === 'correct' ? 'rgba(80,200,80,0.25)' : 'rgba(255,80,80,0.25)',
          color: v.result === 'correct' ? '#7dff7d' : '#ff7d7d',
          border: v.result === 'correct' ? '1px solid #7dff7d' : '1px solid #ff7d7d',
        }}>
          {v.result === 'correct' ? '✓ correct' : '✗ wrong'}
        </span>
      </div>

      {/* Query count */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '3px 7px',
        background: 'rgba(10,10,20,0.78)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>queries used:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: v.color }}>{v.queries}</span>
      </div>

      {/* Play/pause overlay */}
      {!playing && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 28, color: 'white' }}>▶</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Graph panel (loads the PNG from public) ───────────────────────────────────

function GraphPanel({ temp }: { temp: 'T20' | 'T200' }) {
  // Map to the graph files we have
  const graphFiles: Record<string, string> = {
    T20:  '/data/dmcontrol_graph_T20.png',
    T200: '/data/dmcontrol_graph_T200.png',
  };
  const src = graphFiles[temp];

  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Top-1 Accuracy vs Budget · {temp === 'T20' ? 'T=20 (hardest)' : 'T=200'}
      </div>
      <div style={{
        flex: 1, borderRadius: 10, overflow: 'hidden',
        border: '1px solid var(--glass-10)',
        background: '#0a0a14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={src}
          alt={`DMControl ${temp} accuracy graph`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}

// ── Main slide ────────────────────────────────────────────────────────────────

export function DMControlSlide() {
  const [temp, setTemp] = useState<'T20' | 'T200'>('T20');

  const videos = VIDEOS[temp];
  const wisdom = videos.find(v => v.isWisdom)!;
  const others = videos.filter(v => !v.isWisdom);
  const correct = others.filter(v => v.result === 'correct').length;
  const total = others.length;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 32px 16px',
      boxSizing: 'border-box',
      gap: 12,
      fontFamily: 'var(--font)',
      color: 'var(--text)',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            DMControl — Walker Walk
            <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
              N=100 policies · All algorithms · Winner's policy rollout
            </span>
          </h2>
        </div>

        {/* T=20 / T=200 toggle */}
        <div style={{
          display: 'flex', borderRadius: 8, overflow: 'hidden',
          border: '1px solid var(--glass-25)',
          flexShrink: 0,
        }}>
          {(['T20', 'T200'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTemp(t)}
              style={{
                padding: '6px 18px', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: temp === t ? 'var(--gold)' : 'transparent',
                color: temp === t ? '#0a0a14' : 'var(--text-secondary)',
                transition: 'all 0.18s',
              }}
            >
              {t === 'T20' ? 'T = 20  (hardest)' : 'T = 200'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat bar ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={temp}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex', gap: 16, flexShrink: 0,
            padding: '8px 14px', borderRadius: 8,
            background: 'var(--glass-05)',
            border: '1px solid var(--glass-10)',
            alignItems: 'center',
          }}
        >
          {/* WiSDoM highlight */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
              WiSDoM → correct
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              using {wisdom.queries} queries
            </span>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--glass-25)' }} />

          {/* Baselines summary */}
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Baselines: <span style={{ color: '#7dff7d', fontWeight: 700 }}>{correct}</span>
            <span style={{ color: 'var(--text-secondary)' }}> / {total} correct</span>
            {temp === 'T20' && <span style={{ color: '#ff7d7d', marginLeft: 6 }}>· RUCB fails at {temp}</span>}
            {temp === 'T200' && <span style={{ color: '#ff7d7d', marginLeft: 6 }}>· RUCB & MultiSort fail at {temp}</span>}
          </span>

          <div style={{ width: 1, height: 18, background: 'var(--glass-25)' }} />

          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Videos show the predicted winner's rollout — not WiSDoM's internal comparisons
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ── Main body: videos + graph ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>

        {/* Video grid: 2 rows × 3 cols */}
        <AnimatePresence mode="wait">
          <motion.div
            key={temp + '-grid'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 8,
              width: '52%',
              flexShrink: 0,
            }}
          >
            {videos.map((v, i) => (
              <VideoCard key={v.file} v={v} temp={temp} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Right: graph stack */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Graph */}
          <div style={{
            flex: 1, minHeight: 0,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: 0.8,
              flexShrink: 0,
            }}>
              Top-1 Accuracy vs Budget
              {temp === 'T20'
                ? <span style={{ color: '#ff9e7d', marginLeft: 6 }}>· T=20 — hardest, tiny margins</span>
                : <span style={{ color: '#80cbc4', marginLeft: 6 }}>· T=200</span>}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={temp + '-graph'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  flex: 1, minHeight: 0,
                  borderRadius: 10, overflow: 'hidden',
                  border: '1px solid var(--glass-10)',
                  background: '#111',
                }}
              >
                <img
                  src={`${BASE}data/real_ACC_dmcontrol_${temp === 'T20' ? 'T20' : 'T200'}.png`}
                  alt={`DMControl ${temp} accuracy`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div style={{
            flexShrink: 0,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'var(--glass-05)',
            border: '1px solid var(--glass-10)',
            display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
          }}>
            {videos.map(v => (
              <div key={v.algo} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  display: 'inline-block', width: v.isWisdom ? 16 : 12,
                  height: v.isWisdom ? 3.5 : 2,
                  borderRadius: 2, background: v.color,
                }} />
                <span style={{
                  fontSize: 11,
                  color: v.isWisdom ? 'var(--gold)' : 'var(--text-secondary)',
                  fontWeight: v.isWisdom ? 700 : 400,
                }}>
                  {v.algo}
                  {' '}
                  <span style={{
                    color: v.result === 'correct' ? '#7dff7d' : '#ff7d7d',
                    fontSize: 10,
                  }}>
                    {v.result === 'correct' ? '✓' : '✗'}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Key takeaway */}
          <div style={{
            flexShrink: 0,
            padding: '8px 14px', borderRadius: 8,
            background: 'rgba(201,162,39,0.08)',
            border: '1px solid rgba(201,162,39,0.25)',
            fontSize: 12, lineHeight: 1.5,
            color: 'var(--text-secondary)',
          }}>
            {temp === 'T20' ? (
              <>
                <strong style={{ color: 'var(--gold)' }}>T=20 (hardest):</strong>{' '}
                Tiny BTL gaps — all 100 policies nearly identical in strength. WiSDoM still identifies the correct winner using{' '}
                <strong style={{ color: 'var(--gold)' }}>189 queries</strong>.{' '}
                RUCB exhausts budget (118 queries) and picks the{' '}
                <strong style={{ color: '#ff7d7d' }}>wrong policy</strong>.
              </>
            ) : (
              <>
                <strong style={{ color: '#80cbc4' }}>T=200:</strong>{' '}
                Larger gaps make it easier — yet RUCB uses{' '}
                <strong style={{ color: '#ff7d7d' }}>244 queries</strong> and still picks wrong.
                MultiSort also fails. WiSDoM solves it in just{' '}
                <strong style={{ color: 'var(--gold)' }}>49 queries</strong>.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
