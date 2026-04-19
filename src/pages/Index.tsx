import { useEffect, useMemo, useState } from "react";
import {
  INVESTOR_TYPES,
  InvestorType,
  LEVELS,
  STARTING_CASH,
  TOTAL_LEVELS,
  LIFELINES,
  MARKET_DICTIONARY,
  MAX_STARS,
} from "@/game/constants";
import { Allocation, LevelOutcome, lifelineReveal, runLevel } from "@/game/engine";
import { useProgression } from "@/game/progression";
import { HomeScreen } from "@/components/stockquest/HomeScreen";
import { Hud } from "@/components/stockquest/Hud";
import { LevelScreen } from "@/components/stockquest/LevelScreen";
import { ResultsScreen } from "@/components/stockquest/ResultsScreen";
import { NewspaperScreen } from "@/components/stockquest/NewspaperScreen";
import { WinScreen } from "@/components/stockquest/WinScreen";
import { DictionaryModal } from "@/components/stockquest/DictionaryModal";
import { TickerTape } from "@/components/stockquest/TickerTape";
import { LevelSelectScreen } from "@/components/stockquest/LevelSelectScreen";
import { LevelDetailModal } from "@/components/stockquest/LevelDetailModal";
import { audio } from "@/audio/audioEngine";
import { useAudioUnlock, useMute } from "@/audio/useAudio";

type Phase = "home" | "map" | "level" | "results" | "newspaper" | "win";

interface RoundLog {
  level: number;
  profit: number;
  diversificationStars: number;
  hadWinningPick: boolean;
}

const Index = () => {
  const [phase, setPhase] = useState<Phase>("home");
  const [investorTypeId, setInvestorTypeId] = useState<InvestorType["id"] | null>(null);
  const [levelIdx, setLevelIdx] = useState(0); // 0..9
  const [lifelinesLeft, setLifelinesLeft] = useState(LIFELINES);
  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [bossActive, setBossActive] = useState(false);
  const [detailLevel, setDetailLevel] = useState<number | null>(null);

  const progression = useProgression();
  const { state, recordOutcome, startLevel, reset: resetProgression, depositVault } = progression;

  useAudioUnlock();
  const { muted, toggle: toggleMute } = useMute();

  // Last round state
  const [lastOutcome, setLastOutcome] = useState<LevelOutcome | null>(null);
  const [lastConfidence, setLastConfidence] = useState<"low" | "medium" | "high">("medium");
  const [poolBeforeLast, setPoolBeforeLast] = useState(STARTING_CASH);
  const [lastRoundStars, setLastRoundStars] = useState(0);
  const [lastPersonalBest, setLastPersonalBest] = useState(false);
  const [lastPreviousStars, setLastPreviousStars] = useState(0);

  const [history, setHistory] = useState<RoundLog[]>([]);

  const investor = useMemo(
    () => INVESTOR_TYPES.find((i) => i.id === investorTypeId) ?? INVESTOR_TYPES[0],
    [investorTypeId],
  );

  const hotStreak = history.slice(-3).length === 3 && history.slice(-3).every((r) => r.profit > 0);
  const losingStreak = history.slice(-2).length === 2 && history.slice(-2).every((r) => r.profit < 0);
  const totalStarsEarned = state.levels.reduce((s, l) => s + l.stars, 0);
  const totalWorth = state.worth + state.vault;

  // Music orchestration based on phase + boss state
  useEffect(() => {
    if (phase === "home" || phase === "map") audio.startMusic("home");
    else if (phase === "win") audio.startMusic("win");
    else audio.startMusic(bossActive ? "boss" : "level");
  }, [phase, bossActive]);

  function handleStart() {
    if (!investorTypeId) return;
    setPhase("map");
  }

  function handlePickLevel(levelNum: number) {
    const rec = state.levels[levelNum - 1];
    if (!rec.unlocked) return;
    if (rec.played) {
      // Show detail modal for completed levels.
      setDetailLevel(levelNum);
    } else {
      // Enter the level fresh.
      enterLevel(levelNum);
    }
  }

  function enterLevel(levelNum: number) {
    setDetailLevel(null);
    setLevelIdx(levelNum - 1);
    setLifelinesLeft(LIFELINES);
    startLevel(levelNum);
    setBossActive(false);
    setPhase("level");
  }

  function handleUseLifeline(hintId: string): string {
    if (lifelinesLeft <= 0) return "";
    setLifelinesLeft((n) => n - 1);
    audio.sfxLifeline();
    return lifelineReveal(hintId);
  }

  function handleInvest(
    allocation: Allocation,
    confidence: "low" | "medium" | "high",
    bossHintId: string | null,
    vaultDeposit: number,
  ) {
    audio.sfxInvest();
    const cfg = LEVELS[levelIdx];
    const poolAtStart = state.worth;
    // Stash vault deposit before computing returns.
    if (vaultDeposit > 0 && state.vaultUnlocked) {
      depositVault(vaultDeposit);
    }
    const investablePool = Math.max(0, +(poolAtStart - vaultDeposit).toFixed(2));
    const outcome = runLevel(cfg.level, investablePool, allocation, bossHintId ? [bossHintId] : []);

    setPoolBeforeLast(poolAtStart);
    setLastOutcome(outcome);
    setLastConfidence(confidence);

    // Record into progression — this updates worth + unlocks next level + vault.
    const rec = recordOutcome(cfg.level, poolAtStart, outcome);
    setLastRoundStars(rec.newStars);
    setLastPersonalBest(rec.newPersonalBest);
    setLastPreviousStars(rec.previousStars);

    // Unlock dictionary terms for this level
    const newKeys = cfg.unlockTerms.filter((k) => MARKET_DICTIONARY[k] && !unlockedTerms.includes(k));
    if (newKeys.length > 0) {
      setUnlockedTerms((prev) => Array.from(new Set([...prev, ...newKeys])));
      setNewlyUnlocked(newKeys);
      setTimeout(() => audio.sfxUnlock(), 900);
    } else {
      setNewlyUnlocked([]);
    }

    // Result chime
    setTimeout(() => {
      if (outcome.profit >= 0) audio.sfxProfit();
      else audio.sfxLoss();
    }, 250);

    const hadWinningPick = outcome.results.some((r) => r.invested > 0 && r.pctChange > 0);
    setHistory((h) => [...h, { level: cfg.level, profit: outcome.profit, diversificationStars: outcome.diversificationStars, hadWinningPick }]);

    setBossActive(false);
    setPhase("results");
  }

  function handleAfterResults() {
    if (levelIdx + 1 >= TOTAL_LEVELS) {
      setPhase("win");
    } else {
      setPhase("newspaper");
    }
  }

  function handleAfterNewspaper() {
    const nextLevel = levelIdx + 2; // +1 for next, then convert to 1-indexed
    setNewlyUnlocked([]);
    enterLevel(nextLevel);
  }

  function handlePlayAgain() {
    resetProgression();
    setPhase("home");
    setInvestorTypeId(null);
    setHistory([]);
    setUnlockedTerms([]);
    setNewlyUnlocked([]);
    setLifelinesLeft(LIFELINES);
  }

  function handleOpenMap() {
    setPhase("map");
  }

  // Derived stats for win screen
  const signalsRead = history.filter((r) => r.hadWinningPick).length;
  const totalSignals = history.length;
  const avgDiv =
    history.length === 0 ? 0 : history.reduce((s, r) => s + r.diversificationStars, 0) / history.length;

  if (phase === "home") {
    return (
      <HomeScreen
        selectedType={investorTypeId}
        onSelectType={setInvestorTypeId}
        onStart={handleStart}
      />
    );
  }

  if (phase === "map") {
    return (
      <>
        <LevelSelectScreen
          state={state}
          onPickLevel={handlePickLevel}
          onBackHome={() => setPhase("home")}
        />
        {detailLevel !== null && (
          <LevelDetailModal
            levelNum={detailLevel}
            record={state.levels[detailLevel - 1]}
            onClose={() => setDetailLevel(null)}
            onReplay={() => enterLevel(detailLevel)}
            onContinue={() => enterLevel(detailLevel)}
          />
        )}
      </>
    );
  }

  if (phase === "win") {
    return (
      <WinScreen
        finalWorth={totalWorth}
        signalsRead={signalsRead}
        totalSignals={totalSignals}
        avgDiversification={avgDiv}
        totalStarsEarned={totalStarsEarned}
        onPlayAgain={handlePlayAgain}
        onBackToMap={() => setPhase("map")}
      />
    );
  }

  return (
    <>
      <TickerTape />
      <Hud
        portfolio={state.worth}
        totalWorth={totalWorth}
        level={LEVELS[levelIdx].level}
        totalLevels={TOTAL_LEVELS}
        investor={investor}
        onOpenDictionary={() => setDictionaryOpen(true)}
        unlockedCount={unlockedTerms.length}
        muted={muted}
        onToggleMute={toggleMute}
        starsEarned={totalStarsEarned}
        maxStars={MAX_STARS}
        onOpenMap={handleOpenMap}
        vaultUnlocked={state.vaultUnlocked}
        vault={state.vault}
      />

      {phase === "level" && (
        <LevelScreen
          config={LEVELS[levelIdx]}
          pool={state.worth}
          lifelinesLeft={lifelinesLeft}
          onUseLifeline={handleUseLifeline}
          onInvest={handleInvest}
          onBossOpen={() => setBossActive(true)}
          onBossClose={() => setBossActive(false)}
          vaultUnlocked={state.vaultUnlocked}
          vaultBalance={state.vault}
        />
      )}

      {phase === "results" && lastOutcome && (
        <ResultsScreen
          config={LEVELS[levelIdx]}
          outcome={lastOutcome}
          pool={poolBeforeLast}
          newWorth={state.worth + state.vault}
          confidence={lastConfidence}
          hotStreak={hotStreak}
          losingStreak={losingStreak}
          onNext={handleAfterResults}
          isLast={levelIdx + 1 >= TOTAL_LEVELS}
          roundStars={lastRoundStars}
          personalBest={lastPersonalBest}
          previousStars={lastPreviousStars}
          onBackToMap={handleOpenMap}
        />
      )}

      {phase === "newspaper" && (
        <NewspaperScreen config={LEVELS[levelIdx]} onContinue={handleAfterNewspaper} />
      )}

      <DictionaryModal
        open={dictionaryOpen}
        unlocked={unlockedTerms}
        newlyUnlocked={newlyUnlocked}
        onClose={() => setDictionaryOpen(false)}
      />

      <footer className="mx-auto max-w-7xl px-5 py-6 text-center text-[10px] text-muted-foreground/70">
        StockQuest is for educational purposes only. It does not constitute financial advice. All companies and events are fictional or used for learning.
      </footer>
    </>
  );
};

export default Index;
