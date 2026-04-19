// StockQuest progression — localStorage-backed unlocks, stars, personal bests, vault.
import { useCallback, useEffect, useState } from "react";
import { LevelOutcome } from "./engine";
import { STARTING_CASH, TOTAL_LEVELS, VAULT_UNLOCK_LEVEL } from "./constants";

export interface LevelRecord {
  unlocked: boolean;
  played: boolean;
  stars: number; // 0-3, best ever
  bestProfit: number | null; // best profit ever for this level
  lastProfit: number | null; // most recent profit
  poolBefore: number | null; // pool at the start of the most-recent attempt (for "Continue From Here")
  poolAfter: number | null;
  diversificationStars: number; // best
  personalBest: boolean; // true if last attempt set the best stars
}

export interface ProgressionState {
  levels: LevelRecord[]; // length = TOTAL_LEVELS
  vault: number; // money safely stashed (does not get invested)
  vaultUnlocked: boolean;
  currentLevel: number; // next level to play (1-indexed, the lowest unlocked-but-unplayed level)
  worth: number; // active cash pool (unlike vault — invested each round)
}

const STORAGE_KEY = "stockquest.progression.v1";

export function defaultState(): ProgressionState {
  const levels: LevelRecord[] = Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
    unlocked: i === 0,
    played: false,
    stars: 0,
    bestProfit: null,
    lastProfit: null,
    poolBefore: i === 0 ? STARTING_CASH : null,
    poolAfter: null,
    diversificationStars: 0,
    personalBest: false,
  }));
  return {
    levels,
    vault: 0,
    vaultUnlocked: false,
    currentLevel: 1,
    worth: STARTING_CASH,
  };
}

function loadState(): ProgressionState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed?.levels || parsed.levels.length !== TOTAL_LEVELS) return defaultState();
    return parsed as ProgressionState;
  } catch {
    return defaultState();
  }
}

function saveState(s: ProgressionState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function computeStars(profit: number, diversificationStars: number, played: boolean): number {
  if (!played) return 0;
  if (profit > 0 && diversificationStars >= 4) return 3;
  if (profit > 0 && diversificationStars >= 3) return 2;
  return 1;
}

export function totalStars(state: ProgressionState): number {
  return state.levels.reduce((s, l) => s + l.stars, 0);
}

export interface UseProgression {
  state: ProgressionState;
  reset: () => void;
  recordOutcome: (
    levelNum: number,
    poolBefore: number,
    outcome: LevelOutcome,
  ) => { newStars: number; newPersonalBest: boolean; previousStars: number };
  setActiveLevel: (levelNum: number) => void;
  startLevel: (levelNum: number) => void; // called when entering a level — sets currentLevel + worth
  setWorth: (w: number) => void;
  depositVault: (amount: number) => void;
  withdrawVault: (amount: number) => void;
  unlockVault: () => void;
}

export function useProgression(): UseProgression {
  const [state, setState] = useState<ProgressionState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const reset = useCallback(() => setState(defaultState()), []);

  const recordOutcome = useCallback(
    (levelNum: number, poolBefore: number, outcome: LevelOutcome) => {
      let result = { newStars: 0, newPersonalBest: false, previousStars: 0 };
      setState((prev) => {
        const idx = levelNum - 1;
        const cur = prev.levels[idx];
        const newStars = computeStars(outcome.profit, outcome.diversificationStars, true);
        const previousStars = cur.stars;
        const isBest = newStars > previousStars;
        const bestProfit = cur.bestProfit === null ? outcome.profit : Math.max(cur.bestProfit, outcome.profit);
        const newRecord: LevelRecord = {
          ...cur,
          unlocked: true,
          played: true,
          stars: Math.max(cur.stars, newStars),
          bestProfit,
          lastProfit: outcome.profit,
          poolBefore,
          poolAfter: outcome.totalReturned,
          diversificationStars: Math.max(cur.diversificationStars, outcome.diversificationStars),
          personalBest: isBest,
        };
        const levels = [...prev.levels];
        levels[idx] = newRecord;
        // Unlock next level
        if (idx + 1 < TOTAL_LEVELS) {
          levels[idx + 1] = {
            ...levels[idx + 1],
            unlocked: true,
            poolBefore: levels[idx + 1].poolBefore ?? outcome.totalReturned,
          };
        }
        // Vault unlock check
        const vaultUnlocked = prev.vaultUnlocked || levelNum >= VAULT_UNLOCK_LEVEL;
        result = { newStars, newPersonalBest: isBest, previousStars };
        return {
          ...prev,
          levels,
          vaultUnlocked,
          worth: outcome.totalReturned,
        };
      });
      return result;
    },
    [],
  );

  const setActiveLevel = useCallback((levelNum: number) => {
    setState((prev) => ({ ...prev, currentLevel: levelNum }));
  }, []);

  const startLevel = useCallback((levelNum: number) => {
    setState((prev) => {
      const idx = levelNum - 1;
      const cur = prev.levels[idx];
      // Use stored poolBefore when available (for replay/continue), else current worth.
      const startPool = cur.poolBefore ?? prev.worth;
      const levels = [...prev.levels];
      levels[idx] = { ...cur, poolBefore: startPool };
      return { ...prev, currentLevel: levelNum, worth: startPool, levels };
    });
  }, []);

  const setWorth = useCallback((w: number) => {
    setState((prev) => ({ ...prev, worth: w }));
  }, []);

  const depositVault = useCallback((amount: number) => {
    setState((prev) => {
      if (!prev.vaultUnlocked) return prev;
      const amt = Math.max(0, Math.min(amount, prev.worth));
      return { ...prev, worth: prev.worth - amt, vault: prev.vault + amt };
    });
  }, []);

  const withdrawVault = useCallback((amount: number) => {
    setState((prev) => {
      const amt = Math.max(0, Math.min(amount, prev.vault));
      return { ...prev, worth: prev.worth + amt, vault: prev.vault - amt };
    });
  }, []);

  const unlockVault = useCallback(() => {
    setState((prev) => (prev.vaultUnlocked ? prev : { ...prev, vaultUnlocked: true }));
  }, []);

  return { state, reset, recordOutcome, setActiveLevel, startLevel, setWorth, depositVault, withdrawVault, unlockVault };
}
