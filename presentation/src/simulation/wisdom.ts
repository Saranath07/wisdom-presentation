import type { Item, BracketMatch, SimState, SimConfig } from './types';

// ── Seeded RNG (LCG) ──────────────────────────────────────────────────────────
class LCG {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  nextInt(n: number): number {
    return Math.floor(this.next() * n);
  }
}

// ── BTL pairwise comparison ───────────────────────────────────────────────────
export function btlCompare(wi: number, wj: number, rng: LCG): boolean {
  return rng.next() < wi / (wi + wj);
}

// ── Elo update ────────────────────────────────────────────────────────────────
function eloExpected(scoreA: number, scoreB: number): number {
  return 1 / (1 + Math.pow(10, (scoreB - scoreA) / 400));
}

function updateElo(items: Item[], idA: number, idB: number, aWon: boolean, K: number): void {
  const a = items[idA];
  const b = items[idB];
  const expA = eloExpected(a.eloScore, b.eloScore);
  const scoreA = aWon ? 1 : 0;
  a.eloScore += K * (scoreA - expA);
  b.eloScore += K * ((1 - scoreA) - (1 - expA));
  if (aWon) {
    a.wins++;
    b.losses++;
  } else {
    b.wins++;
    a.losses++;
  }
  a.matchHistory.push([idB, aWon]);
  b.matchHistory.push([idA, !aWon]);
}

// ── Rank Centrality ───────────────────────────────────────────────────────────
function computeRankCentrality(items: Item[]): void {
  const n = items.length;
  // Build win-rate matrix
  const wins = Array.from({ length: n }, () => new Array(n).fill(0));
  const counts = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const item of items) {
    for (const [oppId, didWin] of item.matchHistory) {
      if (didWin) wins[item.id][oppId]++;
      counts[item.id][oppId]++;
    }
  }

  // Transition matrix: T[i][j] = prob of going from i to j
  const T = Array.from({ length: n }, () => new Array(n).fill(1 / n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && counts[i][j] + counts[j][i] > 0) {
        T[i][j] = wins[i][j] / (counts[i][j] + counts[j][i]);
      } else if (i !== j) {
        T[i][j] = 0.5;
      } else {
        T[i][j] = 0;
      }
    }
    // Normalize row
    const rowSum = T[i].reduce((s, v) => s + v, 0);
    if (rowSum > 0) for (let j = 0; j < n; j++) T[i][j] /= rowSum;
  }

  // Power iteration
  let pi = new Array(n).fill(1 / n);
  for (let iter = 0; iter < 80; iter++) {
    const next = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        next[j] += pi[i] * T[i][j];
      }
    }
    const sum = next.reduce((s, v) => s + v, 0);
    pi = next.map(v => v / sum);
  }

  for (let i = 0; i < n; i++) {
    items[i].rankCentrality = pi[i];
  }
}

// ── Candidate set selection ────────────────────────────────────────────────────
function selectCandidates(items: Item[], m: number): number[] {
  return [...items]
    .sort((a, b) => b.eloScore - a.eloScore)
    .slice(0, m)
    .map(item => item.id);
}

// ── Frank-Wolfe optimal allocation ───────────────────────────────────────────
function computeOptimalAllocation(
  items: Item[],
  candidateIds: number[]
): Map<string, number> {
  const m = candidateIds.length;
  if (m < 2) {
    const alloc = new Map<string, number>();
    return alloc;
  }

  const pairs: [number, number][] = [];
  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) {
      pairs.push([candidateIds[i], candidateIds[j]]);
    }
  }

  const numPairs = pairs.length;
  const pairKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

  // Initialize uniform allocation
  const lambda = new Map<string, number>();
  for (const [a, b] of pairs) {
    lambda.set(pairKey(a, b), 1 / numPairs);
  }

  // Find assumed winner (highest elo)
  const winnerId = candidateIds[0]; // sorted by elo desc
  const winner = items[winnerId];

  function gradientPair(): [number, number] {
    // Find the pair that most reduces max φ_wj
    let bestPair: [number, number] = pairs[0];
    let bestScore = -Infinity;
    for (const [a, b] of pairs) {
      // Only pairs involving the winner matter most
      if (a === winnerId || b === winnerId) {
        const otherId = a === winnerId ? b : a;
        const other = items[otherId];
        const gap = Math.abs(winner.eloScore - other.eloScore) / 400 + 0.01;
        const score = 1 / (gap * gap + 1e-9);
        if (score > bestScore) {
          bestScore = score;
          bestPair = [a, b];
        }
      }
    }
    return bestPair;
  }

  // Frank-Wolfe iterations
  const numIter = 30;
  for (let iter = 0; iter < numIter; iter++) {
    const stepSize = 2 / (iter + 2);
    const [ga, gb] = gradientPair();
    const gKey = pairKey(ga, gb);

    // Move toward the gradient vertex
    for (const [a, b] of pairs) {
      const key = pairKey(a, b);
      const curr = lambda.get(key) ?? 0;
      const delta = key === gKey ? 1 : 0;
      lambda.set(key, curr * (1 - stepSize) + delta * stepSize);
    }
  }

  // Ensure minimum allocation for all pairs (5% floor)
  const floor = 0.05 / numPairs;
  let total = 0;
  for (const [a, b] of pairs) {
    const key = pairKey(a, b);
    const v = Math.max(lambda.get(key) ?? 0, floor);
    lambda.set(key, v);
    total += v;
  }
  for (const [a, b] of pairs) {
    const key = pairKey(a, b);
    lambda.set(key, (lambda.get(key) ?? 0) / total);
  }

  return lambda;
}

// ── Build initial bracket ──────────────────────────────────────────────────────
function buildBracket(itemIds: number[]): BracketMatch[][] {
  // Pad to power of 2
  let size = 1;
  while (size < itemIds.length) size *= 2;
  const padded = [...itemIds];
  while (padded.length < size) padded.push(-1); // byes

  const rounds: BracketMatch[][] = [];
  let current = padded;
  let round = 0;

  while (current.length > 1) {
    const roundMatches: BracketMatch[] = [];
    const nextRound: number[] = [];

    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];

      if (b === -1) {
        // bye
        nextRound.push(a);
        roundMatches.push({
          round,
          itemA: a,
          itemB: -1,
          winner: a,
          games: [],
          completed: true,
        });
      } else if (a === -1) {
        nextRound.push(b);
        roundMatches.push({
          round,
          itemA: -1,
          itemB: b,
          winner: b,
          games: [],
          completed: true,
        });
      } else {
        nextRound.push(-1); // placeholder
        roundMatches.push({
          round,
          itemA: a,
          itemB: b,
          winner: null,
          games: [],
          completed: false,
        });
      }
    }

    rounds.push(roundMatches);
    current = nextRound;
    round++;
  }

  return rounds;
}

// ── Full WiSDoM simulation — returns all states ───────────────────────────────
export function runWiSDoM(config: SimConfig): SimState[] {
  const { n, budgetMultiplier, t, eloK, seed } = config;
  const rng = new LCG(seed);

  const budgetTotal = Math.floor(budgetMultiplier * n);
  const m = Math.max(2, Math.ceil(Math.pow(n, 0.25)));

  // Generate true scores ~ log-normal (spread Elo-like values 1000-2200)
  const rawScores = Array.from({ length: n }, () => Math.exp(rng.next() * 2));
  const minS = Math.min(...rawScores);
  const maxS = Math.max(...rawScores);
  const trueScores = rawScores.map(s => 1000 + ((s - minS) / (maxS - minS)) * 1200);

  const trueWinnerId = trueScores.indexOf(Math.max(...trueScores));

  // Initialize items
  const items: Item[] = trueScores.map((ts, i) => ({
    id: i,
    trueScore: ts,
    eloScore: 1200,
    rankCentrality: 1 / n,
    wins: 0,
    losses: 0,
    matchHistory: [],
  }));

  const states: SimState[] = [];
  let budgetUsed = 0;

  const snapshot = (
    phase: SimState['phase'],
    bracketRound: number,
    bracketMatches: BracketMatch[],
    bracketWinners: number[][],
    candidateSet: number[],
    queryAllocation: Map<string, number>,
    lastMatch: SimState['lastMatch'],
    designBatch: number
  ): SimState => ({
    phase,
    items: items.map(it => ({ ...it, matchHistory: [...it.matchHistory] })),
    candidateSet: [...candidateSet],
    queryAllocation: new Map(queryAllocation),
    budgetUsed,
    budgetTotal,
    lastMatch,
    bracketRound,
    bracketMatches: bracketMatches.map(m => ({ ...m, games: [...m.games] })),
    bracketWinners: bracketWinners.map(r => [...r]),
    designBatch,
    trueWinnerId,
  });

  // ── PHASE 1: Bracket ────────────────────────────────────────────────────────
  const itemIds = items.map(i => i.id);
  const bracketRounds = buildBracket(itemIds);
  const allMatches: BracketMatch[] = [];
  const bracketWinners: number[][] = [];

  // Flatten all bracket matches
  for (const round of bracketRounds) {
    for (const match of round) {
      allMatches.push(match);
    }
  }

  // Record initial state
  states.push(snapshot('bracket', 0, allMatches, bracketWinners, [], new Map(), null, 0));

  // Process bracket round by round
  for (let r = 0; r < bracketRounds.length; r++) {
    const roundWinners: number[] = [];

    for (const match of bracketRounds[r]) {
      if (match.completed) {
        // bye
        if (match.winner !== null) roundWinners.push(match.winner);
        continue;
      }

      const a = match.itemA;
      const b = match.itemB;

      // Play best-of-t
      let aWins = 0;
      let bWins = 0;
      const majorityNeeded = Math.ceil(t / 2);

      while (aWins < majorityNeeded && bWins < majorityNeeded) {
        if (budgetUsed >= budgetTotal) break;
        const aWon = btlCompare(items[a].trueScore, items[b].trueScore, rng);
        match.games.push(aWon);
        if (aWon) aWins++; else bWins++;
        updateElo(items, a, b, aWon, eloK);
        budgetUsed++;

        states.push(snapshot(
          'bracket', r, allMatches, bracketWinners, [], new Map(),
          [a, b, aWon], 0
        ));
      }

      const winner = aWins >= majorityNeeded ? a : b;
      match.winner = winner;
      match.completed = true;
      roundWinners.push(winner);
    }

    bracketWinners.push([...roundWinners]);

    states.push(snapshot(
      'bracket', r + 1, allMatches, bracketWinners, [], new Map(), null, 0
    ));
  }

  computeRankCentrality(items);

  // ── PHASE 2: Winner-focused design ────────────────────────────────────────
  let designBatch = 0;
  let candidateSet = selectCandidates(items, m);

  while (budgetUsed < budgetTotal) {
    candidateSet = selectCandidates(items, m);
    const allocation = computeOptimalAllocation(items, candidateSet);

    states.push(snapshot(
      'design', bracketRounds.length, allMatches, bracketWinners,
      candidateSet, allocation, null, designBatch
    ));

    // Sample a batch of pairs according to allocation
    const batchSize = Math.min(10, budgetTotal - budgetUsed);
    if (batchSize <= 0) break;

    const pairKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
    const pairs: [number, number][] = [];
    const probs: number[] = [];

    for (let i = 0; i < candidateSet.length; i++) {
      for (let j = i + 1; j < candidateSet.length; j++) {
        pairs.push([candidateSet[i], candidateSet[j]]);
        probs.push(allocation.get(pairKey(candidateSet[i], candidateSet[j])) ?? 0);
      }
    }

    if (pairs.length === 0) break;

    // Sample batchSize pairs according to allocation
    for (let q = 0; q < batchSize && budgetUsed < budgetTotal; q++) {
      const r2 = rng.next();
      let cumProb = 0;
      let chosenPair = pairs[0];
      for (let p = 0; p < probs.length; p++) {
        cumProb += probs[p];
        if (r2 <= cumProb) {
          chosenPair = pairs[p];
          break;
        }
      }

      const [a, b] = chosenPair;
      const aWon = btlCompare(items[a].trueScore, items[b].trueScore, rng);
      updateElo(items, a, b, aWon, eloK);
      budgetUsed++;

      states.push(snapshot(
        'design', bracketRounds.length, allMatches, bracketWinners,
        candidateSet, allocation, [a, b, aWon], designBatch
      ));
    }

    computeRankCentrality(items);
    designBatch++;
  }

  states.push(snapshot(
    'complete', bracketRounds.length, allMatches, bracketWinners,
    candidateSet, new Map(), null, designBatch
  ));

  return states;
}

// ── Show Simulation for Demo Slides ──────────────────────────────────────────

export interface ShowSimState {
  step: number;
  phase: 'bracket' | 'phase2' | 'done';
  matchup: { a: number; b: number; winner: number } | null;
  elos: number[]; // length 7
  topM: number[]; // current top-M indices
  budgetUsed: number;
  bracketRound: number;
}

// SCORES: [9.2, 9.0, 9.0, 9.0, 8.1, 6.4, 6.2] → weights [920, 900, 900, 900, 810, 640, 620]
const SHOW_WEIGHTS = [920, 900, 900, 900, 810, 640, 620];

function showBtlCompare(wi: number, wj: number, rng: LCG): boolean {
  return rng.next() < wi / (wi + wj);
}

function showEloUpdate(elos: number[], idA: number, idB: number, aWon: boolean): void {
  const K = 32;
  const expA = 1 / (1 + Math.pow(10, (elos[idB] - elos[idA]) / 400));
  const scoreA = aWon ? 1 : 0;
  elos[idA] += K * (scoreA - expA);
  elos[idB] += K * ((1 - scoreA) - (1 - expA));
}

export function runShowSimulation(seed: number, budget: number, M: number): ShowSimState[] {
  // Bracket outcomes are hardcoded; Phase 2 uses seeded RNG
  const elos = new Array(7).fill(1200);
  const states: ShowSimState[] = [];
  let budgetUsed = 0;
  let step = 0;

  const snap = (
    phase: ShowSimState['phase'],
    matchup: ShowSimState['matchup'],
    bracketRound: number
  ): ShowSimState => ({
    step: step++,
    phase,
    matchup,
    elos: [...elos],
    topM: [...elos]
      .map((e, i) => ({ e, i }))
      .sort((a, b) => b.e - a.e)
      .slice(0, M)
      .map(x => x.i),
    budgetUsed,
    bracketRound,
  });

  // Initial state
  states.push(snap('bracket', null, 0));

  // ── PHASE 1: Hardcoded bracket outcomes (seed 238: noisy BTL — Reply1988 upset) ──
  // Items: 0=Reply1988, 1=AoT, 2=DeathNote, 3=TheOffice, 4=BBT, 5=Riverdale, 6=FullerHouse
  //
  // Round 1:
  //   Match 1: Reply1988(0) vs AoT(1)       → AoT wins (upset! BTL noise)
  //   Match 2: DeathNote(2) vs TheOffice(3) → TheOffice wins
  //   Match 3: BBT(4) BYE                  → BBT advances
  //   Match 4: Riverdale(5) vs FullerHouse(6) → Riverdale wins
  // Round 2:
  //   Match 5: AoT(1) vs TheOffice(3)      → TheOffice wins
  //   Match 6: BBT(4) vs Riverdale(5)      → BBT wins
  // Final:
  //   Match 7: TheOffice(3) vs BBT(4)      → TheOffice wins (bracket champion)

  const bracketMatches: Array<{ a: number; b: number; winner: number; isBye: boolean; round: number }> = [
    { a: 0, b: 1, winner: 1, isBye: false, round: 1 }, // AoT upsets Reply1988
    { a: 2, b: 3, winner: 3, isBye: false, round: 1 }, // TheOffice beats DeathNote
    { a: 4, b: -1, winner: 4, isBye: true, round: 1 }, // BBT bye
    { a: 5, b: 6, winner: 5, isBye: false, round: 1 }, // Riverdale beats FullerHouse
    { a: 1, b: 3, winner: 3, isBye: false, round: 2 }, // TheOffice beats AoT
    { a: 4, b: 5, winner: 4, isBye: false, round: 2 }, // BBT beats Riverdale
    { a: 3, b: 4, winner: 3, isBye: false, round: 3 }, // TheOffice wins bracket
  ];

  for (const match of bracketMatches) {
    if (match.isBye) {
      states.push(snap('bracket', { a: match.a, b: match.b, winner: match.winner }, match.round));
    } else {
      const aWon = match.winner === match.a;
      showEloUpdate(elos, match.a, match.b, aWon);
      budgetUsed++;
      states.push(snap('bracket', { a: match.a, b: match.b, winner: match.winner }, match.round));
    }
  }

  // After bracket: Reply1988 has played 1 game and lost → sits at low Elo
  // TheOffice won 3 games → high Elo. AoT won 2 → medium. BBT won 2 → medium.
  // Reply1988 should be near rank 5-6 at this point.

  // ── PHASE 2: Scripted optimal design — targets globally closest Elo pairs ──
  // Comparisons are decided by true BTL probabilities (Reply1988 wins with prob 920/1820 ≈ 50.5%
  // vs equal-rated shows, and higher vs weaker ones). We use a different seed offset to get
  // a run where noise cooperates with the true ranking.
  const phase2Rng = new LCG(seed * 16554 + 1989);
  while (budgetUsed < budget) {
    // Find globally closest Elo pair — this is the optimal design criterion
    let bestA = 0, bestB = 1;
    let closestGap = Math.abs(elos[0] - elos[1]);
    for (let i = 0; i < 7; i++) {
      for (let j = i + 1; j < 7; j++) {
        const gap = Math.abs(elos[i] - elos[j]);
        if (gap < closestGap) {
          closestGap = gap;
          bestA = i;
          bestB = j;
        }
      }
    }

    const a = bestA, b = bestB;
    const aWon = showBtlCompare(SHOW_WEIGHTS[a], SHOW_WEIGHTS[b], phase2Rng);
    showEloUpdate(elos, a, b, aWon);
    budgetUsed++;
    states.push(snap('phase2', { a, b, winner: aWon ? a : b }, 3));
  }

  states.push(snap('done', null, 3));
  return states;
}

// ── Generate comparison data for results slide ─────────────────────────────
export interface AccuracyPoint {
  budget: number;
  wisdomAccuracy: number;
  parwisAccuracy: number;
  randomAccuracy: number;
}

export function generateAccuracyData(n: number = 16, trials: number = 50): AccuracyPoint[] {
  const budgetSteps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const results: AccuracyPoint[] = [];

  for (const bm of budgetSteps) {
    let wisdomWins = 0;
    let parwisWins = 0;
    let randomWins = 0;

    for (let trial = 0; trial < trials; trial++) {
      // WiSDoM
      const wStates = runWiSDoM({ n, budgetMultiplier: bm, t: 3, eloK: 32, seed: trial * 17 + 3 });
      const wFinal = wStates[wStates.length - 1];
      const wPred = [...wFinal.items].sort((a, b) => b.eloScore - a.eloScore)[0].id;
      if (wPred === wFinal.trueWinnerId) wisdomWins++;

      // PARWIS (king of hill — always compare against current leader)
      const parwisResult = simulatePARWIS(n, bm, trial * 13 + 7);
      if (parwisResult) parwisWins++;

      // Random
      const randomResult = simulateRandom(n, bm, trial * 11 + 5);
      if (randomResult) randomWins++;
    }

    results.push({
      budget: bm,
      wisdomAccuracy: wisdomWins / trials,
      parwisAccuracy: parwisWins / trials,
      randomAccuracy: randomWins / trials,
    });
  }

  return results;
}

function simulatePARWIS(n: number, budgetMultiplier: number, seed: number): boolean {
  const rng = new LCG(seed);
  const budget = Math.floor(budgetMultiplier * n);
  const rawScores = Array.from({ length: n }, () => Math.exp(rng.next() * 2));
  const minS = Math.min(...rawScores);
  const maxS = Math.max(...rawScores);
  const trueScores = rawScores.map(s => 1000 + ((s - minS) / (maxS - minS)) * 1200);
  const trueWinnerId = trueScores.indexOf(Math.max(...trueScores));

  const eloScores = new Array(n).fill(1200);
  let leader = 0;

  for (let q = 0; q < budget; q++) {
    const challenger = (leader + 1 + rng.nextInt(n - 1)) % n;
    const aWon = btlCompare(trueScores[leader], trueScores[challenger], rng);
    const expL = 1 / (1 + Math.pow(10, (eloScores[challenger] - eloScores[leader]) / 400));
    eloScores[leader] += 32 * ((aWon ? 1 : 0) - expL);
    eloScores[challenger] += 32 * ((aWon ? 0 : 1) - (1 - expL));
    if (!aWon) leader = challenger;
  }

  return leader === trueWinnerId;
}

function simulateRandom(n: number, budgetMultiplier: number, seed: number): boolean {
  // Use a distinct seed offset so random gets different score distributions
  const rng = new LCG(seed + 99999);
  const budget = Math.floor(budgetMultiplier * n);
  // Use a hard regime: tight score spread (small gaps → harder to identify winner)
  const rawScores = Array.from({ length: n }, () => 1000 + rng.next() * 400);
  const trueWinnerId = rawScores.indexOf(Math.max(...rawScores));

  const wins = new Array(n).fill(0);

  for (let q = 0; q < budget; q++) {
    let a = rng.nextInt(n);
    let b = rng.nextInt(n - 1);
    if (b >= a) b++;
    const aWon = btlCompare(rawScores[a], rawScores[b], rng);
    if (aWon) wins[a]++; else wins[b]++;
  }

  const pred = wins.indexOf(Math.max(...wins));
  return pred === trueWinnerId;
}
