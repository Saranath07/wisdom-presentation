import { motion } from 'framer-motion';

const QUESTIONS = [
  { color: '#e8c547', number: '01', bold: 'Exact Bernoulli KL divergence' },
  { color: '#4fc3f7', number: '02', bold: 'Matching upper bound' },
  { color: '#ce93d8', number: '03', bold: 'Self-contained end-to-end guarantee' },
  { color: '#80cbc4', number: '04', bold: 'Optimal bracket depth t*(N, Δ)' },
  { color: '#ffb74d', number: '05', bold: 'Hundreds of LLMs — robustness' },
  { color: '#ef9a9a', number: '06', bold: 'Beyond flat single-gap BTL' },
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, justifyContent: 'center' }}>
        {QUESTIONS.map((q, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 160, damping: 24 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 24,
              padding: '18px 28px', borderRadius: 14, flex: 1,
              background: `${q.color}0c`, borderLeft: `4px solid ${q.color}`,
            }}
          >
            <div style={{
              fontSize: 15, fontWeight: 900, color: q.color, opacity: 0.6,
              fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0, letterSpacing: '0.05em',
            }}>
              {q.number}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: q.color, fontFamily: "'Space Grotesk', sans-serif" }}>
              {q.bold}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
