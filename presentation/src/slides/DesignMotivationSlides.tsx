import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─────────────────────────────────────────────────────────────────────────────
// Slide 1: 3 sub-steps
//   sub 0 → big centred question
//   sub 1 → bracket tree + P(fail) stats  (GPT-4o LOSES the close final!)
//   sub 2 → second big question
// ─────────────────────────────────────────────────────────────────────────────

const SHOWS8 = [
  { id: 0, name: 'Fable 5',      s: 60, color: '#10b981' },
  { id: 1, name: 'GPT-5.6',      s: 59, color: '#e8c547' },
  { id: 2, name: 'Kimi K3',      s: 57, color: '#4fc3f7' },
  { id: 3, name: 'Gemini 3.5',   s: 50, color: '#ce93d8' },
  { id: 4, name: 'DeepSeek V4',  s: 44, color: '#80cbc4' },
  { id: 5, name: 'Mistral M3.5', s: 30, color: '#ffab40' },
  { id: 6, name: 'Llama 4',      s: 14, color: '#78909c' },
  { id: 7, name: 'Phi-4',        s:  5, color: '#546e7a' },
];

function pWinMajority(p: number, m: number): number {
  let prob = 0;
  const thr = Math.ceil(m / 2);
  for (let j = thr; j <= m; j++) {
    let c = 1;
    for (let k = 0; k < j; k++) c *= (m - k) / (k + 1);
    prob += c * Math.pow(p, j) * Math.pow(1 - p, m - j);
  }
  return prob;
}

function pFail(N: number, m: number, pWin: number): number {
  return 1 - Math.pow(pWinMajority(pWin, m), Math.ceil(Math.log2(N)));
}

// KaTeX helper — renders inline HTML string
function _K({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: display });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// All layout + bracket outcome constants are computed inside TournamentFlawSlide()

export function TournamentFlawSlide() {
  const [sub, setSub] = useState(0);
  const [matchStep, setMatchStep] = useState(0); // 0..7: bracket reveals step by step
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Arrow keys: right advances sub, left goes back
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        setSub(s => {
          if (e.key === 'ArrowLeft') {
            if (s > 0) { e.stopPropagation(); e.preventDefault(); return s - 1; }
            return s; // let App navigate to prev slide
          }
          // Right / Space
          if (s < 2) { e.stopPropagation(); e.preventDefault(); return s + 1; }
          return s; // let App navigate to next slide
        });
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, []);

  // Auto-animate bracket on sub=1
  useEffect(() => {
    if (sub !== 1) return;
    setMatchStep(0);
    let i = 0;
    const tick = () => { i++; setMatchStep(i); if (i < 7) timer.current = setTimeout(tick, 800); };
    timer.current = setTimeout(tick, 500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [sub]);

  // ── Math: t = #times each pair plays. Total budget = t*(N-1). ───────────────
  // P(fail) = 1 - [P_t^win]^{log2(N)}
  // P_t^win = Σ_{j=ceil(t/2)}^t C(t,j) p^j (1-p)^{t-j}
  const N = 8;
  const pWin = 0.57; // true winner's per-game win prob
  const failStats = [1, 3, 5].map(t => ({
    t,
    budget: t * (N - 1), // t*(N-1) total queries
    pf: pFail(N, t, pWin),
  }));

  // ── SVG layout: 4 rounds, left→right ──────────────────────────────────────
  const VH = 460, TNW = 108, TNH = 30, TNR = 6;
  const COL = [6, 168, 318, 462]; // x-start of each round column
  // R1: 8 nodes spread evenly
  const ry1 = Array.from({ length: 8 }, (_, i) => Math.round(24 + i * (VH - 48) / 7));
  // R1-winners (midpoint of each pair)
  const rwy1 = [0,1,2,3].map(i => Math.round((ry1[i*2] + ry1[i*2+1]) / 2));
  // Semi (midpoint of R1-winner pairs)
  const rsemiY = [Math.round((rwy1[0]+rwy1[1])/2), Math.round((rwy1[2]+rwy1[3])/2)];
  const rfinalY = Math.round(VH / 2);

  // Outcomes: Fable 5(0) wins R1, wins R1-winners round, LOSES semi (noisy!) → GPT-5.6(1) wins final
  // scores from artificialanalysis.ai leaderboard (July 2026)
  const r1WinIds = [0, 1, 2, 3];      // id of SHOWS8 winner per R1 pair
  const semiWinIds = [1, 2];           // GPT-5.6(1) upsets Fable 5(0) in semi!
  const finalWinnerId = 1;             // GPT-5.6 wins (WRONG — true best was Fable 5)

  // step visibility helpers
  const r1PairVisible = (pairIdx: number) => matchStep > pairIdx;         // R1 pair done
  const r1WinVisible  = (pairIdx: number) => matchStep > pairIdx;         // R1 winner node
  const semiVisible   = (idx: number)     => matchStep >= 5 + idx;        // Semi nodes
  const finalVisible  = matchStep >= 7;

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>

      {/* ── SUB 0: Big centred question ── */}
      <AnimatePresence>
        {sub === 0 && (
          <motion.div key="q1"
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '0 120px', gap: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.15,
              fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
              Why not just keep running the tournament{' '}
              <span style={{ color: 'var(--gold)' }}>until a winner is clear?</span>
            </div>
            <div style={{ fontSize: 20, color: 'var(--text-secondary)', maxWidth: 680, lineHeight: 1.7 }}>
              Phase 1 gives us a bracket. Could we simply extend it — more rounds, more voters — until we're confident?
            </div>
            <div style={{ fontSize: 13, color: 'var(--glass-25)', letterSpacing: '0.1em' }}>
              press → to find out
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUB 1: Bracket tree + P(fail) ── */}
      <AnimatePresence>
        {sub === 1 && (
          <motion.div key="tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              padding: '16px 52px 10px', gap: 8, overflow: 'hidden' }}>

            <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
              style={{ flexShrink: 0 }}>
              <div className="label" style={{ marginBottom: 4, color: 'var(--gold)' }}>The Tournament Trap</div>
              <h1 style={{ fontSize: 28, margin: 0 }}>
                Keep running until a winner is clear?{' '}
                <span style={{ color: 'var(--red)' }}>Here's the cost.</span>
              </h1>
            </motion.div>

            <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>

              {/* Bracket SVG */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <svg width="100%" height="100%" viewBox={`0 0 620 ${VH}`} preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <filter id="gw"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <filter id="gr"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>

                  {/* R1: 8 entry nodes */}
                  {SHOWS8.map((s, i) => {
                    if (!r1PairVisible(Math.floor(i / 2))) return null;
                    const y = ry1[i];
                    const isTrue = s.id === 0;
                    return (
                      <motion.g key={`r1-${i}`} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 24 }}>
                        {isTrue && <rect x={COL[0]-2} y={y-TNH/2-2} width={TNW+4} height={TNH+4} rx={TNR+2}
                          fill={`${s.color}18`} filter="url(#gw)" />}
                        <rect x={COL[0]} y={y-TNH/2} width={TNW} height={TNH} rx={TNR}
                          fill={isTrue ? `${s.color}20` : 'var(--glass-04)'}
                          stroke={isTrue ? s.color : 'var(--glass-10)'}
                          strokeWidth={isTrue ? 2 : 1} />
                        <text x={COL[0]+TNW/2} y={y+5} textAnchor="middle"
                          fontSize={isTrue ? 12 : 10.5} fontWeight={isTrue ? 700 : 400}
                          fill={isTrue ? s.color : '#78909c'} fontFamily="'Space Grotesk',sans-serif">
                          {s.name} <tspan fontSize={9.5} fill={isTrue ? s.color+'99' : '#455a64'}>({s.s})</tspan>
                        </text>
                      </motion.g>
                    );
                  })}

                  {/* R1 bracket connectors → R1 winners */}
                  {[0,1,2,3].map(p => {
                    if (!r1PairVisible(p)) return null;
                    const ya = ry1[p*2], yb = ry1[p*2+1], ym = rwy1[p];
                    const x1 = COL[0]+TNW, x2 = COL[1];
                    const isTrue = r1WinIds[p] === 0;
                    const m = (x1 + x2) / 2;
                    const c = isTrue ? SHOWS8[0].color : 'var(--glass-15)';
                    const w = isTrue ? 2 : 1;
                    const dash = isTrue ? 'none' : '4,4';
                    return (
                      <motion.g key={`c1-${p}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <path d={`M ${x1} ${ya} C ${m} ${ya}, ${m} ${ym}, ${x2} ${ym}`} fill="none" stroke={c} strokeWidth={w} strokeDasharray={dash} />
                        <path d={`M ${x1} ${yb} C ${m} ${yb}, ${m} ${ym}, ${x2} ${ym}`} fill="none" stroke={c} strokeWidth={w} strokeDasharray={dash} />
                      </motion.g>
                    );
                  })}

                  {/* R1-winner nodes */}
                  {r1WinIds.map((id, p) => {
                    if (!r1WinVisible(p)) return null;
                    const s = SHOWS8[id]; const y = rwy1[p]; const isTrue = id === 0;
                    return (
                      <motion.g key={`rw-${p}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
                        {isTrue && <rect x={COL[1]-2} y={y-TNH/2-2} width={TNW+4} height={TNH+4} rx={TNR+2} fill={`${s.color}14`} filter="url(#gw)"/>}
                        <rect x={COL[1]} y={y-TNH/2} width={TNW} height={TNH} rx={TNR}
                          fill={isTrue ? `${s.color}20` : 'var(--glass-05)'}
                          stroke={isTrue ? s.color : 'var(--glass-12)'} strokeWidth={isTrue?2:1}/>
                        <text x={COL[1]+TNW/2} y={y+5} textAnchor="middle" fontSize={isTrue?12:10.5}
                          fontWeight={isTrue?700:400} fill={isTrue?s.color:'#90a4ae'} fontFamily="'Space Grotesk',sans-serif">
                          {s.name} <tspan fontSize={9.5} fill={isTrue?s.color+'99':'#455a64'}>({s.s})</tspan>
                        </text>
                      </motion.g>
                    );
                  })}

                  {/* R1-winners → Semi connectors */}
                  {[0,1].map(p => {
                    if (!semiVisible(p)) return null;
                    const ya = rwy1[p*2], yb = rwy1[p*2+1], ym = rsemiY[p];
                    const x1 = COL[1]+TNW, x2 = COL[2];
                    const isUpsetPath = p === 0; // top semi is the upset match
                    const m = (x1 + x2) / 2;
                    return (
                      <motion.g key={`c2-${p}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <path d={`M ${x1} ${ya} C ${m} ${ya}, ${m} ${ym}, ${x2} ${ym}`} fill="none" stroke={isUpsetPath ? '#ef535080' : 'var(--glass-15)'} strokeWidth={isUpsetPath?2.5:1} strokeDasharray={isUpsetPath?'none':'4,4'} />
                        <path d={`M ${x1} ${yb} C ${m} ${yb}, ${m} ${ym}, ${x2} ${ym}`} fill="none" stroke={isUpsetPath ? '#ef535080' : 'var(--glass-15)'} strokeWidth={isUpsetPath?2.5:1} strokeDasharray={isUpsetPath?'none':'4,4'} />
                        {isUpsetPath && (
                          <>
                            <text x={m + 80} y={ym-20} textAnchor="middle" fontSize={10} fontWeight={700}
                              fill="#ef5350" fontFamily="'Space Grotesk',sans-serif">⚡ Close match — noisy oracle!</text>
                            <text x={m + 80} y={ym+26} textAnchor="middle" fontSize={9}
                              fill="rgba(239,83,80,0.8)" fontFamily="'Space Grotesk',sans-serif">
                              P(upset) = {((1-pWinMajority(pWin,3))*100).toFixed(0)}%
                            </text>
                          </>
                        )}
                      </motion.g>
                    );
                  })}

                  {/* Semi nodes */}
                  {semiWinIds.map((id, i) => {
                    if (!semiVisible(i)) return null;
                    const s = SHOWS8[id]; const y = rsemiY[i];
                    const isUpsetWinner = i === 0; // Claude won top semi (upset!)
                    return (
                      <motion.g key={`semi-${i}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}>
                        {isUpsetWinner && <rect x={COL[2]-2} y={y-TNH/2-2} width={TNW+4} height={TNH+4} rx={TNR+2} fill="#ef535018" filter="url(#gr)"/>}
                        <rect x={COL[2]} y={y-TNH/2} width={TNW} height={TNH} rx={TNR}
                          fill={isUpsetWinner ? '#ef535022' : 'var(--glass-05)'}
                          stroke={isUpsetWinner ? '#ef5350' : 'var(--glass-15)'} strokeWidth={isUpsetWinner?2:1}/>
                        <text x={COL[2]+TNW/2} y={y+5} textAnchor="middle" fontSize={isUpsetWinner?12:10.5}
                          fontWeight={isUpsetWinner?700:400} fill={isUpsetWinner?s.color:'#90a4ae'} fontFamily="'Space Grotesk',sans-serif">
                          {s.name} <tspan fontSize={9.5} fill={isUpsetWinner?s.color+'99':'#455a64'}>({s.s})</tspan>
                        </text>
                      </motion.g>
                    );
                  })}

                  {/* Semi → Final */}
                  {finalVisible && (() => {
                    const ya = rsemiY[0], yb = rsemiY[1], ym = rfinalY;
                    const x1 = COL[2]+TNW, x2 = COL[3];
                    const m = (x1 + x2) / 2;
                    return (
                      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <path d={`M ${x1} ${ya} C ${m} ${ya}, ${m} ${ym}, ${x2} ${ym}`} fill="none" stroke="#ef535060" strokeWidth={2} />
                        <path d={`M ${x1} ${yb} C ${m} ${yb}, ${m} ${ym}, ${x2} ${ym}`} fill="none" stroke={SHOWS8[finalWinnerId].color} strokeWidth={3} />
                      </motion.g>
                    );
                  })()}

                  {/* Final node — WRONG WINNER */}
                  {finalVisible && (
                    <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 150, damping: 16, delay: 0.2 }}>
                      <rect x={COL[3]-3} y={rfinalY-TNH/2-3} width={TNW+6} height={TNH+6} rx={TNR+3}
                        fill={`${SHOWS8[finalWinnerId].color}20`} filter="url(#gr)"/>
                      <rect x={COL[3]} y={rfinalY-TNH/2} width={TNW} height={TNH} rx={TNR}
                        fill={`${SHOWS8[finalWinnerId].color}25`} stroke={SHOWS8[finalWinnerId].color} strokeWidth={2.5}/>
                      <text x={COL[3]+TNW/2} y={rfinalY+5} textAnchor="middle" fontSize={12} fontWeight={800}
                        fill={SHOWS8[finalWinnerId].color} fontFamily="'Space Grotesk',sans-serif">
                        {SHOWS8[finalWinnerId].name} 🏆
                      </text>
                      <rect x={COL[3]+TNW/2 - 75} y={rfinalY+TNH/2+6} width={150} height={18} rx={9} fill="#ef535018" stroke="#ef535050" strokeWidth={1} />
                      <text x={COL[3]+TNW/2} y={rfinalY+TNH/2+18.5} textAnchor="middle" fontSize={8.5}
                        fill="#ef5350" fontFamily="'Space Grotesk',sans-serif" fontWeight={700} letterSpacing="0.05em">
                        WRONG! True best = Fable 5
                      </text>
                    </motion.g>
                  )}

                  {/* Round labels */}
                  {['R1 (pairs)', 'R1 winners', 'Semi', 'Final'].map((lbl, i) => (
                    <text key={lbl} x={COL[i]+TNW/2} y={VH-4} textAnchor="middle"
                      fontSize={8.5} fill="var(--text-secondary)" fontFamily="'Space Grotesk',sans-serif" letterSpacing="0.8">
                      {lbl.toUpperCase()}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Right: formula + t comparison */}
              <div style={{ width: 420, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>

                {/* KaTeX formula — BIG */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: matchStep >= 3 ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ padding: '26px 28px', borderRadius: 16,
                    background: 'var(--glass-04)', border: '1px solid var(--glass-14)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--glass-50)', letterSpacing: '0.15em', marginBottom: 24 }}>
                    FAILURE PROBABILITY
                  </div>
                  {/* Main equation */}
                  <div style={{ fontSize: '1.3em', textAlign: 'center', marginBottom: 20 }}
                    dangerouslySetInnerHTML={{ __html: katex.renderToString(
                      String.raw`P(\text{fail}) = 1 - \!\left[P_t^{\,\text{win}}\right]^{\!\log_2 N}`,
                      { throwOnError: false, displayMode: true }
                    )}} />
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.85 }}>
                    where&nbsp;
                    <span dangerouslySetInnerHTML={{ __html: katex.renderToString(
                      String.raw`P_t^{\,\text{win}} = \sum_{j=\lceil t/2\rceil}^{t}\binom{t}{j}p^j(1{-}p)^{t-j}`,
                      { throwOnError: false }
                    )}} />
                  </div>
                </motion.div>

                {/* t comparison cards */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: matchStep >= 5 ? 1 : 0 }}
                  transition={{ duration: 0.5 }}>
                  <div style={{ fontSize: 12, color: 'var(--glass-40)', letterSpacing: '0.1em', marginBottom: 16 }}>
                    <span dangerouslySetInnerHTML={{__html: katex.renderToString(String.raw`t = \text{games each pair plays} \;\cdot\; \text{budget} = t(N{-}1)`, {throwOnError:false})}} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {failStats.map(({ t, pf, budget }) => {
                      const c = t === 1 ? '#ef5350' : t === 3 ? '#ffab40' : '#66bb6a';
                      return (
                        <div key={t} style={{ padding: '18px 20px', borderRadius: 14,
                          display: 'flex', alignItems: 'center', gap: 18,
                          background: `linear-gradient(90deg, ${c}15 0%, ${c}04 100%)`, 
                          border: `1px solid ${c}30`, 
                          boxShadow: `0 4px 20px ${c}15` }}>
                          <div style={{ flexShrink: 0, minWidth: 110 }}>
                            <div style={{ fontSize: 32, fontWeight: 900, color: c,
                              fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>t = {t}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 5 }}>
                              {budget} queries total
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ height: 14, borderRadius: 7, background: 'var(--glass-08)', overflow: 'hidden', marginBottom: 5 }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pf * 100}%` }}
                                transition={{ type: 'spring', stiffness: 60, delay: 0.5 }}
                                style={{ height: '100%', borderRadius: 7, background: c }}/>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{__html: katex.renderToString(String.raw`P(\text{fail})`, {throwOnError:false})}} />
                          </div>
                          <div style={{ fontSize: 46, fontWeight: 900, color: c, flexShrink: 0,
                            fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>
                            {(pf * 100).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUB 2: Big centred Q2 ── */}
      <AnimatePresence>
        {sub === 2 && (
          <motion.div key="q2" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '0 120px', gap: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.2,
              fontFamily: "'Space Grotesk',sans-serif", color: 'var(--text-primary)' }}>
              Does a tournament always ask the{' '}
              <span style={{ color: 'var(--cyan)' }}>most useful question</span> next?
            </div>
            <div style={{ fontSize: 20, color: 'var(--text-secondary)', maxWidth: 700, lineHeight: 1.7 }}>
              The bracket is fixed before any results come in. It can't adapt.{' '}
              <strong style={{ color: 'var(--text-primary)' }}>What if we could choose each pair based on what we've already learned?</strong>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide 2: Info vs Gap (placeholder — unchanged for now)
// ─────────────────────────────────────────────────────────────────────────────
export function InfoGapSlide() {
  const [delta, setDelta] = useState(400);
  const base = 1500;
  const wA = base + delta / 2;
  const wB = base - delta / 2;
  const pA = wA / (wA + wB);
  const samplesNeeded = Math.round(10000 / (delta * delta / 100000 + 0.1));
  const fisherInfo = 4 * pA * (1 - pA);
  const infoNorm = Math.min(fisherInfo / 1, 1);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', padding: '20px 72px 16px', gap: 16, background: 'var(--bg)', overflow: 'hidden' }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="label" style={{ marginBottom: 4, color: 'var(--gold)' }}>The Core Insight</div>
        <h1 style={{ fontSize: 38, margin: 0 }}>
          Close matchups carry <span style={{ color: 'var(--gold)' }}>more information</span>
        </h1>
      </motion.div>
      <div style={{ flex: 1, display: 'flex', gap: 28, minHeight: 0, alignItems: 'stretch' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label: 'Item i', w: wA, color: '#e8c547' }, { label: 'Item j', w: wB, color: '#4fc3f7' }].map(item => (
              <motion.div key={item.label} layout style={{ flex: 1, padding: '16px', borderRadius: 12, textAlign: 'center', background: `${item.color}12`, border: `1px solid ${item.color}40` }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: item.color, fontFamily: "'Space Grotesk', sans-serif" }}>{Math.round(item.w).toLocaleString()}</div>
              </motion.div>
            ))}
          </div>
          <div style={{ padding: '18px 20px', borderRadius: 12, background: 'var(--glass-03)', border: '1px solid var(--glass-08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{__html: katex.renderToString(String.raw`\text{Strength gap } \Delta_{ij}`, {throwOnError:false})}} />
              <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>{delta}</span>
            </div>
            <input type="range" min={20} max={1400} value={delta} onChange={e => setDelta(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--glass-30)', marginTop: 6 }}>
              <span>Close (Δ→0)</span><span>Lopsided (Δ large)</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Win prob P(i ≻ j)', value: `${(pA * 100).toFixed(1)}%`, color: '#e8c547', sub: delta < 200 ? 'Dangerously close' : delta > 800 ? 'Almost certain' : 'Clear edge' },
              { label: 'Information per query', value: `${(infoNorm * 100).toFixed(0)}%`, color: infoNorm > 0.7 ? '#66bb6a' : infoNorm > 0.35 ? '#ffab40' : '#ef5350', sub: infoNorm > 0.7 ? 'High — worth asking' : infoNorm > 0.35 ? 'Medium' : 'Low — skip this pair' },
              { label: 'Queries to resolve', value: samplesNeeded > 9999 ? '>10k' : samplesNeeded.toLocaleString(), color: samplesNeeded > 500 ? '#ef5350' : '#66bb6a', sub: `to confirm winner at Δ=${delta}` },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'var(--glass-03)', border: '1px solid var(--glass-08)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Information per query — peaks when gap is zero</div>
            <div style={{ height: 14, borderRadius: 7, background: 'var(--glass-07)', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${infoNorm * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                style={{ height: '100%', borderRadius: 7, background: `linear-gradient(90deg, #66bb6a, #e8c547)` }} />
            </div>
          </div>
        </div>
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🎯', title: 'Close matchup (small Δ)', body: 'The result is genuinely uncertain. Each query resolves real doubt about who is better.', highlight: true, color: 'var(--gold)' },
            { icon: '💤', title: 'Lopsided matchup (large Δ)', body: 'Result is obvious. You spend a query confirming what you already knew — budget wasted.', highlight: false, color: 'var(--text-secondary)' },
            { icon: '📐', title: 'The math behind it', body: 'To separate items with gap Δ you need ≥ 1/Δ² queries on that edge. Small Δ → exponentially more queries needed.', highlight: false, color: 'var(--cyan)' },
          ].map(item => (
            <motion.div key={item.title} layout style={{ padding: '16px', borderRadius: 12, background: item.highlight ? `rgba(232,197,71,0.06)` : 'var(--glass-03)', border: `1px solid ${item.highlight ? 'rgba(232,197,71,0.3)' : 'var(--glass-08)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.color, fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</div>
              </div>
              {item.title === 'The math behind it'
                ? <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    To separate items with gap <span dangerouslySetInnerHTML={{__html: katex.renderToString(String.raw`\Delta`, {throwOnError:false})}} /> you need{' '}
                    <span dangerouslySetInnerHTML={{__html: katex.renderToString(String.raw`\geq 1/\Delta^2`, {throwOnError:false})}} /> queries on that edge.
                    Small <span dangerouslySetInnerHTML={{__html: katex.renderToString(String.raw`\Delta`, {throwOnError:false})}} /> → exponentially more queries needed.
                  </div>
                : <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.body}</div>
              }
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide 3: Standard design fails (placeholder — unchanged for now)
// ─────────────────────────────────────────────────────────────────────────────
export function AOptimalTrapSlide() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-secondary)' }}>
      Slide 3 — coming next
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide 4: WiSDoM Objective (placeholder — unchanged for now)
// ─────────────────────────────────────────────────────────────────────────────
export function WisdomObjectiveSlide() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-secondary)' }}>
      Slide 4 — coming next
    </div>
  );
}
