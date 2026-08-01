import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Item } from '../simulation/types';

interface LeaderboardProps {
  items: Item[];
  highlightId?: number;
  showRankCentrality?: boolean;
  maxItems?: number;
  compact?: boolean;
}

const RANK_COLORS = ['#e8c547', '#90a4ae', '#cd7f32', '#4fc3f7', '#4fc3f7'];

const LeaderboardItem = memo(({
  item,
  rank,
  highlightId,
  showRankCentrality,
  compact,
  maxElo,
}: {
  item: Item;
  rank: number;
  highlightId?: number;
  showRankCentrality?: boolean;
  compact?: boolean;
  maxElo: number;
}) => {
  const isWinner = item.id === highlightId;
  const barWidth = Math.max(4, (item.eloScore / maxElo) * 100);
  const rcWidth = item.rankCentrality * 100 * 5; // scale for visibility

  return (
    <motion.div
      layout
      layoutId={`lb-item-${item.id}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 12,
        padding: compact ? '6px 10px' : '10px 14px',
        borderRadius: 8,
        background: isWinner
          ? 'rgba(232, 197, 71, 0.12)'
          : 'var(--glass-03)',
        border: isWinner
          ? '1px solid rgba(232, 197, 71, 0.35)'
          : '1px solid var(--glass-06)',
        marginBottom: compact ? 4 : 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rank badge */}
      <div style={{
        minWidth: compact ? 22 : 28,
        height: compact ? 22 : 28,
        borderRadius: '50%',
        background: rank < RANK_COLORS.length ? RANK_COLORS[rank] : 'var(--glass-10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? 11 : 13,
        fontWeight: 700,
        color: rank === 0 ? '#0a0a0f' : 'var(--text-primary)',
        fontFamily: "'Space Grotesk', sans-serif",
        flexShrink: 0,
      }}>
        {rank + 1}
      </div>

      {/* Item label */}
      <div style={{ minWidth: compact ? 40 : 52 }}>
        <div style={{
          fontSize: compact ? 12 : 14,
          fontWeight: 600,
          color: isWinner ? 'var(--gold)' : 'var(--text-primary)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Item {item.id}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {item.wins}W {item.losses}L
        </div>
      </div>

      {/* Elo bar */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          fontSize: compact ? 9 : 10,
          color: 'var(--text-secondary)',
          marginBottom: 3,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Elo: <span style={{ color: isWinner ? 'var(--gold)' : 'var(--cyan)', fontWeight: 600 }}>
            {Math.round(item.eloScore)}
          </span>
        </div>
        <div style={{
          height: compact ? 4 : 5,
          background: 'var(--glass-06)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${barWidth}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{
              height: '100%',
              background: isWinner
                ? 'linear-gradient(90deg, #e8c547, #f5d76e)'
                : 'linear-gradient(90deg, #4fc3f7, #81d4fa)',
              borderRadius: 3,
            }}
          />
        </div>

        {showRankCentrality && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 2 }}>
              RC: <span style={{ color: 'var(--purple)' }}>{(item.rankCentrality * 100).toFixed(1)}%</span>
            </div>
            <div style={{
              height: 3,
              background: 'var(--glass-06)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${Math.min(100, rcWidth)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #ce93d8, #f48fb1)',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Winner star */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ fontSize: compact ? 14 : 18 }}
        >
          ★
        </motion.div>
      )}
    </motion.div>
  );
});

LeaderboardItem.displayName = 'LeaderboardItem';

export const Leaderboard = memo(({
  items,
  highlightId,
  showRankCentrality = false,
  maxItems = 10,
  compact = false,
}: LeaderboardProps) => {
  const sorted = [...items]
    .sort((a, b) => b.eloScore - a.eloScore)
    .slice(0, maxItems);

  const maxElo = Math.max(...items.map(i => i.eloScore), 1400);

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="popLayout">
        {sorted.map((item, rank) => (
          <LeaderboardItem
            key={item.id}
            item={item}
            rank={rank}
            highlightId={highlightId}
            showRankCentrality={showRankCentrality}
            compact={compact}
            maxElo={maxElo}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

Leaderboard.displayName = 'Leaderboard';
