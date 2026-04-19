import { useEffect, useMemo, useState } from "react";
import {
  INVESTOR_TYPES,
  InvestorType,
  LEVELS,
  STARTING_CASH,
  TOTAL_LEVELS,
  LIFELINES,
  MARKET_DICTIONARY,
} from "@/game/constants";
import { Allocation, LevelOutcome, lifelineReveal, runLevel } from "@/game/engine";
import { HomeScreen } from "@/components/stockquest/HomeScreen";
import { Hud } from "@/components/stockquest/Hud";
import { LevelScreen } from "@/components/stockquest/LevelScreen";
import { ResultsScreen } from "@/components/stockquest/ResultsScreen";
import { NewspaperScreen } from "@/components/stockquest/NewspaperScreen";
import { WinScreen } from "@/components/stockquest/WinScreen";
import { DictionaryModal } from "@/components/stockquest/DictionaryModal";
import { audio } from "@/audio/audioEngine";
import { useAudioUnlock, useMute } from "@/audio/useAudio";

type Phase = "home" | "level" | "results" | "newspaper" | "win";

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
  const [worth, setWorth] = useState(STARTING_CASH);
  const [lifelinesLeft, setLifelinesLeft] = useState(LIFELINES);
  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

  // Last round state
  const [lastOutcome, setLastOutcome] = useState<LevelOutcome | null>(null);
  const [lastConfidence, setLastConfidence] = useState<"low" | "medium" | "high">("medium");
  const [poolBeforeLast, setPoolBeforeLast] = useState(STARTING_CASH);

  const [history, setHistory] = useState<RoundLog[]>([]);

  const investor = useMemo(
    () => INVESTOR_TYPES.find((i) => i.id === investorTypeId) ?? INVESTOR_TYPES[0],
    [investorTypeId],
  );

  const hotStreak = history.slice(-3).length === 3 && history.slice(-3).every((r) => r.profit > 0);
  const losingStreak = history.slice(-2).length === 2 && history.slice(-2).every((r) => r.profit < 0);

  function handleStart() {
    if (!investorTypeId) return;
    setLevelIdx(0);
    setWorth(STARTING_CASH);
    setLifelinesLeft(LIFELINES);
    setUnlockedTerms([]);
    setNewlyUnlocked([]);
    setHistory([]);
    setPhase("level");
  }

  function handleUseLifeline(hintId: string): string {
    if (lifelinesLeft <= 0) return "";
    setLifelinesLeft((n) => n - 1);
    return lifelineReveal(hintId);
  }

  function handleInvest(allocation: Allocation, confidence: "low" | "medium" | "high", bossHintId: string | null) {
    const cfg = LEVELS[levelIdx];
    const pool = worth;
    const outcome = runLevel(cfg.level, pool, allocation, bossHintId ? [bossHintId] : []);
    setPoolBeforeLast(pool);
    setLastOutcome(outcome);
    setLastConfidence(confidence);
    setWorth(outcome.totalReturned);

    // Unlock dictionary terms for this level
    const newKeys = cfg.unlockTerms.filter((k) => MARKET_DICTIONARY[k] && !unlockedTerms.includes(k));
    if (newKeys.length > 0) {
      setUnlockedTerms((prev) => Array.from(new Set([...prev, ...newKeys])));
      setNewlyUnlocked(newKeys);
    } else {
      setNewlyUnlocked([]);
    }

    // Track history
    const hadWinningPick = outcome.results.some((r) => r.invested > 0 && r.pctChange > 0);
    setHistory((h) => [...h, { level: cfg.level, profit: outcome.profit, diversificationStars: outcome.diversificationStars, hadWinningPick }]);

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
    setLevelIdx((i) => i + 1);
    setNewlyUnlocked([]);
    setPhase("level");
  }

  function handlePlayAgain() {
    setPhase("home");
    setInvestorTypeId(null);
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

  if (phase === "win") {
    return (
      <WinScreen
        finalWorth={worth}
        signalsRead={signalsRead}
        totalSignals={totalSignals}
        avgDiversification={avgDiv}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <>
      <Hud
        portfolio={worth}
        totalWorth={worth}
        level={LEVELS[levelIdx].level}
        totalLevels={TOTAL_LEVELS}
        investor={investor}
        onOpenDictionary={() => setDictionaryOpen(true)}
        unlockedCount={unlockedTerms.length}
      />

      {phase === "level" && (
        <LevelScreen
          config={LEVELS[levelIdx]}
          pool={worth}
          lifelinesLeft={lifelinesLeft}
          onUseLifeline={handleUseLifeline}
          onInvest={handleInvest}
        />
      )}

      {phase === "results" && lastOutcome && (
        <ResultsScreen
          config={LEVELS[levelIdx]}
          outcome={lastOutcome}
          pool={poolBeforeLast}
          newWorth={worth}
          confidence={lastConfidence}
          hotStreak={hotStreak}
          losingStreak={losingStreak}
          onNext={handleAfterResults}
          isLast={levelIdx + 1 >= TOTAL_LEVELS}
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
