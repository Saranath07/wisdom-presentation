import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface NodeItem {
  id: number;
  eloScore: number;
  trueScore?: number;
}

interface NodeGraphProps {
  items: NodeItem[];
  highlightId?: number;
  candidateIds?: number[];
  queryAllocation?: Map<string, number>;
  showLabels?: boolean;
  width?: number;
  height?: number;
  animated?: boolean;
}

export const NodeGraph = memo(({
  items,
  highlightId,
  candidateIds = [],
  queryAllocation,
  showLabels = true,
  width = 400,
  height = 400,
  animated = true,
}: NodeGraphProps) => {
  const positions = useMemo(() => {
    const n = items.length;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.38;

    return items.map((item, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return {
        id: item.id,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
  }, [items, width, height]);

  const posMap = useMemo(() => {
    const m = new Map<number, { x: number; y: number }>();
    for (const p of positions) m.set(p.id, { x: p.x, y: p.y });
    return m;
  }, [positions]);

  const pairKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

  const edges = useMemo(() => {
    if (!queryAllocation || candidateIds.length < 2) return [];
    const edgeList: Array<{
      key: string;
      x1: number; y1: number;
      x2: number; y2: number;
      weight: number;
    }> = [];

    for (let i = 0; i < candidateIds.length; i++) {
      for (let j = i + 1; j < candidateIds.length; j++) {
        const a = candidateIds[i];
        const b = candidateIds[j];
        const key = pairKey(a, b);
        const weight = queryAllocation.get(key) ?? 0;
        const pa = posMap.get(a);
        const pb = posMap.get(b);
        if (pa && pb) {
          edgeList.push({ key, x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, weight });
        }
      }
    }
    return edgeList;
  }, [queryAllocation, candidateIds, posMap]);

  const maxElo = Math.max(...items.map(it => it.eloScore), 1400);

  return (
    <svg width={width} height={height}>
      {/* Allocation edges */}
      {edges.map(edge => (
        <motion.line
          key={edge.key}
          x1={edge.x1} y1={edge.y1}
          x2={edge.x2} y2={edge.y2}
          stroke="rgba(232, 197, 71, 0.6)"
          animate={{ strokeWidth: Math.max(1, edge.weight * 20) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          opacity={0.6 + edge.weight * 0.4}
        />
      ))}

      {/* Nodes */}
      {positions.map(pos => {
        const item = items.find(it => it.id === pos.id);
        if (!item) return null;

        const isWinner = item.id === highlightId;
        const isCandidate = candidateIds.includes(item.id);
        const eloNorm = item.eloScore / maxElo;
        const nodeR = 8 + eloNorm * 8;

        return (
          <g key={item.id}>
            {/* Glow for candidates */}
            {isCandidate && (
              <motion.circle
                cx={pos.x} cy={pos.y}
                r={nodeR + 6}
                initial={{ r: nodeR + 6 }}
                fill="none"
                stroke={isWinner ? '#e8c547' : '#4fc3f7'}
                strokeWidth={1.5}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* Main node */}
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r={nodeR}
              animate={{ r: nodeR }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              fill={
                isWinner
                  ? '#e8c547'
                  : isCandidate
                  ? '#4fc3f7'
                  : `rgba(84, 110, 122, ${0.4 + eloNorm * 0.6})`
              }
            />

            {/* Label */}
            {showLabels && (
              <text
                x={pos.x}
                y={pos.y + nodeR + 13}
                textAnchor="middle"
                fill={isWinner ? '#e8c547' : isCandidate ? '#4fc3f7' : '#90a4ae'}
                fontSize={9}
                fontFamily="Inter, sans-serif"
                fontWeight={isWinner || isCandidate ? 600 : 400}
              >
                {item.id}
              </text>
            )}
          </g>
        );
      })}

      {/* Center label */}
      {animated && (
        <motion.text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill="var(--glass-15)"
          fontSize={11}
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight={600}
          letterSpacing="0.1em"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          N={items.length}
        </motion.text>
      )}
    </svg>
  );
});

NodeGraph.displayName = 'NodeGraph';
