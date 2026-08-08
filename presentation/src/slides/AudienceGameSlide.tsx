import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── 10 shows - good spread of genres, true winner = Breaking Bad ─────────────
export const SHOWS = [
  { id: 0, name: 'Reply 1988',      image: import.meta.env.BASE_URL + 'shows/reply1988.jpg',          rating: 9.2, genre: 'K-Drama',  color: '#e8c547' },
  { id: 1, name: 'Attack on Titan', image: import.meta.env.BASE_URL + 'shows/aot.jpg',                rating: 9.0, genre: 'Anime',    color: '#ef5350' },
  { id: 2, name: 'Death Note',      image: import.meta.env.BASE_URL + 'shows/deathnote.jpg',          rating: 9.0, genre: 'Anime',    color: '#ce93d8' },
  { id: 3, name: 'The Office',      image: import.meta.env.BASE_URL + 'shows/office.jpg',             rating: 9.0, genre: 'Comedy',   color: '#4fc3f7' },
  { id: 4, name: 'Breaking Bad',    image: import.meta.env.BASE_URL + 'shows/breakingbad.svg',        rating: 9.5, genre: 'Thriller', color: '#80cbc4' },
  { id: 5, name: 'Chernobyl',       image: import.meta.env.BASE_URL + 'shows/Chernobyl.jpeg',         rating: 9.4, genre: 'Drama',    color: '#a5d6a7' },
  { id: 6, name: 'Squid Game',      image: import.meta.env.BASE_URL + 'shows/squidgame.jpeg',         rating: 8.0, genre: 'K-Drama',  color: '#f06292' },
  { id: 7, name: 'Steins;Gate',     image: import.meta.env.BASE_URL + 'shows/steinsgate.jpeg',        rating: 9.1, genre: 'Anime',    color: '#80deea' },
  { id: 8, name: 'Riverdale',       image: import.meta.env.BASE_URL + 'shows/riverdale.jpg',          rating: 6.4, genre: 'Drama',    color: '#e57373' },
  { id: 9, name: 'Fuller House',    image: import.meta.env.BASE_URL + 'shows/fullerhouse.jpg',        rating: 6.2, genre: 'Comedy',   color: '#ffb74d' },
];

const TRUE_WINNER = 4; // Breaking Bad 9.5
const N = 10;
const M = 4;           // top-4 advance to Phase 2
const PHASE2_BUDGET = 20;

// Phase 1: automated bracket simulation (audience watches the animation)
// Phase 2: 1 voter per query (single oracle query, budget-optimal) - audience plays
const VOTERS = [
  { name: 'Alice',   color: '#e8c547' },
  { name: 'Bob',     color: '#4fc3f7' },
  { name: 'Charlie', color: '#ef5350' },
];

// Simulate Phase 1 bracket with Breaking Bad losing once due to noise,
// ending up just outside top-M. Returns final elos + match log.
function _simulatePhase1(): { elos: number[]; matches: MatchRecord[] } {
  let elos = new Array(N).fill(1200);
  const matches: MatchRecord[] = [];

  // Bracket: pair 0v1, 2v3, 4v5(BB loses!), 6v7, 8v9
  // Round 1 results: winner of each pair (BB=4 loses to Chernobyl=5 due to noise)
  const r1: [number, number, number][] = [
    [0, 1, 0],  // Reply 1988 beats AoT
    [2, 3, 2],  // Death Note beats The Office
    [4, 5, 5],  // Chernobyl UPSETS Breaking Bad (noisy oracle!)
    [6, 7, 7],  // Steins;Gate beats Squid Game
    [8, 9, 8],  // Riverdale beats Fuller House (bye match - one advances)
  ];

  for (const [a, b, winner] of r1) {
    elos = eloUpdate(elos, a, b, winner === a);
    matches.push({ a, b, votes: [winner === a ? 0 : 1], winner, phase: 1 });
  }

  // Round 2: survivors 0, 2, 5, 7 play; BB=4 is eliminated; Riverdale=8 got a bye
  // Give BB a consolation match so it appears in log but loses bracket
  const r2: [number, number, number][] = [
    [0, 2, 0],  // Reply 1988 beats Death Note
    [5, 7, 5],  // Chernobyl beats Steins;Gate
    [4, 8, 4],  // BB beats Riverdale (consolation) - shows up #5 in elo
  ];
  for (const [a, b, winner] of r2) {
    elos = eloUpdate(elos, a, b, winner === a);
    matches.push({ a, b, votes: [winner === a ? 0 : 1], winner, phase: 1 });
  }

  // Round 3: 0 vs 5 → Chernobyl wins bracket
  const r3: [number, number, number][] = [
    [0, 5, 5],  // Chernobyl beats Reply 1988 in final
  ];
  for (const [a, b, winner] of r3) {
    elos = eloUpdate(elos, a, b, winner === a);
    matches.push({ a, b, votes: [winner === a ? 0 : 1], winner, phase: 1 });
  }

  return { elos, matches };
}

type GamePhase = 'intro' | 'phase1' | 'phase1_done' | 'phase2' | 'done' | 'replay';
type P1Mode = 'manual' | 'auto';

interface MatchRecord {
  a: number; b: number;
  votes: (0 | 1)[];
  winner: number;
  phase: 1 | 2;
}

function eloUpdate(elos: number[], a: number, b: number, aWon: boolean): number[] {
  const next = [...elos];
  const expA = 1 / (1 + Math.pow(10, (elos[b] - elos[a]) / 400));
  next[a] += 32 * ((aWon ? 1 : 0) - expA);
  next[b] += 32 * ((aWon ? 0 : 1) - (1 - expA));
  return next;
}

function topM(elos: number[], m: number): number[] {
  return [...Array(elos.length).keys()].sort((a, b) => elos[b] - elos[a]).slice(0, m);
}

function bestPair(elos: number[], candidates: number[]): [number, number] {
  const sorted = [...candidates].sort((a, b) => elos[b] - elos[a]);
  let best: [number, number] = [sorted[0], sorted[1]];
  let minGap = Math.abs(elos[sorted[0]] - elos[sorted[1]]);
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const gap = Math.abs(elos[sorted[i]] - elos[sorted[j]]);
      if (gap < minGap) { minGap = gap; best = [sorted[i], sorted[j]]; }
    }
  }
  return best;
}

// Build a proper single-elimination bracket queue (no -1 byes leaking)
function buildBracketQueue(ids: number[]): [number, number][] {
  const queue: [number, number][] = [];
  // Pair up sequentially; odd one out gets a bye (auto-wins, handled separately)
  for (let i = 0; i + 1 < ids.length; i += 2) {
    queue.push([ids[i], ids[i + 1]]);
  }
  return queue;
}

// ── Poster card (3D tilt) ─────────────────────────────────────────────────────
function PosterCard({ show, size = 'md', highlighted = false, faded = false }: {
  show: typeof SHOWS[0];
  size?: 'sm' | 'md' | 'intro';
  highlighted?: boolean;
  faded?: boolean;
}) {
  const w = size === 'sm' ? 72 : size === 'intro' ? 130 : 100;
  const h = size === 'sm' ? 100 : size === 'intro' ? 185 : 140;
  return (
    <div style={{
      width: w, height: h,
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
      opacity: faded ? 0.3 : 1,
      transform: highlighted
        ? 'perspective(400px) rotateY(-10deg) rotateX(5deg) scale(1.06)'
        : 'perspective(400px) rotateY(-6deg) rotateX(3deg)',
      boxShadow: highlighted
        ? `5px 8px 20px rgba(0,0,0,0.7), 0 0 20px ${show.color}55`
        : '4px 6px 14px rgba(0,0,0,0.6)',
      border: highlighted ? `1.5px solid ${show.color}99` : '1px solid var(--glass-10)',
      transition: 'all 0.3s ease',
    }}>
      <img src={show.image} alt={show.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {/* Gloss */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, var(--glass-12) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      {/* Name overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
        padding: '14px 6px 5px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: size === 'sm' ? 8 : 10,
          fontWeight: 700,
          color: highlighted ? show.color : '#fff',
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1.2,
        }}>{show.name}</div>
      </div>
    </div>
  );
}

// ── Big vote button ───────────────────────────────────────────────────────────
function VoteButton({ show, side, onVote }: {
  show: typeof SHOWS[0]; side: 'left' | 'right'; onVote: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => { if (!pressed) { setPressed(true); onVote(); } }}
      style={{
        flex: 1, padding: '16px 12px', borderRadius: 16,
        background: pressed ? `${show.color}30` : `${show.color}12`,
        border: `2px solid ${show.color}70`,
        cursor: 'pointer', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}
    >
      {/* 3D poster - grows to fill card */}
      <div style={{
        flex: 1, width: '100%', maxWidth: 260, borderRadius: 12, overflow: 'hidden',
        transform: side === 'left'
          ? 'perspective(700px) rotateY(-12deg) rotateX(3deg)'
          : 'perspective(700px) rotateY(12deg) rotateX(3deg)',
        boxShadow: `6px 10px 28px rgba(0,0,0,0.75), 0 0 20px ${show.color}44`,
        border: `1.5px solid ${show.color}66`,
        position: 'relative',
        minHeight: 0,
      }}>
        <img src={show.image} alt={show.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, var(--glass-13) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: show.color, fontFamily: "'Space Grotesk', sans-serif" }}>
        {show.name}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{show.genre}</div>
      <div style={{
        marginTop: 4, padding: '10px 22px', borderRadius: 8,
        background: show.color, color: '#0a0a0f',
        fontSize: 15, fontWeight: 800, letterSpacing: '0.07em',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        {side === 'left' ? '← ' : ''}I PREFER THIS{side === 'right' ? ' →' : ''}
      </div>
    </motion.button>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LiveLeaderboard({ elos, trueWinner }: { elos: number[]; trueWinner: number }) {
  const ranked = [...Array(elos.length).keys()].sort((a, b) => elos[b] - elos[a]);
  return (
    <div style={{
      background: 'var(--glass-03)', border: '1px solid var(--glass-08)',
      borderRadius: 14, padding: 12, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    }}>
      <div className="label" style={{ marginBottom: 8, flexShrink: 0 }}>Live Rankings</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1 }}>
        {ranked.map((id, rank) => {
          const isTrue = id === trueWinner;
          return (
            <motion.div key={id} layout layoutId={`lb-${id}`}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 7px', borderRadius: 8,
                background: isTrue ? 'rgba(232,197,71,0.1)' : 'transparent',
                border: isTrue ? '1px solid rgba(232,197,71,0.3)' : '1px solid transparent',
              }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: rank === 0 ? 'var(--gold)' : 'var(--glass-10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                color: rank === 0 ? '#0a0a0f' : 'var(--text-secondary)',
              }}>{rank + 1}</div>
              <PosterCard show={SHOWS[id]} size="sm"
                highlighted={false} faded={false} />
              <span style={{
                fontSize: 11, fontWeight: isTrue ? 700 : 400, flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: isTrue ? 'var(--gold)' : 'var(--text-primary)',
              }}>{SHOWS[id].name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {Math.round(elos[id])}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Match log ─────────────────────────────────────────────────────────────────
function MatchLog({ matches }: { matches: MatchRecord[] }) {
  const recent = [...matches].reverse().slice(0, 4);
  return (
    <div style={{
      background: 'var(--glass-03)', border: '1px solid var(--glass-08)',
      borderRadius: 14, padding: 12,
    }}>
      <div className="label" style={{ marginBottom: 8 }}>Recent Matches</div>
      {recent.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No matches yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recent.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 4, flexShrink: 0,
                background: m.phase === 2 ? 'rgba(232,197,71,0.2)' : 'rgba(79,195,247,0.15)',
                color: m.phase === 2 ? 'var(--gold)' : 'var(--cyan)', fontWeight: 700,
              }}>P{m.phase}</span>
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {SHOWS[m.a].name} vs {SHOWS[m.b].name}
              </span>
              <span style={{ marginLeft: 'auto', color: SHOWS[m.winner].color, fontWeight: 600, flexShrink: 0 }}>
                {SHOWS[m.winner].name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AudienceGameSlide() {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [p1Mode, setP1Mode] = useState<P1Mode>('manual');
  const [elos, setElos] = useState<number[]>(new Array(10).fill(1200));
  const elosRef = useRef<number[]>(new Array(10).fill(1200)); // sync mirror for handleVote closure
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [currentMatch, setCurrentMatch] = useState<{ a: number; b: number; phase: 1 | 2; voter: number } | null>(null);
  const [votes, setVotes] = useState<(0 | 1)[]>([]);
  const [phase2Queries, setPhase2Queries] = useState(0);
  const [p2Running, setP2Running] = useState(false);
  const p2Ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const [p2AutoMatches, setP2AutoMatches] = useState<MatchRecord[]>([]);
  const [p2AutoStep, setP2AutoStep] = useState(0);

  // Manual Phase 1 bracket state
  const [bracketQueue, setBracketQueue] = useState<[number, number][]>([]);
  const [bracketPool, setBracketPool] = useState<number[]>([]);

  // Phase 1 auto-animation state
  const [p1Step, setP1Step] = useState(0);
  const [p1Matches, setP1Matches] = useState<MatchRecord[]>([]);
  const [p1Elos, setP1Elos] = useState<number[][]>([]);
  const [p1Running, setP1Running] = useState(false);
  const p1Ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const [replayStep, setReplayStep] = useState(0);
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // ── Preload images ───────────────────────────────────────────────────────────
  useEffect(() => {
    SHOWS.forEach(s => { const img = new Image(); img.src = s.image; });
  }, []);

  // ── Start Phase 1 - always manual ────────────────────────────────────────────
  const startPhase1 = useCallback(() => {
    setP1Mode('manual');
    const ids = Array.from({ length: N }, (_, i) => i);
    setBracketQueue(buildBracketQueue(ids));
    setBracketPool([]);
    setCurrentMatch(null);
    setVotes([]);
    setPhase('phase1');
  }, []);

  // ── Auto-complete remaining Phase 1 from current state ───────────────────────
  const autoCompletePhase1 = useCallback(() => {
    setP1Mode('auto');
    setCurrentMatch(null);
    setVotes([]);

    // Simulate all remaining matches from current elos + bracket state,
    // with BB losing to a close opponent if it hasn't been eliminated yet
    const remainingQueue = [...bracketQueue];
    const pool = [...bracketPool];
    let curElos = [...elos];
    const newMatches: MatchRecord[] = [];
    const snapshots: number[][] = [curElos];

    // Helper: run a match with fixed outcomes - BB loses once if still in
    const runMatch = (a: number, b: number): number => {
      // BB loses if facing a strong opponent (simulate noisy upset)
      const bbInMatch = a === TRUE_WINNER || b === TRUE_WINNER;
      const opponent = a === TRUE_WINNER ? b : a;
      const bbLoses = bbInMatch && curElos[opponent] > 1180; // loses to strong opponents
      const winner = bbLoses
        ? (a === TRUE_WINNER ? b : a)
        : (curElos[a] >= curElos[b] ? a : b);
      curElos = eloUpdate(curElos, a, b, winner === a);
      snapshots.push([...curElos]);
      newMatches.push({ a, b, votes: [winner === a ? 0 : 1], winner, phase: 1 });
      return winner;
    };

    // Drain remaining queue
    for (const [a, b] of remainingQueue) {
      pool.push(runMatch(a, b));
    }

    // Run subsequent rounds until 1 bracket champion
    let roundPool = [...pool];
    while (roundPool.length > 1) {
      const byeId = roundPool.length % 2 !== 0 ? roundPool[roundPool.length - 1] : -1;
      const playing = byeId !== -1 ? roundPool.slice(0, -1) : roundPool;
      const nextPool: number[] = byeId !== -1 ? [byeId] : [];
      for (let i = 0; i + 1 < playing.length; i += 2) {
        nextPool.push(runMatch(playing[i], playing[i + 1]));
      }
      roundPool = nextPool;
    }

    setP1Matches(prev => [...prev, ...newMatches]);
    setP1Elos(snapshots);
    setP1Step(0);
    setP1Running(true);
    elosRef.current = curElos; setElos(curElos);
    setMatches(prev => [...prev, ...newMatches]);
    setBracketQueue([]);
    setBracketPool([]);
  }, [bracketQueue, bracketPool, elos]);

  // ── Manual Phase 1: pop next match ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'phase1' || p1Mode !== 'manual') return;
    if (currentMatch !== null) return;
    if (bracketQueue.length === 0) {
      if (bracketPool.length <= 1) { setPhase('phase1_done'); return; }
      const byeId = bracketPool.length % 2 !== 0 ? bracketPool[bracketPool.length - 1] : -1;
      const playing = byeId !== -1 ? bracketPool.slice(0, -1) : bracketPool;
      setBracketQueue(buildBracketQueue(playing));
      setBracketPool(byeId !== -1 ? [byeId] : []);
      return;
    }
    const [a, b] = bracketQueue[0];
    setCurrentMatch({ a, b, phase: 1, voter: 0 });
    setVotes([]);
  }, [phase, p1Mode, bracketQueue, bracketPool, currentMatch]);

  // ── Auto Phase 1: animate matches ────────────────────────────────────────────
  useEffect(() => {
    if (!p1Running || phase !== 'phase1') return;
    p1Ref.current = setInterval(() => {
      setP1Step(s => {
        const next = s + 1;
        if (next >= p1Matches.length) {
          clearInterval(p1Ref.current!);
          setP1Running(false);
          setTimeout(() => setPhase('phase1_done'), 800);
          return s;
        }
        return next;
      });
    }, 800);
    return () => { if (p1Ref.current) clearInterval(p1Ref.current); };
  }, [p1Running, phase, p1Matches.length]);

  // ── Phase 2 pair selection ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'phase2') return;
    if (currentMatch !== null) return;
    if (phase2Queries >= PHASE2_BUDGET) { setPhase('done'); return; }
    const candidates = topM(elos, M);
    const [a, b] = bestPair(elos, candidates);
    setCurrentMatch({ a, b, phase: 2, voter: 0 });
    setVotes([]);
  }, [phase, currentMatch, elos, phase2Queries]);

  // ── Auto-complete remaining Phase 2 ──────────────────────────────────────────
  const autoCompletePhase2 = useCallback(() => {
    setCurrentMatch(null);
    setVotes([]);
    let curElos = [...elos];
    let queries = phase2Queries;
    const newMatches: MatchRecord[] = [];
    while (queries < PHASE2_BUDGET) {
      const candidates = topM(curElos, M);
      const [a, b] = bestPair(curElos, candidates);
      // Winner = higher elo (deterministic oracle)
      const winner = curElos[a] >= curElos[b] ? a : b;
      curElos = eloUpdate(curElos, a, b, winner === a);
      newMatches.push({ a, b, votes: [winner === a ? 0 : 1], winner, phase: 2 });
      queries++;
    }
    setP2AutoMatches(newMatches);
    setP2AutoStep(0);
    setP2Running(true);
    elosRef.current = curElos; setElos(curElos);
    setPhase2Queries(PHASE2_BUDGET);
    // Add to match log after animation
    setMatches(m => [...m, ...newMatches]);
  }, [elos, phase2Queries]);

  // ── Animate Phase 2 auto matches ─────────────────────────────────────────────
  useEffect(() => {
    if (!p2Running) return;
    p2Ref.current = setInterval(() => {
      setP2AutoStep(s => {
        const next = s + 1;
        if (next >= p2AutoMatches.length) {
          clearInterval(p2Ref.current!);
          setP2Running(false);
          setTimeout(() => setPhase('done'), 800);
          return s;
        }
        return next;
      });
    }, 600);
    return () => { if (p2Ref.current) clearInterval(p2Ref.current); };
  }, [p2Running, p2AutoMatches.length]);

  // ── Handle vote ───────────────────────────────────────────────────────────────
  const handleVote = useCallback((choice: 0 | 1) => {
    if (!currentMatch) return;
    const newVotes = [...votes, choice];
    setVotes(newVotes);

    // Update Elo after every individual vote using ref (avoids stale closure)
    const aWon = choice === 0;
    const newElos = eloUpdate(elosRef.current, currentMatch.a, currentMatch.b, aWon);
    elosRef.current = newElos;
    setElos([...newElos]);

    const votersNeeded = currentMatch.phase === 1 ? 3 : 1;
    if (newVotes.length < votersNeeded) {
      setCurrentMatch(cm => cm ? { ...cm, voter: cm.voter + 1 } : null);
      return;
    }

    // Tally majority for the match winner record
    const aWins = newVotes.filter(v => v === 0).length;
    const winner = aWins > newVotes.length - aWins ? currentMatch.a : currentMatch.b;

    const record: MatchRecord = {
      a: currentMatch.a, b: currentMatch.b,
      votes: newVotes as (0 | 1)[],
      winner, phase: currentMatch.phase,
    };
    setMatches(m => [...m, record]);

    if (currentMatch.phase === 1) {
      // Advance winner in manual bracket
      setBracketPool(p => [...p, winner]);
      setBracketQueue(q => q.slice(1));
    } else {
      setPhase2Queries(q => q + 1);
    }
    setCurrentMatch(null);
    setVotes([]);
  }, [currentMatch, votes, elos]);

  // ── Replay ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'replay') return;
    setReplayStep(0);
    replayRef.current = setInterval(() => {
      setReplayStep(s => {
        if (s >= matches.length - 1) { clearInterval(replayRef.current!); return s; }
        return s + 1;
      });
    }, 700);
    return () => { if (replayRef.current) clearInterval(replayRef.current); };
  }, [phase, matches.length]);

  const finalRanking = [...Array(N).keys()].sort((a, b) => elos[b] - elos[a]);
  const predictedWinner = finalRanking[0];
  const currentVoter = currentMatch ? VOTERS[currentMatch.voter % VOTERS.length] : null;

  // Current elos to display: during p1 animation use snapshot, else full elos
  const displayElos = phase === 'phase1' && p1Elos.length > 0
    ? p1Elos[Math.min(p1Step, p1Elos.length - 1)]
    : elos;

  const resetGame = () => {
    setPhase('intro');
    setP1Mode('manual');
    elosRef.current = new Array(10).fill(1200); setElos(new Array(10).fill(1200));
    setMatches([]);
    setCurrentMatch(null);
    setVotes([]);
    setPhase2Queries(0);
    setBracketQueue([]);
    setBracketPool([]);
    setP1Step(0);
    setP1Matches([]);
    setP1Elos([]);
    setP1Running(false);
    if (p1Ref.current) clearInterval(p1Ref.current);
    setP2Running(false);
    setP2AutoMatches([]);
    setP2AutoStep(0);
    if (p2Ref.current) clearInterval(p2Ref.current);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      padding: '12px 72px 30px', gap: 8,
      overflow: 'hidden', position: 'relative',
      background: 'var(--bg)',
      boxSizing: 'border-box',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div className="label" style={{ marginBottom: 2 }}>
            {phase === 'intro' ? 'Audience Game' :
             phase === 'phase1' || phase === 'phase1_done' ? 'Phase 1 · Bracket Tournament' :
             phase === 'phase2' ? 'Phase 2 · WiSDoM Optimal Design' :
             phase === 'done' ? 'Winner Found!' : 'Replay'}
          </div>
          <h1 style={{ fontSize: 32, margin: 0 }}>
            {phase === 'intro' ? <>You <span style={{ color: 'var(--gold)' }}>Play</span> the Algorithm</> :
             phase === 'phase1' || phase === 'phase1_done' ? <>Tournament <span style={{ color: 'var(--cyan)' }}>Face-Off</span></> :
             phase === 'phase2' ? <>WiSDoM <span style={{ color: 'var(--gold)' }}>Picks</span> the Pairs</> :
             phase === 'done' ? <><span style={{ color: 'var(--gold)' }}>Winner</span> Identified!</> :
             <>The <span style={{ color: 'var(--cyan)' }}>Algorithm's</span> Journey</>}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Phase 1', 'Phase 2', 'Done'] as const).map((label, i) => {
            const active = (i === 0 && (phase === 'phase1' || phase === 'phase1_done')) ||
                           (i === 1 && phase === 'phase2') ||
                           (i === 2 && (phase === 'done' || phase === 'replay'));
            const done = (i === 0 && ['phase1_done','phase2','done','replay'].includes(phase)) ||
                         (i === 1 && ['done','replay'].includes(phase));
            return (
              <div key={label} style={{
                padding: '5px 13px', borderRadius: 20,
                background: active ? 'rgba(232,197,71,0.15)' : done ? 'rgba(79,195,247,0.1)' : 'var(--glass-04)',
                border: `1px solid ${active ? 'rgba(232,197,71,0.5)' : done ? 'rgba(79,195,247,0.3)' : 'var(--glass-08)'}`,
                fontSize: 12, fontWeight: 600,
                color: active ? 'var(--gold)' : done ? 'var(--cyan)' : 'var(--text-secondary)',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {done && !active ? '✓ ' : ''}{label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2, width: '100%', minHeight: 0 }}>
          <p style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.7, textAlign: 'center', maxWidth: 680, marginBottom: 4 }}>
            <strong style={{ color: 'var(--text-primary)' }}>10 shows.</strong> Anime, English & Korean.{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Phase 1:</strong> 3 biased voters per match.{' '}
            <strong style={{ color: 'var(--gold)' }}>Phase 2:</strong> WiSDoM picks 1 optimal pair at a time.
          </p>

          {/* 10-show poster grid - 5 per row, fills full width */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
            width: '100%',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}>
            {SHOWS.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, scale: 0.85, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.025, type: 'spring', stiffness: 200, damping: 22 }}
                style={{ minWidth: 0, minHeight: 0, borderRadius: 8, overflow: 'hidden', position: 'relative',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  border: '1px solid var(--glass-10)',
                }}>
                <img src={s.image} alt={s.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* gloss */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, var(--glass-08) 0%, transparent 50%)',
                  pointerEvents: 'none',
                }} />
                {/* name overlay */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
                  padding: '18px 5px 5px', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: '#fff',
                    fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2,
                  }}>{s.name}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button onClick={startPhase1} style={{
              padding: '12px 40px', borderRadius: 14,
              background: 'var(--gold)', border: 'none',
              color: '#0a0a0f', fontSize: 17, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: 'pointer', letterSpacing: '0.05em',
            }}>
              START TOURNAMENT →
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              You'll vote on each match · or auto-complete Phase 1 any time during the game
            </div>
          </div>
        </motion.div>
      )}

      {/* ── PHASE 1 ── */}
      {phase === 'phase1' && (
        <div style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

            {/* Status bar + auto button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: p1Mode === 'auto' ? 'rgba(79,195,247,0.08)' : 'var(--glass-04)',
                border: `1px solid ${p1Mode === 'auto' ? 'rgba(79,195,247,0.3)' : 'var(--glass-10)'}`,
                fontSize: 12,
              }}>
                {p1Mode === 'manual'
                  ? <span style={{ color: 'var(--text-secondary)' }}>🎮 <strong style={{ color: 'var(--text-primary)' }}>Manual mode</strong>: vote on each match · {matches.filter(m => m.phase === 1).length} done</span>
                  : <span style={{ color: 'var(--cyan)' }}>⚡ <strong>Auto-completing</strong> remaining bracket…</span>
                }
              </div>
              {p1Mode === 'manual' && !p1Running && (
                <button onClick={autoCompletePhase1} style={{
                  padding: '10px 18px', borderRadius: 10, flexShrink: 0,
                  background: 'rgba(79,195,247,0.12)', border: '1px solid rgba(79,195,247,0.4)',
                  color: 'var(--cyan)', fontSize: 13, fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
                }}>
                  ⚡ Auto-complete
                </button>
              )}
            </div>

            {/* Manual: voting cards */}
            {p1Mode === 'manual' && currentMatch && currentVoter && (
              <AnimatePresence mode="wait">
                <motion.div key={`${currentMatch.a}-${currentMatch.b}-${currentMatch.voter}`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  style={{
                    flex: 1, padding: '16px 20px', borderRadius: 18,
                    background: 'var(--glass-04)', border: '1px solid var(--glass-10)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: currentVoter.color }}>
                      {currentVoter.name} is voting
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Bracket match · Vote {currentMatch.voter + 1} of 3
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 8 }}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: i < votes.length
                            ? (votes[i] === 0 ? SHOWS[currentMatch.a].color : SHOWS[currentMatch.b].color)
                            : i === currentMatch.voter ? 'var(--glass-50)' : 'var(--glass-12)',
                          border: i === currentMatch.voter ? '2px solid white' : 'none',
                        }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, flex: 1, alignItems: 'stretch' }}>
                    <VoteButton show={SHOWS[currentMatch.a]} side="left" onVote={() => handleVote(0)} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 48 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--red)' }}>VS</div>
                    </div>
                    <VoteButton show={SHOWS[currentMatch.b]} side="right" onVote={() => handleVote(1)} />
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {p1Mode === 'manual' && !currentMatch && !p1Running && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Preparing next match…
              </div>
            )}

            {/* Auto: animated match log */}
            {p1Mode === 'auto' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
                {p1Matches.slice(0, p1Step + 1).map((m, i) => {
                  const isLatest = i === p1Step;
                  const bbLost = (m.a === TRUE_WINNER || m.b === TRUE_WINNER) && m.winner !== TRUE_WINNER;
                  return (
                    <motion.div key={`auto-${i}`}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                      style={{
                        padding: '10px 14px', borderRadius: 12, flexShrink: 0,
                        background: bbLost ? 'rgba(239,83,80,0.12)' : isLatest ? 'rgba(79,195,247,0.08)' : 'var(--glass-03)',
                        border: `1px solid ${bbLost ? 'rgba(239,83,80,0.4)' : isLatest ? 'rgba(79,195,247,0.3)' : 'var(--glass-06)'}`,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                      <PosterCard show={SHOWS[m.a]} size="sm" faded={m.winner !== m.a} />
                      <div style={{ textAlign: 'center', flexShrink: 0, fontSize: 16 }}>
                        {m.winner === m.a ? '←' : '→'}
                      </div>
                      <PosterCard show={SHOWS[m.b]} size="sm" faded={m.winner !== m.b} />
                      <div style={{ marginLeft: 8, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: SHOWS[m.winner].color }}>{SHOWS[m.winner].name} wins</div>
                        {bbLost && <div style={{ fontSize: 11, color: '#ef9a9a', marginTop: 2 }}>⚠️ Noisy oracle upset! Breaking Bad eliminated</div>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Completed manual matches log */}
            {p1Mode === 'manual' && matches.filter(m => m.phase === 1).length > 0 && (
              <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                {matches.filter(m => m.phase === 1).slice(-4).map((m, i) => (
                  <div key={i} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12,
                    background: 'var(--glass-03)', border: '1px solid var(--glass-06)',
                    display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: SHOWS[m.a].color }}>{SHOWS[m.a].name}</span>
                    <span>vs</span>
                    <span style={{ color: SHOWS[m.b].color }}>{SHOWS[m.b].name}</span>
                    <span style={{ marginLeft: 'auto', color: SHOWS[m.winner].color, fontWeight: 700 }}>→ {SHOWS[m.winner].name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ width: 230, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LiveLeaderboard elos={p1Mode === 'auto' ? displayElos : elos} trueWinner={TRUE_WINNER} />
          </div>
        </div>
      )}

      {/* ── VOTING Phase 2 ── */}
      {phase === 'phase2' && (
        <div style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

            {/* Status bar + auto button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: p2Running ? 'rgba(232,197,71,0.08)' : 'var(--glass-04)',
                border: `1px solid ${p2Running ? 'rgba(232,197,71,0.3)' : 'var(--glass-10)'}`,
                fontSize: 12,
              }}>
                {p2Running
                  ? <span style={{ color: 'var(--gold)' }}>⚡ <strong>Auto-completing</strong> Phase 2…</span>
                  : <span style={{ color: 'var(--text-secondary)' }}>🎮 <strong style={{ color: 'var(--text-primary)' }}>Manual mode</strong>: WiSDoM picks optimal pairs · {phase2Queries} done</span>
                }
              </div>
              {!p2Running && (
                <button onClick={autoCompletePhase2} style={{
                  padding: '10px 18px', borderRadius: 10, flexShrink: 0,
                  background: 'rgba(232,197,71,0.12)', border: '1px solid rgba(232,197,71,0.4)',
                  color: 'var(--gold)', fontSize: 13, fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
                }}>
                  ⚡ Auto-complete
                </button>
              )}
            </div>

            {/* Auto animation feed */}
            {p2Running && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
                {p2AutoMatches.slice(0, p2AutoStep + 1).map((m, i) => (
                  <motion.div key={`p2auto-${i}`}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                    style={{
                      padding: '10px 14px', borderRadius: 12, flexShrink: 0,
                      background: i === p2AutoStep ? 'rgba(232,197,71,0.1)' : 'var(--glass-03)',
                      border: `1px solid ${i === p2AutoStep ? 'rgba(232,197,71,0.4)' : 'var(--glass-06)'}`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                    <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(232,197,71,0.2)', color: 'var(--gold)', flexShrink: 0 }}>P2</div>
                    <PosterCard show={SHOWS[m.a]} size="sm" faded={m.winner !== m.a} />
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {m.winner === m.a ? '←' : '→'}
                    </div>
                    <PosterCard show={SHOWS[m.b]} size="sm" faded={m.winner !== m.b} />
                    <div style={{ marginLeft: 8, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: SHOWS[m.winner].color }}>{SHOWS[m.winner].name} wins</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Optimal query {i + 1}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Manual voting UI */}
            {!p2Running && currentMatch && currentVoter ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentMatch.a}-${currentMatch.b}-${currentMatch.voter}`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  style={{
                    padding: '18px 20px', borderRadius: 18,
                    background: 'var(--glass-04)',
                    border: '1px solid var(--glass-10)',
                    flex: 1, display: 'flex', flexDirection: 'column', gap: 14,
                  }}>
                  {/* Voter info */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
                      Your vote decides
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      WiSDoM optimal pair · Query {phase2Queries + 1}/{PHASE2_BUDGET}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.08em' }}>
                      1 VOTE · SINGLE ORACLE QUERY
                    </div>
                  </div>

                  {/* Vote buttons */}
                  <div style={{ display: 'flex', gap: 14, flex: 1, alignItems: 'stretch' }}>
                    <VoteButton show={SHOWS[currentMatch.a]} side="left" onVote={() => handleVote(0)} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 52 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--red)' }}>VS</div>
                      {phase === 'phase2' && (
                        <div style={{ fontSize: 9, color: 'var(--gold)', textAlign: 'center', letterSpacing: '0.1em', fontWeight: 600 }}>
                          OPTIMAL<br />PAIR
                        </div>
                      )}
                    </div>
                    <VoteButton show={SHOWS[currentMatch.b]} side="right" onVote={() => handleVote(1)} />
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : !p2Running ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 16 }}>
                Preparing next match…
              </div>
            ) : null}
          </div>

          {/* Right sidebar */}
          <div style={{ width: 230, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LiveLeaderboard elos={elos} trueWinner={TRUE_WINNER} />
            <MatchLog matches={matches} />
          </div>
        </div>
      )}

      {/* ── PHASE 1 DONE ── */}
      {phase === 'phase1_done' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 20, overflowY: 'auto', minHeight: 0 }}>
            <div style={{
              padding: 22, borderRadius: 18,
              background: 'var(--glass-04)',
              border: '1px solid var(--glass-10)',
            }}>
              <div className="label" style={{ marginBottom: 10, color: 'var(--cyan)' }}>
                Phase 1 Complete · {p1Matches.length} matches simulated
              </div>
              <h2 style={{ fontSize: 26, marginBottom: 8 }}>
                Bracket champion:{' '}
                <span style={{ color: 'var(--gold)' }}>{SHOWS[finalRanking[0]].name}</span>
              </h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
                Top-{M} candidates advance to Phase 2. WiSDoM will now pick{' '}
                <strong style={{ color: 'var(--text-primary)' }}>optimal pairs</strong> to
                maximise certainty, targeting the closest matchups.
              </p>

              {/* Top-3 poster cards */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {topM(elos, M).map((id, rank) => (
                  <div key={id} style={{
                    flex: 1, padding: '12px 10px', borderRadius: 12, textAlign: 'center',
                    background: `${SHOWS[id].color}15`,
                    border: `1px solid ${SHOWS[id].color}50`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                    <PosterCard show={SHOWS[id]} size="sm" highlighted={rank === 0} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: SHOWS[id].color }}>{SHOWS[id].name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>#{rank + 1} · {Math.round(elos[id])} Elo</div>
                  </div>
                ))}
              </div>

            </div>
            <button onClick={() => setPhase('phase2')} style={{
              padding: '13px 38px', borderRadius: 14,
              background: 'var(--gold)', border: 'none',
              color: '#0a0a0f', fontSize: 16, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: 'pointer', flexShrink: 0,
            }}>
              START PHASE 2 →
            </button>
          </div>
          <div style={{ width: 260 }}>
            <LiveLeaderboard elos={elos} trueWinner={TRUE_WINNER} />
          </div>
        </motion.div>
      )}

      {/* ── DONE ── */}
      {phase === 'done' && (() => {
        const wisdomRanking = [...Array(N).keys()].sort((a, b) => elos[b] - elos[a]);
        const imdbRanking = [...Array(N).keys()].sort((a, b) => SHOWS[b].rating - SHOWS[a].rating);
        return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>

          {/* Left: winner + buttons */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{
              width: 240, flexShrink: 0, padding: '20px 18px', borderRadius: 20, textAlign: 'center',
              background: predictedWinner === TRUE_WINNER ? 'rgba(232,197,71,0.1)' : 'rgba(239,83,80,0.1)',
              border: `2px solid ${predictedWinner === TRUE_WINNER ? 'var(--gold)' : 'var(--red)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              justifyContent: 'center',
            }}>
            <PosterCard show={SHOWS[predictedWinner]} size="md" highlighted />
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>
              {SHOWS[predictedWinner].name}
            </div>
            {predictedWinner === TRUE_WINNER ? (
              <div style={{ fontSize: 14, color: '#66bb6a', fontWeight: 600 }}>
                ✓ WiSDoM found the true best show!
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--red)' }}>
                Near-miss. True best: {SHOWS[TRUE_WINNER].name}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {matches.length} comparisons · {matches.filter(m => m.phase === 1).length} bracket + {matches.filter(m => m.phase === 2).length} Phase 2
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
              <button onClick={() => setPhase('replay')} style={{
                padding: '10px', borderRadius: 10, width: '100%',
                background: 'rgba(79,195,247,0.15)', border: '1px solid rgba(79,195,247,0.4)',
                color: 'var(--cyan)', fontSize: 13, fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
              }}>▶ Replay Journey</button>
              <button onClick={resetGame} style={{
                padding: '10px', borderRadius: 10, width: '100%',
                background: 'var(--glass-04)', border: '1px solid var(--glass-10)',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
              }}>↺ Play Again</button>
            </div>
          </motion.div>

          {/* Middle: IMDB Ranking */}
          <div style={{
            flex: 1, borderRadius: 16, padding: '16px 14px',
            background: 'var(--glass-03)', border: '1px solid var(--glass-08)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 8, flexShrink: 0 }}>
              IMDB RANKING
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            {imdbRanking.map((id, rank) => (
              <motion.div key={id} layout
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rank * 0.04 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
                  background: id === TRUE_WINNER ? 'rgba(232,197,71,0.1)' : 'transparent',
                  border: id === TRUE_WINNER ? '1px solid rgba(232,197,71,0.3)' : '1px solid transparent',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: rank === 0 ? 'var(--gold)' : 'var(--glass-08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  color: rank === 0 ? '#0a0a0f' : 'var(--text-secondary)',
                }}>{rank + 1}</div>
                <PosterCard show={SHOWS[id]} size="sm" highlighted={id === TRUE_WINNER} />
                <span style={{ fontSize: 12, fontWeight: id === TRUE_WINNER ? 700 : 400, flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: id === TRUE_WINNER ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {SHOWS[id].name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--gold)', flexShrink: 0 }}>★ {SHOWS[id].rating}</span>
              </motion.div>
            ))}
            </div>
          </div>

          {/* Right: WiSDoM Ranking */}
          <div style={{
            flex: 1, borderRadius: 16, padding: '16px 14px',
            background: 'rgba(232,197,71,0.04)', border: '1px solid rgba(232,197,71,0.15)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 8, flexShrink: 0 }}>
              WiSDoM RANKING
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            {wisdomRanking.map((id, rank) => (
              <motion.div key={id} layout
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rank * 0.04 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8,
                  background: id === predictedWinner ? 'rgba(232,197,71,0.12)' : 'transparent',
                  border: id === predictedWinner ? '1px solid rgba(232,197,71,0.4)' : '1px solid transparent',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: rank === 0 ? 'var(--gold)' : 'var(--glass-08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  color: rank === 0 ? '#0a0a0f' : 'var(--text-secondary)',
                }}>{rank + 1}</div>
                <PosterCard show={SHOWS[id]} size="sm" highlighted={id === predictedWinner} />
                <span style={{ fontSize: 12, fontWeight: id === predictedWinner ? 700 : 400, flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: id === predictedWinner ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {SHOWS[id].name}
                </span>
                {/* Arrow showing rank change vs IMDB */}
                {(() => {
                  const imdbRank = imdbRanking.indexOf(id);
                  const diff = imdbRank - rank;
                  return diff !== 0 ? (
                    <span style={{ fontSize: 10, color: diff > 0 ? '#66bb6a' : '#ef5350', flexShrink: 0 }}>
                      {diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
                    </span>
                  ) : <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>-</span>;
                })()}
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{Math.round(elos[id])}</span>
              </motion.div>
            ))}
            </div>
          </div>
        </motion.div>
        );
      })()}

      {/* ── REPLAY ── */}
      {phase === 'replay' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflowY: 'auto' }}>
            <div className="label">The Algorithm's Journey: {matches.length} queries</div>
            {matches.slice(0, replayStep + 1).map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                style={{
                  padding: '8px 12px', borderRadius: 10, flexShrink: 0,
                  background: m.phase === 2 ? 'rgba(232,197,71,0.06)' : 'rgba(79,195,247,0.06)',
                  border: `1px solid ${m.phase === 2 ? 'rgba(232,197,71,0.2)' : 'rgba(79,195,247,0.15)'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                  background: m.phase === 2 ? 'rgba(232,197,71,0.2)' : 'rgba(79,195,247,0.15)',
                  color: m.phase === 2 ? 'var(--gold)' : 'var(--cyan)',
                }}>P{m.phase}</div>
                <PosterCard show={SHOWS[m.a]} size="sm" />
                <span style={{ fontSize: 13, fontWeight: 600, color: SHOWS[m.a].color }}>{SHOWS[m.a].name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>vs</span>
                <PosterCard show={SHOWS[m.b]} size="sm" />
                <span style={{ fontSize: 13, fontWeight: 600, color: SHOWS[m.b].color }}>{SHOWS[m.b].name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: SHOWS[m.winner].color, fontWeight: 700, flexShrink: 0 }}>
                  → {SHOWS[m.winner].name}
                </span>
              </motion.div>
            ))}
          </div>
          <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Step {replayStep + 1} / {matches.length}
            </div>
            <LiveLeaderboard elos={elos} trueWinner={TRUE_WINNER} />
            <button onClick={() => setPhase('done')} style={{
              padding: '11px 18px', borderRadius: 10, marginTop: 4,
              background: 'var(--glass-04)', border: '1px solid var(--glass-10)',
              color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer',
            }}>← Back to Results</button>
          </div>
        </motion.div>
      )}

      {/* Confetti on correct answer */}
      <AnimatePresence>
        {phase === 'done' && predictedWinner === TRUE_WINNER && (
          <>
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i / 18) * 2 * Math.PI) * (180 + (i % 3) * 55),
                  y: Math.sin((i / 18) * 2 * Math.PI) * (160 + (i % 4) * 45),
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 1.4, delay: i * 0.05, repeat: Infinity, repeatDelay: 3 }}
                style={{
                  position: 'absolute', top: '50%', left: '40%',
                  width: 9, height: 9, borderRadius: '50%', pointerEvents: 'none', zIndex: 50,
                  background: i % 3 === 0 ? 'var(--gold)' : i % 3 === 1 ? 'var(--cyan)' : '#ef5350',
                }} />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
