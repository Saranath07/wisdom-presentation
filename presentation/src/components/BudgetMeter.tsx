import { memo } from 'react';
import { motion } from 'framer-motion';

interface BudgetMeterProps {
  used: number;
  total: number;
  compact?: boolean;
}

export const BudgetMeter = memo(({ used, total, compact = false }: BudgetMeterProps) => {
  const pct = total > 0 ? used / total : 0;
  const remaining = total - used;

  const barColor = pct < 0.5
    ? '#4fc3f7'
    : pct < 0.8
    ? '#e8c547'
    : '#ef5350';

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: compact ? 6 : 8,
      }}>
        <span style={{
          fontSize: compact ? 10 : 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}>
          Budget
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.span
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              fontSize: compact ? 13 : 16,
              fontWeight: 700,
              color: barColor,
              fontFamily: "'Space Grotesk', monospace",
            }}
          >
            {remaining}
          </motion.span>
          <span style={{ fontSize: compact ? 10 : 12, color: 'var(--text-secondary)' }}>
            / {total} left
          </span>
        </div>
      </div>

      <div style={{
        height: compact ? 6 : 8,
        background: 'var(--glass-06)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, #4fc3f7, ${barColor})`,
            borderRadius: 4,
            position: 'relative',
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            animate={{ x: ['0%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: 0,
              left: '-50%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, var(--glass-30), transparent)',
            }}
          />
        </motion.div>
      </div>

      {/* Query count dots */}
      {!compact && total <= 100 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          marginTop: 8,
        }}>
          {Array.from({ length: total }, (_, i) => (
            <motion.div
              key={i}
              animate={{
                background: i < used ? barColor : 'var(--glass-10)',
                scale: i === used - 1 ? [1, 1.4, 1] : 1,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

BudgetMeter.displayName = 'BudgetMeter';
