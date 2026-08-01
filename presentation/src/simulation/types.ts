export interface Item {
  id: number;
  trueScore: number;
  eloScore: number;
  rankCentrality: number;
  wins: number;
  losses: number;
  matchHistory: Array<[number, boolean]>; // [opponentId, didWin]
}

export interface BracketMatch {
  round: number;
  itemA: number;
  itemB: number;
  winner: number | null;
  games: boolean[]; // true = itemA won game
  completed: boolean;
}

export interface SimState {
  phase: 'bracket' | 'design' | 'complete';
  items: Item[];
  candidateSet: number[]; // item ids in top-M
  queryAllocation: Map<string, number>; // "i-j" -> λ_ij
  budgetUsed: number;
  budgetTotal: number;
  lastMatch: [number, number, boolean] | null; // [idA, idB, A_won]
  bracketRound: number;
  bracketMatches: BracketMatch[];
  bracketWinners: number[][]; // winners by round
  designBatch: number;
  trueWinnerId: number;
}

export interface SimConfig {
  n: number;
  budgetMultiplier: number; // B = budgetMultiplier * N
  t: number; // games per bracket match (best-of-t)
  eloK: number;
  seed: number;
}
