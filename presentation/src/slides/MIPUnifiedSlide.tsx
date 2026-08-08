import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

const ML = (f: string) => (
  <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />
);

// ── Python-verified constants ─────────────────────────────────────────────────
// Example 1: θ=[1.00, 0.80, 0.60, 0.40]
// Chain: 30 F-G + 30 G-K + 30 K-L, underplayed: 2 F-K + 2 F-L + 2 G-L
// Scalar f values (all near equal — blind to transitivity)
const F_FG = 0.2475; // f Fable-GPT  Δ=0.20
const F_FK = 0.2403; // f Fable-Kimi Δ=0.40
const F_FL = 0.2139; // f Fable-Llama Δ=0.60
const F_GK = 0.2475; // f GPT-Kimi Δ=0.20
// φ₁ values — G-opt picks Llama (most uncertain despite chain helping it)
const EX1_PHI1_GPT   = 0.1212;  // most-played adjacent pair → already well known
const EX1_PHI1_KIMI  = 0.2123;
const EX1_PHI1_LLAMA = 0.2984;  // G-optimal picks this ← chain exploited

// Example 2: θ=[1.00, 0.85, 0.60, 0.10]
// Setup: 20 F-G + 20 G-K + 40 K-L (chain) + 10 F-K + 4 F-L + 20 G-L
// (F-L fewest games — audience says "play F-L!" G-opt agrees, WiSDoM doesn't)
const EX2_PHI1_GPT   = 0.1365;  // close threat, few F-G games
const EX2_PHI1_KIMI  = 0.1661;
const EX2_PHI1_LLAMA = 0.1877;  // G-opt picks this (big φ₁) but Δ=0.90 — already safe!
// φ = φ₁/Δ²
const EX2_PHI_GPT   = 6.06;    // Δ=0.15 → REAL threat (small gap!)
const EX2_PHI_KIMI  = 0.82;    // Δ=0.45
const EX2_PHI_LLAMA = 0.23;    // Δ=0.90 → large CI but already safe
const EX2_DELTA_GPT   = 0.15;
const EX2_DELTA_KIMI  = 0.45;
const EX2_DELTA_LLAMA = 0.90;
const EX2_CI_GPT   = 0.7268;   // 1.96*sqrt(phi1)
const EX2_CI_KIMI  = 0.7993;
const EX2_CI_LLAMA = 0.8488;

// Budget-bar keyframes (4-player, Python-verified)
// Prior: 30 Fable-Kimi + 30 Kimi-GPT. Add B=50 more queries.
// Optimal λ*: 91% Fable-GPT + 9% Fable-Llama (non-obvious - Fable-GPT is obvious, but Llama needs some too)
// normCI = CI_hw / Δ. Capped at 12.5 for display (Llama starts at ∞).
const KEYFRAMES = [
  { lamFL: 0.000, lamFG: 0.650, phi_gpt: 1.99, phi_kimi: 0.41, phi_llama: 25.00, normCI_gpt: 2.77, normCI_kimi: 1.25, normCI_llama: 12.50 },
  { lamFL: 0.017, lamFG: 0.639, phi_gpt: 2.02, phi_kimi: 0.41, phi_llama:  8.59, normCI_gpt: 2.78, normCI_kimi: 1.26, normCI_llama:  5.75 },
  { lamFL: 0.035, lamFG: 0.627, phi_gpt: 2.04, phi_kimi: 0.41, phi_llama:  4.17, normCI_gpt: 2.80, normCI_kimi: 1.26, normCI_llama:  4.00 },
  { lamFL: 0.052, lamFG: 0.616, phi_gpt: 2.07, phi_kimi: 0.42, phi_llama:  2.81, normCI_gpt: 2.82, normCI_kimi: 1.27, normCI_llama:  3.29 },
  { lamFL: 0.070, lamFG: 0.604, phi_gpt: 2.09, phi_kimi: 0.42, phi_llama:  2.09, normCI_gpt: 2.84, normCI_kimi: 1.27, normCI_llama:  2.83 },
  { lamFL: 0.087, lamFG: 0.593, phi_gpt: 2.12, phi_kimi: 0.42, phi_llama:  1.68, normCI_gpt: 2.85, normCI_kimi: 1.28, normCI_llama:  2.54 },
];

// SDP final result (3-player Fable/GPT/Kimi)
const SDP_LAM_GPT  = 96.8; const SDP_PHI_GPT_OPT  = 16.41;
const SDP_PHI_KIMI_OPT = 16.34; const SDP_WORST_UNIFORM = 32.19;
const SDP_WORST_OPT = 16.41; const SDP_IMPROVEMENT = 49;

// ── Step map ──────────────────────────────────────────────────────────────────
// step 0 → sub 0      : Setup — 4 players, match counts, 1 query left
// step 1 → sub 0      : Scalar f fails — all ≈ 0.24, blind to transitivity
// step 2 → sub 0,1,2  : G-optimality (φ₁) — exploits transitivity (Example 1)
// step 3 → sub 0,1,2  : G-optimality fails — ignores Δ (Example 2)
// step 4 → sub 0,1,2  : Fix: divide by Δ² → φ = φ₁/Δ²
// step 5 → sub 0      : Full SDP objective
const MAX_SUBS: Record<number, number> = { 0: 0, 1: 0, 2: 2, 3: 3, 4: 2, 5: 0 };

// ── Shared helpers ────────────────────────────────────────────────────────────
function Label({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
      {text}
    </div>
  );
}

function PlayerChip({ name, theta, color, role, dim }: {
  name: string; theta: string; color: string; role?: string; dim?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      padding: '12px 18px', borderRadius: 14, minWidth: 130, opacity: dim ? 0.35 : 1,
      background: `${color}15`, border: `2px solid ${color}${dim ? '44' : '88'}`, transition: 'all 0.4s',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#0a0a0f' }}>
        {name[0]}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'Space Grotesk',sans-serif" }}>{name}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{ML(`\\theta=${theta}`)}</div>
      {role && <div style={{ fontSize: 12, color, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: `${color}22` }}>{role}</div>}
    </div>
  );
}

// ── Step 0 - Setup: players + match history + 1 query ────────────────────────
function Step0() {
  const chainPairs = [
    { label: 'Fable–GPT',   n: 30, colorA: '#e8c547', colorB: '#ef5350' },
    { label: 'GPT–Kimi',    n: 30, colorA: '#ef5350',  colorB: '#66bb6a' },
    { label: 'Kimi–Llama',  n: 30, colorA: '#66bb6a',  colorB: '#78909c' },
  ];
  const sparePairs = [
    { label: 'Fable–Kimi',  n: 2, colorA: '#e8c547', colorB: '#66bb6a' },
    { label: 'Fable–Llama', n: 2, colorA: '#e8c547', colorB: '#78909c' },
    { label: 'GPT–Llama',   n: 2, colorA: '#ef5350',  colorB: '#78909c' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28, justifyContent: 'center', alignItems: 'center' }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.1 }}>
          You have <span style={{ color: 'var(--gold)' }}>1 query</span> left.
        </div>
        <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 10 }}>
          4 LLMs. Budget nearly spent. Which pair is most informative?
        </div>
      </motion.div>

      {/* Players */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: 20 }}>
        <PlayerChip name="Fable 5"  theta="1.00" color="#e8c547" role="Leader (winner?)" />
        <PlayerChip name="GPT-5.6"  theta="0.80" color="#ef5350" role="Challenger" />
        <PlayerChip name="Kimi K3"  theta="0.60" color="#66bb6a" role="Challenger" />
        <PlayerChip name="Llama 4"  theta="0.40" color="#78909c" role="Challenger" />
      </motion.div>

      {/* Match history */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Chain pairs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 2 }}>Well-played (chain)</div>
          {chainPairs.map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderRadius: 12, background: 'rgba(79,195,247,0.07)', border: '1.5px solid rgba(79,195,247,0.25)' }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--cyan)', fontFamily: "'Space Grotesk',sans-serif", minWidth: 44 }}>{p.n}</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>
                <span style={{ color: p.colorA }}>{p.label.split('–')[0]}</span>
                <span style={{ color: 'var(--text-muted)' }}> – </span>
                <span style={{ color: p.colorB }}>{p.label.split('–')[1]}</span>
              </span>
              <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>games</span>
            </div>
          ))}
        </div>

        <div style={{ alignSelf: 'center', fontSize: 32, color: 'var(--glass-25)', padding: '0 4px' }}>+</div>

        {/* Sparse pairs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 2 }}>Rarely played</div>
          {sparePairs.map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderRadius: 12, background: 'rgba(232,197,71,0.06)', border: '1.5px solid rgba(232,197,71,0.2)' }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--gold)', fontFamily: "'Space Grotesk',sans-serif", minWidth: 44 }}>{p.n}</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>
                <span style={{ color: p.colorA }}>{p.label.split('–')[0]}</span>
                <span style={{ color: 'var(--text-muted)' }}> – </span>
                <span style={{ color: p.colorB }}>{p.label.split('–')[1]}</span>
              </span>
              <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>games</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Question */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
        style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', padding: '14px 32px', borderRadius: 12, background: 'rgba(232,197,71,0.1)', border: '1.5px solid rgba(232,197,71,0.4)', textAlign: 'center' }}>
        Obvious answer: play <span style={{ color: '#e8c547' }}>Fable–Kimi</span> or <span style={{ color: '#78909c' }}>Fable–Llama</span> — they've barely played!
      </motion.div>
    </div>
  );
}

// ── Step 1 - Scalar f fails ───────────────────────────────────────────────────
function Step1({ sub: _sub }: { sub: number }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28, justifyContent: 'center' }}>
      <Label text="Naïve approach: scalar Fisher information per game" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ textAlign: 'center' }}>
        <MathFormula formula="f_{ij} = p_{ij}(1 - p_{ij})" block style={{ fontSize: '2.4em' }} />
        <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 10 }}>
          How much information does one game between <em>i</em> and <em>j</em> carry?
        </div>
      </motion.div>

      {/* Big f-value boxes */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: 14 }}>
        {[
          { label: 'Fable–GPT',   f: F_FG, color: '#ef5350', sub: '30 games', dim: false },
          { label: 'Fable–Kimi',  f: F_FK, color: '#66bb6a', sub: '2 games',  dim: false },
          { label: 'Fable–Llama', f: F_FL, color: '#78909c', sub: '2 games',  dim: false },
          { label: 'GPT–Kimi',    f: F_GK, color: '#4fc3f7', sub: '30 games', dim: false },
        ].map(r => (
          <div key={r.label} style={{
            flex: 1, padding: '24px 14px', borderRadius: 16, textAlign: 'center',
            background: 'var(--glass-04)', border: '2px solid var(--glass-08)',
            minWidth: 0, overflow: 'hidden',
          }}>
            <div style={{ fontSize: 18, color: r.color, fontWeight: 700, marginBottom: 6 }}>{r.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{r.sub}</div>
            <MathFormula formula={`f = ${r.f}`} block style={{ fontSize: '2em' }} />
          </div>
        ))}
      </motion.div>

      {/* Punchline */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ padding: '16px 28px', borderRadius: 14, background: 'rgba(239,83,80,0.08)', border: '2px solid rgba(239,83,80,0.4)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, color: '#ef9a9a', fontWeight: 700 }}>
          All pairs score ≈ 0.24 — scalar <em>f</em> is blind to how many games were already played.
        </div>
        <div style={{ fontSize: 17, color: 'var(--text-secondary)', marginTop: 8 }}>
          It cannot see that 30+30+30 games along the chain <em>already tell us</em> something about the underplayed pairs.
        </div>
      </motion.div>
    </div>
  );
}

// ── Step 2 - G-optimality exploits transitivity (Example 1) ─────────────────
function Step2({ sub }: { sub: number }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, justifyContent: 'center' }}>
      <Label text="Fisher Information + G-Optimality: capturing transitivity" />

      {/* Fisher matrix + φ₁ formula */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ padding: '18px 28px', borderRadius: 16, background: 'rgba(232,197,71,0.06)', border: '1.5px solid rgba(232,197,71,0.3)', textAlign: 'center' }}>
        <MathFormula formula={String.raw`I(\theta;\lambda) = B\!\sum_{i<j}\lambda_{ij}\,p_{ij}(1-p_{ij})\,(e_i-e_j)(e_i-e_j)^\top`} block style={{ fontSize: '1.85em' }} />
        <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
          Encodes the full history — the 30+30+30 chain propagates transitivity through the matrix
        </div>
      </motion.div>

      {/* Cramér-Rao + G-optimality */}
      {sub >= 1 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
          <div style={{ flex: 1, padding: '18px 24px', borderRadius: 16, background: 'rgba(79,195,247,0.06)', border: '1.5px solid rgba(79,195,247,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>CRAMÉR-RAO BOUND</div>
            <MathFormula formula={String.raw`\varphi_1^{(j)} = (e_w - e_j)^\top I(\theta;\lambda)^{-1}(e_w - e_j)`} block style={{ fontSize: '1.6em' }} />
          </div>
          <div style={{ flex: 1, padding: '18px 24px', borderRadius: 16, background: 'rgba(79,195,247,0.06)', border: '1.5px solid rgba(79,195,247,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>G-OPTIMALITY: minimize worst-case uncertainty</div>
            <MathFormula formula={String.raw`\min_{\lambda} \max_{j} \; \varphi_1^{(j)}`} block style={{ fontSize: '2em' }} />
          </div>
        </motion.div>
      )}

      {/* φ₁ values — shows G-opt exploiting transitivity */}
      {sub >= 2 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Fable–GPT',   phi: EX1_PHI1_GPT,   color: '#ef5350', games: '30 games', note: '← well-played chain pair' },
            { label: 'Fable–Kimi',  phi: EX1_PHI1_KIMI,  color: '#66bb6a', games: '2 games',  note: '' },
            { label: 'Fable–Llama', phi: EX1_PHI1_LLAMA, color: '#78909c', games: '2 games',  note: '← G-optimal picks this', highlight: true },
          ].map(r => (
            <div key={r.label} style={{
              flex: 1, padding: '20px 14px', borderRadius: 16, textAlign: 'center',
              background: r.highlight ? 'rgba(102,187,106,0.08)' : 'var(--glass-04)',
              border: `2px solid ${r.highlight ? '#66bb6a88' : r.color + '44'}`,
            }}>
              <div style={{ fontSize: 18, color: r.color, fontWeight: 700, marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{r.games}</div>
              <MathFormula formula={`\\varphi_1 = ${r.phi.toFixed(4)}`} block style={{ fontSize: '1.9em' }} />
              {r.note && <div style={{ fontSize: 13, color: '#66bb6a', marginTop: 10, fontWeight: 700 }}>{r.note}</div>}
            </div>
          ))}
        </motion.div>
      )}

      {sub >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(79,195,247,0.07)', border: '1.5px solid rgba(79,195,247,0.3)', textAlign: 'center', fontSize: 17, color: 'var(--cyan)', fontWeight: 700 }}>
          φ₁ is smallest for Fable–GPT — the 30-game chain already informs Kimi/Llama via transitivity. Scalar <em>f</em> could never see this.
        </motion.div>
      )}

      {sub < 2 && <div style={{ fontSize: 13, color: 'var(--glass-25)', textAlign: 'center' }}>→ press to continue ({sub + 1}/3)</div>}
    </div>
  );
}

// ── Step 3 - G-optimality fails Example 2 ────────────────────────────────────
const EX2_PAIRS = [
  { label: 'Fable vs GPT',   phi1: EX2_PHI1_GPT,   phi_norm: EX2_PHI_GPT,   delta: EX2_DELTA_GPT,   color: '#ef5350', gopt: false, wisdom: true  },
  { label: 'Fable vs Kimi',  phi1: EX2_PHI1_KIMI,  phi_norm: EX2_PHI_KIMI,  delta: EX2_DELTA_KIMI,  color: '#66bb6a', gopt: false, wisdom: false },
  { label: 'Fable vs Llama', phi1: EX2_PHI1_LLAMA, phi_norm: EX2_PHI_LLAMA, delta: EX2_DELTA_LLAMA, color: '#78909c', gopt: true,  wisdom: false },
];

function Step3({ sub }: { sub: number }) {
  const expanded = sub === 0;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', justifyContent: expanded ? 'center' : 'flex-start' }}>

      {/* Setup card */}
      <motion.div
        layout
        animate={expanded
          ? { padding: '28px 48px', borderRadius: 20 }
          : { padding: '10px 24px', borderRadius: 12 }
        }
        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        style={{
          background: 'rgba(79,195,247,0.07)', border: '1.5px solid rgba(79,195,247,0.35)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden', flexShrink: 0, alignSelf: expanded ? 'center' : 'stretch',
        }}
      >
        {expanded ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 22 }}>NEW SCENARIO — closer ratings, fewer Fable–Llama games</div>
            {/* Ratings */}
            <div style={{ display: 'flex', gap: 36, justifyContent: 'center', marginBottom: 24 }}>
              {[
                { name: 'Fable', theta: '1.00', color: '#e8c547' },
                { name: 'GPT',   theta: '0.85', color: '#ef5350' },
                { name: 'Kimi',  theta: '0.60', color: '#66bb6a' },
                { name: 'Llama', theta: '0.10', color: '#78909c' },
              ].map(p => (
                <div key={p.name} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: p.color }}>{p.name}</div>
                  <div style={{ fontSize: 17, color: 'var(--text-secondary)', marginTop: 4 }}>{ML(`\\theta=${p.theta}`)}</div>
                </div>
              ))}
            </div>
            {/* Game counts */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { pair: 'F-G', n: 20, color: '#ef5350', note: '' },
                { pair: 'G-K', n: 20, color: '#66bb6a', note: '' },
                { pair: 'K-L', n: 40, color: '#78909c', note: '' },
                { pair: 'F-K', n: 10, color: '#66bb6a', note: '' },
                { pair: 'F-L', n:  4, color: '#78909c', note: 'fewest!' },
                { pair: 'G-L', n: 20, color: '#78909c', note: '' },
              ].map(r => (
                <div key={r.pair} style={{ textAlign: 'center', padding: '10px 18px', borderRadius: 10, background: r.note ? 'rgba(232,197,71,0.1)' : 'var(--glass-04)', border: `1.5px solid ${r.note ? 'rgba(232,197,71,0.5)' : 'var(--glass-08)'}` }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: r.note ? 'var(--gold)' : r.color, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>{r.n}</div>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>{r.pair}</div>
                  {r.note && <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginTop: 2 }}>{r.note}</div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 14, color: 'var(--glass-25)' }}>→ press to see the φ₁ values</div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em' }}>EX 2</span>
            {[
              { pair: 'F-G:20', color: '#ef5350' }, { pair: 'G-K:20', color: '#66bb6a' },
              { pair: 'K-L:40', color: '#78909c' }, { pair: 'F-K:10', color: '#66bb6a' },
              { pair: 'F-L:4', color: 'var(--gold)' }, { pair: 'G-L:20', color: '#78909c' },
            ].map(r => (
              <span key={r.pair} style={{ color: r.color, fontWeight: 700, fontSize: 14 }}>{r.pair}</span>
            ))}
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>θ:[1.00, 0.85, 0.60, 0.10]</span>
          </motion.div>
        )}
      </motion.div>

      {/* φ₁ column — full width, G-opt view only */}
      {sub >= 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 14, color: '#ef9a9a', fontWeight: 700, letterSpacing: '0.1em' }}>
            {ML('\\varphi_1^{(j)}')}: G-OPTIMAL CRITERION
          </div>
          {EX2_PAIRS.map((r, i) => i < sub && (
            <motion.div key={r.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '18px 28px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 20,
                background: r.gopt ? 'rgba(239,83,80,0.10)' : 'var(--glass-04)',
                border: `2px solid ${r.gopt ? '#ef535066' : r.color + '33'}`,
              }}>
              <div style={{ fontSize: 19, color: r.color, fontWeight: 700, minWidth: 130 }}>{r.label}</div>
              <MathFormula formula={`\\Delta={${r.delta.toFixed(2)}}`} style={{ display: 'inline', fontSize: '1.1em', color: 'var(--text-secondary)', minWidth: 90 }} />
              <MathFormula formula={`\\varphi_1={${r.phi1.toFixed(4)}}`} block style={{ fontSize: '1.9em', color: r.gopt ? '#ef9a9a' : r.color, flex: 1, textAlign: 'center' }} />
              {r.gopt && <div style={{ fontSize: 14, color: '#ef9a9a', fontWeight: 700, minWidth: 110 }}>← G-opt picks</div>}
            </motion.div>
          ))}

          {/* Bottom note */}
          {sub >= 3 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '14px 28px', borderRadius: 14, background: 'rgba(239,83,80,0.08)', border: '2px solid rgba(239,83,80,0.35)', textAlign: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#ef9a9a' }}>G-opt picks Fable–Llama</span>
              <span style={{ fontSize: 18, color: 'var(--text-secondary)' }}> — uncertain, but Δ=0.90. Is this the pair we should care about?</span>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 4 - The fix: divide by Δ² ───────────────────────────────────────────
function Step4({ sub }: { sub: number }) {
  const formulaExpanded = sub <= 1;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: formulaExpanded ? 'center' : sub >= 3 ? 'flex-start' : 'center' }}>

      {/* Formula card - single box that animates in place */}
      <motion.div
        layout
        animate={formulaExpanded
          ? { padding: '32px 56px', borderRadius: 20 }
          : { padding: '12px 28px', borderRadius: 14 }
        }
        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        style={{
          background: 'rgba(232,197,71,0.07)', border: '2px solid rgba(232,197,71,0.4)',
          textAlign: 'center', flexShrink: 0, alignSelf: formulaExpanded ? 'center' : 'stretch',
          overflow: 'hidden',
        }}
      >
        {formulaExpanded ? (
          <div>
            <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 20 }}>
              {sub === 0 ? 'G-OPTIMALITY (old)' : 'THE FIX: DIVIDE BY Δ²'}
            </div>
            <AnimatePresence mode="wait">
              {sub === 0 ? (
                <motion.div key="f0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <MathFormula
                    formula={String.raw`\varphi_1^{(j)} = (e_w - e_j)^\top I(\theta;\lambda)^{-1}(e_w - e_j)`}
                    block style={{ fontSize: '1.9em' }}
                  />
                  <div style={{ marginTop: 16, fontSize: 15, color: 'var(--glass-25)' }}>→ press to see the fix</div>
                </motion.div>
              ) : (
                <motion.div key="f1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  <MathFormula
                    formula={String.raw`\varphi^{(j)} = \frac{(e_w - e_j)^\top I(\theta;\lambda)^{-1}(e_w - e_j)}{\Delta^2_{wj}}`}
                    block style={{ fontSize: '1.9em', color: 'var(--gold)' }}
                  />
                  <div style={{ marginTop: 14, fontSize: 15, color: 'var(--glass-25)' }}>→ press to compare</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MathFormula
              formula={String.raw`\varphi^{(j)} = \frac{(e_w - e_j)^\top I(\theta;\lambda)^{-1}(e_w - e_j)}{\Delta^2_{wj}}`}
              block style={{ fontSize: '1.6em', color: 'var(--gold)' }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Before / after comparison - sub>=2 */}
      {sub >= 2 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flex: 1 }}>

          {/* G-optimal φ₁ */}
          <div style={{ width: 400, padding: '22px 26px', borderRadius: 16, background: 'rgba(239,83,80,0.07)', border: '2px solid rgba(239,83,80,0.4)' }}>
            <div style={{ fontSize: 14, color: '#ef9a9a', fontWeight: 700, marginBottom: 18, letterSpacing: '0.08em' }}>G-OPTIMAL: uses φ₁ only</div>
            {[
              { label: 'Fable–GPT',   val: EX2_PHI1_GPT,   color: '#ef5350' },
              { label: 'Fable–Kimi',  val: EX2_PHI1_KIMI,  color: '#66bb6a' },
              { label: 'Fable–Llama', val: EX2_PHI1_LLAMA, color: '#78909c' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 20, color: r.color, fontWeight: 700 }}>{r.label}</span>
                <MathFormula formula={r.val.toFixed(4)} style={{ display: 'inline', fontSize: '1.5em', color: r.color, fontWeight: 700 }} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(239,83,80,0.3)', paddingTop: 10, fontSize: 17, color: '#ef9a9a', fontWeight: 700 }}>
              Worst φ₁ = {EX2_PHI1_LLAMA.toFixed(4)} → Fable–Llama ✗
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, color: 'var(--gold)', fontWeight: 900, flexShrink: 0 }}>→</div>

          {/* Our φ = φ₁/Δ² */}
          <div style={{ width: 400, padding: '22px 26px', borderRadius: 16, background: 'rgba(102,187,106,0.08)', border: '2px solid rgba(102,187,106,0.5)' }}>
            <div style={{ fontSize: 14, color: '#66bb6a', fontWeight: 700, marginBottom: 18, letterSpacing: '0.08em' }}>WiSDoM: φ = φ₁/Δ²</div>
            {[
              { label: 'Fable–GPT',   val: EX2_PHI_GPT,   color: '#ef5350', note: '← real threat (Δ=0.15)' },
              { label: 'Fable–Kimi',  val: EX2_PHI_KIMI,  color: '#66bb6a', note: '' },
              { label: 'Fable–Llama', val: EX2_PHI_LLAMA, color: '#78909c', note: '' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 20, color: r.color, fontWeight: 700 }}>{r.label}</span>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <MathFormula formula={r.val.toFixed(2)} style={{ display: 'inline', fontSize: '1.5em', color: r.color, fontWeight: 700 }} />
                  {r.note && <span style={{ fontSize: 13, color: '#ef9a9a', fontWeight: 700 }}>{r.note}</span>}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(102,187,106,0.3)', paddingTop: 10, fontSize: 17, color: '#66bb6a', fontWeight: 700 }}>
              Worst φ = {EX2_PHI_GPT.toFixed(2)} → Fable–GPT ✓
            </div>
          </div>
        </motion.div>
      )}

      {/* Question - sub=2 */}
      {sub >= 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px 28px', borderRadius: 12, background: 'rgba(232,197,71,0.12)', border: '2px solid rgba(232,197,71,0.5)', fontSize: 22, fontWeight: 700, color: 'var(--gold)', textAlign: 'center', flexShrink: 0 }}>
          Now: how do we <em>optimally allocate</em> the entire budget B to minimise worst-case φ?
        </motion.div>
      )}
    </div>
  );
}

// ── Step 5 - Water-filling ────────────────────────────────────────────────────
function BudgetBarsViz({ sub }: { sub: number }) {
  const kf = KEYFRAMES[sub];
  const isOptimal = sub === KEYFRAMES.length - 1;
  const B = 50;

  // Queries allocated (rounded)
  const q_gpt   = Math.round(kf.lamFG * B);
  const q_kimi  = Math.round((1 - kf.lamFG - kf.lamFL) * B);
  const q_llama = Math.round(kf.lamFL * B);

  // Danger level - φ normalised: use 0..25 scale, clamp
  const MAX_PHI = 25;
  const pairs = [
    { label: 'Fable vs GPT-5.6', gap: 'Δ=0.20', queries: q_gpt,   phi: kf.phi_gpt,   color: '#ef5350', isBottleneck: kf.phi_gpt   > kf.phi_kimi && kf.phi_gpt   > kf.phi_llama },
    { label: 'Fable vs Kimi K3', gap: 'Δ=0.40', queries: q_kimi,  phi: kf.phi_kimi,  color: '#66bb6a', isBottleneck: kf.phi_kimi  > kf.phi_gpt  && kf.phi_kimi  > kf.phi_llama },
    { label: 'Fable vs Llama 4', gap: 'Δ=0.80', queries: q_llama, phi: kf.phi_llama, color: '#78909c', isBottleneck: kf.phi_llama > kf.phi_gpt  && kf.phi_llama > kf.phi_kimi },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
      <div style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Prior: 30 Fable–Kimi + 30 Kimi–GPT. Allocating <strong style={{ color: 'var(--text-primary)' }}>50 more queries.</strong>{' '}
        Obvious choice: all on Fable–GPT. <strong style={{ color: '#ef5350' }}>But Llama has zero data, so φ = ∞.</strong>
      </div>

      {/* Three pair cards side by side */}
      <div style={{ display: 'flex', gap: 16 }}>
        {pairs.map((p) => {
          const phiPct = Math.min(p.phi / MAX_PHI * 100, 100);
          const isInfinite = p.phi >= 24;
          const dangerColor = p.phi > 5 ? '#ef5350' : p.phi > 2 ? '#ffb74d' : '#66bb6a';
          const dangerLabel = isInfinite ? '∞ UNCONFIRMABLE' : p.phi > 5 ? 'HIGH RISK' : p.phi > 2 ? 'MODERATE' : 'SAFE';
          return (
            <div key={p.label} style={{
              flex: 1, padding: '18px 20px', borderRadius: 16,
              background: p.isBottleneck ? `${dangerColor}15` : 'var(--glass-04)',
              border: `2px solid ${p.isBottleneck ? dangerColor + '88' : p.color + '44'}`,
            }}>
              {/* Header */}
              <div style={{ fontSize: 18, fontWeight: 800, color: p.color, marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>gap {p.gap}</div>

              {/* Queries allocated */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 6 }}>QUERIES ALLOCATED</div>
                <div style={{ height: 14, background: 'var(--glass-08)', borderRadius: 7, overflow: 'hidden', marginBottom: 4 }}>
                  <motion.div
                    animate={{ width: `${Math.min(p.queries / B * 100, 100)}%` }}
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                    style={{ height: '100%', background: p.color, borderRadius: 7 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>0</span>
                  <motion.span style={{ fontSize: 22, fontWeight: 900, color: p.color, fontFamily: "'Space Grotesk',sans-serif" }}>
                    {p.queries}
                  </motion.span>
                  <span>{B}</span>
                </div>
              </div>

              {/* φ danger level */}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 6 }}>DANGER φ</div>
                <div style={{ height: 14, background: 'var(--glass-08)', borderRadius: 7, overflow: 'hidden', marginBottom: 4 }}>
                  <motion.div
                    animate={{ width: `${phiPct}%` }}
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                    style={{ height: '100%', background: dangerColor, borderRadius: 7 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: dangerColor, fontFamily: "'Space Grotesk',sans-serif" }}>
                    {isInfinite ? '∞' : p.phi.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                    background: `${dangerColor}22`, color: dangerColor, border: `1px solid ${dangerColor}55` }}>
                    {dangerLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isOptimal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '12px 20px', borderRadius: 10, textAlign: 'center', background: 'rgba(102,187,106,0.1)', border: '2px solid rgba(102,187,106,0.5)', fontSize: 18, fontWeight: 700, color: '#66bb6a' }}>
          ✓ GPT + Llama both under control. λ* = {q_gpt} queries on Fable–GPT + {q_llama} on Fable–Llama.
        </motion.div>
      )}

      <div style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(232,197,71,0.06)', border: '1px solid rgba(232,197,71,0.3)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {isOptimal
          ? <><strong style={{ color: 'var(--gold)' }}>Non-obvious answer:</strong> {q_gpt} queries on Fable–GPT (closest threat) <em>and</em> <strong style={{ color: '#78909c' }}>{q_llama} queries on Fable–Llama</strong> (never played). Without those {q_llama}, Llama φ=∞ and the algorithm fails.</>
          : sub === 0
          ? <><strong style={{ color: '#ef5350' }}>0 queries on Llama → φ = ∞.</strong> All on Fable–GPT feels obvious, but Llama is completely unconfirmed. Press → to allocate some budget to it.</>
          : <>φ(Llama) drops fast with each query. φ(GPT) barely changes. Stop when <strong style={{ color: 'var(--gold)' }}>both are equal</strong>: <strong style={{ color: 'var(--gold)' }}>water-filling</strong>.</>
        }
      </div>
      {!isOptimal && <div style={{ fontSize: 13, color: 'var(--glass-25)', textAlign: 'center', marginTop: 6 }}>→ shift budget ({sub + 1}/{KEYFRAMES.length})</div>}
    </div>
  );
}

function Step5Ellipse({ sub }: { sub: number }) {
  return <BudgetBarsViz sub={sub} />;
}

// ── Step 5 - The Objective + What Happens Next ───────────────────────────────
function Step5Objective() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
      <Label text="The Objective: Solved Every Round" />

      {/* SDP equation */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '24px 40px', borderRadius: 16, background: 'rgba(232,197,71,0.07)', border: '2px solid rgba(232,197,71,0.45)', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14 }}>
          SEMIDEFINITE PROGRAM (SDP): WINNER-FOCUSED EXPERIMENTAL DESIGN
        </div>
        <MathFormula
          formula={String.raw`\lambda^* = \arg\min_{\lambda \in \Delta_{\binom{\mathcal{C}}{2}}} \;\max_{j \in \mathcal{C} \setminus \{w\}}\; \frac{(e_w-e_j)^\top I(\theta;\lambda)^{-1}(e_w-e_j)}{\Delta_{wj}^2}`}
          block style={{ fontSize: '2.1em' }}
        />
      </motion.div>

      {/* 4 step cards - title only, no body */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: 0, borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--glass-12)' }}>
        {[
          { num: '①', color: 'var(--cyan)',  bg: 'rgba(79,195,247,0.06)',   title: 'Solve the SDP' },
          { num: '②', color: 'var(--gold)',  bg: 'rgba(232,197,71,0.06)',   title: 'Allocate queries' },
          { num: '③', color: '#66bb6a',      bg: 'rgba(102,187,106,0.06)', title: 'Uncertainty collapses' },
          { num: '④', color: '#ce93d8',      bg: 'rgba(206,147,216,0.06)', title: 'Repeat each round' },
        ].map((r, i) => (
          <div key={i} style={{ flex: 1, padding: '28px 20px', background: r.bg, borderRight: i < 3 ? '1px solid var(--glass-10)' : undefined, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: r.color, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 12 }}>{r.num}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.title}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── (Step6Numbers kept as stub to avoid breaking old refs) ───────────────────
function Step6Numbers() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Label text="Solution: Convex SDP, Solved Every Round" />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '16px 28px', borderRadius: 16, background: 'rgba(232,197,71,0.07)', border: '2px solid rgba(232,197,71,0.45)', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>CONVEX SDP: SOLVED EACH ROUND</div>
        <MathFormula formula={String.raw`\lambda^* = \arg\min_{\lambda \in \Delta_{\binom{\mathcal{C}}{2}}} \;\max_{j \in \mathcal{C} \setminus \{w\}}\; \frac{(e_w-e_j)^\top I(\theta;\lambda)^{-1}(e_w-e_j)}{\Delta_{wj}^2}`} block style={{ fontSize: '1.7em' }} />
        <div style={{ fontSize: 17, color: 'var(--text-secondary)', marginTop: 10 }}>
          Convex in λ (map λ ↦ vᵀI(θ;λ)⁻¹v is convex on the PSD cone; pointwise max of convex = convex).
          Solved by Frank–Wolfe in O(M²) per step.
        </div>
      </motion.div>

      <div style={{ display: 'flex', gap: 16 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ flex: 1, padding: '16px 22px', borderRadius: 16, background: 'rgba(239,83,80,0.08)', border: '2px solid rgba(239,83,80,0.45)' }}>
          <div style={{ fontSize: 15, color: '#ef9a9a', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>BEFORE: Uniform λ = ⅓</div>
          {[['λ(Fable, GPT)', '33%'], ['λ(Fable, Kimi)', '33%'], ['λ(GPT, Kimi)', '33%']].map(([lbl, val]) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 17, color: 'var(--text-secondary)' }}>
              <span>{lbl}</span><span style={{ fontWeight: 700, fontSize: 19 }}>{val}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(239,83,80,0.3)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, marginBottom: 3 }}><span style={{ color: '#ef9a9a' }}>φ (GPT)</span><span style={{ color: '#ef5350', fontWeight: 800, fontSize: 26 }}>{SDP_WORST_UNIFORM}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17 }}><span style={{ color: '#ef9a9a', fontWeight: 700 }}>worst-case</span><span style={{ color: '#ef5350', fontWeight: 900, fontSize: 32, fontFamily: "'Space Grotesk',sans-serif" }}>{SDP_WORST_UNIFORM}</span></div>
          </div>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, color: 'var(--gold)', fontWeight: 900 }}>→</div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
          style={{ flex: 1, padding: '16px 22px', borderRadius: 16, background: 'rgba(102,187,106,0.08)', border: '2px solid rgba(102,187,106,0.5)' }}>
          <div style={{ fontSize: 15, color: '#66bb6a', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>AFTER: Optimal λ*</div>
          {[['λ*(Fable, GPT)', `${SDP_LAM_GPT}%`, true], ['λ*(Fable, Kimi)', '1.6%', false], ['λ*(GPT, Kimi)', '1.6%', false]].map(([lbl, val, big]) => (
            <div key={lbl as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 17, color: big ? 'var(--gold)' : 'var(--text-secondary)' }}>
              <span>{lbl}</span><span style={{ fontWeight: big ? 900 : 700, fontSize: big ? 24 : 19 }}>{val}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(102,187,106,0.3)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, marginBottom: 3 }}><span style={{ color: '#66bb6a' }}>φ (GPT)</span><span style={{ color: '#66bb6a', fontWeight: 800, fontSize: 26 }}>{SDP_PHI_GPT_OPT}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, marginBottom: 3 }}><span style={{ color: '#66bb6a' }}>φ (Kimi)</span><span style={{ color: '#66bb6a', fontWeight: 800, fontSize: 26 }}>{SDP_PHI_KIMI_OPT}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17 }}><span style={{ color: '#66bb6a', fontWeight: 700 }}>worst-case</span><span style={{ color: '#66bb6a', fontWeight: 900, fontSize: 32, fontFamily: "'Space Grotesk',sans-serif" }}>{SDP_WORST_OPT}</span></div>
            <div style={{ fontSize: 16, color: '#66bb6a', fontWeight: 700, marginTop: 5, textAlign: 'right' }}>↓ {SDP_IMPROVEMENT}%, φ(GPT) ≈ φ(Kimi) ✓</div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(79,195,247,0.07)', border: '1px solid rgba(79,195,247,0.3)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        <strong style={{ color: 'var(--cyan)' }}>Why {SDP_LAM_GPT}% on Fable–GPT?</strong>{' '}
        Gap Δ=0.05 is tiny, so any σ² creates huge φ. Concentrating budget there reduces worst-case φ. WiSDoM solves this SDP every round.
      </motion.div>
    </div>
  );
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
export function MIPUnifiedSlide() {
  const [step, setStep] = useState(0);
  const [sub, setSub] = useState(0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (sub > 0) {
          e.stopPropagation(); e.preventDefault(); setSub(s => s - 1);
        } else if (step > 0) {
          e.stopPropagation(); e.preventDefault();
          const prev = step - 1; setStep(prev);
          // Step 5 is the animation - always start from sub=0 when entering it
          setSub(MAX_SUBS[prev]);
        }
        return;
      }
      if (e.key !== 'ArrowRight' && e.key !== ' ') return;
      const maxSub = MAX_SUBS[step];
      if (sub < maxSub) {
        e.stopPropagation(); e.preventDefault(); setSub(s => s + 1);
      } else if (step < 5) {
        e.stopPropagation(); e.preventDefault(); setStep(s => s + 1); setSub(0);
      }
      // step=5, sub=0 → outer App navigates forward
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [step, sub]);

  const stepTitles: Record<number, React.ReactNode> = {
    0: <>You have <span style={{ color: 'var(--gold)' }}>1 query.</span> Which pair?</>,
    1: <>Scalar f is <span style={{ color: '#ef5350' }}>blind to transitivity.</span></>,
    2: <>Fisher information <span style={{ color: 'var(--cyan)' }}>+ G-optimality.</span></>,
    3: <>G-optimality <span style={{ color: '#ef5350' }}>ignores the gap.</span></>,
    4: <>Fix: divide by <span style={{ color: 'var(--gold)' }}>Δ².</span></>,
    5: <>Solve the SDP → allocate queries → <span style={{ color: 'var(--gold)' }}>uncertainty collapses.</span></>,
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', padding: '16px 64px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div className="label">MOST INFORMATIVE PAIR</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 6, borderRadius: 3, width: i === step ? 22 : 7, background: i < step ? 'var(--cyan)' : i === step ? 'var(--gold)' : 'var(--glass-12)', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
        <h1 style={{ fontSize: 36, margin: 0, lineHeight: 1.15 }}>{stepTitles[step]}</h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {step === 0 && <Step0 />}
          {step === 1 && <Step1 sub={sub} />}
          {step === 2 && <Step2 sub={sub} />}
          {step === 3 && <Step3 sub={sub} />}
          {step === 4 && <Step4 sub={sub} />}
          {step === 5 && <Step5Objective />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
