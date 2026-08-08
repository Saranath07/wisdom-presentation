import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';
import { SHOWS } from './AudienceGameSlide';

// ── simulation constants & helpers ────────────────────────────────────────────
// M=5 so BB (rank 5) is just inside the candidate set despite losing in the bracket
const N = 10, M_CANDS = 5, TRUE_WINNER = 4;

function eloUp(elos: number[], a: number, b: number, aWon: boolean) {
  const r = [...elos], ea = 1 / (1 + Math.pow(10, (elos[b] - elos[a]) / 400));
  r[a] += 32 * ((aWon ? 1 : 0) - ea); r[b] += 32 * ((aWon ? 0 : 1) - (1 - ea));
  return r;
}
function topM(e: number[], m: number) {
  return [...Array(e.length).keys()].sort((a, b) => e[b] - e[a]).slice(0, m);
}

// ── pre-computed Phase 1 ───────────────────────────────────────────────────────
// BB(4) loses to Chernobyl(5) in round 1 - noisy upset
// BB ends rank 5 (outside top-4, just inside top-5)
interface Match { a: number; b: number; winner: number; phase: 1 | 2; lambda?: number }
const P1_FIXED: [number, number, number][] = [
  [0, 1, 0], [2, 3, 2], [4, 5, 5], [6, 7, 7], [8, 9, 8], // round 1 - BB=4 loses!
  [0, 2, 0], [5, 7, 5], [4, 3, 4],                         // round 2 consolation: BB beats Office
  [0, 5, 5],                                                 // final - Chernobyl wins
];
let _e = new Array(N).fill(1200);
const P1_MATCHES: Match[] = P1_FIXED.map(([a, b, w]) => {
  _e = eloUp(_e, a, b, w === a);
  return { a, b, winner: w, phase: 1 };
});
const P1_ELOS = [..._e];
// BB is rank 5, top-4 are Chernobyl/Reply/Riverdale/DeathNote
const P1_CANDS = topM(P1_ELOS, M_CANDS); // includes BB at slot 5

// Snapshots for live animation
const P1_SNAPSHOTS: number[][] = [new Array(N).fill(1200)];
{
  let e2 = new Array(N).fill(1200);
  for (const m of P1_MATCHES) {
    e2 = eloUp(e2, m.a, m.b, m.winner === m.a);
    P1_SNAPSHOTS.push([...e2]);
  }
}

// ── pre-computed Phase 2 (seed 6 - BB wins from rank 5) ──────────────────────
function mkRng(seed: number) {
  let s = ((seed ^ 0x12345678) >>> 0) || 1;
  return () => { s ^= s << 13; s = s >>> 0; s ^= s >> 17; s = s >>> 0; s ^= s << 5; s = s >>> 0; return s / 4294967296; };
}
const RATINGS = [9.2, 9.0, 9.0, 9.0, 9.5, 9.4, 8.0, 9.1, 6.4, 6.2];
function btlP(i: number, j: number) { return RATINGS[i] / (RATINGS[i] + RATINGS[j]); }

function buildP2(startElos: number[], seed: number, budget = 16) {
  const rand = mkRng(seed); let e = [...startElos]; const ms: Match[] = [], snaps: number[][] = [[...e]];
  for (let q = 0; q < budget; q++) {
    const cands = topM(e, M_CANDS), leader = cands[0], challs = cands.slice(1);
    const phis = challs.map(j => 1 / Math.max((e[leader] - e[j]) ** 2, 0.01));
    const tot = phis.reduce((s, v) => s + v, 0);
    const lams = phis.map(p => p / tot);
    let rv = rand(), cum = 0, ci = challs.length - 1;
    for (let k = 0; k < lams.length; k++) { cum += lams[k]; if (rv < cum) { ci = k; break; } }
    const a = leader, b = challs[ci], lambda = Math.round(lams[ci] * 100) / 100;
    const w = rand() < btlP(a, b) ? a : b;
    e = eloUp(e, a, b, w === a);
    ms.push({ a, b, winner: w, phase: 2, lambda });
    snaps.push([...e]);
  }
  return { matches: ms, snapshots: snaps, elos: e };
}
const P2_DATA = buildP2(P1_ELOS, 6); // seed 6: BB climbs from rank 5 to #1
const P2_MATCHES = P2_DATA.matches;
const P2_SNAPSHOTS = P2_DATA.snapshots;
const P2_ELOS = P2_DATA.elos;

// ── inline helpers ────────────────────────────────────────────────────────────
const _KW = (t: string) => (
  <span style={{ fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif", color: 'inherit' }}>{t}</span>
);
const ML = (f: string) => <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />;

// ── mini poster ───────────────────────────────────────────────────────────────
function Poster({ id, sz = 36, hi = false, faded = false }: { id: number; sz?: number; hi?: boolean; faded?: boolean }) {
  const s = SHOWS[id];
  return (
    <div style={{
      width: sz, height: sz * 1.4, borderRadius: 5, overflow: 'hidden', flexShrink: 0,
      opacity: faded ? 0.2 : 1,
      border: hi ? `2px solid ${s.color}` : '1px solid var(--glass-10)',
      boxShadow: hi ? `0 0 12px ${s.color}88` : 'none',
      position: 'relative', transition: 'all 0.3s',
    }}>
      <img src={s.image} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,transparent 100%)',
        padding: '6px 2px 2px', textAlign: 'center',
        fontSize: sz > 44 ? 8 : 7, fontWeight: 700, color: hi ? s.color : '#fff', lineHeight: 1.1,
      }}>{SHOWS[id].name.split(' ')[0]}</div>
    </div>
  );
}

// ── ranking list ──────────────────────────────────────────────────────────────
function Ranking({ elos, phase }: { elos: number[]; phase: 1 | 2 }) {
  const ranked = [...Array(N).keys()].sort((a, b) => elos[b] - elos[a]);
  const accent = phase === 1 ? 'var(--cyan)' : 'var(--gold)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {ranked.map((id, rank) => {
        const isTrue = id === TRUE_WINNER;
        return (
          <motion.div key={id} layout layoutId={`rk-${phase}-${id}`}
            transition={{ type: 'spring', stiffness: 200, damping: 28 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9,
              background: isTrue ? 'rgba(232,197,71,0.12)' : 'var(--glass-02)',
              border: `1px solid ${isTrue ? 'rgba(232,197,71,0.45)' : 'var(--glass-07)'}`,
            }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: rank === 0 ? accent : 'var(--glass-08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: rank === 0 ? '#0a0a0f' : 'var(--text-secondary)',
            }}>{rank + 1}</div>
            <Poster id={id} sz={34} hi={isTrue} />
            <span style={{
              fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: isTrue ? 'var(--gold)' : 'var(--text-primary)', fontWeight: isTrue ? 700 : 400,
            }}>{SHOWS[id].name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{Math.round(elos[id])}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── match row ─────────────────────────────────────────────────────────────────
function MatchRow({ m, i }: { m: Match; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26, delay: Math.min(i * 0.04, 0.5) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 8, flexShrink: 0,
        background: m.phase === 2 ? 'rgba(232,197,71,0.07)' : 'rgba(79,195,247,0.06)',
        border: `1px solid ${m.phase === 2 ? 'rgba(232,197,71,0.2)' : 'rgba(79,195,247,0.15)'}`,
      }}
    >
      <div style={{
        fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, flexShrink: 0,
        background: m.phase === 2 ? 'rgba(232,197,71,0.2)' : 'rgba(79,195,247,0.15)',
        color: m.phase === 2 ? 'var(--gold)' : 'var(--cyan)',
      }}>P{m.phase}</div>
      <Poster id={m.a} sz={28} faded={m.winner !== m.a} />
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>vs</span>
      <Poster id={m.b} sz={28} faded={m.winner !== m.b} />
      <span style={{ fontSize: 12, fontWeight: 700, color: SHOWS[m.winner].color, marginLeft: 'auto', flexShrink: 0 }}>
        ▸ {SHOWS[m.winner].name}
      </span>
      {m.phase === 2 && m.lambda != null && (
        <span style={{
          fontSize: 10, color: 'var(--gold)', flexShrink: 0,
          padding: '1px 5px', borderRadius: 4, background: 'rgba(232,197,71,0.12)',
        }}><MathFormula formula={`\\lambda=${m.lambda}`} style={{ display: 'inline', fontSize: '0.9em' }} /></span>
      )}
    </motion.div>
  );
}

// ── Phase 1 right panel ───────────────────────────────────────────────────────
function Phase1Panel() {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTick(0); setDone(false);
    timer.current = setInterval(() => {
      setTick(t => {
        const next = t + 1;
        if (next >= P1_MATCHES.length) { clearInterval(timer.current!); setTimeout(() => setDone(true), 800); }
        return Math.min(next, P1_MATCHES.length);
      });
    }, 600);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const currentElos = P1_SNAPSHOTS[tick] ?? P1_ELOS;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em', flexShrink: 0 }}>
        PHASE 1: BRACKET TOURNAMENT
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="p1feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', paddingRight: 4 }}>
              {P1_MATCHES.slice(0, tick).map((m, i) => <MatchRow key={i} m={m} i={i} />)}
              {tick < P1_MATCHES.length && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 8px', opacity: 0.5 }}>Running bracket…</div>
              )}
            </div>
            <div style={{ width: 170, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: 2 }}>LIVE ELO</div>
              {[...Array(N).keys()].sort((a, b) => currentElos[b] - currentElos[a]).slice(0, 7).map((id, rank) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '3px 7px', borderRadius: 6,
                  background: id === TRUE_WINNER ? 'rgba(232,197,71,0.08)' : 'var(--glass-02)',
                  border: `1px solid ${id === TRUE_WINNER ? 'rgba(232,197,71,0.3)' : 'var(--glass-05)'}`,
                }}>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', width: 12, flexShrink: 0 }}>{rank + 1}</span>
                  <Poster id={id} sz={22} hi={id === TRUE_WINNER} />
                  <span style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: id === TRUE_WINNER ? 'var(--gold)' : 'var(--text-secondary)' }}>
                    {SHOWS[id].name}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', flexShrink: 0 }}>{Math.round(currentElos[id])}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="p1done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}
          >
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Ranking elos={P1_ELOS} phase={1} />
            </div>
            <div style={{ width: 190, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.4)', fontSize: 13, color: '#ef9a9a', lineHeight: 1.65 }}>
                ⚠ <strong>Breaking Bad</strong> eliminated by a noisy Chernobyl upset. Bracket failed to find the true winner.
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.3)', fontSize: 13, color: 'var(--cyan)', lineHeight: 1.65 }}>
                Top {M_CANDS} advance to Phase 2 → can Phase 2 rescue Breaking Bad?
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Phase 2 right panel ───────────────────────────────────────────────────────
function Phase2Panel() {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTick(0); setDone(false);
    timer.current = setInterval(() => {
      setTick(t => {
        const next = t + 1;
        if (next >= P2_MATCHES.length) { clearInterval(timer.current!); setTimeout(() => setDone(true), 800); }
        return Math.min(next, P2_MATCHES.length);
      });
    }, 480);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const currentElos = P2_SNAPSHOTS[tick] ?? P2_ELOS;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', flexShrink: 0 }}>
        PHASE 2: WINNER-FOCUSED DESIGN
      </div>

      {/* Candidate strip */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {P1_CANDS.map(id => (
          <div key={id} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 8px', borderRadius: 8,
            background: `${SHOWS[id].color}15`, border: `1.5px solid ${SHOWS[id].color}55`,
          }}>
            <Poster id={id} sz={28} hi />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: SHOWS[id].color, lineHeight: 1.2 }}>{SHOWS[id].name.split(' ')[0]}</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{ML('\\mathcal{C}')}</div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="p2feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', paddingRight: 4 }}>
              {P2_MATCHES.slice(0, tick).map((m, i) => <MatchRow key={i} m={m} i={i} />)}
              {tick < P2_MATCHES.length && tick > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 8px', opacity: 0.5 }}>Querying {ML('\\lambda^\\star')} pairs…</div>
              )}
            </div>
            <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: 2 }}>LIVE ELO</div>
              {[...Array(N).keys()].sort((a, b) => currentElos[b] - currentElos[a]).slice(0, 7).map((id, rank) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', borderRadius: 6,
                  background: id === TRUE_WINNER ? 'rgba(232,197,71,0.1)' : 'var(--glass-02)',
                  border: `1px solid ${id === TRUE_WINNER ? 'rgba(232,197,71,0.35)' : 'var(--glass-05)'}`,
                }}>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', width: 12 }}>{rank + 1}</span>
                  <Poster id={id} sz={22} hi={id === TRUE_WINNER} />
                  <span style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: id === TRUE_WINNER ? 'var(--gold)' : 'var(--text-secondary)' }}>
                    {SHOWS[id].name}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{Math.round(currentElos[id])}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="p2done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}
          >
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Ranking elos={P2_ELOS} phase={2} />
            </div>
            <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 0.2 }}
                style={{ padding: '16px', borderRadius: 14, textAlign: 'center', background: 'rgba(232,197,71,0.12)', border: '2px solid rgba(232,197,71,0.55)' }}
              >
                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>✓ WINNER RECOVERED</div>
                <Poster id={TRUE_WINNER} sz={52} hi />
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)', marginTop: 8 }}>Breaking Bad</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  {ML('\\lambda^\\star')} directed all queries toward the tightest gaps
                </div>
              </motion.div>
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(79,195,247,0.07)', border: '1px solid rgba(79,195,247,0.25)', fontSize: 12, color: 'var(--cyan)', lineHeight: 1.65 }}>
                {P2_MATCHES.length} optimal queries overcame the bracket noise.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Algorithm panel content ───────────────────────────────────────────────────
const FS = 20; // base font size for algo lines
function AlgoLine({ num, indent, children, active, dim, activeColor }: {
  num?: string; indent?: number; children: React.ReactNode;
  active?: boolean; dim?: boolean; activeColor?: string;
}) {
  const color = activeColor ?? 'var(--cyan)';
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline',
      paddingLeft: (indent ?? 0) * 28,
      opacity: dim ? 0.22 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      <div style={{ width: 36, flexShrink: 0, fontSize: FS - 2, color: active ? color : 'var(--glass-20)', fontFamily: 'monospace', textAlign: 'right', paddingRight: 10, transition: 'color 0.4s' }}>
        {num}
      </div>
      <div style={{
        flex: 1, padding: '3px 12px', borderRadius: 8,
        background: active ? `${color}14` : 'transparent',
        border: active ? `1.5px solid ${color}44` : '1.5px solid transparent',
        transition: 'background 0.4s, border-color 0.4s',
      }}>
        <span style={{
          fontSize: FS, color: active ? color : 'var(--text-secondary)',
          fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.65,
          transition: 'color 0.4s',
        }}>{children}</span>
      </div>
    </div>
  );
}

// ── Main slide ────────────────────────────────────────────────────────────────
export function WiSDoMAlgorithmSlide() {
  const [step, setStep] = useState(0); // 0=overview, 1=phase1, 2=phase2

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (step < 2) { e.stopPropagation(); setStep(s => s + 1); }
      } else if (e.key === 'ArrowLeft') {
        if (step > 0) { e.stopPropagation(); setStep(s => s - 1); }
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [step]);

  const p1Active = step === 1;
  const p2Active = step === 2;
  const p1Dim = step === 2;
  const p2Dim = step === 1;
  const p1Color = 'var(--cyan)';
  const p2Color = 'var(--gold)';

  return (
    <LayoutGroup>
      <div style={{
        width: '100vw', height: '100vh', background: 'var(--bg)',
        padding: '10px 14px 28px', boxSizing: 'border-box', overflow: 'hidden',
        display: 'flex', gap: 14,
        // When step=0 centre the algorithm panel both axes
        alignItems: step === 0 ? 'center' : 'stretch',
        justifyContent: step === 0 ? 'center' : 'flex-start',
      }}>

        {/* ══ ALGORITHM PANEL ══════════════════════════════════════════════════ */}
        <motion.div layout
          style={{
            width: step === 0 ? '68%' : '54%',
            flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 0,
            padding: '14px 20px 12px', borderRadius: 18,
            background: 'var(--glass-02)', border: '1px solid var(--glass-09)',
            overflowY: 'auto', overflowX: 'hidden',
          }}
          transition={{ type: 'spring', stiffness: 130, damping: 24 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.03em' }}>Algorithm 1</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)", fontFamily: "'Space Grotesk', sans-serif" }}>WiSDoM</span>
            <div style={{ flex: 1, height: 1.5, background: 'var(--glass-20)', marginLeft: 4 }} />
          </div>

          {/* Input / Output box */}
          <div style={{
            padding: '8px 14px', borderRadius: 10, marginBottom: 6, flexShrink: 0,
            background: 'var(--glass-04)', border: '1px solid var(--glass-14)',
            display: 'flex', gap: 28, alignItems: 'baseline', flexWrap: 'wrap',
          }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>Input: </span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {ML('\\text{Items }[N],\\text{ budget }B,\\text{ bracket depth }t,\\text{ candidate size }M')}
              </span>
            </div>
            <div style={{ borderLeft: '1px solid var(--glass-14)', paddingLeft: 28 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>Output: </span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{ML('\\text{predicted winner }\\hat{\\imath}')}</span>
            </div>
          </div>

          {/* Line 1 */}
          <AlgoLine num="1:">
            {ML('\\text{Initialise Elo scores }\\hat{w} \\leftarrow \\mathbf{1}_N \\cdot w_0;\\quad S \\leftarrow \\emptyset')}
          </AlgoLine>

          {/* Phase 1 block */}
          <motion.div layout key="p1block"
            style={{
              marginTop: 10, borderRadius: 13, overflow: 'hidden',
              border: `1.5px solid ${p1Active ? 'rgba(79,195,247,0.55)' : p1Dim ? 'rgba(79,195,247,0.1)' : 'rgba(79,195,247,0.28)'}`,
              opacity: p1Dim ? 0.45 : 1,
              transition: 'border-color 0.4s, opacity 0.4s',
            }}
            transition={{ type: 'spring', stiffness: 130, damping: 24 }}
          >
            <div style={{
              padding: '6px 14px',
              background: p1Active ? 'rgba(79,195,247,0.13)' : 'rgba(79,195,247,0.05)',
              transition: 'background 0.4s',
            }}>
              <span style={{ fontSize: 14, fontStyle: 'italic', color: p1Active ? p1Color : 'var(--text-secondary)', transition: 'color 0.4s', fontFamily: "'Space Grotesk', sans-serif" }}>
                {ML('\\textit{Phase 1}\\text{: robust best-of-}t\\text{ bracket}\\quad(t(N-1)\\text{ queries})')}
              </span>
            </div>
            <div style={{ padding: '4px 6px 10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              <AlgoLine num="2:" active={p1Active} dim={p1Dim} activeColor={p1Color}>
                {ML('\\text{Arrange }[N]\\text{ into single-elimination bracket (byes for non-power-of-2 }N\\text{)}')}
              </AlgoLine>
              <AlgoLine num="3:" active={p1Active} dim={p1Dim} activeColor={p1Color}>
                {ML('\\textbf{for all}\\text{ matches }(a,b)\\text{ in bracket order }\\textbf{do}')}
              </AlgoLine>
              <AlgoLine num="4:" indent={1} active={p1Active} dim={p1Dim} activeColor={p1Color}>
                {ML('\\text{Play up to }t\\text{ games; winner} = \\text{first to }\\lceil t/2 \\rceil\\text{ wins}')}
              </AlgoLine>
              <AlgoLine num="5:" indent={1} active={p1Active} dim={p1Dim} activeColor={p1Color}>
                {ML('\\text{After each game: update }\\hat{w}\\text{ via Elo; append outcome to }S')}
              </AlgoLine>
              <AlgoLine num="6:" active={p1Active} dim={p1Dim} activeColor={p1Color}>
                {ML('\\textbf{end for}')}
              </AlgoLine>
            </div>
          </motion.div>

          {/* Phase 2 block - exits right when step=1 */}
          <AnimatePresence>
            {step !== 1 && (
              <motion.div key="p2block" layout
                initial={false}
                exit={{ opacity: 0, x: 90 }}
                transition={{ type: 'spring', stiffness: 130, damping: 24 }}
                style={{
                  marginTop: 10, borderRadius: 13, overflow: 'hidden',
                  border: `1.5px solid ${p2Active ? 'rgba(232,197,71,0.55)' : 'rgba(232,197,71,0.28)'}`,
                  transition: 'border-color 0.4s',
                }}
              >
                <div style={{
                  padding: '6px 14px',
                  background: p2Active ? 'rgba(232,197,71,0.13)' : 'rgba(232,197,71,0.05)',
                  transition: 'background 0.4s',
                }}>
                  <span style={{ fontSize: 14, fontStyle: 'italic', color: p2Active ? p2Color : 'var(--text-secondary)', transition: 'color 0.4s', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {ML('\\textit{Phase 2}\\text{: winner-focused design loop}')}
                  </span>
                </div>
                <div style={{ padding: '4px 6px 10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <AlgoLine num="7:" active={p2Active} activeColor={p2Color}>
                    {ML('\\textbf{while}\\text{ budget not exhausted }\\textbf{do}')}
                  </AlgoLine>
                  <AlgoLine num="8:" indent={1} active={p2Active} activeColor={p2Color}>
                    {ML('\\mathcal{C} \\leftarrow \\text{top-}M\\text{ items by current Elo }\\hat{w}')}
                  </AlgoLine>
                  <AlgoLine num="9:" indent={1} active={p2Active} activeColor={p2Color}>
                    {ML('\\lambda^\\star \\leftarrow \\mathrm{SolveSDP}\\bigl(\\mathrm{Eq.}\\,(5)\\text{ on }\\mathcal{C}\\bigr)')}
                  </AlgoLine>
                  <AlgoLine num="10:" indent={1} active={p2Active} activeColor={p2Color}>
                    {ML('\\text{Query each pair }(i,j)\\in\\mathcal{C}\\text{ according to }\\lambda^\\star\\text{; append to }S')}
                  </AlgoLine>
                  <AlgoLine num="11:" indent={1} active={p2Active} activeColor={p2Color}>
                    {ML('\\text{Update }\\hat{w}\\text{ via Elo; refresh }\\hat{w} \\leftarrow \\mathrm{RankCentrality}(S)')}
                  </AlgoLine>
                  <AlgoLine num="12:" active={p2Active} activeColor={p2Color}>
                    {ML('\\textbf{end while}')}
                  </AlgoLine>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Return line */}
          <motion.div layout style={{ marginTop: 8 }}>
            <AlgoLine num="13:">
              {ML('\\textbf{return}\\; \\arg\\max_{i \\in \\mathcal{C}}\\,\\hat{w}_i')}
              <span style={{ fontSize: 14, color: 'var(--glass-28)', fontStyle: 'italic', marginLeft: 10 }}>▷ top Elo item in {ML('\\mathcal{C}')}</span>
            </AlgoLine>
          </motion.div>

          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, marginTop: 'auto', flexShrink: 0 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                height: 5, borderRadius: 3,
                width: i === step ? 22 : 8,
                background: i === 1 && step >= 1 ? p1Color : i === 2 && step >= 2 ? p2Color : i === step ? 'var(--glass-45)' : 'var(--glass-10)',
                transition: 'all 0.3s',
              }} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>
              {step === 0 ? 'Overview · press → to run Phase 1' : step === 1 ? 'Phase 1 running' : 'Phase 2 running'}
            </span>
          </div>
        </motion.div>

        {/* ══ RIGHT SIMULATION PANEL ═══════════════════════════════════════════ */}
        <AnimatePresence>
          {step > 0 && (
            <motion.div key={`sim-${step}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: 'spring', stiffness: 130, damping: 24 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}
            >
              {step === 1 ? <Phase1Panel /> : <Phase2Panel />}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </LayoutGroup>
  );
}
