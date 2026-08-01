import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { BracketMatch } from '../simulation/types';

interface BracketVizProps {
  matches: BracketMatch[];
  items: Array<{ id: number; eloScore: number }>;
  highlightWinnerId?: number;
  width?: number;
  height?: number;
}

interface MatchNode {
  match: BracketMatch;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BracketViz = memo(({
  matches,
  items,
  highlightWinnerId,
  width = 700,
  height = 420,
}: BracketVizProps) => {
  const matchNodes = useMemo((): MatchNode[] => {
    if (!matches || matches.length === 0) return [];

    // Group by round
    const byRound = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      if (!byRound.has(m.round)) byRound.set(m.round, []);
      byRound.get(m.round)!.push(m);
    }

    const numRounds = Math.max(...matches.map(m => m.round)) + 1;
    const nodes: MatchNode[] = [];
    const padding = 20;
    const colWidth = (width - padding * 2) / numRounds;
    const boxW = Math.min(110, colWidth - 20);
    const boxH = 52;

    for (let r = 0; r < numRounds; r++) {
      const roundMatches = byRound.get(r) ?? [];
      const numInRound = roundMatches.length;
      const totalHeight = height - padding * 2;
      const slotHeight = totalHeight / numInRound;

      roundMatches.forEach((match, idx) => {
        const x = padding + r * colWidth;
        const y = padding + idx * slotHeight + slotHeight / 2 - boxH / 2;
        nodes.push({ match, x, y, w: boxW, h: boxH });
      });
    }

    return nodes;
  }, [matches, width, height]);

  // Build connector lines between rounds
  const connectors = useMemo(() => {
    if (matchNodes.length === 0) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; active: boolean }> = [];

    // Group nodes by round
    const byRound = new Map<number, MatchNode[]>();
    for (const node of matchNodes) {
      const r = node.match.round;
      if (!byRound.has(r)) byRound.set(r, []);
      byRound.get(r)!.push(node);
    }

    const numRounds = Math.max(...matchNodes.map(n => n.match.round)) + 1;

    for (let r = 0; r < numRounds - 1; r++) {
      const currentRound = byRound.get(r) ?? [];
      const nextRound = byRound.get(r + 1) ?? [];

      // Each pair in currentRound feeds one in nextRound
      for (let i = 0; i < currentRound.length; i += 2) {
        const nodeA = currentRound[i];
        const nodeB = currentRound[i + 1];
        const nextNode = nextRound[Math.floor(i / 2)];
        if (!nextNode) continue;

        const midX = (nodeA.x + nodeA.w + nextNode.x) / 2;

        [nodeA, nodeB].forEach(node => {
          const isActive = node.match.completed;
          lines.push({
            x1: node.x + node.w,
            y1: node.y + node.h / 2,
            x2: nextNode.x,
            y2: nextNode.y + nextNode.h / 2,
            active: isActive,
          });
          // Elbow connector
          lines.push({
            x1: node.x + node.w,
            y1: node.y + node.h / 2,
            x2: midX,
            y2: node.y + node.h / 2,
            active: isActive,
          });
          lines.push({
            x1: midX,
            y1: node.y + node.h / 2,
            x2: midX,
            y2: nextNode.y + nextNode.h / 2,
            active: isActive,
          });
          lines.push({
            x1: midX,
            y1: nextNode.y + nextNode.h / 2,
            x2: nextNode.x,
            y2: nextNode.y + nextNode.h / 2,
            active: isActive,
          });
        });
      }
    }

    return lines;
  }, [matchNodes]);

  const getItemLabel = (id: number) => {
    if (id === -1) return 'BYE';
    const item = items.find(it => it.id === id);
    const elo = item ? Math.round(item.eloScore) : 1200;
    return `#${id} (${elo})`;
  };

  const isHighlighted = (id: number) => id === highlightWinnerId;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Connector lines */}
      {connectors.map((line, i) => (
        <motion.line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={line.active ? 'rgba(79,195,247,0.3)' : 'var(--glass-08)'}
          strokeWidth={1.5}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: i * 0.01 }}
        />
      ))}

      {/* Match boxes */}
      {matchNodes.map((node, i) => {
        const { match, x, y, w, h } = node;
        const isCompleted = match.completed;
        const winnerIsA = match.winner === match.itemA;
        const winnerIsB = match.winner === match.itemB;
        const hlA = isHighlighted(match.itemA);
        const hlB = isHighlighted(match.itemB);

        if (match.itemB === -1 || match.itemA === -1) {
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={w} height={h / 2 - 1}
                rx={4}
                fill="var(--glass-04)"
                stroke="var(--glass-08)"
                strokeWidth={1}
              />
              <text x={x + 8} y={y + h / 4 + 4} fill="#90a4ae" fontSize={10} fontFamily="Inter, sans-serif">
                {match.itemA === -1 ? getItemLabel(match.itemB) : getItemLabel(match.itemA)}
              </text>
            </g>
          );
        }

        return (
          <g key={i}>
            {/* Box A */}
            <motion.rect
              x={x} y={y} width={w} height={h / 2 - 1}
              rx={4}
              fill={hlA ? 'rgba(232,197,71,0.15)' : winnerIsA && isCompleted ? 'rgba(79,195,247,0.1)' : 'var(--glass-04)'}
              stroke={hlA ? 'rgba(232,197,71,0.5)' : winnerIsA && isCompleted ? 'rgba(79,195,247,0.4)' : 'var(--glass-08)'}
              strokeWidth={1}
              animate={{
                fill: hlA ? 'rgba(232,197,71,0.15)' : winnerIsA && isCompleted ? 'rgba(79,195,247,0.1)' : 'var(--glass-04)',
              }}
              transition={{ duration: 0.3 }}
            />
            <text
              x={x + 7}
              y={y + h / 4 + 3}
              fill={hlA ? '#e8c547' : winnerIsA && isCompleted ? '#4fc3f7' : '#90a4ae'}
              fontSize={9}
              fontFamily="Inter, sans-serif"
              fontWeight={winnerIsA && isCompleted ? 600 : 400}
            >
              {getItemLabel(match.itemA)}
            </text>

            {/* Box B */}
            <motion.rect
              x={x} y={y + h / 2} width={w} height={h / 2 - 1}
              rx={4}
              fill={hlB ? 'rgba(232,197,71,0.15)' : winnerIsB && isCompleted ? 'rgba(79,195,247,0.1)' : 'var(--glass-04)'}
              stroke={hlB ? 'rgba(232,197,71,0.5)' : winnerIsB && isCompleted ? 'rgba(79,195,247,0.4)' : 'var(--glass-08)'}
              strokeWidth={1}
              animate={{
                fill: hlB ? 'rgba(232,197,71,0.15)' : winnerIsB && isCompleted ? 'rgba(79,195,247,0.1)' : 'var(--glass-04)',
              }}
              transition={{ duration: 0.3 }}
            />
            <text
              x={x + 7}
              y={y + h / 2 + h / 4 + 3}
              fill={hlB ? '#e8c547' : winnerIsB && isCompleted ? '#4fc3f7' : '#90a4ae'}
              fontSize={9}
              fontFamily="Inter, sans-serif"
              fontWeight={winnerIsB && isCompleted ? 600 : 400}
            >
              {getItemLabel(match.itemB)}
            </text>

            {/* Divider */}
            <line
              x1={x} y1={y + h / 2 - 0.5}
              x2={x + w} y2={y + h / 2 - 0.5}
              stroke="var(--glass-06)"
              strokeWidth={1}
            />

            {/* Game dots */}
            {isCompleted && match.games.length > 0 && (
              <g>
                {match.games.map((aWon, gi) => (
                  <circle
                    key={gi}
                    cx={x + w - 8 - gi * 7}
                    cy={y + h / 2}
                    r={2.5}
                    fill={aWon ? '#4fc3f7' : '#ef5350'}
                  />
                ))}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
});

BracketViz.displayName = 'BracketViz';
