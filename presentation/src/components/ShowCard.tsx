import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface ShowData {
  id: number;
  name: string;
  rating: number;
  emoji: string;
  icon?: ReactNode;
  image?: string;
  color: string;
  genre: string;
}

interface ShowCardProps {
  show: ShowData;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  faded?: boolean;
  rank?: number;
  elo?: number;
  icon?: ReactNode;
}

const SIZES = {
  sm: { width: 80, emojiSize: 18, nameSize: 10, ratingSize: 9, padding: 8 },
  md: { width: 120, emojiSize: 26, nameSize: 12, ratingSize: 11, padding: 12 },
  lg: { width: 160, emojiSize: 40, nameSize: 14, ratingSize: 13, padding: 16 },
};

export function ShowCard({ show, size = 'md', highlighted = false, faded = false, rank, elo, icon }: ShowCardProps) {
  const displayIcon = icon ?? show.icon;
  const s = SIZES[size];
  return (
    <motion.div
      style={{
        width: s.width,
        background: highlighted
          ? `linear-gradient(135deg, ${show.color}22, ${show.color}11)`
          : 'var(--glass-04)',
        border: `1px solid ${highlighted ? show.color : 'var(--glass-08)'}`,
        borderRadius: 12,
        padding: s.padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        opacity: faded ? 0.35 : 1,
        boxShadow: highlighted ? `0 0 20px ${show.color}44` : 'none',
        transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {rank !== undefined && (
        <div style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontSize: 9,
          fontWeight: 700,
          color: highlighted ? show.color : 'var(--text-secondary)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          #{rank}
        </div>
      )}
      <div style={{ lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {show.image ? (
          <div style={{
            width: s.emojiSize * 1.8,
            height: s.emojiSize * 1.8,
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: highlighted
              ? `0 8px 20px ${show.color}66, 4px 4px 0 ${show.color}33`
              : '0 4px 12px rgba(0,0,0,0.5), 3px 3px 0 rgba(0,0,0,0.3)',
            transform: 'perspective(120px) rotateY(-6deg) rotateX(3deg)',
            flexShrink: 0,
          }}>
            <img
              src={show.image}
              alt={show.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ) : displayIcon ? (
          <div style={{ width: s.emojiSize * 1.4, height: s.emojiSize * 1.4 }}>{displayIcon}</div>
        ) : (
          <span style={{ fontSize: s.emojiSize }}>{show.emoji}</span>
        )}
      </div>
      <div style={{
        fontSize: s.nameSize,
        fontWeight: 700,
        color: highlighted ? show.color : 'var(--text-primary)',
        textAlign: 'center',
        fontFamily: "'Space Grotesk', sans-serif",
        lineHeight: 1.2,
      }}>
        {show.name}
      </div>
      <div style={{
        fontSize: s.ratingSize,
        color: 'var(--gold)',
        fontWeight: 600,
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        ★ {show.rating.toFixed(1)}
      </div>
      {size !== 'sm' && (
        <div style={{
          fontSize: s.ratingSize - 1,
          color: 'var(--text-secondary)',
          background: 'var(--glass-06)',
          borderRadius: 4,
          padding: '1px 5px',
          marginTop: 2,
        }}>
          {show.genre}
        </div>
      )}
      {elo !== undefined && (
        <div style={{
          fontSize: 9,
          color: 'var(--text-secondary)',
          fontFamily: "'Space Grotesk', sans-serif",
          marginTop: 2,
        }}>
          Elo {Math.round(elo)}
        </div>
      )}
    </motion.div>
  );
}
