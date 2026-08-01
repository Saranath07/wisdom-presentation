import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

const ML = (f: string) => (
  <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />
);

function Block({ f, size = '1.2em' }: { f: string; size?: string }) {
  return <MathFormula formula={f} block style={{ fontSize: size, margin: '8px 0' }} />;
}

const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 140, damping: 22 } },
};

// Shared pill label
function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
      color, background: `${color}22`,
      padding: '3px 11px', borderRadius: 6,
    }}>
      {text}
    </span>
  );
}

// One proof card
function Card({
  color, border, bg, pill, title, children, delay = 0,
}: {
  color: string; border: string; bg: string;
  pill: string; title: string;
  children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible"
      transition={{ delay }}
      style={{
        flex: 1,
        padding: '22px 32px',
        borderRadius: 18,
        background: bg,
        border: `1.5px solid ${border}`,
        display: 'flex', flexDirection: 'column', gap: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Pill text={pill} color={color} />
        <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '0.07em' }}>{title}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        {children}
      </div>
    </motion.div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

// ─── Setup animation ─────────────────────────────────────────────────────────
// 4 phases, each held for 2.2s, looping:
//   0 — all N items, winner highlighted gold
//   1 — show gap Δ arrow between winner and challengers
//   2 — split: S (selected, K items) vs R (rejected, N-K items), x* lit red
//   3 — two-worlds label: H₀ vs H_{x*}

const N_VIZ = 9;   // total items to visualise (winner + 8 challengers)
const K_VIZ = 5;   // size of returned set S

function SetupAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 4), 2200);
    return () => clearInterval(t);
  }, []);

  const W = 340, H = 220;
  const cx = W / 2;

  // Arrange N_VIZ items in a row
  const spacing = W / (N_VIZ + 1);
  const items = Array.from({ length: N_VIZ }, (_, i) => ({
    x: spacing * (i + 1),
    y: phase < 2 ? 90 : (i < K_VIZ ? 64 : 148),  // split vertically in phase 2+
    isWinner: i === 0,
    inS: i < K_VIZ,
    isXstar: i === K_VIZ,  // first rejected = x*
  }));

  const GOLD = '#e8c547';
  const CYAN = '#4fc3f7';
  const RED  = '#ef5350';
  const DIM  = 'rgba(255,255,255,0.18)';

  function itemColor(it: typeof items[0]) {
    if (it.isWinner) return GOLD;
    if (phase >= 2 && it.isXstar) return RED;
    if (phase >= 2 && !it.inS) return 'rgba(239,83,80,0.35)';
    return CYAN;
  }

  function itemR(it: typeof items[0]) {
    if (it.isWinner) return 13;
    if (phase >= 2 && it.isXstar) return 12;
    return 9;
  }

  return (
    <svg width={W} height={H} style={{ overflow: 'visible', flexShrink: 0 }}>

      {/* Phase 2+: bracket lines for S and R */}
      {phase >= 2 && (
        <g>
          {/* S bracket */}
          <line x1={spacing * 0.5} y1={38} x2={spacing * (K_VIZ + 0.5)} y2={38}
            stroke={CYAN} strokeWidth={1.5} strokeOpacity={0.5} />
          <text x={spacing * (K_VIZ / 2 + 0.5)} y={28} textAnchor="middle"
            fill={CYAN} fontSize={13} fontWeight={700} fontFamily="Inter,sans-serif">
            S (returned, K={K_VIZ})
          </text>
          {/* R bracket */}
          <line x1={spacing * (K_VIZ + 0.5)} y1={122} x2={spacing * (N_VIZ + 0.5)} y2={122}
            stroke={RED} strokeWidth={1.5} strokeOpacity={0.5} />
          <text x={spacing * ((K_VIZ + N_VIZ) / 2 + 0.5)} y={112} textAnchor="middle"
            fill={RED} fontSize={13} fontWeight={700} fontFamily="Inter,sans-serif">
            R (rejected, N-K)
          </text>
        </g>
      )}

      {/* Phase 1: Δ gap arrow between winner and nearest challenger */}
      {phase === 1 && (
        <g>
          <line x1={items[0].x + 14} y1={90} x2={items[1].x - 10} y2={90}
            stroke={GOLD} strokeWidth={1.5} strokeDasharray="4,3" />
          <text x={(items[0].x + items[1].x) / 2} y={78}
            textAnchor="middle" fill={GOLD} fontSize={13} fontWeight={700}
            fontFamily="Inter,sans-serif">
            Δ gap
          </text>
        </g>
      )}

      {/* Items */}
      {items.map((it, i) => (
        <g key={i}>
          <motion.circle
            cx={it.x}
            cy={it.y}
            r={itemR(it)}
            fill={itemColor(it)}
            fillOpacity={phase >= 2 && !it.inS && !it.isXstar ? 0.4 : 0.9}
            animate={{ cy: it.y }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          />
          {it.isWinner && (
            <text x={it.x} y={it.y + 26} textAnchor="middle"
              fill={GOLD} fontSize={11} fontWeight={700} fontFamily="Inter,sans-serif">
              w
            </text>
          )}
          {phase >= 2 && it.isXstar && (
            <text x={it.x} y={it.y + 26} textAnchor="middle"
              fill={RED} fontSize={11} fontWeight={700} fontFamily="Inter,sans-serif">
              x*
            </text>
          )}
        </g>
      ))}

      {/* Phase 3: two-worlds label */}
      {phase === 3 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <rect x={cx - 120} y={H - 52} width={240} height={44}
            rx={8} fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <text x={cx - 10} y={H - 32} textAnchor="middle"
            fill="rgba(255,255,255,0.55)" fontSize={12} fontFamily="Inter,sans-serif">
            H₀: someone else wins
          </text>
          <text x={cx - 10} y={H - 16} textAnchor="middle"
            fill={RED} fontSize={12} fontWeight={700} fontFamily="Inter,sans-serif">
            H_x*: x* is the true winner
          </text>
        </motion.g>
      )}

      {/* Phase indicator dots */}
      {[0,1,2,3].map(p => (
        <circle key={p} cx={W / 2 - 18 + p * 12} cy={H - 6} r={3}
          fill={p === phase ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'} />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Setup (then → reveals Step 1: KL bound)
// ══════════════════════════════════════════════════════════════════════════════
const SLIDE1_STEPS = [
  { color: '#ce93d8' },
  { color: '#4fc3f7' },
];

export function LowerBoundProof1Slide() {
  const TOTAL = SLIDE1_STEPS.length;
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowRight' || e.key === ' ') && visible < TOTAL) {
        e.stopPropagation(); e.preventDefault();
        setVisible(v => v + 1);
      } else if (e.key === 'ArrowLeft' && visible > 1) {
        e.stopPropagation(); e.preventDefault();
        setVisible(v => v - 1);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, TOTAL]);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '28px 80px 24px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Theory &middot; Proof &middot; 1 / 2</div>
          <h1 style={{ fontSize: 40, margin: 0, lineHeight: 1.2 }}>
            Proof: <span style={{ color: 'var(--cyan)' }}>Flat Single-Gap Corollary</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 6 }}>
          {SLIDE1_STEPS.map((s, i) => (
            <div key={i} style={{
              width: i < visible ? 26 : 9, height: 9, borderRadius: 5,
              background: i < visible ? s.color : 'var(--glass-15)',
              transition: 'all 0.3s ease',
              opacity: i < visible ? 0.9 : 0.4,
            }} />
          ))}
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>
            {visible}/{TOTAL}
          </span>
        </div>
      </div>

      {/* Setup */}
      <AnimatePresence>
        {visible >= 1 && (
          <motion.div
            key="setup"
            variants={fadeUp} initial="hidden" animate="visible"
            style={{
              flex: 1,
              padding: '22px 28px',
              borderRadius: 18,
              background: 'rgba(206,147,216,0.07)',
              border: '1.5px solid rgba(206,147,216,0.4)',
              display: 'flex', flexDirection: 'column', gap: 10,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Pill text="Setup" color="#ce93d8" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ce93d8', letterSpacing: '0.07em' }}>
                FLAT SINGLE-GAP MODEL
              </span>
            </div>

            {/* Two-column: text left, animation right */}
            <div style={{ flex: 1, display: 'flex', gap: 28, alignItems: 'center', minHeight: 0 }}>

              {/* Left: text */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                <Body>
                  We have {ML('N')} items: winner {ML('w')} and {ML('N{-}1')} challengers, all with the
                  same BTL gap {ML('\\Delta')} to {ML('w')}:
                </Body>
                <Block
                  f={String.raw`P(w \succ j) \;=\; \tfrac{1}{2} + \Delta \qquad \forall\, j \ne w`}
                  size="1.15em"
                />
                <Body>
                  The algorithm uses {ML('B')} queries and returns a set {ML('S')} of size {ML('K')}.
                  Exactly {ML('N{-}K')} challengers are <span style={{ color: '#ef5350' }}>rejected</span>.
                  For the hardest rejected candidate {ML('x^*')}, we compare:
                </Body>
                <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
                  <div style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6,
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{ML('H_0')}:</span>{' '}
                    Some other player is the true winner. {ML('x^*')} is just a challenger.
                  </div>
                  <div style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.3)',
                    fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6,
                  }}>
                    <span style={{ color: '#ef9a9a', fontWeight: 700 }}>{ML('H_{x^*}')}:</span>{' '}
                    {ML('x^*')} is the true winner. Rejecting {ML('x^*')} is a <span style={{ color: '#ef5350', fontWeight: 700 }}>failure</span>.
                  </div>
                </div>
              </div>

              {/* Right: animation */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <SetupAnimation />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1 */}
      <AnimatePresence>
        {visible >= 2 && (
          <Card
            key="kl"
            pill="Step 1" title="PER-MATCH KL BOUND (chi-square upper bound)"
            color="#4fc3f7" border="rgba(79,195,247,0.35)" bg="rgba(79,195,247,0.07)"
            delay={0}
          >
            <Body>
              Under {ML('H_0')} vs {ML('H_{x^*}')}, each match involving {ML('x^*')} shifts
              the Bernoulli parameter by {ML('\\Delta')}.
              The chi-square upper bound on {ML('D_{\\mathrm{KL}}')} gives, for one match:
            </Body>
            <Block
              f={String.raw`D_{\mathrm{KL}}\!\bigl(\mathrm{Bern}(p)\,\big\|\,\mathrm{Bern}(q)\bigr) \;\le\; \frac{(p-q)^2}{q(1-q)} \;\le\; \frac{\Delta^2}{0.25 - \Delta^2}`}
              size="1.2em"
            />
            <Body>
              The denominator {ML('q(1-q)')} is minimised at {ML('q = \\tfrac{1}{2} \\pm \\Delta')}, giving {ML('0.25 - \\Delta^2')}.
              Summing over the {ML('m_{x^*}')} independent matches involving {ML('x^*')}:
            </Body>
            <Block
              f={String.raw`D_{\mathrm{KL}}(H_0 \,\|\, H_{x^*}) \;\le\; \frac{\Delta^2 \cdot m_{x^*}}{0.25 - \Delta^2}`}
              size="1.25em"
            />
          </Card>
        )}
      </AnimatePresence>

      <div style={{ flexShrink: 0, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', opacity: 0.5, minHeight: 16 }}>
        {visible < TOTAL
          ? <>Press <strong>&rarr;</strong> to reveal Step 1 ({visible}/{TOTAL})</>
          : <>All steps shown &mdash; advance to slide 2 for the conclusion</>
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Step 2: Pigeonhole + Step 3: B–H → result
// ══════════════════════════════════════════════════════════════════════════════

const STEP2_ITEMS = [
  { id: 'pigeonhole', delay: 0.05 },
  { id: 'bh',        delay: 0.15 },
];

export function LowerBoundProof2Slide() {
  const TOTAL = STEP2_ITEMS.length;
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowRight' || e.key === ' ') && visible < TOTAL) {
        e.stopPropagation(); e.preventDefault();
        setVisible(v => v + 1);
      } else if (e.key === 'ArrowLeft' && visible > 1) {
        e.stopPropagation(); e.preventDefault();
        setVisible(v => v - 1);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, TOTAL]);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '28px 80px 24px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Theory &middot; Proof &middot; 2 / 2</div>
          <h1 style={{ fontSize: 40, margin: 0, lineHeight: 1.2 }}>
            Proof: <span style={{ color: 'var(--cyan)' }}>Flat Single-Gap Corollary</span>
          </h1>
        </div>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 6 }}>
          {[{ color: '#e8c547' }, { color: '#66bb6a' }].map((s, i) => (
            <div key={i} style={{
              width: i < visible ? 26 : 9, height: 9, borderRadius: 5,
              background: i < visible ? s.color : 'var(--glass-15)',
              transition: 'all 0.3s ease',
              opacity: i < visible ? 0.9 : 0.4,
            }} />
          ))}
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>
            {visible}/{TOTAL}
          </span>
        </div>
      </div>

      {/* Step 2 */}
      <AnimatePresence>
        {visible >= 1 && (
          <Card
            key="pigeonhole"
            pill="Step 2" title="PIGEONHOLE MATCH COUNT"
            color="#e8c547" border="rgba(232,197,71,0.4)" bg="rgba(232,197,71,0.07)"
            delay={0}
          >
            <Body>
              The budget satisfies {ML('\\textstyle\\sum_i m_i = 2B')}.
              Since exactly {ML('N{-}K')} players are forced out of {ML('S')}, by pigeonhole
              at least one rejected player {ML('x^*')} has:
            </Body>
            <Block
              f={String.raw`m_{x^*} \;\le\; \frac{2B}{N - K}`}
              size="1.4em"
            />
            <Body>
              Substitute into the KL bound from Step 1:
            </Body>
            <Block
              f={String.raw`D_{\mathrm{KL}}(H_0 \,\|\, H_{x^*}) \;\le\; \frac{2B\,\Delta^2}{(0.25 - \Delta^2)(N - K)}`}
              size="1.25em"
            />
          </Card>
        )}
      </AnimatePresence>

      {/* Step 3 */}
      <AnimatePresence>
        {visible >= 2 && (
          <Card
            key="bh"
            pill="Step 3" title="BRETAGNOLLE–HUBER  →  RESULT"
            color="#66bb6a" border="rgba(102,187,106,0.45)" bg="rgba(102,187,106,0.08)"
            delay={0}
          >
            <Body>
              The <strong style={{ color: '#66bb6a' }}>Bretagnolle–Huber inequality</strong> states: for any distributions {ML('P, Q')} and event {ML('\\mathcal{E}')},
            </Body>
            <Block
              f={String.raw`P(\mathcal{E}) + Q(\mathcal{E}^c) \;\ge\; \tfrac{1}{2}\,\exp\!\bigl(-D_{\mathrm{KL}}(P \,\|\, Q)\bigr)`}
              size="1.2em"
            />
            <Body>
              Apply with {ML('\\mathcal{E} = \\{\\text{algorithm rejects }x^*\\}')}.
              The adversary places the true winner at {ML('x^*')}, absorbing a factor of {ML('\\tfrac{1}{2}')}.
              Substituting the bound from Steps 1–2 gives the corollary:
            </Body>
            <Block
              f={String.raw`\boxed{\;P(w \notin S) \;\ge\; \frac{1}{4}\exp\!\left(-\frac{2B\Delta^2}{(0.25-\Delta^2)(N-K)}\right)\;}`}
              size="1.4em"
            />
          </Card>
        )}
      </AnimatePresence>

      <div style={{ flexShrink: 0, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', opacity: 0.5, minHeight: 16 }}>
        {visible < TOTAL
          ? <>Press <strong>&rarr;</strong> to reveal the conclusion</>
          : <MathFormula formula="\square\;\text{ Q.E.D.}" style={{ display: 'inline', fontSize: '1.05em' }} />
        }
      </div>
    </div>
  );
}
