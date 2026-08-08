import { motion } from 'framer-motion';
import { ShowPosterCard } from '../components/ShowPosterCard';
import type { ShowData } from '../components/ShowCard';

export const SHOWS: ShowData[] = [
  { id: 0, name: 'Reply 1988',      rating: 9.2, emoji: '🇰🇷', image: import.meta.env.BASE_URL + 'shows/reply1988.jpg',   color: '#e8c547', genre: 'Korean Drama' },
  { id: 1, name: 'Attack on Titan', rating: 9.0, emoji: '⚔️',  image: import.meta.env.BASE_URL + 'shows/aot.jpg',         color: '#ef5350', genre: 'Anime' },
  { id: 2, name: 'Death Note',      rating: 9.0, emoji: '📓',  image: import.meta.env.BASE_URL + 'shows/deathnote.jpg',   color: '#ce93d8', genre: 'Anime' },
  { id: 3, name: 'The Office',      rating: 9.0, emoji: '🏢',  image: import.meta.env.BASE_URL + 'shows/office.jpg',      color: '#4fc3f7', genre: 'Comedy' },
  { id: 4, name: 'Big Bang Theory', rating: 8.1, emoji: '🔭',  image: import.meta.env.BASE_URL + 'shows/bigbang.png',     color: '#80cbc4', genre: 'Comedy' },
  { id: 5, name: 'Riverdale',       rating: 6.4, emoji: '🌊',  image: import.meta.env.BASE_URL + 'shows/riverdale.jpg',   color: '#e57373', genre: 'Drama' },
  { id: 6, name: 'Fuller House',    rating: 6.2, emoji: '🏠',  image: import.meta.env.BASE_URL + 'shows/fullerhouse.jpg', color: '#ffb74d', genre: 'Comedy' },
];

const springCard = { type: 'spring' as const, stiffness: 120, damping: 20 };

export function ShowdownSlide() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '28px 60px 30px',
      gap: 0,
      background: 'var(--bg)',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{ fontSize: 46, marginBottom: 8, lineHeight: 1.1 }}>
          7 Shows.{' '}
          <span style={{ color: 'var(--gold)' }}>1 Best.</span>{' '}
          Minimum Comparisons.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)' }}>
          WiSDoM finds the winner without watching everything.
        </p>
      </motion.div>

      {/* Main content row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        width: '100%',
        flex: 1,
        maxWidth: 1300,
      }}>
        {/* Left: Viewer character */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...springCard }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <svg width={180} height={240} viewBox="0 0 200 260" style={{ color: 'var(--figure-fg)' }}>
            {/* TV screen */}
            <rect x={70} y={185} width={80} height={54} rx={6} fill="var(--shape-dark)" stroke="#4fc3f7" strokeWidth={2} />
            <rect x={76} y={191} width={68} height={40} rx={3} fill="var(--shape-screen)" />
            <rect x={70} y={185} width={80} height={54} rx={6} fill="none" stroke="#4fc3f7" strokeWidth={1} opacity={0.3}
              style={{ filter: 'blur(4px)' }} />
            <text x={110} y={215} textAnchor="middle" fontSize={18} fill="#e8c547">?</text>
            <line x1={100} y1={239} x2={90} y2={252} stroke="#546e7a" strokeWidth={2} />
            <line x1={120} y1={239} x2={130} y2={252} stroke="#546e7a" strokeWidth={2} />
            <line x1={80} y1={252} x2={140} y2={252} stroke="#546e7a" strokeWidth={3} />
            <rect x={50} y={230} width={120} height={22} rx={8} fill="var(--shape-dark)" stroke="var(--glass-10)" strokeWidth={1} />
            <rect x={44} y={218} width={16} height={34} rx={6} fill="var(--shape-dark)" stroke="var(--glass-10)" strokeWidth={1} />
            <rect x={160} y={218} width={16} height={34} rx={6} fill="var(--shape-dark)" stroke="var(--glass-10)" strokeWidth={1} />
            <circle cx={110} cy={140} r={20} fill="none" stroke="currentColor" strokeWidth={2} />
            <circle cx={104} cy={136} r={2.5} fill="currentColor" />
            <circle cx={116} cy={136} r={2.5} fill="currentColor" />
            <path d="M 104 148 Q 110 154 116 148" fill="none" stroke="currentColor" strokeWidth={1.5} />
            <line x1={110} y1={160} x2={110} y2={185} stroke="currentColor" strokeWidth={2} />
            <line x1={110} y1={168} x2={75} y2={178} stroke="currentColor" strokeWidth={2} />
            <line x1={110} y1={168} x2={145} y2={178} stroke="currentColor" strokeWidth={2} />
            <line x1={103} y1={185} x2={78} y2={210} stroke="currentColor" strokeWidth={2} />
            <line x1={117} y1={185} x2={140} y2={210} stroke="currentColor" strokeWidth={2} />
            <line x1={78} y1={210} x2={70} y2={228} stroke="currentColor" strokeWidth={2} />
            <line x1={140} y1={210} x2={148} y2={228} stroke="currentColor" strokeWidth={2} />
            <circle cx={85} cy={120} r={3} fill="var(--glass-40)" />
            <circle cx={78} cy={110} r={4.5} fill="var(--glass-30)" />
            <ellipse cx={68} cy={94} rx={20} ry={14} fill="var(--glass-08)" stroke="var(--glass-20)" strokeWidth={1} />
            <text x={68} y={99} textAnchor="middle" fontSize={14}>🤔</text>
          </svg>

          <div style={{
            background: 'var(--glass-04)',
            border: '1px solid var(--glass-08)',
            borderRadius: 10,
            padding: '10px 18px',
            textAlign: 'center',
            maxWidth: 160,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Thinking:</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
              "Which is best?"
            </div>
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{ fontSize: 28, color: 'var(--gold)', flexShrink: 0 }}
        >
          →
        </motion.div>

        {/* Right: Poster grid - 4 top row, 3 bottom row */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {/* Row 1: 4 posters */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {SHOWS.slice(0, 4).map((show, i) => (
              <motion.div
                key={show.id}
                initial={{ opacity: 0, y: 40, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, ...springCard }}
              >
                <ShowPosterCard show={show} highlighted={show.id === 0} />
              </motion.div>
            ))}
          </div>
          {/* Row 2: 3 posters centered */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {SHOWS.slice(4).map((show, i) => (
              <motion.div
                key={show.id}
                initial={{ opacity: 0, y: 40, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.1, ...springCard }}
              >
                <ShowPosterCard show={show} highlighted={false} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}
      >
        {/* <span>N = 7 shows</span>
        <span style={{ color: 'var(--glass-20)' }}>|</span>
        <span>Budget: B = 50 comparisons</span>
        <span style={{ color: 'var(--glass-20)' }}>|</span> */}
        <span style={{ color: 'var(--gold)' }}>Can we find the top show without watching them all?</span>
      </motion.div>
    </div>
  );
}
