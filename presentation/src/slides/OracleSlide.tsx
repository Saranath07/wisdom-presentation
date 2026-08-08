import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';
const ML = (f: string) => <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />;

// ── Teams - FIFA rankings as of July 2026 (Spain won 2026 World Cup) ──────────
const ARG = { name: 'Argentina', w: 1970, color: '#74ACDF', rank: '#2' };
const ESP = { name: 'Spain',     w: 1996, color: '#C60B1E', rank: '#1' };
const TOTAL = ARG.w + ESP.w; // 3966
const P_ARG = (ARG.w / TOTAL * 100).toFixed(1); // 49.7

// Seeded RNG so particles are identical on every render
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}
const rng = lcg(42);
const R = 82; // bowl radius

// ~equal counts since rankings are close; Spain gets 1 more dot to reflect #1
const ARG_DOTS = Array.from({ length: 16 }, (_, i) => {
  const a = rng() * Math.PI * 2, r = rng() * R * 0.82;
  return { id: `a${i}`, x: Math.round(r * Math.cos(a)), y: Math.round(r * Math.sin(a)) };
});
const ESP_DOTS = Array.from({ length: 17 }, (_, i) => {
  const a = rng() * Math.PI * 2, r = rng() * R * 0.82;
  return { id: `e${i}`, x: Math.round(r * Math.cos(a)), y: Math.round(r * Math.sin(a)) };
});


// ── Flag SVGs ─────────────────────────────────────────────────────────────────
function ArgentinaFlag({ size = 160 }: { size?: number }) {
  const h = Math.round(size * 2 / 3);
  return (
    <svg width={size} height={h} viewBox="0 0 900 600"
      style={{ borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.5)', display: 'block' }}>
      <rect width="900" height="600" fill="#74ACDF" />
      <rect y="200" width="900" height="200" fill="#fff" />
      {/* Sol de Mayo */}
      <g transform="translate(450,300)">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
          if (i % 2 === 0) {
            const a1 = ((i - 0.6) / 16) * Math.PI * 2 - Math.PI / 2;
            const a2 = ((i + 0.6) / 16) * Math.PI * 2 - Math.PI / 2;
            return <polygon key={i} fill="#F6B40E"
              points={`0,0 ${84 * Math.cos(a1)},${84 * Math.sin(a1)} ${84 * Math.cos(a2)},${84 * Math.sin(a2)}`} />;
          }
          return <line key={i} stroke="#F6B40E" strokeWidth="14" strokeLinecap="round"
            x1={50 * Math.cos(a)} y1={50 * Math.sin(a)} x2={80 * Math.cos(a)} y2={80 * Math.sin(a)} />;
        })}
        <circle r="46" fill="#F6B40E" />
        <circle cx="-13" cy="-9" r="5.5" fill="#5A3000" />
        <circle cx="13" cy="-9" r="5.5" fill="#5A3000" />
        <path d="M-12 10 Q0 21 12 10" stroke="#5A3000" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function SpainFlag({ size = 160 }: { size?: number }) {
  const h = Math.round(size * 2 / 3);
  return (
    <svg width={size} height={h} viewBox="0 0 900 600"
      style={{ borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.5)', display: 'block' }}>
      <rect width="900" height="600" fill="#C60B1E" />
      <rect y="150" width="900" height="300" fill="#F1BF00" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function OracleSlide() {
  const [step, setStep] = useState(0);
  const [counts, setCounts] = useState({ arg: 0, esp: 0 });
  const countDoneRef = useRef(false);
  const advance = useCallback(() => setStep(s => Math.min(s + 1, 4)), []);

  // Left/right arrow navigation - fully manual, no auto-advance
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (step > 0) {
          e.stopPropagation(); e.preventDefault();
          setStep(s => s - 1);
          countDoneRef.current = false;
        }
        // step=0 → let outer App navigate back
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        if (step < 4) {
          e.stopPropagation(); e.preventDefault();
          advance();
        }
        // step=4 → let outer App navigate forward
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [step, advance]);

  // Click anywhere to advance (manual)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      if (step >= 4) return;
      e.stopPropagation();
      advance();
    };
    window.addEventListener('click', h, { capture: true });
    return () => window.removeEventListener('click', h, { capture: true });
  }, [advance, step]);

  // Count-up animation triggers at step 1
  useEffect(() => {
    if (step < 1 || countDoneRef.current) return;
    countDoneRef.current = true;
    const FRAMES = 55;
    let f = 0;
    const id = setInterval(() => {
      f++;
      const t = Math.min(f / FRAMES, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setCounts({ arg: Math.round(ARG.w * ease), esp: Math.round(ESP.w * ease) });
      if (f >= FRAMES) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [step]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      padding: '20px 72px 16px', gap: 12,
      background: 'var(--bg)', userSelect: 'none',
      cursor: 'default',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>The Oracle</div>
        <h1 style={{ fontSize: 44, margin: 0 }}>
          Bradley–Terry–Luce:{' '}
          <span style={{ color: 'var(--gold)' }}>The Raffle Bowl</span>
        </h1>
      </motion.div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', minHeight: 0 }}>

        {/* ── Row 1: Teams + Bowl ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, width: '100%', justifyContent: 'center' }}>

          {/* Argentina */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: '18px 22px', borderRadius: 16,
              background: `${ARG.color}12`, border: `2px solid ${ARG.color}50`,
            }}>
            <ArgentinaFlag size={150} />
            <div style={{ fontSize: 22, fontWeight: 800, color: ARG.color, fontFamily: "'Space Grotesk', sans-serif" }}>Argentina</div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>FIFA Ranking {ARG.rank}</div>

            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 16, color: "var(--text-secondary)", letterSpacing: '0.1em' }}>TRUE WEIGHT {ML('w_i')}</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: ARG.color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
                    {counts.arg.toLocaleString()}
                  </div>
                  {/* Ticket dots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 160, justifyContent: 'center' }}>
                    {Array.from({ length: 18 }, (_, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
                        style={{ width: 8, height: 8, borderRadius: '50%', background: ARG.color }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: ARG.color, opacity: 0.85 }}>1,970 raffle tickets</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Bowl */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 220, height: 220, flexShrink: 0 }}>
              {/* Dashed bowl border */}
              <svg width={220} height={220} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                <ellipse cx={110} cy={110} rx={R + 10} ry={R + 10}
                  fill={step >= 2 ? 'var(--glass-03)' : 'none'}
                  stroke={step >= 2 ? 'var(--glass-35)' : 'var(--glass-10)'}
                  strokeWidth="2" strokeDasharray="6,4" />
                {step >= 2 && (
                  <foreignObject x={10} y={205} width={200} height={26}>
                    <div style={{ textAlign: 'center', fontSize: 13 }}>
                      {ML(`w_i + w_j = ${TOTAL.toLocaleString()}`)}
                    </div>
                  </foreignObject>
                )}
              </svg>

              {/* Rotating placeholder before bowl appears */}
              {step < 2 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 56, height: 56, borderRadius: '50%', border: '3px dashed var(--glass-15)' }} />
                </div>
              )}

              {/* Argentina particles */}
              {step >= 2 && ARG_DOTS.map((d, i) => (
                <motion.div key={d.id}
                  initial={{ x: -180, y: 0, scale: 0, opacity: 0 }}
                  animate={step >= 3 && i === 0
                    ? { x: d.x, y: -160, scale: 2.2, opacity: 1 }
                    : { x: d.x, y: d.y, scale: 1, opacity: 1 }
                  }
                  transition={{ type: 'spring', stiffness: 55, damping: 14, delay: i * 0.035 }}
                  style={{
                    position: 'absolute',
                    left: 110 - 5, top: 110 - 5,
                    width: 10, height: 10, borderRadius: '50%',
                    background: step >= 3 && i === 0
                      ? 'radial-gradient(circle, #fff 30%, #74ACDF)'
                      : ARG.color,
                    boxShadow: step >= 3 && i === 0
                      ? `0 0 18px ${ARG.color}, 0 0 32px #fff4`
                      : `0 0 5px ${ARG.color}88`,
                    zIndex: step >= 3 && i === 0 ? 20 : 1,
                  }}
                />
              ))}

              {/* Spain particles */}
              {step >= 2 && ESP_DOTS.map((d, i) => (
                <motion.div key={d.id}
                  initial={{ x: 180, y: 0, scale: 0, opacity: 0 }}
                  animate={{ x: d.x, y: d.y, scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 55, damping: 14, delay: i * 0.035 + 0.15 }}
                  style={{
                    position: 'absolute',
                    left: 110 - 4, top: 110 - 4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: ESP.color,
                    boxShadow: `0 0 4px ${ESP.color}88`,
                  }}
                />
              ))}
            </div>

            {/* Bowl label */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                  style={{ fontSize: 16, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.5 }}>
                  All tickets pooled → draw one
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spain */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.08 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: '18px 22px', borderRadius: 16,
              background: `${ESP.color}12`, border: `2px solid ${ESP.color}50`,
            }}>
            <SpainFlag size={150} />
            <div style={{ fontSize: 22, fontWeight: 800, color: ESP.color, fontFamily: "'Space Grotesk', sans-serif" }}>Spain</div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>FIFA Ranking {ESP.rank}</div>

            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.08 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 16, color: "var(--text-secondary)", letterSpacing: '0.1em' }}>TRUE WEIGHT {ML('w_j')}</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: ESP.color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
                    {counts.esp.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 160, justifyContent: 'center' }}>
                    {Array.from({ length: 14 }, (_, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
                        style={{ width: 8, height: 8, borderRadius: '50%', background: ESP.color }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: ESP.color, opacity: 0.85 }}>1,996 raffle tickets</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Row 2: Formula ── */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 110, damping: 20 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 24,
                padding: '14px 28px', borderRadius: 16,
                background: 'rgba(232,197,71,0.07)', border: '1px solid rgba(232,197,71,0.3)',
                width: '100%', maxWidth: 900,
              }}>
              {/* Fraction */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>
                  BTL WIN PROBABILITY
                </div>
                <MathFormula
                  formula={String.raw`P(i \succ j) = \frac{w_i}{w_i + w_j} = \frac{1970}{3966}`}
                  block style={{ fontSize: '1.55em' }}
                />
              </div>

              <div style={{ fontSize: 22, color: 'var(--glass-30)', flexShrink: 0 }}>→</div>

              {/* Result */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 6 }}>
                  ARGENTINA WINS WITH
                </div>
                {/* P_ARG is now 49.7% - Argentina is slight underdog */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
                  style={{ fontSize: 56, fontWeight: 900, color: ARG.color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
                  {P_ARG}%
                </motion.div>
              </div>

              <div style={{ fontSize: 22, color: 'var(--glass-30)', flexShrink: 0 }}>→</div>

              {/* Insight */}
              <div style={{ flex: 1, fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Each match = <strong style={{ color: 'var(--text-primary)' }}>one noisy draw</strong> from the bowl.
                Argentina wins more often, but not always.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Row 3: Elo Update ── */}
        <AnimatePresence>
          {step >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 110, damping: 20 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '12px 24px', borderRadius: 14,
                background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.2)',
                width: '100%', maxWidth: 900,
              }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.1em', flexShrink: 0 }}>ELO UPDATE</div>
              <MathFormula
                formula={String.raw`E_i \leftarrow E_i + K\!\left(S_i - \frac{w_i}{w_i+w_j}\right)`}
                style={{ fontSize: '1.35em' }}
              />
              <div style={{ width: 1, height: 32, background: 'var(--glass-12)' }} />
              <div style={{ fontSize: 17, color: 'var(--text-secondary)' }}>
                Argentina wins → Elo{' '}<span style={{ color: '#66bb6a', fontWeight: 700 }}>↑</span>
                &nbsp;·&nbsp; Spain wins → Elo{' '}<span style={{ color: '#ef5350', fontWeight: 700 }}>↓</span>
              </div>
              <div style={{ width: 1, height: 32, background: 'var(--glass-12)' }} />
              <div style={{ fontSize: 17, color: 'var(--text-secondary)' }}>
                Repeat {ML('N \\log N')} times → true ranking emerges
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav hint */}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--glass-18)', flexShrink: 0, letterSpacing: '0.05em' }}>
        {step < 4 ? `→ press to continue · step ${step + 1} / 5` : '→ press to go to next slide'}
      </div>
    </div>
  );
}
