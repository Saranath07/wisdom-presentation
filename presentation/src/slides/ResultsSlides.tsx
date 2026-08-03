import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

// ── Types & constants ─────────────────────────────────────────────────────────
interface DataRow { budget: number; [algo: string]: number }

const ALGOS = [
  { key: 'Robust-FW', label: 'WiSDoM',    color: 'var(--gold)', width: 3   },
  { key: 'PARWiS',    label: 'PARWiS',    color: '#4fc3f7', width: 1.8 },
  { key: 'SELECT',    label: 'SELECT',    color: '#ef5350', width: 1.5 },
  { key: 'RUCB',      label: 'RUCB',      color: '#ce93d8', width: 1.5 },
  { key: 'MultiSort', label: 'MultiSort', color: '#80cbc4', width: 1.5 },
  { key: 'Knockout',  label: 'Knockout',  color: '#ffb74d', width: 1.5 },
];

const K_VALUES = [25, 50, 75, 85, 90, 95] as const;
type KVal = typeof K_VALUES[number];

const METRIC_INFO = {
  ACC: { label: 'Top-1 Accuracy', desc: 'Fraction of trials where the algorithm returned the true winner. Higher is better.', higher: true  },
  CT:  { label: 'Predicted Rank (CT)', desc: 'True rank of the predicted winner. Lower is better. 1 = perfect.', higher: false },
  PF:  { label: 'True Winner Rank (PF)', desc: 'Rank assigned to the true winner. Lower is better. 1 = true winner ranked #1.', higher: false },
} as const;
type MetricKey = keyof typeof METRIC_INFO;

// ── CSV loader ────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;
async function loadCSV(path: string): Promise<DataRow[]> {
  const r = await fetch(BASE + path.replace(/^\//, ''));
  if (!r.ok) return [];
  const text = await r.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const row: DataRow = { budget: 0 };
    headers.forEach((h, i) => {
      if (h === 'Budget') row.budget = parseFloat(vals[i]);
      else if (h.endsWith('_mean')) row[h.replace('_mean', '')] = parseFloat(vals[i]) || 0;
    });
    return row;
  });
}

// ── Line chart ────────────────────────────────────────────────────────────────
function LineChart({
  data, width = 600, height = 280, yLabel, higherBetter,
}: {
  data: DataRow[]; width?: number; height?: number; yLabel?: string; higherBetter?: boolean;
}) {
  if (!data.length) return (
    <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--glass-30)', fontSize: 15 }}>Loading…</div>
  );

  const PAD = { top: 20, right: 20, bottom: 40, left: 52 };
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;

  // Dynamic Y range
  const allVals = ALGOS.flatMap(a => data.map(d => d[a.key] ?? 0)).filter(v => isFinite(v));
  const rawMin = Math.min(...allVals), rawMax = Math.max(...allVals);
  const pad = (rawMax - rawMin) * 0.08;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;
  const xMax = Math.max(...data.map(d => d.budget));

  const sx = (x: number) => (x / xMax) * W;
  const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

  // Y ticks: 5 evenly spaced
  const yRange = yMax - yMin;
  const step = parseFloat((yRange / 4).toPrecision(2));
  const yTicks: number[] = [];
  for (let i = 0; i <= 4; i++) yTicks.push(parseFloat((yMin + step * i).toPrecision(3)));

  const xTicks = [1, Math.round(xMax * 0.25), Math.round(xMax * 0.5), Math.round(xMax * 0.75), xMax];

  const pathFor = (key: string) => {
    const pts = data.map(d => [sx(d.budget), sy(d[key] ?? yMin)]);
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  };

  const fmt = (v: number) => v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {/* Grid */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={0} y1={sy(t)} x2={W} y2={sy(t)} stroke="var(--glass-07)" strokeWidth={1} />
            <text x={-8} y={sy(t) + 4} textAnchor="end" fill="var(--text-secondary)" fontSize={16}>{fmt(t)}</text>
          </g>
        ))}
        {xTicks.map(t => (
          <text key={t} x={sx(t)} y={H + 22} textAnchor="middle" fill="var(--text-secondary)" fontSize={16}>{t}</text>
        ))}
        {/* Axis labels */}
        <text x={W / 2} y={H + 36} textAnchor="middle" fill="var(--text-secondary)" fontSize={16}>Budget</text>
        {yLabel && (
          <text x={-38} y={H / 2} textAnchor="middle" fill="var(--text-secondary)" fontSize={16}
            transform={`rotate(-90,-38,${H / 2})`}>{yLabel}</text>
        )}
        {/* Higher/lower label */}
        <text x={W} y={-6} textAnchor="end" fill="var(--text-secondary)" fontSize={11}>
          {higherBetter ? '↑ higher better' : '↓ lower better'}
        </text>
        {/* Lines — non-WiSDoM faded */}
        {ALGOS.filter(a => a.key !== 'Robust-FW').map(a => (
          <path key={a.key} d={pathFor(a.key)} fill="none"
            stroke={a.color} strokeWidth={a.width} strokeOpacity={0.75} />
        ))}
        {/* WiSDoM last (on top) */}
        <path d={pathFor('Robust-FW')} fill="none" stroke="var(--gold)" strokeWidth={3} />
        {/* Endpoint dot */}
        {(() => {
          const last = data[data.length - 1];
          const y = last['Robust-FW'] ?? yMin;
          return <circle cx={sx(last.budget)} cy={sy(y)} r={5} fill="var(--gold)" />;
        })()}
      </g>
    </svg>
  );
}

function Legend({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: compact ? 10 : 16, flexWrap: 'wrap', alignItems: 'center' }}>
      {ALGOS.map(a => (
        <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: a.key === 'Robust-FW' ? 20 : 14,
            height: a.key === 'Robust-FW' ? 3 : 2,
            background: a.color, borderRadius: 2,
            opacity: a.key === 'Robust-FW' ? 1 : 0.9,
          }} />
          <span style={{
            fontSize: compact ? 12 : 13,
            color: a.key === 'Robust-FW' ? a.color : 'var(--text-secondary)',
            fontWeight: a.key === 'Robust-FW' ? 700 : 400,
          }}>{a.label}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// THEORY SLIDE 1 — Lower-bound theorem
// ══════════════════════════════════════════════════════════════════════════════
export function LowerBoundTheoremSlide() {
  const ML = (f: string) => <MathFormula formula={f} style={{ display: 'inline', fontSize: '1.05em' }} />;
  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '18px 80px 30px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden', justifyContent: 'center',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 6 }}>Theory</div>
        <h1 style={{ fontSize: 42, margin: 0, lineHeight: 1.2 }}>
          Information-theoretic <span style={{ color: 'var(--gold)' }}>lower bound</span> on failure
        </h1>
      </div>

      {/* Setup — pure LaTeX */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ padding: '20px 28px', borderRadius: 14, background: 'var(--glass-03)', border: '1px solid var(--glass-10)', flexShrink: 0 }}
      >
        <MathFormula
          formula={String.raw`\text{Winner }w,\quad L\text{ challenger tiers }G_1,\ldots,G_L\text{ of sizes }n_1,\ldots,n_L,\quad B\text{ pairwise queries.}`}
          block style={{ fontSize: '1.25em' }}
        />
        <div style={{ marginTop: 10 }}>
          <MathFormula
            formula={String.raw`\Delta_\ell = \textstyle\sum_{j\le\ell}\delta_j \;(\text{cumulative gap}),\qquad \ell^* = \min\!\bigl\{\ell : K < 1+{\textstyle\sum_{j=1}^\ell n_j}\bigr\} \;(\text{critical tier})`}
            block style={{ fontSize: '1.2em' }}
          />
        </div>
      </motion.div>

      {/* Theorem — full LaTeX, large */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 130, damping: 22 }}
        style={{ padding: '26px 36px', borderRadius: 18, background: 'rgba(232,197,71,0.07)', border: '2px solid rgba(232,197,71,0.5)', flexShrink: 0 }}
      >
        <div style={{ fontSize: 15, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>
          THEOREM 1 — MULTI-TIER LOWER BOUND &nbsp;(proof in supplementary)
        </div>
        <MathFormula
          formula={String.raw`P(w \notin S) \;\geq\; \frac{1}{4}\exp\!\left(-\;\frac{2B\,\Delta_{\ell^*}^2}{\Bigl(0.25 - \Delta_{\ell^*}^2\Bigr)\!\Bigl(\sum_{j \le \ell^*} n_j - K + 1\Bigr)}\right)`}
          block style={{ fontSize: '2.2em' }}
        />
        <div style={{ marginTop: 14, fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {ML('S')} = returned set of size {ML('K')}. &nbsp;
          Bound is <strong style={{ color: 'var(--gold)' }}>exponential in {ML('B\\Delta_{\\ell^*}^2/(N-K)')}</strong> — the same quantity WiSDoM minimises.
        </div>
      </motion.div>

      {/* Corollary — 2 lines only */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
        style={{ padding: '20px 28px', borderRadius: 14, background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.3)', flexShrink: 0 }}
      >
        <div style={{ fontSize: 15, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
          COROLLARY — FLAT SINGLE-GAP REGIME
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <MathFormula
            formula={String.raw`P(w \notin S) \;\geq\; \frac{1}{4}\exp\!\left(-\frac{2B\Delta^2}{(0.25 - \Delta^2)(N-K)}\right)`}
            block style={{ fontSize: '1.85em' }}
          />
          <div style={{ fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1.7, flex: 1 }}>
            {ML('\\log P(\\text{fail})')} is <strong style={{ color: 'var(--cyan)' }}>linear in {ML('\\displaystyle\\frac{\\delta_1^2}{0.25-\\delta_1^2}')}</strong>.{' '}
            Empirical slope {ML('\\approx -1.5')} vs bound slope {ML('-10.1')} — verified next slide.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// THEORY SLIDE 2 — Empirical validation (interactive log P(fail) plot)
// ══════════════════════════════════════════════════════════════════════════════

interface LBRow { d: number; delta: number; acc: number; p_fail: number; lb_new: number; lb_old: number; x_axis: number }

async function loadLBData(): Promise<LBRow[]> {
  const r = await fetch(BASE + 'data/lb_validation_data.csv');
  const text = await r.text();
  const lines = text.trim().split('\n').slice(1);
  return lines.map(l => {
    const [d, delta, acc, p_fail, lb_new, lb_old, x_axis] = l.split(',').map(Number);
    return { d, delta, acc, p_fail, lb_new, lb_old, x_axis };
  }).filter(r => isFinite(r.x_axis) && r.p_fail > 0);
}

export function EmpiricalValidationSlide() {
  const ML2 = (f: string) => <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />;
  const [rows, setRows] = useState<LBRow[]>([]);
  const [hovered, setHovered] = useState<LBRow | null>(null);

  useEffect(() => { loadLBData().then(setRows); }, []);

  // SVG chart: log P(fail) vs x = δ₁²/(0.25−δ₁²)
  // Use a large logical canvas rendered via viewBox so it stretches to fill
  const W = 900, H = 520;
  const PAD = { top: 30, right: 36, bottom: 64, left: 76 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const xMax = rows.length ? Math.max(...rows.map(r => r.x_axis)) * 1.05 : 2.5;
  const logPFails = rows.map(r => Math.log10(r.p_fail));
  // Only show LB where it's non-trivially small (> 1e-6) to avoid off-screen points
  const validLB = rows.filter(r => r.lb_new > 1e-6);
  const logLBNew = validLB.map(r => Math.log10(r.lb_new));
  const yMin = Math.max(Math.min(...logPFails, ...logLBNew) - 0.4, -6);
  const yMax = 0.3;

  const sx = (x: number) => (x / xMax) * cW;
  const sy = (y: number) => cH - ((y - yMin) / (yMax - yMin)) * cH;

  const ptPath = (ys: number[], xs: number[]) =>
    ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${sx(xs[i]).toFixed(1)},${sy(y).toFixed(1)}`).join(' ');

  // Regression line for empirical: slope ≈ -1.5
  // Fit a simple line through the first and last empirical point for annotation
  const firstR = rows[0], lastR = rows[rows.length - 1];
  const _empSlope = firstR && lastR
    ? (Math.log10(lastR.p_fail) - Math.log10(firstR.p_fail)) / (lastR.x_axis - firstR.x_axis)
    : -1.5;

  const yTicks = [-5, -4, -3, -2, -1, 0];
  const xTicks = [0, 0.5, 1.0, 1.5, 2.0];

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '16px 60px 30px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>Theory · Empirical Validation</div>
        <h1 style={{ fontSize: 38, margin: 0 }}>
          {ML2('\\log P(\\text{fail})')} is linear in {ML2('\\delta_1^2/(0.25 - \\delta_1^2)')} — <span style={{ color: 'var(--gold)' }}>bound confirmed</span>
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>

        {/* Left: chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <div style={{ padding: '14px 18px', borderRadius: 14, background: 'var(--glass-02)', border: '1px solid var(--glass-09)', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { color: 'var(--gold)', label: 'WiSDoM empirical', slope: '-1.5', dashed: false },
                  { color: '#ef5350', label: 'Lower bound (Thm 1)', slope: '-10.1', dashed: true },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <svg width={28} height={12}><line x1={0} y1={6} x2={28} y2={6} stroke={l.color} strokeWidth={2} strokeDasharray={l.dashed ? '4,3' : undefined} /></svg>
                    <div>
                      <span style={{ fontSize: 13, color: l.color, fontWeight: 700 }}>{l.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>slope {l.slope}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                N=100, B=500, M=4 · 100 trials per <MathFormula formula="\delta_1" style={{ display: 'inline' }} /> · hover for details
              </div>
            </div>

            {rows.length > 0 ? (
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <g transform={`translate(${PAD.left},${PAD.top})`}>
                  {/* Grid */}
                  {yTicks.map(t => (
                    <g key={t}>
                      <line x1={0} y1={sy(t)} x2={cW} y2={sy(t)} stroke="var(--glass-07)" strokeWidth={1} />
                      <text x={-10} y={sy(t) + 4} textAnchor="end" fill="var(--text-secondary)" fontSize={16}>{t}</text>
                    </g>
                  ))}
                  {xTicks.map(t => (
                    <text key={t} x={sx(t)} y={cH + 22} textAnchor="middle" fill="var(--text-secondary)" fontSize={16}>{t.toFixed(1)}</text>
                  ))}
                  {/* Axis labels */}
                  <text x={cW / 2} y={cH + 42} textAnchor="middle" fill="var(--text-secondary)" fontSize={17}>δ₁² / (0.25 - δ₁²)</text>
                  <text x={-48} y={cH / 2} textAnchor="middle" fill="var(--text-secondary)" fontSize={17} transform={`rotate(-90,-48,${cH/2})`}>log₁₀ P(fail)</text>

                  {/* Empirical points + path */}
                  <path d={ptPath(logPFails, rows.map(r => r.x_axis))} fill="none" stroke="var(--gold)" strokeWidth={2} />
                  {rows.map((r, i) => (
                    <circle key={i}
                      cx={sx(r.x_axis)} cy={sy(Math.log10(r.p_fail))} r={hovered?.d === r.d ? 8 : 5}
                      fill="var(--gold)" fillOpacity={hovered?.d === r.d ? 1 : 0.85}
                      style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                      onMouseEnter={() => setHovered(r)} onMouseLeave={() => setHovered(null)}
                    />
                  ))}

                  {/* Lower bound path — only where LB is visible */}
                  <path d={ptPath(logLBNew, validLB.map(r => r.x_axis))} fill="none" stroke="#ef5350" strokeWidth={2} strokeDasharray="5,3" strokeOpacity={0.9} />
                  {validLB.map((r, i) => (
                    <rect key={i}
                      x={sx(r.x_axis) - 5} y={sy(Math.log10(r.lb_new)) - 5} width={10} height={10}
                      fill="#ef5350" fillOpacity={0.85}
                    />
                  ))}

                  {/* Hover tooltip */}
                  {hovered && (() => {
                    const cx = sx(hovered.x_axis), cy = sy(Math.log10(hovered.p_fail));
                    const tx = cx > cW * 0.7 ? cx - 160 : cx + 12;
                    return (
                      <g>
                        <rect x={tx} y={cy - 44} width={190} height={80} rx={6} fill="var(--bg)" stroke="rgba(232,197,71,0.5)" strokeWidth={1} />
                        <text x={tx + 8} y={cy - 26} fill="var(--gold)" fontSize={16} fontWeight={700}>δ₁ = {hovered.delta.toFixed(3)}</text>
                        <text x={tx + 8} y={cy - 10} fill="var(--text-secondary)" fontSize={14}>P(fail) = {hovered.p_fail.toFixed(3)}</text>
                        <text x={tx + 8} y={cy + 6} fill="var(--text-secondary)" fontSize={14}>ACC = {hovered.acc.toFixed(2)}</text>
                        <text x={tx + 8} y={cy + 20} fill="#ef5350" fontSize={14}>LB = {hovered.lb_new.toFixed(4)}</text>
                      </g>
                    );
                  })()}
                </g>
              </svg>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--glass-30)', fontSize: 16 }}>Loading…</div>
            )}
          </div>
        </div>

        {/* Right: interpretation */}
        <div style={{ width: 310, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(232,197,71,0.07)', border: '1.5px solid rgba(232,197,71,0.35)', fontSize: 20, lineHeight: 1.7 }}>
            <div style={{ fontSize: 16, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>WHAT WE'RE CHECKING</div>
            The corollary predicts {ML2('\\log P(\\text{fail})')} is linear in{' '}
            {ML2('x = \\delta_1^2/(0.25-\\delta_1^2)')}. If the bound is tight, the empirical curve should be a straight line.
          </div>

          <div style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--glass-03)', border: '1px solid var(--glass-09)', fontSize: 17, lineHeight: 1.7, flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>RESULT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Empirical slope: </span>
                <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--gold)' }}>−1.5</span>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>WiSDoM log P(fail) is linear ✓</div>
              </div>
              <div>
                <span style={{ color: '#ef5350', fontWeight: 700 }}>Bound slope: </span>
                <span style={{ fontSize: 19, fontWeight: 800, color: '#ef5350' }}>−10.1</span>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>The bound is loose by ~7×</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(79,195,247,0.07)', border: '1px solid rgba(79,195,247,0.3)', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Both curves are linear — confirming the <strong style={{ color: 'var(--cyan)' }}>exponential decay form</strong> of the bound. Closing the gap between {ML2('-1.5')} and {ML2('-10.1')} is the main open theoretical question.
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 0 — Experiment setup explainer (synthetic difficulty + metrics)
// ══════════════════════════════════════════════════════════════════════════════
export function ExperimentSetupSlide() {
  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '18px 64px 30px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>Experiments</div>
        <h1 style={{ fontSize: 40, margin: 0 }}>
          Setup: <span style={{ color: 'var(--gold)' }}>difficulty</span> and <span style={{ color: 'var(--cyan)' }}>metrics</span>
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>

        {/* Left: synthetic difficulty */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ padding: '20px 28px', borderRadius: 16, background: 'rgba(232,197,71,0.06)', border: '1px solid rgba(232,197,71,0.25)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
            <div style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em' }}>
              SYNTHETIC BTL — DIFFICULTY PARAMETER k &nbsp;·&nbsp; N=100, winner score=100, others ~U(0,k)
            </div>

            {([25, 75, 95] as KVal[]).map(kv => {
              const gap = 100 - kv;
              const diffColor = gap > 50 ? '#66bb6a' : gap > 10 ? '#ffb74d' : '#ef9a9a';
              const diffLabel = gap > 50 ? 'Easy' : gap > 10 ? 'Hard' : 'Very hard';
              return (
                <div key={kv}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>k = {kv}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: diffColor }}>{diffLabel} — min gap <MathFormula formula={`\\geq ${gap}`} style={{ display:'inline' }} /></span>
                  </div>
                  <div style={{ position: 'relative', height: 44, background: 'var(--glass-04)', borderRadius: 10 }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${kv}%`, borderRadius: '10px 0 0 10px',
                      background: 'rgba(79,195,247,0.22)', border: '1px solid rgba(79,195,247,0.35)',
                    }} />
                    <div style={{
                      position: 'absolute', left: `${kv}%`, top: 0, bottom: 0,
                      width: `${gap}%`, borderRadius: '0 10px 10px 0',
                      background: 'rgba(239,83,80,0.18)', border: '1px solid rgba(239,83,80,0.35)',
                    }} />
                    <div style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0, width: 10,
                      background: 'var(--gold)', borderRadius: '0 10px 10px 0',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 14, color: "rgba(79,195,247,0.75)" }}>non-winners ∈ U(0,{kv})</span>
                    <span style={{ fontSize: 14, color: '#ef9a9a' }}>gap ≥ {gap}</span>
                    <span style={{ fontSize: 14, color: 'var(--gold)' }}>winner = 100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right: metrics */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ padding: '18px 24px', borderRadius: 16, background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.25)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14, flexShrink: 0 }}>EVALUATION METRICS</div>

            {[
              { name: 'ACC', full: 'Accuracy — Correct Winner', color: '#66bb6a', higher: true,  formula: String.raw`\mathbf{1}\bigl[\hat\imath = i^*\bigr]` },
              { name: 'CT',  full: 'Competitor Rank — Rank of predicted winner', color: '#ffb74d', higher: false, formula: String.raw`\text{rank}(\hat\imath)` },
              { name: 'PF',  full: 'Predicted Final — Rank of true winner', color: '#ef9a9a', higher: false, formula: String.raw`\text{rank}(i^*)` },
            ].map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{
                  flex: 1, padding: '0 28px', borderRadius: 16,
                  background: `${m.color}10`, border: `1.5px solid ${m.color}44`,
                  display: 'flex', alignItems: 'center', gap: 28,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80, flexShrink: 0 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: m.color, fontFamily: "'Space Grotesk',sans-serif" }}>{m.name}</span>
                  <span style={{ fontSize: 15, color: m.higher ? '#66bb6a' : '#ffb74d', fontWeight: 700 }}>
                    {m.higher ? '↑ higher' : '↓ lower'}
                  </span>
                </div>
                <MathFormula formula={m.formula} block style={{ fontSize: '2.2em', flex: 1, textAlign: 'center' }} />
                <div style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 180, lineHeight: 1.5, flexShrink: 0 }}>{m.full}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Synthetic results: interactive k + metric
// ══════════════════════════════════════════════════════════════════════════════
export function SyntheticResultsSlide() {
  const [k, setK] = useState<KVal>(75);
  const [metric, setMetric] = useState<MetricKey>('ACC');
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    loadCSV(`/data/synthetic_${metric}_k${k}.csv`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [k, metric]);

  useEffect(() => { load(); }, [load]);

  const mInfo = METRIC_INFO[metric];
  const last = data[data.length - 1];
  const wisdomFinal = last?.['Robust-FW'] ?? 0;
  const secondBest = last ? Math.max(...ALGOS.filter(a => a.key !== 'Robust-FW').map(a => last[a.key] ?? 0)) : 0;

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '14px 56px 30px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>Experiments · Synthetic BTL</div>
        <h1 style={{ fontSize: 36, margin: 0 }}>
          {mInfo.label} vs Budget — <span style={{ color: 'var(--gold)' }}>interactive difficulty</span>
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0 }}>

        {/* Controls column */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Metric */}
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--glass-03)', border: '1px solid var(--glass-09)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 8 }}>METRIC</div>
            {(['ACC', 'CT', 'PF'] as MetricKey[]).map(m => (
              <button key={m} onClick={() => setMetric(m)} style={{
                display: 'block', width: '100%', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                marginBottom: 5, textAlign: 'left',
                background: metric === m ? 'rgba(232,197,71,0.15)' : 'var(--glass-03)',
                border: `1.5px solid ${metric === m ? 'rgba(232,197,71,0.5)' : 'var(--glass-08)'}`,
                color: metric === m ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: 14, fontWeight: metric === m ? 700 : 400,
              }}>
                <div>{m} — {METRIC_INFO[m].label.split(' ')[0]}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{METRIC_INFO[m].higher ? '↑ higher better' : '↓ lower better'}</div>
              </button>
            ))}
          </div>

          {/* k selector */}
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--glass-03)', border: '1px solid var(--glass-09)', flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 8 }}>DIFFICULTY k</div>
            {K_VALUES.map(kv => {
              const hardness = kv <= 25 ? 'Easy' : kv <= 75 ? 'Hard' : kv <= 90 ? 'Med' : 'V.Hard';
              // Note: k=25 means gap≥75 (easy), k=95 means gap≥5 (hardest)
              const hardnessColor = kv <= 50 ? '#66bb6a' : kv <= 75 ? '#ffb74d' : '#ef9a9a';
              return (
                <button key={kv} onClick={() => setK(kv)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 5,
                  background: k === kv ? 'rgba(232,197,71,0.15)' : 'var(--glass-03)',
                  border: `1.5px solid ${k === kv ? 'rgba(232,197,71,0.5)' : 'var(--glass-08)'}`,
                  color: k === kv ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: k === kv ? 700 : 400,
                }}>
                  <span>k = {kv}</span>
                  <span style={{ fontSize: 11, color: hardnessColor }}>{hardness}</span>
                </button>
              );
            })}
          </div>

          {/* Metric description */}
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--glass-03)', border: '1px solid var(--glass-08)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {mInfo.desc}
          </div>
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <div style={{ flex: 1, padding: '16px 20px', borderRadius: 16, background: 'var(--glass-02)', border: '1px solid var(--glass-09)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                k = {k} &nbsp;·&nbsp;
                <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 13 }}>
                  <MathFormula formula={`\\text{min gap} \\geq ${100 - k},\\; N{=}100,\\; B{=}500`} style={{ display: 'inline' }} />
                </span>
              </div>
              <Legend compact />
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading
                ? <div style={{ color: 'var(--glass-30)', fontSize: 15 }}>Loading…</div>
                : <motion.div key={`${k}-${metric}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                    <LineChart data={data} width={900} height={380} yLabel={mInfo.label} higherBetter={mInfo.higher} />
                  </motion.div>
              }
            </div>
          </div>

          {/* Stats bar */}
          {last && (
            <div style={{ flexShrink: 0, padding: '12px 20px', borderRadius: 12, background: 'rgba(232,197,71,0.08)', border: '1px solid rgba(232,197,71,0.3)', display: 'flex', gap: 24, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>WiSDoM @ B=500</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>
                  {mInfo.higher ? `${(wisdomFinal * 100).toFixed(1)}%` : wisdomFinal.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>2nd best @ B=500</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {mInfo.higher ? `${(secondBest * 100).toFixed(1)}%` : secondBest.toFixed(1)}
                </div>
              </div>
              {mInfo.higher && (
                <div style={{ fontSize: 15, color: 'var(--text-secondary)', flex: 1 }}>
                  Lead: <strong style={{ color: 'var(--gold)' }}>+{((wisdomFinal - secondBest) * 100).toFixed(1)} pp</strong>
                </div>
              )}
              {!mInfo.higher && (
                <div style={{ fontSize: 15, color: 'var(--text-secondary)', flex: 1 }}>
                  WiSDoM improvement: <strong style={{ color: 'var(--gold)' }}>−{(secondBest - wisdomFinal).toFixed(1)}</strong> vs 2nd best
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Real-world results
// ══════════════════════════════════════════════════════════════════════════════
const REAL_DATASETS = [
  { key: 'arena',          label: 'Chatbot Arena',   desc: 'Top-20 LLMs, N=20, human prefs', difficulty: 'Hard' as const },
  { key: 'netflix',        label: 'Netflix',         desc: 'N=20, B=100',                    difficulty: 'Hard' as const },
  { key: 'movielens',      label: 'MovieLens',       desc: 'N=20, B=100',                    difficulty: 'Hard' as const },
  { key: 'dmcontrol_T100', label: 'DMControl T=100', desc: 'N=100, hard regime',             difficulty: 'Hard' as const },
  { key: 'dmcontrol_T200', label: 'DMControl T=200', desc: 'N=100, hardest regime',          difficulty: 'Hard' as const },
  { key: 'dmcontrol_T20',  label: 'DMControl T=20',  desc: 'N=100, easy regime',             difficulty: 'Easy' as const },
  { key: 'jester',         label: 'Jester',          desc: 'Joke ratings, N=20, B=100',      difficulty: 'Easy' as const },
  { key: 'sushi-B',        label: 'Sushi-B',         desc: 'Sushi prefs, N=20, B=100',       difficulty: 'Easy' as const },
];

const DS_COLORS: Record<string, string> = {
  arena: '#e8c547', netflix: '#ef5350', movielens: '#4fc3f7',
  dmcontrol_T100: '#ce93d8', dmcontrol_T200: '#80cbc4', dmcontrol_T20: '#a5d6a7',
  jester: '#ffb74d', 'sushi-B': '#f06292',
};

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE: Real-world dataset descriptions
// ══════════════════════════════════════════════════════════════════════════════
const ML = (f: string) => <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />;

interface DSDesc {
  key: string; label: string; color: string; difficulty: string; hard: boolean;
  icon: string; N: number; B: number;
  what: React.ReactNode; pairwise: React.ReactNode; why: React.ReactNode;
}

const RW_DATASETS_DESC: DSDesc[] = [
  {
    key: 'dmcontrol',
    label: 'DMControl (MuJoCo)',
    color: '#ce93d8',
    difficulty: 'Hard (T=100, T=200) · Easy (T=20)',
    hard: true, icon: '🤖', N: 100, B: 500,
    what: <>{ML('N=100')} open-loop walker policies. Each policy runs for 150 steps and returns cumulative reward {ML('r_i')}.</>,
    pairwise: <>A query on pair {ML('(i,j)')} draws Bernoulli{ML('\\left(\\frac{s_i}{s_i+s_j}\\right)')} where {ML('s_i = \\exp(r_i/T)')}. Temperature {ML('T')} controls difficulty — higher {ML('T')} compresses scores, making comparisons noisier.</>,
    why: <>Hardest benchmark: semi-synthetic with real physics, ground truth known. {ML('T=200')} makes top policies nearly indistinguishable.</>,
  },
  {
    key: 'arena',
    label: 'Chatbot Arena',
    color: 'var(--gold)',
    difficulty: 'Hard', hard: true, icon: '💬', N: 20, B: 100,
    what: <>Top-{ML('20')} LLMs from lmsys/chatbot_arena. Elo scores bootstrapped from real human preference votes. {ML('B = 5N = 100')}.</>,
    pairwise: <>Human annotator sees two LLM responses and picks a winner. Preference drawn from BTL model {ML('p(i \\succ j) = w_i/(w_i+w_j)')} fitted to arena data. GPT-4 is the true winner {ML('i^*')}.</>,
    why: <>True RLHF-scale evaluation. Top-{ML('20')} LLM scores cluster tightly — separating {ML('i^*')} requires precise, targeted queries.</>,
  },
  {
    key: 'rating',
    label: 'Netflix · MovieLens',
    color: '#ef5350',
    difficulty: 'Hard', hard: true, icon: '🎬', N: 20, B: 100,
    what: <>Top-{ML('20')} movies by average user rating from Netflix Prize and MovieLens. {ML('B = 5N = 100')}.</>,
    pairwise: <>BTL weights {ML('\\{w_i\\}')} fitted to user rating data via MLE. Oracle draws {ML('\\text{Bernoulli}\\!\\left(w_i/(w_i+w_j)\\right)')} to simulate a user preference query.</>,
    why: <>Popular movies have nearly identical ratings — small {ML('\\Delta_{wj}^2')} makes winner identification genuinely hard under a tight budget.</>,
  },
  {
    key: 'easy',
    label: 'Jester · Sushi-B',
    color: '#66bb6a',
    difficulty: 'Easy', hard: false, icon: '😂', N: 20, B: 100,
    what: <>Jester: joke ratings on {ML('[-10,+10]')} scale. Sushi-B: {ML('100')} users fully rank {ML('10')} sushi types (Kamishima 2003). {ML('B = 5N = 100')}.</>,
    pairwise: <>Same BTL fitting pipeline. Oracle draws from {ML('p(i \\succ j) = w_i/(w_i+w_j)')}. Winner is clearly separated — large {ML('\\Delta_{1} = \\theta_{i^*} - \\max_{j \\ne i^*}\\theta_j')}.</>,
    why: <>Easy regime with large score gaps. Used to verify no algorithm catastrophically fails on simple instances.</>,
  },
];

export function RealWorldSetupSlide() {
  const [sub, setSub] = React.useState(0);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && sub > 0) {
        e.stopPropagation(); e.preventDefault(); setSub(0);
      } else if ((e.key === 'ArrowRight' || e.key === ' ') && sub < 1) {
        e.stopPropagation(); e.preventDefault(); setSub(1);
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [sub]);

  const REAL_CARDS = [
    { icon: '💬', label: 'Chatbot Arena',    color: 'var(--gold)', hard: true,  N: 20,  B: 100, line: 'Top-20 LLMs · Elo from real human preferences · GPT-4 is true winner' },
    { icon: '🎬', label: 'Netflix · MovieLens', color: '#ef5350', hard: true,  N: 20,  B: 100, line: 'Top-20 movies by average user rating · BTL fitted to rating data' },
    { icon: '😂', label: 'Jester · Sushi-B', color: '#66bb6a', hard: false, N: 20,  B: 100, line: 'Joke ratings & sushi rankings · winner clearly separated' },
  ];

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '16px 60px 30px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>Experiments · Real World</div>
        <h1 style={{ fontSize: 40, margin: 0 }}>
          Real-world datasets — <span style={{ color: 'var(--gold)' }}>6 benchmarks</span>
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {sub === 0 ? (
          <motion.div key="real" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {REAL_CARDS.map((ds, i) => (
              <motion.div key={ds.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  flex: 1, padding: '0 32px', borderRadius: 16,
                  background: `${ds.color === 'var(--gold)' ? 'rgba(232,197,71' : ds.color === '#ef5350' ? 'rgba(239,83,80' : 'rgba(102,187,106'},0.07)`,
                  border: `2px solid ${ds.color === 'var(--gold)' ? 'rgba(232,197,71' : ds.color === '#ef5350' ? 'rgba(239,83,80' : 'rgba(102,187,106'},0.4)`,
                  display: 'flex', alignItems: 'center', gap: 28,
                }}>
                <span style={{ fontSize: 40, flexShrink: 0 }}>{ds.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: ds.color, marginBottom: 6 }}>{ds.label}</div>
                  <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>{ds.line}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
                    background: ds.hard ? 'rgba(239,83,80,0.18)' : 'rgba(102,187,106,0.18)',
                    color: ds.hard ? '#ef9a9a' : '#66bb6a',
                  }}>{ds.hard ? 'Hard' : 'Easy'}</span>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 52, fontWeight: 900, color: ds.color, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>{ds.N}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Items</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 52, fontWeight: 900, color: ds.color, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>{ds.B}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Budget</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <div style={{ fontSize: 14, color: 'var(--glass-25)', textAlign: 'center', flexShrink: 0 }}>→ press to see DMControl</div>
          </motion.div>
        ) : (
          <motion.div key="dm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* DMControl header card */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '24px 36px', borderRadius: 16, background: 'rgba(206,147,216,0.08)', border: '2px solid rgba(206,147,216,0.45)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
                <span style={{ fontSize: 48 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#ce93d8' }}>DMControl (MuJoCo)</div>
                  <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 4 }}>
                    N=100 open-loop walker policies · reward r_i = cumulative reward over 150 steps
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'flex-end', flexShrink: 0 }}>
                  {[['100','Items'],['500','Budget']].map(([val,lbl]) => (
                    <div key={lbl} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 52, fontWeight: 900, color: '#ce93d8', fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 6 }}>Pairwise oracle:</div>
              <MathFormula
                formula={String.raw`p(i \succ j) = \text{Bernoulli}\!\left(\frac{s_i}{s_i+s_j}\right), \quad s_i = e^{r_i/T}`}
                block style={{ fontSize: '1.6em' }}
              />
              <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>
                Higher <strong style={{ color: '#ce93d8' }}>T</strong> compresses scores → noisier comparisons → harder
              </div>
            </motion.div>

            {/* T variants */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ flex: 1, display: 'flex', gap: 16 }}>
              {[
                { T: 20,  label: 'Easy',     color: '#66bb6a', note: 'Policies clearly separated' },
                { T: 100, label: 'Hard',     color: '#ffb74d', note: 'Top policies close in reward' },
                { T: 200, label: 'Very hard',color: '#ef5350', note: 'Nearly indistinguishable at top' },
              ].map(t => (
                <div key={t.T} style={{
                  flex: 1, borderRadius: 16, textAlign: 'center',
                  background: `${t.color}10`, border: `2px solid ${t.color}44`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: t.color, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }}>T={t.T}</div>
                  <span style={{ fontSize: 18, fontWeight: 700, padding: '6px 20px', borderRadius: 8, background: `${t.color}20`, color: t.color }}>{t.label}</span>
                  <div style={{ fontSize: 20, color: 'var(--text-secondary)', padding: '0 24px' }}>{t.note}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RealWorldResultsSlide() {
  const [selected, setSelected] = useState(REAL_DATASETS[0].key);
  const [metric, setMetric] = useState<MetricKey>('ACC');
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    loadCSV(`/data/real_${metric}_${selected}.csv`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selected, metric]);

  useEffect(() => { load(); }, [load]);

  const ds = REAL_DATASETS.find(d => d.key === selected)!;
  const mInfo = METRIC_INFO[metric];
  const last = data[data.length - 1];
  const wisdomFinal = last?.['Robust-FW'] ?? 0;
  const ranked = last ? ALGOS.filter(a => a.key !== 'Robust-FW').map(a => ({ label: a.label, val: last[a.key] ?? 0, color: a.color })).sort((a, b) => mInfo.higher ? b.val - a.val : a.val - b.val) : [];

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '14px 56px 30px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>Experiments · Real World</div>
        <h1 style={{ fontSize: 36, margin: 0 }}>
          {mInfo.label} vs Budget — <span style={{ color: 'var(--gold)' }}>real datasets</span>
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0 }}>

        {/* Left: dataset + metric selector */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Metric */}
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--glass-03)', border: '1px solid var(--glass-09)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 7 }}>METRIC</div>
            {(['ACC', 'CT', 'PF'] as MetricKey[]).map(m => (
              <button key={m} onClick={() => setMetric(m)} style={{
                display: 'block', width: '100%', padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                marginBottom: 4, textAlign: 'left',
                background: metric === m ? 'rgba(232,197,71,0.15)' : 'var(--glass-03)',
                border: `1.5px solid ${metric === m ? 'rgba(232,197,71,0.5)' : 'var(--glass-08)'}`,
                color: metric === m ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: metric === m ? 700 : 400,
              }}>
                {m} — {METRIC_INFO[m].label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Datasets */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(['Hard', 'Easy'] as const).map(diff => (
              <div key={diff}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginTop: 4, marginBottom: 4 }}>{diff.toUpperCase()}</div>
                {REAL_DATASETS.filter(d => d.difficulty === diff).map(d => (
                  <button key={d.key} onClick={() => setSelected(d.key)} style={{
                    display: 'block', width: '100%', padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                    marginBottom: 4, textAlign: 'left',
                    background: selected === d.key ? `${DS_COLORS[d.key]}18` : 'var(--glass-03)',
                    border: `1.5px solid ${selected === d.key ? DS_COLORS[d.key] + '88' : 'var(--glass-08)'}`,
                    color: selected === d.key ? DS_COLORS[d.key] : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: selected === d.key ? 700 : 400,
                  }}>
                    <div>{d.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1, fontWeight: 400, color: 'var(--text-secondary)' }}>{d.desc}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <div style={{ flex: 1, padding: '16px 20px', borderRadius: 16, background: 'var(--glass-02)', border: '1px solid var(--glass-09)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: 17, fontWeight: 700, color: DS_COLORS[selected] }}>{ds.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 10 }}>{ds.desc}</span>
              </div>
              <Legend compact />
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading
                ? <div style={{ color: 'var(--glass-30)', fontSize: 15 }}>Loading…</div>
                : <motion.div key={`${selected}-${metric}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                    <LineChart data={data} width={920} height={360} yLabel={mInfo.label} higherBetter={mInfo.higher} />
                  </motion.div>
              }
            </div>
          </div>

          {/* Stats */}
          {last && (
            <div style={{ flexShrink: 0, padding: '12px 20px', borderRadius: 12, background: 'rgba(232,197,71,0.07)', border: '1px solid rgba(232,197,71,0.3)', display: 'flex', gap: 20, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>WiSDoM @ B=100</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>
                  {mInfo.higher ? `${(wisdomFinal * 100).toFixed(1)}%` : wisdomFinal.toFixed(1)}
                </div>
              </div>
              {ranked.slice(0, 3).map(b => (
                <div key={b.label}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: b.color }}>
                    {mInfo.higher ? `${(b.val * 100).toFixed(1)}%` : b.val.toFixed(1)}
                  </div>
                </div>
              ))}
              {ranked.length > 0 && (
                <div style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {mInfo.higher
                    ? <>Lead: <strong style={{ color: 'var(--gold)' }}>+{((wisdomFinal - ranked[0].val) * 100).toFixed(1)} pp</strong> over {ranked[0].label}</>
                    : <>Improvement: <strong style={{ color: 'var(--gold)' }}>−{(ranked[0].val - wisdomFinal).toFixed(1)}</strong> vs {ranked[0].label}</>
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
