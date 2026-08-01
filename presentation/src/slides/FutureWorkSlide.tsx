import { motion } from 'framer-motion';
import { MathFormula } from '../components/MathFormula';

const ML = (f: string) => <MathFormula formula={f} style={{ display: 'inline', fontSize: '1em' }} />;

const QUESTIONS = [
  {
    color: '#e8c547',
    number: '01',
    question: <>
      Can the lower bound be tightened to use the <strong>exact Bernoulli KL divergence</strong> instead of
      Hoeffding's inequality, closing the empirical slope gap from {ML('-10.1')} to {ML('-1.5')}?
    </>,
  },
  {
    color: '#4fc3f7',
    number: '02',
    question: <>
      Is there a <strong>matching upper bound</strong> — does any algorithm actually achieve the same
      exponential rate {ML('(1 - 4\\Delta^2)^{B/(N-K)}')} as the lower bound, establishing minimax optimality?
    </>,
  },
  {
    color: '#ce93d8',
    number: '03',
    question: <>
      Can the end-to-end guarantee be made <strong>self-contained</strong> — formally bridging from the
      SDP allocation {ML('\\lambda^\\star')} through Elo updates to a final failure-probability bound,
      without re-solving the SDP?
    </>,
  },
  {
    color: '#80cbc4',
    number: '04',
    question: <>
      What is the <strong>optimal bracket depth</strong> {ML('t^*(N, \\Delta)')} that jointly minimises
      failure probability over both phases — and can {ML('(M, t)')} be optimised together for large {ML('N')}?
    </>,
  },
  {
    color: '#ffb74d',
    number: '05',
    question: <>
      Does WiSDoM remain the best algorithm when scaled to <strong>hundreds of LLMs</strong> with real
      human annotators, non-BTL noise (cyclic preferences, annotator heterogeneity), and
      {ML('N \\ge 500')}?
    </>,
  },
  {
    color: '#ef9a9a',
    number: '06',
    question: <>
      Can the theoretical guarantees be extended beyond the <strong>flat single-gap BTL model</strong> to
      heterogeneous gaps {ML('\\Delta_{wj} \\ne \\Delta')}, multi-tier structure, and non-BTL preference
      models such as Thurstone or Plackett-Luce?
    </>,
  },
];

export function FutureWorkSlide() {
  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      padding: '18px 72px 52px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div className="label" style={{ marginBottom: 4 }}>Discussion</div>
        <h1 style={{ fontSize: 42, margin: 0, lineHeight: 1.2 }}>
          Open <span style={{ color: 'var(--gold)' }}>questions</span>
        </h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, justifyContent: 'center' }}>
        {QUESTIONS.map((q, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 160, damping: 24 }}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 20,
              padding: '14px 24px', borderRadius: 14,
              background: `${q.color}0c`, borderLeft: `4px solid ${q.color}`,
            }}
          >
            <div style={{
              fontSize: 15, fontWeight: 900, color: q.color, opacity: 0.6,
              fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0, letterSpacing: '0.05em',
            }}>
              {q.number}
            </div>
            <div style={{ fontSize: 19, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {q.question}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
