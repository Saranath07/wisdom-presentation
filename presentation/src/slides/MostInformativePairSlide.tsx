import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

// ── Consistent players: A=2000, B=1950 (Δ=50), C=1900 (Δ=100) ─────────────────
const PA = { name: 'A', score: 2000, color: '#e8c547', label: 'Leader',     gap: 0   };
const PB = { name: 'B', score: 1950, color: '#4fc3f7', label: 'Challenger', gap: 50  };
const PC = { name: 'C', score: 1900, color: '#ef9a9a', label: 'Challenger', gap: 100 };
const ALL5 = [
  { name: 'A', score: 2000, color: '#e8c547' },
  { name: 'B', score: 1950, color: '#4fc3f7' },
  { name: 'C', score: 1900, color: '#ef9a9a' },
  { name: 'D', score: 1400, color: '#a5d6a7' },
  { name: 'E', score: 1300, color: '#ce93d8' },
];

type Player = { name: string; score: number; color: string; label?: string; gap?: number };

function Figure({ color, sz = 70 }: { color: string; sz?: number }) {
  const s = sz / 44;
  return (
    <svg width={44 * s} height={58 * s} viewBox="0 0 44 58" fill="none">
      <circle cx="22" cy="12" r="10" fill={color} />
      <rect x="14" y="24" width="16" height="20" rx="6" fill={color} />
      <rect x="6"  y="24" width="8"  height="14" rx="4" fill={color} />
      <rect x="30" y="24" width="8"  height="14" rx="4" fill={color} />
      <rect x="14" y="42" width="7"  height="14" rx="4" fill={color} />
      <rect x="23" y="42" width="7"  height="14" rx="4" fill={color} />
    </svg>
  );
}

function PlayerCard({ p, glow, sz = 88 }: { p: Player; glow?: boolean; sz?: number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
      padding: '16px 18px', borderRadius: 18, minWidth: sz * 1.7,
      background: glow ? `${p.color}18` : 'var(--glass-04)',
      border: `2px solid ${glow ? p.color : `${p.color}44`}`,
      boxShadow: glow ? `0 0 28px ${p.color}44` : 'none',
    }}>
      <Figure color={glow ? p.color : `${p.color}77`} sz={sz} />
      <div style={{ fontSize: sz * 0.27, fontWeight: 800, color: glow ? p.color : 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
        Player {p.name}
      </div>
      <div style={{ fontSize: sz * 0.32, fontWeight: 700, color: glow ? p.color : 'var(--text-secondary)', fontFamily: "'Space Grotesk', sans-serif" }}>
        {p.score}
      </div>
      {p.gap != null && p.gap > 0 && (
        <div style={{ fontSize: 12, color: p.color, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: `${p.color}20`, letterSpacing: '0.07em' }}>
          Δ = {p.gap}
        </div>
      )}
    </div>
  );
}

function PlayerSidePanel({ showN, nB, nC }: { showN?: boolean; nB?: number; nC?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
      {[PB, PA, PC].map(p => {
        const n = p.name === 'B' ? nB : p.name === 'C' ? nC : undefined;
        return (
          <div key={p.name} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            padding: '12px 16px', borderRadius: 16, minWidth: 130,
            background: p.name === 'A' ? `${p.color}18` : 'var(--glass-04)',
            border: `2px solid ${p.name === 'A' ? p.color : `${p.color}44`}`,
          }}>
            <Figure color={p.color} sz={72} />
            <div style={{ fontSize: 18, fontWeight: 800, color: p.color, fontFamily: "'Space Grotesk', sans-serif" }}>Player {p.name}</div>
            <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>{p.score}</div>
            {p.gap != null && p.gap > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ fontSize: 11, color: p.color, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: `${p.color}20` }}>Δ={p.gap}</span>
                {showN && n != null && (
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: 4, background: 'var(--glass-07)' }}>n={n}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Shell({ label, title, children }: { label: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', padding: '18px 64px 56px', boxSizing: 'border-box', overflow: 'hidden', gap: 10,
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>{label}</div>
        <h1 style={{ fontSize: 42, margin: 0, lineHeight: 1.2 }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 - big question centred → slides left, players fly in right
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair1() {
  const [phase, setPhase] = useState<'q' | 'players'>('q');
  useEffect(() => { const t = setTimeout(() => setPhase('players'), 1500); return () => clearTimeout(t); }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '18px 64px 56px', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div className="label" style={{ marginBottom: 4, flexShrink: 0 }}>MOST INFORMATIVE PAIR</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 40, minHeight: 0 }}>
        <motion.div
          animate={{ flex: phase === 'q' ? 2 : 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <motion.h1
            animate={{ fontSize: phase === 'q' ? 62 : 40 }}
            transition={{ type: 'spring', stiffness: 100, damping: 22 }}
            style={{ margin: 0, lineHeight: 1.2, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Who do you <span style={{ color: 'var(--gold)' }}>play next?</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: 20, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.65, maxWidth: 480 }}
          >
            A judge assigned scores to 5 players.<br />
            <strong style={{ color: 'var(--text-primary)' }}>You have 1 match to play.</strong><br />
            Which pair gives you the most confidence in finding the true winner?
          </motion.p>
        </motion.div>
        {phase === 'players' && (
          <motion.div
            initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexShrink: 0 }}
          >
            {ALL5.map((p, i) => (
              <motion.div key={p.name}
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 150, damping: 22, delay: i * 0.08 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '18px 16px', borderRadius: 18, minWidth: 110,
                  background: 'var(--glass-04)', border: `2px solid ${p.color}44`,
                }}
              >
                <Figure color={p.color} sz={76} />
                <div style={{ fontSize: 19, fontWeight: 800, color: p.color, fontFamily: "'Space Grotesk', sans-serif" }}>Player {p.name}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>{p.score}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 1b - Full Fisher matrix: A vs C beats A vs B
// Players: A=0, B=1, C=2  (scores 2000, 1950, 1900)
// Prior: 20 games A-B + 20 games B-C already played.
// Scalar f_AB≈f_AC (identical). But Fisher matrix says play A-C next.
// Because A-C gap (unc=0.40) is now the bottleneck vs A-B gap (unc=0.20).
// ══════════════════════════════════════════════════════════════════════════════

// Tiny 5x5 matrix utils (arrays of length 5, row-major)
const N5 = 5;
function matMul5(A: number[], B: number[]): number[] {
  const C = new Array(25).fill(0);
  for (let i = 0; i < N5; i++)
    for (let k = 0; k < N5; k++)
      for (let j = 0; j < N5; j++)
        C[i*N5+j] += A[i*N5+k] * B[k*N5+j];
  return C;
}
function identity5(): number[] {
  const I = new Array(25).fill(0);
  for (let i = 0; i < N5; i++) I[i*N5+i] = 1;
  return I;
}
// Gauss-Jordan inverse of 5x5
function inv5(M: number[]): number[] {
  const A = [...M], B = identity5();
  for (let col = 0; col < N5; col++) {
    let pivot = col;
    for (let r = col+1; r < N5; r++) if (Math.abs(A[r*N5+col]) > Math.abs(A[pivot*N5+col])) pivot = r;
    for (let c = 0; c < N5; c++) {
      [A[col*N5+c], A[pivot*N5+c]] = [A[pivot*N5+c], A[col*N5+c]];
      [B[col*N5+c], B[pivot*N5+c]] = [B[pivot*N5+c], B[col*N5+c]];
    }
    const d = A[col*N5+col];
    for (let c = 0; c < N5; c++) { A[col*N5+c] /= d; B[col*N5+c] /= d; }
    for (let r = 0; r < N5; r++) if (r !== col) {
      const f = A[r*N5+col];
      for (let c = 0; c < N5; c++) { A[r*N5+c] -= f*A[col*N5+c]; B[r*N5+c] -= f*B[col*N5+c]; }
    }
  }
  return B;
}
// Fisher contribution of n games on pair (i,j): f_ij * (e_i - e_j)(e_i - e_j)^T
function fisherContrib(i: number, j: number, fij: number, n: number): number[] {
  const M = new Array(25).fill(0);
  for (let r = 0; r < N5; r++) {
    const vi = r === i ? 1 : r === j ? -1 : 0;
    for (let c = 0; c < N5; c++) {
      const vj = c === i ? 1 : c === j ? -1 : 0;
      M[r*N5+c] += n * fij * vi * vj;
    }
  }
  return M;
}
// Add tiny ridge to make invertible (BTL is rank N-1, fix last player as anchor)
function addRidge(M: number[], eps = 1e-4): number[] {
  const R = [...M];
  for (let i = 0; i < N5; i++) R[i*N5+i] += eps;
  return R;
}
// Quadratic form v^T M v for v = e_i - e_j
function quadForm(M: number[], i: number, j: number): number {
  // v = e_i - e_j
  let s = 0;
  for (let r = 0; r < N5; r++) {
    const vr = r === i ? 1 : r === j ? -1 : 0;
    for (let c = 0; c < N5; c++) {
      const vc = c === i ? 1 : c === j ? -1 : 0;
      s += vr * M[r*N5+c] * vc;
    }
  }
  return s;
}

// 3-player setup: A=0(2000), B=1(1950), C=2(1900)
const SC3 = [2000, 1950, 1900, 1400, 1300]; // use N5=5 matrix but only 3 active
function fij3(i: number, j: number) { const p = SC3[i]/(SC3[i]+SC3[j]); return p*(1-p); }

// Prior: 20 A-B + 20 B-C games already played
function buildPrior3(): number[] {
  const M = new Array(25).fill(0);
  const cAB = fisherContrib(0, 1, fij3(0,1), 20);
  const cBC = fisherContrib(1, 2, fij3(1,2), 20);
  for (let k = 0; k < 25; k++) M[k] += cAB[k] + cBC[k];
  return M;
}
const PRIOR_3 = buildPrior3();
const PRIOR_INV_3 = inv5(addRidge(PRIOR_3));
const BASELINE_AB = quadForm(PRIOR_INV_3, 0, 1);
const BASELINE_AC = quadForm(PRIOR_INV_3, 0, 2);

// Compute result of adding 1 game of each option
const OPTIONS_1B = [
  { label: 'A vs B', i: 0, j: 1, color: '#4fc3f7' },
  { label: 'A vs C', i: 0, j: 2, color: '#ef9a9a' },
  { label: 'B vs C', i: 1, j: 2, color: '#a5d6a7' },
].map(o => {
  const I = [...PRIOR_3];
  const c = fisherContrib(o.i, o.j, fij3(o.i, o.j), 1);
  for (let k = 0; k < 25; k++) I[k] += c[k];
  const Ii = inv5(addRidge(I));
  const uAB = quadForm(Ii, 0, 1);
  const uAC = quadForm(Ii, 0, 2);
  const maxUnc = Math.max(uAB, uAC);
  const scalarF = fij3(o.i, o.j);
  return { ...o, uAB, uAC, maxUnc, scalarF };
});
const BEST_OPT_1B = OPTIONS_1B.reduce((a, b) => b.maxUnc < a.maxUnc ? b : a);

export function MostInformativePair1b() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowRight' || e.key === ' ') && step < 2) { e.stopPropagation(); setStep(s => s + 1); }
      else if (e.key === 'ArrowLeft' && step > 0) { e.stopPropagation(); setStep(s => s - 1); }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [step]);

  const ML = (f: string) => <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '32px 80px 32px', boxSizing: 'border-box', overflow: 'hidden', justifyContent: 'center', gap: 20 }}>
      <div>
        <div className="label" style={{ marginBottom: 10 }}>MOST INFORMATIVE PAIR</div>
        <h1 style={{ fontSize: 42, fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
          {step < 2
            ? <>Scalar {ML('f_{ij}')} says <span style={{ color: 'var(--cyan)' }}>A{'}'}B ≈ A{'}'}C</span>: can't decide!</>
            : <>Fisher matrix: <span style={{ color: 'var(--gold)' }}>play A vs C</span></>
          }
        </h1>
      </div>

      {/* Setup */}
      <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>
        Already played: <strong style={{ color: '#4fc3f7' }}>20 × A–B</strong> and <strong style={{ color: '#a5d6a7' }}>20 × B–C</strong>.
        {' '}You have <strong style={{ color: 'var(--text-primary)' }}>1 more game</strong>.
        {' '}Goal: minimise {ML('\\max_j\\,(e_A-e_j)^\\top I(\\theta;\\lambda)^{-1}(e_A-e_j)')}
      </div>

      {/* Current uncertainties */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { latex: '(e_A-e_B)^\\top I^{-1}(e_A-e_B)', val: BASELINE_AB, color: '#4fc3f7' },
          { latex: '(e_A-e_C)^\\top I^{-1}(e_A-e_C)', val: BASELINE_AC, color: '#ef9a9a' },
        ].map(x => (
          <div key={x.latex} style={{ padding: '16px 24px', borderRadius: 12, background: 'var(--glass-04)', border: '1px solid var(--glass-10)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {ML(x.latex)}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: x.color, fontFamily: "'Space Grotesk',sans-serif" }}>{x.val.toFixed(4)}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 16, color: 'var(--glass-55)' }}>
        A–C gap is <strong style={{ color: '#ef9a9a' }}>2× more uncertain</strong>: it's the bottleneck.
        {' '}Scalar: {ML('f_{AB}')} = {OPTIONS_1B[0].scalarF.toFixed(4)}, {ML('f_{AC}')} = {OPTIONS_1B[1].scalarF.toFixed(4)}: <em>almost identical</em>. Scalar alone can't decide.
      </div>

      {/* Options table */}
      {step >= 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '160px 140px 1fr 1fr 1fr', gap: 12, padding: '4px 16px', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            <span>NEXT GAME</span>
            <span>{ML('f_{ij} = p_{ij}(1-p_{ij})')}</span>
            <span style={{ textAlign: 'right' }}>{ML('\\text{unc}(A{-}B)')}</span>
            <span style={{ textAlign: 'right' }}>{ML('\\text{unc}(A{-}C)')}</span>
            <span style={{ textAlign: 'right' }}>{ML('\\max\\,\\text{unc}')}</span>
          </div>
          {OPTIONS_1B.map((o, i) => {
            const isBest = o.label === BEST_OPT_1B.label;
            return (
              <motion.div key={o.label}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  display: 'grid', gridTemplateColumns: '160px 140px 1fr 1fr 1fr', gap: 12,
                  padding: '14px 16px', borderRadius: 12,
                  background: isBest && step >= 2 ? 'rgba(232,197,71,0.09)' : 'var(--glass-03)',
                  border: isBest && step >= 2 ? '1.5px solid rgba(232,197,71,0.5)' : '1px solid var(--glass-08)',
                  transition: 'all 0.4s',
                }}
              >
                <span style={{ fontWeight: 700, color: o.color, fontFamily: "'Space Grotesk',sans-serif", fontSize: 18 }}>{o.label}</span>
                <span style={{ fontSize: 17, color: 'var(--text-secondary)' }}>{o.scalarF.toFixed(4)}</span>
                <span style={{ textAlign: 'right', fontSize: 17, color: 'var(--text-primary)' }}>{o.uAB.toFixed(4)}</span>
                <span style={{ textAlign: 'right', fontSize: 17, color: 'var(--text-primary)' }}>{o.uAC.toFixed(4)}</span>
                <span style={{ textAlign: 'right', fontSize: 18, fontWeight: isBest ? 700 : 400, color: isBest && step >= 2 ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {o.maxUnc.toFixed(4)}{isBest && step >= 2 ? ' ★' : ''}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {step >= 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '14px 22px', borderRadius: 12, background: 'rgba(232,197,71,0.08)', border: '1px solid rgba(232,197,71,0.4)' }}
        >
          <div style={{ fontSize: 18, lineHeight: 1.75 }}>
            <strong style={{ color: 'var(--gold)' }}>A vs C</strong> gives the lowest {ML('\\max\\,\\text{unc}')} ({BEST_OPT_1B.maxUnc.toFixed(4)}) vs A-B ({OPTIONS_1B[0].maxUnc.toFixed(4)}).
            {' '}{ML('f_{AB} \\approx f_{AC}')}: scalar info <em>cannot distinguish them</em>.
            Only the <strong style={{ color: 'var(--text-primary)' }}>Fisher matrix inverse</strong> {ML('I(\\theta;\\lambda)^{-1}')} sees that A-C is the bottleneck. →
          </div>
        </motion.div>
      )}

      {step === 0 && (
        <div style={{ fontSize: 13, color: 'var(--glass-20)', textAlign: 'center' }}>→ press arrow to compute Fisher matrix result</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 - 3 players, gap labels
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair2() {
  return (
    <Shell label="MOST INFORMATIVE PAIR"
      title={<>Which pair gives more <span style={{ color: 'var(--cyan)' }}>information</span>?</>}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PlayerCard p={PB} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 130, gap: 6 }}>
            <div style={{ width: '100%', height: 2, background: `${PB.color}66` }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: PB.color, padding: '4px 14px', borderRadius: 8, background: `${PB.color}18`, border: `1px solid ${PB.color}55`, fontFamily: "'Space Grotesk', sans-serif" }}>Δ = 50</div>
          </div>
          <PlayerCard p={PA} glow />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 130, gap: 6 }}>
            <div style={{ width: '100%', height: 2, background: `${PC.color}66` }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: PC.color, padding: '4px 14px', borderRadius: 8, background: `${PC.color}18`, border: `1px solid ${PC.color}55`, fontFamily: "'Space Grotesk', sans-serif" }}>Δ = 100</div>
          </div>
          <PlayerCard p={PC} />
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ padding: '20px 36px', borderRadius: 16, textAlign: 'center', maxWidth: 640, margin: '0 auto', background: 'rgba(232,197,71,0.06)', border: '1px solid rgba(232,197,71,0.25)' }}
        >
          <div style={{ fontSize: 19, lineHeight: 1.75 }}>
            <strong style={{ color: PA.color }}>A</strong> is the leader.
            <strong style={{ color: PB.color }}> B</strong> is 50 points behind,{' '}
            <strong style={{ color: PC.color }}>C</strong> is 100 points behind.
            <br />
            <span style={{ color: 'var(--text-secondary)' }}>Both are threats. But which matchup tells us <em>more</em>?</span>
          </div>
        </motion.div>
      </motion.div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2b - Why Fisher *matrix*? The transitivity / network effect
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair2b() {
  const [step, setStep] = useState(0); // 0 = naive, 1 = transitivity, 2 = Fisher formula

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowRight' || e.key === ' ') && step < 2) { e.stopPropagation(); setStep(s => s + 1); }
      else if (e.key === 'ArrowLeft' && step > 0) { e.stopPropagation(); setStep(s => s - 1); }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [step]);

  return (
    <Shell label="MOST INFORMATIVE PAIR"
      title={<>Why the Fisher <span style={{ color: 'var(--cyan)' }}>matrix</span>, not just <MathFormula formula="\Delta" style={{ display: 'inline', fontSize: '0.9em' }} />?</>}
    >
      <div style={{ flex: 1, display: 'flex', gap: 24, alignItems: 'center', minHeight: 0 }}>
        <PlayerSidePanel />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

          {/* Box 1 - always visible */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ padding: '16px 22px', borderRadius: 14, background: 'var(--glass-03)', border: '1px solid var(--glass-10)', fontSize: 20, lineHeight: 1.75 }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Naive view:</strong> just pick the pair with the smallest gap{' '}
            <MathFormula formula="\Delta_{ij}" style={{ display: 'inline' }} />: they're the hardest to separate.
            <br />
            <strong style={{ color: 'var(--gold)' }}>But this ignores how BTL is a global ranking model.</strong>{' '}
            Information flows through the network via transitivity.
          </motion.div>

          {/* Box 2 - revealed on step 1 */}
          {step >= 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              style={{ padding: '18px 22px', borderRadius: 14, background: 'rgba(232,197,71,0.05)', border: '1px solid rgba(232,197,71,0.25)' }}
            >
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.1em" }}>THE NETWORK EFFECT: TRANSITIVITY</div>
              <div style={{ fontSize: 20, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
                Suppose A and B never play each other directly. But you run many queries of{' '}
                <strong style={{ color: PB.color }}>A vs C</strong> and{' '}
                <strong style={{ color: PC.color }}>B vs C</strong>.
              </div>
              <div style={{ marginTop: 10, padding: '10px 16px', borderRadius: 10, background: 'var(--glass-04)', border: '1px solid var(--glass-10)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MathFormula formula="\theta_A - \theta_C" style={{ color: PA.color }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 15 }}>pinned by A vs C queries</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MathFormula formula="\theta_B - \theta_C" style={{ color: PB.color }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 15 }}>pinned by B vs C queries</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--glass-10)' }}>
                    <MathFormula formula="\theta_A - \theta_B = (\theta_A - \theta_C) - (\theta_B - \theta_C)" style={{ color: 'var(--gold)', fontWeight: 700 }} />
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 19, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.65 }}>
                The <strong style={{ color: 'var(--text-primary)' }}>off-diagonal entries</strong> of{' '}
                <MathFormula formula="I(\theta;\lambda)^{-1}" style={{ display: 'inline' }} /> capture this covariance.
                <MathFormula formula="\Delta_{AB}" style={{ display: 'inline' }} /> alone is completely blind to it.
              </div>
            </motion.div>
          )}

          {/* Box 3 - revealed on step 2 */}
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              style={{ padding: '16px 22px', borderRadius: 14, background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.3)' }}
            >
              <div style={{ fontSize: 14, color: 'var(--cyan)', marginBottom: 10, letterSpacing: '0.1em', fontWeight: 700 }}>THE FISHER MATRIX: NETWORK-AWARE UNCERTAINTY</div>
              <MathFormula
                formula={String.raw`I(\theta;\lambda) = B\!\sum_{i<j}\lambda_{ij}\,p_{ij}(1-p_{ij})(e_i-e_j)(e_i-e_j)^\top`}
                block style={{ fontSize: '1.9em' }}
              />
              <div style={{ fontSize: 19, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.65 }}>
                Each query on pair <MathFormula formula="(i,j)" style={{ display: 'inline' }} /> adds a rank-1 update along direction{' '}
                <MathFormula formula="e_i - e_j" style={{ display: 'inline' }} />, modifying the uncertainty of <em>every</em> gap, not just <MathFormula formula="\Delta_{ij}" style={{ display: 'inline' }} />.
              </div>
            </motion.div>
          )}

          {step < 2 && (
            <div style={{ fontSize: 12, color: 'var(--glass-20)', textAlign: 'center', marginTop: 4 }}>
              → press arrow to continue
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2c - Why Δ² too? Width vs Location - exact numbers from our players
//
// A=2000, B=1950, D=1400 (using D as the "weakling" contrast)
// BTL log-scores: θ = log(score)
// Δ_AB = log(2000/1950) = 0.0253   p_AB = 2000/3950 = 0.5063   f_AB = 0.2500
// Δ_AD = log(2000/1400) = 0.3567   p_AD = 2000/3400 = 0.5882   f_AD = 0.2424
//
// After n=50 queries each: σ² = 1/(n·f)
//   σ²_AB = 1/(50×0.250) = 0.080   σ_AB = 0.283
//   σ²_AD = 1/(50×0.242) = 0.083   σ_AD = 0.288   ← nearly identical!
//
// 95% CI on gap (±1.96·σ):
//   A vs D: gap=0.357 ± 0.564  → [−0.207, 0.921]  -- straddles 0!? NO wait:
//   CI half-width = 1.96×0.288 = 0.565
//   A vs D: [0.357−0.565, 0.357+0.565] = [−0.208, 0.922]  straddles 0
//   A vs B: [0.025−0.555, 0.025+0.555] = [−0.530, 0.580]  straddles 0 even more
// Both straddle, but φ tells us which is MORE dangerous:
//   φ_AB = σ²_AB / Δ²_AB = 0.080 / 0.000639 = 125.2
//   φ_AD = σ²_AD / Δ²_AD = 0.083 / 0.1272   =   0.65
// φ_AB is 192× larger → A vs B is vastly more dangerous despite same σ²
// ══════════════════════════════════════════════════════════════════════════════

// Player D for this slide - score 1300 so Δ_AD is large enough that CI doesn't straddle 0
const PD = { name: 'D', score: 1300, color: '#a5d6a7', label: 'Weakling' };

// Exact computed values - n=100 queries each so σ is small enough
// A=2000, B=1950, D=1300
// Δ_AB = ln(2000/1950) = 0.02532   p_AB = 2000/3950 = 0.5063  f_AB = 0.2500  σ²_AB = 1/(100×0.250)=0.04000  σ_AB=0.2000
// CI_AB = [0.02532 ± 1.96×0.200] = [−0.367, +0.417]  → straddles 0 ⚠
// Δ_AD = ln(2000/1300) = 0.4308    p_AD = 2000/3300 = 0.6061  f_AD = 0.2388  σ²_AD = 1/(100×0.2388)=0.04188  σ_AD=0.2046
// CI_AD = [0.4308 ± 1.96×0.2046] = [+0.030, +0.832]  → does NOT straddle 0 ✓
// φ_AB = 0.04000 / 0.02532² = 62.4   φ_AD = 0.04188 / 0.4308² = 0.225
// G-optimal picks A vs D (σ²_AD=0.04188 > σ²_AB=0.04000), φ says A vs B is 277× more dangerous
const N_QUERIES = 100;
const p_AB = 2000 / 3950;
const f_AB = p_AB * (1 - p_AB);
const sig2_AB = 1 / (N_QUERIES * f_AB);
const sig_AB = Math.sqrt(sig2_AB);
const Delta_AB = Math.log(2000 / 1950);
const phi_AB = sig2_AB / (Delta_AB * Delta_AB);

const p_AD = 2000 / 3300;
const f_AD = p_AD * (1 - p_AD);
const sig2_AD = 1 / (N_QUERIES * f_AD);
const sig_AD = Math.sqrt(sig2_AD);
const Delta_AD = Math.log(2000 / 1300);
const phi_AD = sig2_AD / (Delta_AD * Delta_AD);

const CI_HALF = 1.96;

export function MostInformativePair2c() {
  const [step, setStep] = useState(0); // 0=σ², 1=CI lines, 2=φ+verdict
  const MAX = 2;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (step < MAX) { e.stopPropagation(); setStep(s => s + 1); }
      } else if (e.key === 'ArrowLeft') {
        if (step > 0) { e.stopPropagation(); setStep(s => s - 1); }
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [step]);

  // Number-line: domain [−0.65, 1.0] mapped to 680px
  const domainMin = -0.65, domainMax = 1.0, lineW = 680;
  const toX = (v: number) => ((v - domainMin) / (domainMax - domainMin)) * lineW;
  const _boundaryX = toX(0);

  const arms = [
    {
      key: 'D', label: 'A vs D', sublabel: `Player D, score ${PD.score}`,
      color: PD.color, gap: Delta_AD, sig: sig_AD, sig2: sig2_AD, f: f_AD, phi: phi_AD,
      p: p_AD, ciLo: Delta_AD - CI_HALF * sig_AD, ciHi: Delta_AD + CI_HALF * sig_AD,
      gPicks: true,
    },
    {
      key: 'B', label: 'A vs B', sublabel: `Player B, score ${PB.score}`,
      color: PB.color, gap: Delta_AB, sig: sig_AB, sig2: sig2_AB, f: f_AB, phi: phi_AB,
      p: p_AB, ciLo: Delta_AB - CI_HALF * sig_AB, ciHi: Delta_AB + CI_HALF * sig_AB,
      gPicks: false,
    },
  ];

  const titles = [
    <>Width ≠ danger: <span style={{ color: 'var(--gold)' }}>same <MathFormula formula="\sigma^2" style={{ display: 'inline', fontSize: '0.85em', color: 'var(--gold)' }} />, different threat</span></>,
    <>The CI tells the real story: <span style={{ color: 'var(--gold)' }}>does it straddle zero?</span></>,
    <><MathFormula formula="\phi = \sigma^2/\Delta^2" style={{ display: 'inline', fontSize: '0.85em' }} />: <span style={{ color: 'var(--gold)' }}>192× difference</span></>,
  ];

  return (
    <Shell label={`MOST INFORMATIVE PAIR  (${step + 1}/3)`} title={titles[step]}>
      <div style={{ flex: 1, display: 'flex', gap: 22, alignItems: 'stretch', minHeight: 0 }}>

        {/* Players column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          {[PB, PA, PD].map(p => (
            <div key={p.name} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '14px 18px', borderRadius: 16, minWidth: 138,
              background: p.name === 'A' ? `${p.color}18` : 'var(--glass-04)',
              border: `2px solid ${p.name === 'A' ? p.color : `${p.color}44`}`,
            }}>
              <Figure color={p.color} sz={72} />
              <div style={{ fontSize: 19, fontWeight: 800, color: p.color, fontFamily: "'Space Grotesk', sans-serif" }}>Player {p.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>{p.score}</div>
              {p.name !== 'A' && (
                <div style={{ fontSize: 13, color: p.color, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${p.color}20` }}>
                  Δ = {p.name === 'B' ? Delta_AB.toFixed(3) : Delta_AD.toFixed(3)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0, overflowY: 'auto' }}>

          {/* ── Step 0: σ² comparison ── */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <div style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                After <MathFormula formula={`n=${N_QUERIES}`} style={{ display: 'inline' }} /> queries on each pair, Cramér-Rao gives{' '}
                <MathFormula formula="\sigma^2 = 1/(n \cdot f)" style={{ display: 'inline' }} />:
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {arms.map(a => (
                  <div key={a.key} style={{
                    flex: 1, padding: '22px 26px', borderRadius: 14,
                    background: a.gPicks ? `${a.color}12` : 'var(--glass-03)',
                    border: `2px solid ${a.gPicks ? a.color : 'var(--glass-10)'}`,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: a.color, marginBottom: 12 }}>
                      {a.label} <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-secondary)' }}>({a.sublabel})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <MathFormula formula={`p = ${a.p.toFixed(4)}, \\quad f = p(1-p) = ${a.f.toFixed(4)}`} block style={{ fontSize: '1.3em' }} />
                      <MathFormula formula={`\\sigma^2 = \\frac{1}{${N_QUERIES} \\times ${a.f.toFixed(4)}} = ${a.sig2.toFixed(4)}, \\quad \\sigma = ${a.sig.toFixed(4)}`} block style={{ fontSize: '1.3em' }} />
                    </div>
                    {a.gPicks && (
                      <div style={{ marginTop: 12, fontSize: 17, color: a.color, fontWeight: 700 }}>
                        ← G-optimal picks this (slightly larger <MathFormula formula="\sigma^2" style={{ display:'inline' }} />)
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 22px', borderRadius: 12, background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.35)', fontSize: 18, color: '#ef9a9a', lineHeight: 1.65 }}>
                <strong>G-optimal flaw:</strong> Both <MathFormula formula="\sigma^2" style={{ display:'inline' }} /> are nearly identical (0.0826 vs 0.0800). G-optimal picks A vs D by a hair, but is that actually the dangerous pair?
              </div>
            </motion.div>
          )}

          {/* ── Step 1: CI number-line - one row per arm ── */}
          {step === 1 && (()=>{
            const dMin = -0.55, dMax = 1.0, lW = 660;
            const tx = (v: number) => ((v - dMin) / (dMax - dMin)) * lW;
            const bx = tx(0);
            const ticks = [-0.5, -0.25, 0, 0.25, 0.5, 0.75];
            return (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  95% CI on gap <MathFormula formula="\theta_A - \theta_j" style={{ display: 'inline' }} />:{' '}
                  <MathFormula formula="\bigl[\hat\Delta \pm 1.96\,\sigma\bigr]" style={{ display: 'inline' }} />.
                  &nbsp;If it crosses <MathFormula formula="0" style={{ display: 'inline' }} />, we cannot confirm A wins.
                </div>

                {arms.map((a) => {
                  const x1 = tx(a.ciLo), x2 = tx(a.ciHi), cx = tx(a.gap);
                  const straddles = a.ciLo < 0;
                  return (
                    <div key={a.key} style={{
                      padding: '18px 22px 20px', borderRadius: 14,
                      background: straddles ? 'rgba(239,83,80,0.07)' : 'rgba(102,187,106,0.07)',
                      border: `2px solid ${straddles ? '#ef535066' : '#66bb6a66'}`,
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: a.color }}>{a.label}</span>
                        <MathFormula
                          formula={`\\hat{\\Delta} = ${a.gap.toFixed(4)},\\quad \\sigma = ${a.sig.toFixed(4)},\\quad \\text{CI} = [${a.ciLo.toFixed(3)},\\, ${a.ciHi.toFixed(3)}]`}
                          style={{ fontSize: '1em', color: 'var(--text-secondary)' }}
                        />
                        <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: straddles ? '#ef9a9a' : '#66bb6a', flexShrink: 0 }}>
                          {straddles ? '⚠ straddles 0' : '✓ clear of 0'}
                        </span>
                      </div>

                      {/* Number line */}
                      <div style={{ position: 'relative', height: 72 }}>
                        {/* Axis */}
                        <div style={{ position: 'absolute', top: 32, left: 0, width: lW, height: 2, background: 'var(--glass-15)' }} />
                        {/* Ticks */}
                        {ticks.map(v => (
                          <div key={v}>
                            <div style={{ position: 'absolute', top: 26, left: tx(v), width: 1.5, height: 12, background: v === 0 ? 'var(--gold)' : 'var(--glass-25)' }} />
                            <div style={{ position: 'absolute', top: 42, left: tx(v) - 14, width: 28, textAlign: 'center', fontSize: 13, color: v === 0 ? 'var(--gold)' : 'var(--glass-35)', fontWeight: v === 0 ? 700 : 400 }}>{v}</div>
                          </div>
                        ))}
                        {/* Gold boundary */}
                        <div style={{ position: 'absolute', top: 0, height: 64, left: bx, width: 2.5, background: 'var(--gold)', opacity: 0.9 }} />
                        <div style={{ position: 'absolute', top: 0, left: bx + 5, fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>0 (boundary)</div>

                        {/* CI bar */}
                        <motion.div
                          initial={{ width: 0, opacity: 0 }} animate={{ width: Math.max(x2 - x1, 4), opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 55, damping: 18, delay: 0.15 }}
                          style={{ position: 'absolute', top: 20, left: x1, height: 26, borderRadius: 6, background: `${a.color}99`, border: `2.5px solid ${a.color}` }}
                        />
                        {/* End caps */}
                        <div style={{ position: 'absolute', top: 16, left: x1 - 2, width: 4, height: 34, background: a.color, borderRadius: 2 }} />
                        <div style={{ position: 'absolute', top: 16, left: x2 - 2, width: 4, height: 34, background: a.color, borderRadius: 2 }} />
                        {/* Gap point */}
                        <div style={{ position: 'absolute', top: 14, left: cx - 7, width: 14, height: 38, borderRadius: 4, background: a.color, border: '3px solid #fff', boxShadow: `0 0 10px ${a.color}` }} />
                        {/* Δ̂ label */}
                        <div style={{ position: 'absolute', top: 56, left: cx - 10, width: 20, textAlign: 'center', fontSize: 13, color: a.color, fontWeight: 700 }}>Δ̂</div>
                      </div>

                      {/* Ratio */}
                      <div style={{ fontSize: 17, color: 'var(--text-secondary)', marginTop: 10 }}>
                        CI half-width <MathFormula formula={`= 1.96 \\times ${a.sig.toFixed(4)} = ${(CI_HALF * a.sig).toFixed(3)}`} style={{ display: 'inline' }} />
                        &nbsp;·&nbsp; ratio CI/Δ = <strong style={{ color: straddles ? '#ef9a9a' : '#66bb6a', fontSize: 19 }}>{(CI_HALF * a.sig / Math.abs(a.gap)).toFixed(1)}×</strong>
                      </div>
                    </div>
                  );
                })}

              </motion.div>
            );
          })()}

          {/* ── Step 2: φ verdict (includes CI summary) ── */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(232,197,71,0.08)', border: '1.5px solid rgba(232,197,71,0.35)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                A vs D: CI/Δ = {(CI_HALF * sig_AD / Delta_AD).toFixed(1)}×, CI clears zero, winner confirmed. &nbsp;
                <strong style={{ color: PB.color }}>A vs B: CI/Δ = {(CI_HALF * sig_AB / Delta_AB).toFixed(1)}×, CI swallows the gap entirely.</strong>
                &nbsp; Same <MathFormula formula="\sigma^2" style={{ display:'inline' }} />, completely different danger.
              </div>
              <div style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                <MathFormula formula="\phi_{Aj} = \sigma^2 / \Delta^2" style={{ display: 'inline' }} /> measures exactly this ratio: how many times does the CI width span the gap?
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {arms.map(a => (
                  <div key={a.key} style={{
                    flex: 1, padding: '24px 28px', borderRadius: 16,
                    background: !a.gPicks ? `${a.color}15` : 'var(--glass-03)',
                    border: `2px solid ${!a.gPicks ? a.color : 'var(--glass-10)'}`,
                    boxShadow: !a.gPicks ? `0 0 28px ${a.color}33` : 'none',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: a.color, marginBottom: 14 }}>{a.label}</div>
                    <MathFormula
                      formula={`\\phi_{A${a.key}} = \\frac{${a.sig2.toFixed(4)}}{(${a.gap.toFixed(4)})^2} = \\frac{${a.sig2.toFixed(4)}}{${(a.gap * a.gap).toFixed(6)}} = ${a.phi.toFixed(1)}`}
                      block style={{ fontSize: '1.5em' }}
                    />
                    {a.gPicks && (
                      <div style={{ marginTop: 14, fontSize: 17, color: '#ef9a9a' }}>
                        G-optimal picked this, but <MathFormula formula={`\\varphi = ${a.phi.toFixed(1)}`} style={{ display:'inline' }} /> is tiny.
                      </div>
                    )}
                    {!a.gPicks && (
                      <div style={{ marginTop: 14, fontSize: 19, color: a.color, fontWeight: 800 }}>
                        ▲ <MathFormula formula={`\\varphi = ${a.phi.toFixed(0)}`} style={{ display:'inline' }} />: {(phi_AB / phi_AD).toFixed(0)}× more dangerous!
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding: '18px 24px', borderRadius: 14, background: 'rgba(232,197,71,0.1)', border: '2px solid rgba(232,197,71,0.45)', fontSize: 19, lineHeight: 1.65 }}>
                <strong style={{ color: 'var(--gold)' }}>G-optimal is wrong by 192×.</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                  It chose A vs D because <MathFormula formula="\sigma^2" style={{ display:'inline' }} /> was 0.0003 larger. But <MathFormula formula="\varphi" style={{ display:'inline' }} /> shows A vs B is the real threat: its tiny gap makes every bit of uncertainty catastrophic.
                </span>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 - (now slide 5) Cramér-Rao → misclassification → closing question
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair3() {
  return (
    <Shell label="MOST INFORMATIVE PAIR"
      title={<>Raw Fisher info <MathFormula formula="f = p(1-p)" style={{ display: 'inline', fontSize: '0.85em' }} />: <span style={{ color: 'var(--gold)' }}>it's a perfect tie.</span></>}
    >
      <div style={{ flex: 1, display: 'flex', gap: 22, alignItems: 'stretch', minHeight: 0 }}>
        <PlayerSidePanel />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Step 1: f = p(1-p) ties */}
          <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 22 }}
            style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(232,197,71,0.05)', border: '1px solid rgba(232,197,71,0.2)' }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em' }}>
              STEP 1: RAW FISHER INFORMATION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <MathFormula formula={String.raw`f_{Aj} = p_{Aj}(1-p_{Aj})`} block style={{ fontSize: '2.1em' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'A\\text{ vs }B', val: String.raw`\tfrac{2000}{3950}\cdot\tfrac{1950}{3950} \approx 0.250`, color: PB.color },
                  { label: 'A\\text{ vs }C', val: String.raw`\tfrac{2000}{3900}\cdot\tfrac{1900}{3900} \approx 0.250`, color: PC.color },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MathFormula formula={r.label} style={{ color: r.color, fontWeight: 700 }} />
                    <MathFormula formula={String.raw`\Rightarrow f =`} style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }} />
                    <MathFormula formula={r.val} style={{ color: r.color, fontWeight: 700 }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 8, padding: '7px 12px', borderRadius: 8, background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.3)', fontSize: 14, color: 'var(--cyan)', fontWeight: 600 }}>
              Maximising <MathFormula formula="f" style={{ display: 'inline' }} /> says both pairs are equally good. The algorithm is blind to gap size.
            </div>
          </motion.div>

          {/* Step 2: Cramér-Rao */}
          <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 120, damping: 22 }}
            style={{ padding: '14px 20px', borderRadius: 14, background: 'var(--glass-03)', border: '1px solid var(--glass-10)' }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em' }}>
              STEP 2: CRAMÉR-RAO, MOVE TO ERROR DOMAIN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <MathFormula
                formula={String.raw`\sigma^2 \;\propto\; \frac{1}{f}`}
                block style={{ fontSize: '1.9em' }}
              />
              <div style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.65, flex: 1 }}>
                The Cramér-Rao bound says variance is <em>inversely proportional</em> to Fisher information.
                Taking <MathFormula formula="f^{-1}" style={{ display: 'inline' }} /> converts us from the <em>information domain</em> into the <em>error domain</em>, where we can measure actual danger of misclassification.
              </div>
            </div>
          </motion.div>

          {/* Closing question */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 120, damping: 22 }}
            style={{ padding: '22px 28px', borderRadius: 16, background: 'rgba(232,197,71,0.07)', border: '2px solid rgba(232,197,71,0.4)', textAlign: 'center' }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.7, marginBottom: 10 }}>
              Both pairs give <MathFormula formula="f \approx 0.250" style={{ display: 'inline' }} />, and
              {' '}<MathFormula formula="\sigma^2 \propto 1/f" style={{ display: 'inline' }} /> is also identical.
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--gold)" }}>
              So which pair should we choose, and why?
            </div>
          </motion.div>

        </div>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 3b - Δ² derivation: from σ/Δ to φ = 1/(f·Δ²)
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair3b() {
  return (
    <Shell label="MOST INFORMATIVE PAIR"
      title={<>The fix: measure <MathFormula formula="\sigma" style={{ display: 'inline', fontSize: '0.9em' }} /> <em>relative to</em> <MathFormula formula="\Delta" style={{ display: 'inline', fontSize: '0.9em' }} />: enter <span style={{ color: 'var(--gold)' }}><MathFormula formula="\Delta^2" style={{ display: 'inline', fontSize: '0.9em', color: 'var(--gold)' }} /></span>.</>}
    >
      <div style={{ flex: 1, display: 'flex', gap: 24, alignItems: 'center', minHeight: 0 }}>
        <PlayerSidePanel />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>

          {/* The question */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ padding: '18px 24px', borderRadius: 14, background: 'var(--glass-03)', border: '1px solid var(--glass-10)', fontSize: 17, lineHeight: 1.75 }}
          >
            We established: <MathFormula formula="\sigma^2 \propto 1/f" style={{ display: 'inline' }} />, same for both pairs.
            <br />
            The real question is: <strong style={{ color: 'var(--text-primary)' }}>how big is the error bar compared to the gap?</strong>
            <br />
            A <MathFormula formula="\sigma = \pm 30" style={{ display: 'inline' }} /> error is safe when <MathFormula formula="\Delta = 100" style={{ display: 'inline' }} />, but catastrophic when <MathFormula formula="\Delta = 50" style={{ display: 'inline' }} />.
          </motion.div>

          {/* Derivation chain */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 120, damping: 22 }}
            style={{ padding: '22px 28px', borderRadius: 16, background: 'rgba(232,197,71,0.05)', border: '1px solid rgba(232,197,71,0.25)' }}
          >
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 14, letterSpacing: "0.1em" }}>DERIVATION: RELATIVE MISCLASSIFICATION DANGER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Relative danger', formula: String.raw`\text{danger} = \frac{\sigma}{\Delta}`, note: 'how large is the error bar vs the gap?' },
                { label: 'Square it (work with variance)', formula: String.raw`\text{danger}^2 = \frac{\sigma^2}{\Delta^2}`, note: '' },
                { label: 'Substitute Cramér-Rao', formula: String.raw`\frac{\sigma^2}{\Delta^2} \;\propto\; \frac{1/f}{\Delta^2} = \frac{1}{f \cdot \Delta^2}`, note: '' },
              ].map((r, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{ width: 200, fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>{r.label}</div>
                  <MathFormula formula={r.formula} block style={{ fontSize: '1.9em' }} />
                  {r.note && <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{r.note}</div>}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* φ definition */}
          <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 130, damping: 20 }}
            style={{ padding: '20px 28px', borderRadius: 14, background: 'rgba(232,197,71,0.1)', border: '2px solid rgba(232,197,71,0.45)', display: 'flex', alignItems: 'center', gap: 28 }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>RELATIVE GAP UNCERTAINTY φ</div>
              <MathFormula
                formula={String.raw`\phi_{Aj} \;\propto\; \frac{1}{f_{Aj} \cdot \Delta_{Aj}^2}`}
                block style={{ fontSize: '2.2em' }}
              />
            </div>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, flex: 1 }}>
              Larger <MathFormula formula="\phi_{Aj}" style={{ display: 'inline' }} /> = more uncertainty about whether <MathFormula formula="\theta_A > \theta_j" style={{ display: 'inline' }} />.
              <br />
              We want to <strong style={{ color: 'var(--gold)' }}>minimise the worst-case <MathFormula formula="\phi" style={{ display: 'inline', color: 'var(--gold)' }} /></strong> over all challengers.
            </div>
          </motion.div>

        </div>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 - twist: n_ij past queries, formula WITHOUT Δ² yet
// n·f(A,B) = 20×0.25 = 5.0  →  φ_simple = 1/5.0 = 0.200
// n·f(A,C) =  2×0.25 = 0.5  →  φ_simple = 1/0.5 = 2.000  (10× higher)
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair4() {
  return (
    <Shell label="MOST INFORMATIVE PAIR"
      title={<>The <span style={{ color: 'var(--gold)' }}>twist</span>: past queries already fill the canyon.</>}
    >
      <div style={{ flex: 1, display: 'flex', gap: 28, alignItems: 'center', minHeight: 0 }}>
        <PlayerSidePanel showN nB={20} nC={2} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Saturation bars */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ padding: '18px 22px', borderRadius: 14, background: 'var(--glass-03)', border: '1px solid var(--glass-10)' }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.09em' }}>INFORMATION ALREADY COLLECTED</div>
            {[
              { label: 'A vs B', n: 20, color: PB.color, pct: 91 },
              { label: 'A vs C', n: 2,  color: PC.color, pct: 9  },
            ].map((r, i) => (
              <div key={r.label} style={{ marginBottom: i === 0 ? 14 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: r.color }}>{r.label}</span>
                  <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{r.n} matches played</span>
                </div>
                <div style={{ height: 12, background: 'var(--glass-08)', borderRadius: 6, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${r.pct}%` }}
                    transition={{ type: 'spring', stiffness: 55, damping: 18, delay: 0.3 + i * 0.1 }}
                    style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${r.color}, ${r.color}88)` }}
                  />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {r.pct > 80 ? '⚠ Nearly saturated: diminishing returns' : '○ Mostly unexplored: high value'}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Formula without Δ² */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            style={{ padding: '18px 22px', borderRadius: 14, background: 'rgba(232,197,71,0.05)', border: '1px solid rgba(232,197,71,0.25)' }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.09em' }}>ACCUMULATED UNCERTAINTY (so far)</div>
            <MathFormula formula={String.raw`\phi_{Aj} \propto \frac{1}{n_{Aj} \cdot p_{Aj}(1-p_{Aj})}`} block style={{ fontSize: '2.1em' }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              {[
                { label: 'A vs B', expr: '1/(20 × 0.250)', val: '0.200', color: PB.color, win: false },
                { label: 'A vs C', expr: '1/(2 × 0.250)',  val: '2.000', color: PC.color, win: true  },
              ].map(r => (
                <div key={r.label} style={{
                  flex: 1, padding: '14px 16px', borderRadius: 12, textAlign: 'center',
                  background: r.win ? `${r.color}18` : 'var(--glass-03)',
                  border: `${r.win ? '2px' : '1px'} solid ${r.win ? r.color : 'var(--glass-08)'}`,
                  boxShadow: r.win ? `0 0 20px ${r.color}33` : 'none',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: r.color, marginBottom: 5 }}>{r.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{r.expr}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: r.win ? r.color : 'var(--text-secondary)', fontFamily: "'Space Grotesk', sans-serif" }}>{r.val}</div>
                  {r.win && <div style={{ fontSize: 12, color: r.color, fontWeight: 700, marginTop: 6, letterSpacing: '0.06em' }}>▲ 10× MORE UNCERTAIN</div>}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ padding: '14px 22px', borderRadius: 12, background: 'rgba(232,197,71,0.07)', border: '1.5px solid rgba(232,197,71,0.4)', textAlign: 'center' }}
          >
            <span style={{ fontSize: 21, fontWeight: 700, color: 'var(--gold)' }}>A vs C wins: </span>
            <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>only 2 past matches vs 20. But we're still missing one thing: does the gap size matter?</span>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 - now add Δ²: full φ formula, same winner but now explained properly
// φ(A,B) = 1/(20×0.25×50²)  = 1/12500 = 0.000080
// φ(A,C) = 1/(2×0.25×100²) = 1/5000  = 0.000200  (2.5× higher)
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair5() {
  return (
    <Shell label="MOST INFORMATIVE PAIR"
      title={<>Add <MathFormula formula="\Delta_{ij}^2" style={{ display: 'inline', fontSize: '0.9em' }} />: gap size also matters.</>}
    >
      <div style={{ flex: 1, display: 'flex', gap: 28, alignItems: 'center', minHeight: 0 }}>
        <PlayerSidePanel showN nB={20} nC={2} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>


          {/* Full formula */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 120, damping: 22 }}
            style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(232,197,71,0.05)', border: '1px solid rgba(232,197,71,0.25)' }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.1em' }}>FULL RELATIVE GAP UNCERTAINTY</div>
            <MathFormula
              formula={String.raw`\phi_{Aj} \propto \frac{1}{n_{Aj} \cdot p_{Aj}(1-p_{Aj}) \cdot \Delta_{Aj}^2}`}
              block style={{ fontSize: '2.1em' }}
            />
          </motion.div>

          {/* Computations */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            style={{ display: 'flex', gap: 14 }}
          >
            {[
              { label: 'A vs B', expr: '1/(20 × 0.250 × 50²)', denval: '= 1/12500', val: '0.000080', color: PB.color, win: false },
              { label: 'A vs C', expr: '1/(2 × 0.250 × 100²)', denval: '= 1/5000',  val: '0.000200', color: PC.color, win: true  },
            ].map((r, i) => (
              <motion.div key={r.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 140, damping: 20 }}
                style={{
                  flex: 1, padding: '16px 18px', borderRadius: 14, textAlign: 'center',
                  background: r.win ? `${r.color}18` : 'var(--glass-03)',
                  border: `${r.win ? '2px' : '1px'} solid ${r.win ? r.color : 'var(--glass-10)'}`,
                  boxShadow: r.win ? `0 0 22px ${r.color}33` : 'none',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: r.color, marginBottom: 6 }}>{r.label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{r.expr}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>{r.denval}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: r.win ? r.color : 'var(--text-secondary)', fontFamily: "'Space Grotesk', sans-serif" }}>{r.val}</div>
                {r.win && <div style={{ fontSize: 12, color: r.color, fontWeight: 700, marginTop: 6, letterSpacing: '0.06em' }}>▲ 2.5× HIGHER: PICK THIS</div>}
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
            style={{ padding: '14px 22px', borderRadius: 12, background: `${PC.color}12`, border: `1.5px solid ${PC.color}55`, textAlign: 'center' }}
          >
            <span style={{ fontSize: 21, fontWeight: 700, color: PC.color }}>A vs C still wins: </span>
            <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>the larger <MathFormula formula="\Delta^2{=}10000" style={{ display:'inline' }} /> in the denominator actually hurts C, but the tiny n=2 dominates. State-aware design.</span>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 - λ objective: step=0 shows max only, step=1 shows min max
// Arrow keys handled internally; passes through to App only when at boundary
// ══════════════════════════════════════════════════════════════════════════════
export function MostInformativePair6() {
  const [step, setStep] = useState(0); // 0=budget only, 1=+Fisher, 2=+objective(max), 3=+min-max

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (step < 3) { e.stopPropagation(); setStep(s => s + 1); }
      } else if (e.key === 'ArrowLeft') {
        if (step > 0) { e.stopPropagation(); setStep(s => s - 1); }
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [step]);

  const reasons = [
    {
      label: 'WHY THE MAX?',
      text: <>
        <MathFormula formula="\mathcal{C}" style={{ display: 'inline' }} /> is the candidate set of top-<MathFormula formula="M" style={{ display: 'inline' }} /> items;{' '}
        <MathFormula formula="w" style={{ display: 'inline' }} /> is the current estimated winner.
        We cannot declare a winner until <em>every</em> challenger is confidently beaten.
        The <MathFormula formula="\max" style={{ display: 'inline' }} /> finds the <strong style={{ color: 'var(--text-primary)' }}>most dangerous challenger</strong>: the bottleneck blocking us.
      </>,
    },
    {
      label: 'WHY THE MIN OVER λ?',
      text: <>
        We control how to split budget <MathFormula formula="B" style={{ display: 'inline' }} /> via <MathFormula formula="\lambda" style={{ display: 'inline' }} />.
        The <MathFormula formula="\arg\min" style={{ display: 'inline' }} /> finds the allocation that{' '}
        <strong style={{ color: 'var(--text-primary)' }}>minimises worst-case uncertainty</strong>,
        pouring budget into the hardest gap until all challengers are equally certain.
        Solving this convex SDP gives the optimal query schedule.
      </>,
    },
  ];
  const current = reasons[step];

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '18px 80px 30px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
      justifyContent: 'center',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>MOST INFORMATIVE PAIR</div>
        <h1 style={{ fontSize: 42, margin: 0, lineHeight: 1.2 }}>
          Now: what is the <span style={{ color: 'var(--gold)' }}>optimal allocation</span> across all pairs?
        </h1>
      </div>

      {/* Box 1: Budget intro - always shown */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '18px 28px', borderRadius: 16, background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.3)', flexShrink: 0 }}
      >
        <div style={{ fontSize: 22, lineHeight: 1.7, fontWeight: 500 }}>
          We know how to score a pair, but we have a <strong style={{ color: 'var(--cyan)' }}>budget <MathFormula formula="B" style={{ display: 'inline' }} /></strong>.
          We can split it across <em>all</em> pairs.
          Let <MathFormula formula="\lambda_{ij}" style={{ display: 'inline' }} /> = fraction of <MathFormula formula="B" style={{ display: 'inline' }} /> spent on pair <MathFormula formula="(i,j)" style={{ display: 'inline' }} />.
        </div>
      </motion.div>

      {/* Box 2: Fisher formula - revealed on step 1 */}
      {step >= 1 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '18px 28px', borderRadius: 16, background: 'rgba(232,197,71,0.05)', border: '1px solid rgba(232,197,71,0.25)', flexShrink: 0 }}
        >
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.1em' }}>ACCUMULATED FISHER INFORMATION WITH ALLOCATION</div>
          <MathFormula
            formula={String.raw`I(\theta;\lambda) = B\!\sum_{i<j} \lambda_{ij}\, p_{ij}(1-p_{ij})(e_i-e_j)(e_i-e_j)^\top`}
            block style={{ fontSize: '2.1em' }}
          />
          <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 12 }}>
            <MathFormula formula="\lambda \in \Delta_{\binom{\mathcal{C}}{2}}" style={{ display: 'inline' }} />
            <span style={{ marginLeft: 12 }}>— probability simplex over all pairs from <MathFormula formula="\mathcal{C}" style={{ display: 'inline' }} /></span>
          </div>
        </motion.div>
      )}

      {/* Box 3: max objective - revealed on step 2 */}
      {step >= 2 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '22px 28px', borderRadius: 16,
            background: 'rgba(232,197,71,0.08)', border: '2px solid rgba(232,197,71,0.45)',
            display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--gold)', letterSpacing: '0.1em', fontWeight: 700 }}>
            {step === 2 ? 'STEP 1 — THE MAX: WORST-CASE CHALLENGER' : 'FULL OBJECTIVE — MIN MAX'}
          </div>
          <MathFormula
            formula={
              step === 2
                ? String.raw`\max_{j \in \mathcal{C} \setminus \{w\}}\; \frac{(e_w-e_j)^\top I(\theta;\lambda)^{-1}(e_w-e_j)}{\Delta_{wj}^2}`
                : String.raw`\lambda^* = \arg\min_{\lambda \in \Delta_{\binom{\mathcal{C}}{2}}} \;\max_{j \in \mathcal{C} \setminus \{w\}}\; \frac{(e_w-e_j)^\top I(\theta;\lambda)^{-1}(e_w-e_j)}{\Delta_{wj}^2}`
            }
            block style={{ fontSize: '2.1em' }}
          />
          <div style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.3)' }}>
            <div style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>
              {step === 2 ? reasons[0].label : reasons[1].label}
            </div>
            <div style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {step === 2 ? reasons[0].text : reasons[1].text}
            </div>
          </div>
          {step === 3 && (
            <div style={{ fontSize: 19, color: 'var(--gold)', fontWeight: 600 }}>
              Solve this convex SDP → <MathFormula formula="\lambda^*" style={{ display: 'inline', color: 'var(--gold)' }} /> tells us exactly how to allocate every query.
            </div>
          )}
        </motion.div>
      )}

      {step < 3 && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>→ press arrow to continue</div>
      )}
    </div>
  );
}




// ─────────────────────────────────────────────────────────────────────────────
// GOptimalitySlide - large-font step-by-step worked example
// Each step shows only what's needed - big, readable, with slide-in transitions
// ─────────────────────────────────────────────────────────────────────────────
export function GOptimalitySlide() {
  const [step, setStep] = useState(0);
  const TOTAL = 5;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!['ArrowRight', ' '].includes(e.key)) return;
      setStep(s => {
        if (s < TOTAL) { e.stopPropagation(); return s + 1; }
        return s;
      });
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, []);

  const GOLD  = 'var(--gold)';
  const CYAN  = 'var(--cyan)';
  const RED   = '#ef5350';
  const GREEN = '#66bb6a';
  const PURP  = '#ce93d8';
  const ORG   = '#ffab40';

  const IN = { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring' as const, stiffness: 180, damping: 22 } };
  const IN2 = (d: number) => ({ initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring' as const, stiffness: 180, damping: 22, delay: d } });

  const stepTitles = [
    <>Setup: 3 LLMs, budget <span style={{ color: CYAN }}>B = 100</span></>,
    <>Step 1 — Encode each pair as <span style={{ color: PURP }}>z = e_i − e_j</span></>,
    <>Step 2 — Build <span style={{ color: GOLD }}>I(θ; λ)</span> from rank-1 pieces</>,
    <>Step 3 — Compute danger <MathFormula formula="\varphi = \sigma^2 / \Delta^2" style={{ display: 'inline', color: RED }} /></>,
    <>Step 4 — Solve for <span style={{ color: GOLD }}>λ*</span></>,
    <>Key insight: λ* <span style={{ color: GREEN }}>equalises φ</span> across challengers</>,
  ];

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '22px 72px 22px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{ flexShrink: 0, marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 6, color: GOLD, fontSize: 13 }}>WORKED EXAMPLE</div>
        <motion.h1 key={`t${step}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          style={{ fontSize: 38, margin: 0, lineHeight: 1.15 }}>
          {stepTitles[step]}
        </motion.h1>
      </div>

      {/* ─── STEP 0: Setup ─── */}
      {step === 0 && (
        <motion.div key="s0" {...IN}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>

          {/* 3 LLM cards - big */}
          <div style={{ display: 'flex', gap: 20 }}>
            {([
              { name: 'Fable 5', role: 'w  (winner?)', score: String.raw`\theta^*_w = 1.00`, color: GREEN },
              { name: 'GPT-5.6', role: 'j = 1', score: String.raw`\theta^*_1 = 0.95`, color: GOLD },
              { name: 'Kimi K3', role: 'j = 2', score: String.raw`\theta^*_2 = 0.72`, color: CYAN },
            ] as {name:string;role:string;score:string;color:string}[]).map((m, i) => (
              <motion.div key={m.name} {...IN2(i * 0.08)}
                style={{ flex: 1, padding: '24px 28px', borderRadius: 18,
                  background: `${m.color}0e`, border: `2px solid ${m.color}77`,
                  display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: m.color, fontFamily: "'Space Grotesk',sans-serif" }}>{m.name}</div>
                <div style={{ fontSize: 15, color: `${m.color}cc`, fontWeight: 600 }}>{m.role}</div>
                <MathFormula formula={m.score} block style={{ fontSize: '2em' }} />
              </motion.div>
            ))}
          </div>

          {/* Gaps - big */}
          <div style={{ display: 'flex', gap: 20 }}>
            <motion.div {...IN2(0.25)} style={{ flex: 1, padding: '20px 28px', borderRadius: 16, background: `${RED}0a`, border: `2px solid ${RED}55` }}>
              <div style={{ fontSize: 13, color: RED, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>GAP TO GPT-5.6</div>
              <MathFormula formula={String.raw`\Delta_{w,1} = 1.00 - 0.95 = \mathbf{0.05}`} block style={{ fontSize: '1.8em' }} />
              <div style={{ fontSize: 16, color: RED, marginTop: 10 }}>Tiny — hard to confirm Fable 5 wins</div>
            </motion.div>
            <motion.div {...IN2(0.35)} style={{ flex: 1, padding: '20px 28px', borderRadius: 16, background: `${GREEN}08`, border: `2px solid ${GREEN}55` }}>
              <div style={{ fontSize: 13, color: GREEN, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>GAP TO KIMI K3</div>
              <MathFormula formula={String.raw`\Delta_{w,2} = 1.00 - 0.72 = \mathbf{0.28}`} block style={{ fontSize: '1.8em' }} />
              <div style={{ fontSize: 16, color: GREEN, marginTop: 10 }}>Large — Fable 5 clearly ahead</div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ─── STEP 1: z vectors ─── */}
      {step === 1 && (
        <motion.div key="s1" {...IN}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>

          <motion.div {...IN2(0)} style={{ padding: '16px 28px', borderRadius: 14, background: `${PURP}0a`, border: `1px solid ${PURP}44` }}>
            <div style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              Each comparison is a vector{' '}
              <MathFormula formula="z = e_i - e_j \in \mathbb{R}^3" style={{ display: 'inline' }} />{' '}
              encoding <em>which pair</em> is queried.
              The true quality gap is{' '}
              <MathFormula formula="z^\top\theta^* = \theta^*_i - \theta^*_j" style={{ display: 'inline' }} />.
              We observe a noisy binary comparison — who wins — and update our estimate of <MathFormula formula="\theta^*" style={{ display: 'inline' }} />.
            </div>
          </motion.div>

          <div style={{ display: 'flex', gap: 16 }}>
            {([
              { pair: 'Fable\\ 5\\ \\text{vs}\\ \\text{GPT-5.6}',
                zTex: String.raw`z_{12} = e_1 - e_2 = \begin{bmatrix}1\\-1\\0\end{bmatrix}`,
                f1: String.raw`z^\top\theta^* = 1.00 - 0.95 = 0.05`,
                f2: String.raw`p_{12} = \sigma(0.05) = 0.513`,
                f3: String.raw`p_{12}(1-p_{12}) = 0.250`,
                color: RED },
              { pair: 'Fable\\ 5\\ \\text{vs}\\ \\text{Kimi}',
                zTex: String.raw`z_{13} = e_1 - e_3 = \begin{bmatrix}1\\0\\-1\end{bmatrix}`,
                f1: String.raw`z^\top\theta^* = 1.00 - 0.72 = 0.28`,
                f2: String.raw`p_{13} = \sigma(0.28) = 0.570`,
                f3: String.raw`p_{13}(1-p_{13}) = 0.245`,
                color: GREEN },
              { pair: '\\text{GPT-5.6}\\ \\text{vs}\\ \\text{Kimi}',
                zTex: String.raw`z_{23} = e_2 - e_3 = \begin{bmatrix}0\\1\\-1\end{bmatrix}`,
                f1: String.raw`z^\top\theta^* = 0.95 - 0.72 = 0.23`,
                f2: String.raw`p_{23} = \sigma(0.23) = 0.557`,
                f3: String.raw`p_{23}(1-p_{23}) = 0.247`,
                color: ORG },
            ] as {pair:string;zTex:string;f1:string;f2:string;f3:string;color:string}[]).map((r, i) => (
              <motion.div key={i} {...IN2(i * 0.1)}
                style={{ flex: 1, padding: '22px 20px', borderRadius: 16,
                  background: `${r.color}0a`, border: `2px solid ${r.color}55`,
                  display: 'flex', flexDirection: 'column', gap: 14 }}>
                <MathFormula formula={r.zTex} block style={{ fontSize: '1.45em' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 10, background: `${r.color}0d`, border: `1px solid ${r.color}33` }}>
                  <MathFormula formula={r.f1} block style={{ fontSize: '1.15em', color: r.color }} />
                  <MathFormula formula={r.f2} block style={{ fontSize: '1.15em' }} />
                  <MathFormula formula={r.f3} block style={{ fontSize: '1.2em', color: r.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── STEP 2: Build I ─── */}
      {step === 2 && (
        <motion.div key="s2" {...IN}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>

          <motion.div {...IN2(0)} style={{ padding: '16px 26px', borderRadius: 14, background: `${GOLD}07`, border: `1px solid ${GOLD}44`, flexShrink: 0 }}>
            <div style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 12 }}>
              <MathFormula formula="I(\theta;\lambda)" style={{ display: 'inline' }} /> is the{' '}
              <strong style={{ color: GOLD }}>accumulated Fisher information matrix</strong> — it tracks how much we know about the score vector{' '}
              <MathFormula formula="\theta^*" style={{ display: 'inline' }} /> after all queries.
              Its inverse <MathFormula formula="I^{-1}" style={{ display: 'inline' }} /> is the Cramér-Rao lower bound on estimation error.
              Larger <MathFormula formula="I" style={{ display: 'inline' }} /> means less uncertainty.
            </div>
            <MathFormula
              formula={String.raw`I(\theta;\lambda) = B \sum_{i<j} \lambda_{ij}\,p_{ij}(1-p_{ij})\,(e_i-e_j)(e_i-e_j)^\top \qquad \bigl[\lambda_{ij} = \tfrac{1}{3}\ \forall\ (i,j)\bigr]`}
              block style={{ fontSize: '1.45em' }} />
          </motion.div>

          <div style={{ display: 'flex', gap: 14, flex: 1 }}>
            {([
              { title: String.raw`(w,1)\;:\;\lambda=\tfrac{1}{3},\; p(1-p)=0.250`, color: RED,
                f1: String.raw`100 \cdot \tfrac{1}{3} \cdot 0.250 \cdot \begin{bmatrix}1\\-1\\0\end{bmatrix}\!\begin{bmatrix}1&-1&0\end{bmatrix}`,
                f2: String.raw`= 8.33\begin{bmatrix}{\phantom{-}}1&-1&{\phantom{-}}0\\-1&{\phantom{-}}1&{\phantom{-}}0\\{\phantom{-}}0&{\phantom{-}}0&{\phantom{-}}0\end{bmatrix}` },
              { title: String.raw`(w,2)\;:\;\lambda=\tfrac{1}{3},\; p(1-p)=0.245`, color: GREEN,
                f1: String.raw`100 \cdot \tfrac{1}{3} \cdot 0.245 \cdot \begin{bmatrix}1\\0\\-1\end{bmatrix}\!\begin{bmatrix}1&0&-1\end{bmatrix}`,
                f2: String.raw`= 8.17\begin{bmatrix}{\phantom{-}}1&{\phantom{-}}0&-1\\{\phantom{-}}0&{\phantom{-}}0&{\phantom{-}}0\\-1&{\phantom{-}}0&{\phantom{-}}1\end{bmatrix}` },
              { title: String.raw`(1,2)\;:\;\lambda=\tfrac{1}{3},\; p(1-p)=0.247`, color: ORG,
                f1: String.raw`100 \cdot \tfrac{1}{3} \cdot 0.247 \cdot \begin{bmatrix}0\\1\\-1\end{bmatrix}\!\begin{bmatrix}0&1&-1\end{bmatrix}`,
                f2: String.raw`= 8.22\begin{bmatrix}0&{\phantom{-}}0&{\phantom{-}}0\\0&{\phantom{-}}1&-1\\0&-1&{\phantom{-}}1\end{bmatrix}` },
            ] as {title:string;color:string;f1:string;f2:string}[]).map((r, i) => (
              <motion.div key={r.title} {...IN2(0.1 + i * 0.12)}
                style={{ flex: 1, padding: '16px 16px', borderRadius: 14,
                  background: `${r.color}0a`, border: `2px solid ${r.color}55`,
                  display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MathFormula formula={r.title} block style={{ fontSize: '1.1em', color: r.color }} />
                <MathFormula formula={r.f1} block style={{ fontSize: '1.05em' }} />
                <MathFormula formula={r.f2} block style={{ fontSize: '1.05em' }} />
              </motion.div>
            ))}
          </div>

          <motion.div {...IN2(0.45)}
            style={{ padding: '14px 24px', borderRadius: 14, background: 'var(--glass-05)', border: '1px solid var(--glass-14)', display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', flexShrink: 0 }}>Sum all three →</div>
            <MathFormula
              formula={String.raw`I = \begin{bmatrix}16.50 & -8.33 & -8.17\\-8.33 & 16.55 & -8.22\\-8.17 & -8.22 & 16.40\end{bmatrix}`}
              block style={{ fontSize: '1.35em' }} />
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Off-diagonals = <strong style={{ color: GOLD }}>transitivity</strong>:<br />
              querying (Fable, GPT) indirectly informs (GPT, Kimi).
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── STEP 3: Compute φ ─── */}
      {step === 3 && (
        <motion.div key="s3" {...IN}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>

          <motion.div {...IN2(0)} style={{ padding: '14px 24px', borderRadius: 14, background: 'var(--glass-04)', border: '1px solid var(--glass-14)', display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
            <MathFormula formula={String.raw`\varphi_{wj} = \frac{(e_w-e_j)^\top I^{-1}(e_w-e_j)}{\Delta_{wj}^2}`} block style={{ fontSize: '1.9em', flexShrink: 0 }} />
            <div style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: GOLD }}>Danger score</strong> — how many times the CI width spans the gap.<br />
              φ ≫ 1 means we can't confirm the winner. φ ≈ 1 means we're confident.
            </div>
          </motion.div>

          <motion.div {...IN2(0.15)}
            style={{ padding: '20px 28px', borderRadius: 16, background: `${RED}0e`, border: `2px solid ${RED}` }}>
            <div style={{ fontSize: 14, color: RED, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>CHALLENGER j=1: GPT-5.6</div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <MathFormula
                formula={String.raw`\varphi_{w,1} = \frac{[1,-1,0]\; I^{-1}\; [1,-1,0]^\top}{0.05^2} = \frac{0.0805}{0.0025}`}
                block style={{ fontSize: '1.55em', flex: 1 }} />
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: RED, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>32.2</div>
                <div style={{ fontSize: 14, color: RED, marginTop: 6 }}>CI is 32× wider than the gap — catastrophic</div>
              </div>
            </div>
          </motion.div>

          <motion.div {...IN2(0.28)}
            style={{ padding: '20px 28px', borderRadius: 16, background: `${GREEN}08`, border: `2px solid ${GREEN}` }}>
            <div style={{ fontSize: 14, color: GREEN, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>CHALLENGER j=2: KIMI K3</div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <MathFormula
                formula={String.raw`\varphi_{w,2} = \frac{[1,0,-1]\; I^{-1}\; [1,0,-1]^\top}{0.28^2} = \frac{0.0812}{0.0784}`}
                block style={{ fontSize: '1.55em', flex: 1 }} />
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: GREEN, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>1.04</div>
                <div style={{ fontSize: 14, color: GREEN, marginTop: 6 }}>Already safe — CI ≈ gap width</div>
              </div>
            </div>
          </motion.div>

          <motion.div {...IN2(0.42)} style={{ padding: '14px 24px', borderRadius: 12, background: `${RED}0a`, border: `1px solid ${RED}44`, flexShrink: 0 }}>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Both <MathFormula formula="\sigma^2" style={{ display:'inline' }} /> are nearly identical (0.080 vs 0.081) — yet <MathFormula formula="\varphi" style={{ display:'inline' }} /> differs by <strong style={{ color: RED }}>31×</strong>.
              <strong style={{ color: GOLD }}> Worst-case <MathFormula formula="\varphi = \max(32.2,\, 1.04) = 32.2" style={{ display:'inline', color: GOLD }} />.</strong> Budget is wasted on Kimi.
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── STEP 4: Optimal λ* ─── */}
      {step === 4 && (
        <motion.div key="s4" {...IN}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>

          <motion.div {...IN2(0)} style={{ padding: '18px 28px', borderRadius: 16, background: `${GOLD}08`, border: `2px solid ${GOLD}55`, flexShrink: 0 }}>
            <div style={{ fontSize: 14, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>OBJECTIVE — SOLVE FOR λ*</div>
            <MathFormula
              formula={String.raw`\lambda^* = \arg\min_{\lambda \in \Delta} \;\max_{j \in \{1,2\}}\; \frac{(e_w-e_j)^\top I(\theta;\lambda)^{-1}(e_w-e_j)}{\Delta_{wj}^2}`}
              block style={{ fontSize: '1.7em' }} />
          </motion.div>

          <div style={{ display: 'flex', gap: 20, flex: 1 }}>
            <motion.div {...IN2(0.15)} style={{ flex: 1, padding: '22px 26px', borderRadius: 16, background: `${GOLD}0a`, border: `1px solid ${GOLD}44` }}>
              <div style={{ fontSize: 14, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>SOLUTION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {([
                  { lbl: 'λ*(Fable 5, GPT-5.6)', val: '0.95', note: '← 95 queries', color: GOLD, big: true },
                  { lbl: 'λ*(Fable 5, Kimi K3)', val: '0.03', note: '← 3 queries',  color: 'var(--text-secondary)', big: false },
                  { lbl: 'λ*(GPT-5.6, Kimi K3)', val: '0.02', note: '← 2 queries',  color: 'var(--text-secondary)', big: false },
                ] as {lbl:string;val:string;note:string;color:string;big:boolean}[]).map(row => (
                  <div key={row.lbl} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontFamily: 'monospace', flex: 1 }}>{row.lbl}</div>
                    <div style={{ fontSize: row.big ? 32 : 22, fontWeight: 900, color: row.color, fontFamily: "'Space Grotesk',sans-serif" }}>{row.val}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{row.note}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...IN2(0.25)} style={{ flex: 1.3, padding: '22px 26px', borderRadius: 16, background: 'var(--glass-04)', border: '1px solid var(--glass-14)' }}>
              <div style={{ fontSize: 14, color: CYAN, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>BEFORE vs AFTER</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: RED, fontWeight: 600, marginBottom: 12 }}>Uniform <MathFormula formula="\lambda = \tfrac{1}{3}" style={{ display:'inline' }} /></div>
                  <div style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 2.2 }}>
                    φ(Fable, GPT): <strong style={{ color: RED, fontSize: 22 }}>32.2</strong><br />
                    φ(Fable, Kimi): <strong style={{ color: GREEN, fontSize: 22 }}>1.04</strong><br />
                    <span style={{ color: RED, fontSize: 16 }}>worst = 32.2</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, color: GOLD, fontWeight: 900 }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: GREEN, fontWeight: 600, marginBottom: 12 }}>Optimal λ*</div>
                  <div style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 2.2 }}>
                    φ(Fable, GPT): <strong style={{ color: GREEN, fontSize: 22 }}>16.6</strong><br />
                    φ(Fable, Kimi): <strong style={{ color: GREEN, fontSize: 22 }}>10.5</strong><br />
                    <span style={{ color: GREEN, fontSize: 16 }}>worst = 16.6 ↓ 48%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div {...IN2(0.35)} style={{ padding: '14px 24px', borderRadius: 12, background: `${CYAN}08`, border: `1px solid ${CYAN}33`, flexShrink: 0 }}>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: CYAN }}>Why 95% on (Fable 5, GPT-5.6)?</strong>{' '}
              Gap <MathFormula formula="\Delta_{\text{Fable,GPT}}=0.05" style={{ display:'inline' }} /> is tiny — any <MathFormula formula="\sigma^2" style={{ display:'inline' }} /> creates huge <MathFormula formula="\varphi" style={{ display:'inline' }} />.
              Concentrating budget on this pair is the only way to reduce worst-case <MathFormula formula="\varphi" style={{ display:'inline' }} />. The solver finds this automatically.
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── STEP 5: Key insight ─── */}
      {step === 5 && (
        <motion.div key="s5" {...IN}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>

          {/* Bar chart - large */}
          <motion.div {...IN2(0)} style={{ padding: '22px 28px', borderRadius: 18, background: 'var(--glass-04)', border: '1px solid var(--glass-14)' }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>φ VALUES — UNIFORM λ vs OPTIMAL λ*</div>
            <div style={{ display: 'flex', gap: 40 }}>
              {([
                { lbl: 'φ(Fable 5, GPT-5.6)', uniform: 32.2, opt: 16.6, color: RED },
                { lbl: 'φ(Fable 5, Kimi K3)', uniform: 1.04, opt: 10.5, color: GREEN },
              ] as {lbl:string;uniform:number;opt:number;color:string}[]).map(b => (
                <div key={b.lbl} style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, color: b.color, fontWeight: 700, marginBottom: 12 }}>{b.lbl}</div>
                  {([
                    { name: 'Uniform λ=⅓', val: b.uniform, c: RED },
                    { name: 'Optimal λ*',  val: b.opt,     c: GREEN },
                  ] as {name:string;val:number;c:string}[]).map(row => (
                    <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', width: 100, flexShrink: 0 }}>{row.name}</div>
                      <div style={{ flex: 1, height: 28, background: 'var(--glass-08)', borderRadius: 6, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${Math.min(row.val / 35 * 100, 100)}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          style={{ height: '100%', background: row.c, borderRadius: 6 }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: row.c, width: 48, textAlign: 'right', flexShrink: 0 }}>{row.val}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...IN2(0.2)} style={{ padding: '20px 26px', borderRadius: 16, background: `${GREEN}08`, border: `2px solid ${GREEN}44` }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>⚖️</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 6 }}>λ* balances φ — pours budget into the hardest pair</div>
                <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Uniform <MathFormula formula="\lambda" style={{display:'inline'}} />: <MathFormula formula="\varphi(\text{Fable},\text{GPT})=32.2" style={{display:'inline'}} />, <MathFormula formula="\varphi(\text{Fable},\text{Kimi})=1.04" style={{display:'inline'}} /> — wildly imbalanced.
                  Optimal <MathFormula formula="\lambda^*" style={{display:'inline'}} />: <MathFormula formula="\varphi(\text{Fable},\text{GPT})=16.6" style={{display:'inline'}} />, <MathFormula formula="\varphi(\text{Fable},\text{Kimi})=10.5" style={{display:'inline'}} /> — worst-case drops 48%.
                  The solver keeps querying the dangerous pair until all challengers are equally resolved.
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div {...IN2(0.35)} style={{ padding: '20px 26px', borderRadius: 16, background: `${GOLD}08`, border: `2px solid ${GOLD}44` }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>🎯</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, marginBottom: 6 }}>G-optimal would miss this entirely</div>
                <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  G-optimal sees <MathFormula formula="\sigma^2{=}0.080" style={{ display:'inline' }} /> vs <MathFormula formula="0.081" style={{ display:'inline' }} /> — nearly equal — and treats both challengers the same.
                  Our objective sees φ=32.2 vs φ=1.04 and focuses where it actually matters.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {step < TOTAL && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', flexShrink: 0, marginTop: 8 }}>
          → press arrow to continue &nbsp; ({step + 1} / {TOTAL + 1})
        </div>
      )}
    </div>
  );
}
