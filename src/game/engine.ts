import { COMPANIES, HINTS, LEVELS, NewsHint, Sector } from "./constants";

export type Allocation = Record<string, number>; // ticker -> percent (0-100)

export interface RoundResult {
  ticker: string;
  invested: number;
  returned: number;
  pctChange: number;
  reason: string;
}

export interface LevelOutcome {
  results: RoundResult[];
  totalInvested: number;
  totalReturned: number;
  profit: number;
  diversificationStars: number;
  diversificationNote: string;
  bestAlt: { ticker: string; profitDelta: number; pctChange: number } | null;
  realWorld: string;
  // sector -> total pct shock (for connection diagram)
  sectorShocks: Record<string, number>;
  // ticker -> winning hint ids (for connection diagram)
  drivers: Record<string, { hintId: string; pct: number }[]>;
}

// Difficulty scaling — later levels punish wrong picks harder and widen the shock range.
// Returns multipliers for upside vs downside shocks plus the absolute cap.
export function difficultyFor(level: number): { upMult: number; downMult: number; cap: number; driftMult: number } {
  // Level 1 → easy, Level 10 → brutal. Downside ramps faster than upside.
  const t = Math.max(0, Math.min(1, (level - 1) / 9)); // 0..1
  const upMult = 1 + t * 0.15;            // 1.00 → 1.15  (slight reward bump)
  const downMult = 1 + t * 1.20;          // 1.00 → 2.20  (wrong picks bleed hard late)
  const cap = 0.55 + t * 0.45;            // 0.55 → 1.00  (allow bigger swings)
  const driftMult = 1 + t * 1.5;          // noisier untouched stocks late game
  return { upMult, downMult, cap, driftMult };
}

// Combine all relevant hints (level hints + boss event if confirmed) into a sector shock map.
export function computeSectorShocks(hintIds: string[], level = 1): Record<string, number> {
  const { upMult, downMult, cap } = difficultyFor(level);
  const shocks: Record<string, number> = {};
  for (const id of hintIds) {
    const h = HINTS[id];
    if (!h) continue;
    for (const imp of h.impacts) {
      const scaled = imp.pct >= 0 ? imp.pct * upMult : imp.pct * downMult;
      shocks[imp.sector] = (shocks[imp.sector] ?? 0) + scaled;
    }
  }
  // Cap shocks — asymmetric so downside can be harsher than upside.
  for (const k of Object.keys(shocks)) {
    shocks[k] = Math.max(-cap, Math.min(cap * 0.85, shocks[k]));
  }
  return shocks;
}

export function pctChangeForTicker(ticker: string, shocks: Record<string, number>, level = 1): number {
  const sector = COMPANIES[ticker].sector;
  const { driftMult } = difficultyFor(level);
  // Baseline drift so even untouched stocks move; later levels add more noise (often negative).
  const seed = Math.sin(ticker.charCodeAt(0) + ticker.length);
  const drift = seed * 0.03 * driftMult;
  return (shocks[sector] ?? 0) + drift;
}

export function explainTickerMove(ticker: string, activeHints: NewsHint[]): string {
  const sector = COMPANIES[ticker].sector;
  const relevant = activeHints
    .map((h) => ({ h, imp: h.impacts.find((i) => i.sector === sector) }))
    .filter((x) => x.imp);

  if (relevant.length === 0) {
    return `${COMPANIES[ticker].name} barely moved — no big news touched the ${sector.toLowerCase()} sector this round.`;
  }
  // Pick strongest absolute impact for the explanation.
  relevant.sort((a, b) => Math.abs(b.imp!.pct) - Math.abs(a.imp!.pct));
  const top = relevant[0];
  const dir = top.imp!.pct >= 0 ? "went up" : "went down";
  const pct = Math.abs(Math.round(top.imp!.pct * 100));
  return `${top.h.headline.toLowerCase()} — so ${COMPANIES[ticker].name} ${dir} ${pct}%.`;
}

export function diversificationScore(allocation: Allocation, tickers: string[]): { stars: number; note: string } {
  const used = tickers.filter((t) => (allocation[t] ?? 0) > 0);
  if (used.length === 0) return { stars: 1, note: "You didn't invest anywhere this round!" };
  if (used.length === 1) return { stars: 1, note: "You put everything in one company — diversifying reduces risk!" };

  // Compute Herfindahl index (sum of squared shares of allocated portion).
  const allocated = used.reduce((s, t) => s + allocation[t], 0);
  const hhi = used.reduce((s, t) => {
    const share = allocation[t] / allocated;
    return s + share * share;
  }, 0);

  // hhi: 1.0 = one stock, 1/n = perfectly even.
  const evenness = 1 - (hhi - 1 / used.length) / (1 - 1 / used.length || 1);
  const breadth = used.length / tickers.length;
  const score = evenness * 0.6 + breadth * 0.4;
  const stars = Math.max(1, Math.min(5, Math.round(score * 5)));

  const notes: Record<number, string> = {
    1: "Heavily concentrated in one bet — risky if the news flips.",
    2: "A bit spread out, but one stock dominated your picks.",
    3: "Decent mix — you covered some ground.",
    4: "Nice spread! You hedged your bets well.",
    5: "Excellent diversification across the board.",
  };
  return { stars, note: notes[stars] };
}

export function runLevel(
  level: number,
  pool: number,
  allocation: Allocation,
  extraHintIds: string[] = [], // boss news hints already in the active set (if any)
): LevelOutcome {
  const cfg = LEVELS[level - 1];
  const allHintIds = [...cfg.hintIds, ...extraHintIds];
  // De-dup
  const hintIds = Array.from(new Set(allHintIds));
  const shocks = computeSectorShocks(hintIds, cfg.level);
  const activeHints = hintIds.map((id) => HINTS[id]).filter(Boolean);

  const results: RoundResult[] = [];
  let totalInvested = 0;
  let totalReturned = 0;
  const drivers: Record<string, { hintId: string; pct: number }[]> = {};

  for (const ticker of cfg.tickers) {
    const pct = (allocation[ticker] ?? 0) / 100;
    const invested = +(pool * pct).toFixed(2);
    const move = pctChangeForTicker(ticker, shocks, cfg.level);
    const returned = +(invested * (1 + move)).toFixed(2);
    const reason = explainTickerMove(ticker, activeHints);
    results.push({ ticker, invested, returned, pctChange: move, reason });
    if (invested > 0) {
      totalInvested += invested;
      totalReturned += returned;
    }
    // Drivers for diagram — every hint that touches this sector.
    drivers[ticker] = activeHints
      .map((h) => ({ hintId: h.id, imp: h.impacts.find((i) => i.sector === COMPANIES[ticker].sector) }))
      .filter((x) => x.imp)
      .map((x) => ({ hintId: x.hintId!, pct: x.imp!.pct }));
  }

  // Add the unallocated cash back at face value.
  const unallocatedPct = 100 - cfg.tickers.reduce((s, t) => s + (allocation[t] ?? 0), 0);
  const unallocated = +(pool * (unallocatedPct / 100)).toFixed(2);
  const totalReturnedAll = +(totalReturned + unallocated).toFixed(2);
  const profit = +(totalReturnedAll - pool).toFixed(2);

  // Best-alternative single-stock allocation across the offered tickers.
  let best: { ticker: string; profitDelta: number; pctChange: number } | null = null;
  for (const t of cfg.tickers) {
    const move = pctChangeForTicker(t, shocks);
    const altReturn = pool * (1 + move);
    const altProfit = altReturn - pool;
    const delta = +(altProfit - profit).toFixed(2);
    if (delta > 0 && (!best || delta > best.profitDelta)) {
      best = { ticker: t, profitDelta: delta, pctChange: move };
    }
  }

  const div = diversificationScore(allocation, cfg.tickers);

  // Real world line — pick the news with biggest absolute impact this round.
  const sortedByImpact = [...activeHints].sort((a, b) => {
    const aMax = Math.max(...a.impacts.map((i) => Math.abs(i.pct)));
    const bMax = Math.max(...b.impacts.map((i) => Math.abs(i.pct)));
    return bMax - aMax;
  });
  const realWorld = sortedByImpact[0]?.realWorld ?? "Markets move every day based on real-world events like these.";

  return {
    results,
    totalInvested: +totalInvested.toFixed(2),
    totalReturned: +totalReturnedAll.toFixed(2),
    profit,
    diversificationStars: div.stars,
    diversificationNote: div.note,
    bestAlt: best,
    realWorld,
    sectorShocks: shocks,
    drivers,
  };
}

// Confidence feedback messaging.
export function confidenceFeedback(
  confidence: "low" | "medium" | "high",
  profit: number,
): string {
  const win = profit >= 0;
  if (confidence === "high" && win) return "Your confidence paid off! Great read of the news. 🎯";
  if (confidence === "high" && !win) return "Markets surprised you this time — even pros get caught out!";
  if (confidence === "medium" && win) return "Nice — your gut was right and the market agreed.";
  if (confidence === "medium" && !win) return "Close call. Re-check which sector each headline touches.";
  if (confidence === "low" && win) return "You weren't sure, but the picks worked out — lucky and smart!";
  return "You sensed the risk. Trust that instinct and tighten your reads.";
}

// Lifeline reveal — returns the dominant sector for a hint.
export function lifelineReveal(hintId: string): Sector {
  const h = HINTS[hintId];
  const sorted = [...h.impacts].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  return sorted[0].sector;
}
