import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { TitleSlide } from './slides/TitleSlide';
import { ShowdownSlide } from './slides/ShowdownSlide';
import { AudienceGameSlide } from './slides/AudienceGameSlide';
import { OracleSlide } from './slides/OracleSlide';
import { TournamentFlawSlide } from './slides/DesignMotivationSlides';
import { MIPUnifiedSlide } from './slides/MIPUnifiedSlide';
import { WiSDoMAlgorithmSlide } from './slides/WiSDoMAlgorithmSlide';
import { FutureWorkSlide } from './slides/FutureWorkSlide';
import { LowerBoundTheoremSlide, EmpiricalValidationSlide, ExperimentSetupSlide, SyntheticResultsSlide, RealWorldSetupSlide, RealWorldResultsSlide } from './slides/ResultsSlides';
import { LowerBoundProof1Slide, LowerBoundProof2Slide } from './slides/LowerBoundProofSlide';
import { DMControlSlide } from './slides/DMControlSlide';

const SLIDES = [
  { component: TitleSlide, title: 'WiSDoM' },
  { component: ShowdownSlide, title: 'The Problem' },
  { component: AudienceGameSlide, title: '🎮 Audience Game' },
  { component: OracleSlide, title: 'The Oracle' },
  { component: TournamentFlawSlide, title: 'Tournament Flaw' },
  { component: MIPUnifiedSlide, title: 'Most Informative Pair' },
  { component: WiSDoMAlgorithmSlide, title: 'WiSDoM Algorithm' },
  { component: ExperimentSetupSlide, title: 'Experiment Setup' },
  { component: SyntheticResultsSlide, title: 'Results: Synthetic' },
  { component: RealWorldSetupSlide, title: 'Real-World Datasets' },
  { component: RealWorldResultsSlide, title: 'Results: Real World' },
  { component: DMControlSlide, title: 'DMControl: Video Evidence' },
  { component: LowerBoundTheoremSlide, title: 'Lower Bound Theorem' },
  { component: LowerBoundProof1Slide, title: 'Lower Bound Proof 1/2' },
  { component: LowerBoundProof2Slide, title: 'Lower Bound Proof 2/2' },
  { component: EmpiricalValidationSlide, title: 'Empirical Validation' },
  { component: FutureWorkSlide, title: 'Future Work' },
];

function App() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [slideKey, setSlideKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const onFS = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFS);
    return () => document.removeEventListener('fullscreenchange', onFS);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= SLIDES.length) return;
    setDirection(idx > slideIdx ? 1 : -1);
    setSlideIdx(idx);
    setSlideKey(k => k + 1);
  }, [slideIdx]);

  const next = useCallback(() => goTo(slideIdx + 1), [goTo, slideIdx]);
  const prev = useCallback(() => goTo(slideIdx - 1), [goTo, slideIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); return; }
      if (e.key === 't' || e.key === 'T') { setIsDark(d => !d); return; }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (idx < SLIDES.length) goTo(idx);
      } else if (e.key === '0') {
        goTo(9);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, goTo, toggleFullscreen]);

  const SlideComponent = SLIDES[slideIdx].component;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      y: 20,
    }),
    center: {
      x: 0,
      opacity: 1,
      y: 0,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      y: -10,
    }),
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)',
      position: 'relative',
    }}>
      {/* Slide content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`slide-${slideIdx}-${slideKey}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 28,
            duration: 0.4,
          }}
          style={{
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <SlideComponent />
        </motion.div>
      </AnimatePresence>

      {/* Slide number - top right */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 100,
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '0.05em',
        }}>
          {slideIdx + 1} / {SLIDES.length}
        </span>
      </div>

      {/* Theme toggle - top left, next to fullscreen */}
      <button
        onClick={() => setIsDark(d => !d)}
        title={isDark ? 'Switch to light theme (T)' : 'Switch to dark theme (T)'}
        style={{
          position: 'fixed', top: 12, left: 44, zIndex: 100,
          background: 'var(--glass-06)', border: '1px solid var(--glass-10)',
          borderRadius: 6, width: 26, height: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)', opacity: 0.7, transition: 'opacity 0.2s',
          fontSize: 14,
        }}
      >
        {isDark ? '☀' : '☾'}
      </button>

      {/* Fullscreen button - top left */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 100,
          background: 'var(--glass-06)', border: '1px solid var(--glass-10)',
          borderRadius: 6, width: 26, height: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)', opacity: 0.6, transition: 'opacity 0.2s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
          {isFullscreen
            ? <path d="M5.5 0v5.5H0v1h6.5V0h-1zm4 0v1H15v5.5h1V0h-6.5zm-9 9.5H0v6.5h6.5v-1H1V9.5h-.5zm10 0v5H5.5v1H16V9.5h-.5z"/>
            : <path d="M1 1v4.5h1V2h3.5V1H1zm9.5 0v1H14v3.5h1V1h-4.5zM1 10.5V15h4.5v-1H2v-3.5H1zm13 0H13V14h-3.5v1H15v-4.5h-1z"/>
          }
        </svg>
      </button>

      {/* Navigation arrows - smaller */}
      <button
        onClick={prev}
        disabled={slideIdx === 0}
        style={{
          position: 'fixed', left: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'var(--glass-05)', border: '1px solid var(--glass-08)',
          borderRadius: '50%', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: slideIdx === 0 ? 'not-allowed' : 'pointer',
          opacity: slideIdx === 0 ? 0.2 : 0.5,
          color: 'var(--text-primary)', fontSize: 12, zIndex: 100, transition: 'opacity 0.2s',
        }}
      >←</button>

      <button
        onClick={next}
        disabled={slideIdx === SLIDES.length - 1}
        style={{
          position: 'fixed', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'var(--glass-05)', border: '1px solid var(--glass-08)',
          borderRadius: '50%', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: slideIdx === SLIDES.length - 1 ? 'not-allowed' : 'pointer',
          opacity: slideIdx === SLIDES.length - 1 ? 0.2 : 0.5,
          color: 'var(--text-primary)', fontSize: 12, zIndex: 100, transition: 'opacity 0.2s',
        }}
      >→</button>

      {/* Footer: title + dots - compact, won't overlap */}
      <div style={{
        position: 'fixed', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        zIndex: 100, pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>
          {SLIDES[slideIdx].title}
        </span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', pointerEvents: 'auto' }}>
          {SLIDES.map((slide, i) => (
            <button key={i} onClick={() => goTo(i)} title={slide.title} style={{
              width: i === slideIdx ? 18 : 5, height: 5, borderRadius: 3,
              background: i === slideIdx ? 'var(--gold)' : 'var(--glass-20)',
              border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease', flexShrink: 0,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
