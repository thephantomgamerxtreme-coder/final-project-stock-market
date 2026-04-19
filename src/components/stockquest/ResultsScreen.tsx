import { COMPANIES, LevelConfig } from "@/game/constants";
import { LevelOutcome, confidenceFeedback } from "@/game/engine";
import { Star, ArrowRight, Flame, Sparkles, Award, Map } from "lucide-react";
import { ConnectionDiagram } from "./ConnectionDiagram";

interface ResultsScreenProps {
  config: LevelConfig;
  outcome: LevelOutcome;
  pool: number;
  newWorth: number;
  confidence: "low" | "medium" | "high";
  hotStreak: boolean;
  losingStreak: boolean;
  onNext: () => void;
  isLast: boolean;
  roundStars: number; // 1-3 stars earned this round
  personalBest: boolean;
  previousStars: number;
  onBackToMap: () => void;
}

export function ResultsScreen({
  config, outcome, pool, newWorth, confidence, hotStreak, losingStreak, onNext, isLast,
  roundStars, personalBest, previousStars, onBackToMap,
}: ResultsScreenProps) {
  const win = outcome.profit >= 0;
  const profitAbs = Math.abs(outcome.profit);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Headline */}
      <div className={`panel relative overflow-hidden p-6 sm:p-8 text-center ${win ? "border-primary/40" : "border-loss/40"}`}>
        <div className={`text-xs uppercase tracking-[0.3em] ${win ? "text-primary" : "text-loss"}`}>
          Round {config.level} results
        </div>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-5xl">
          {win ? (
            <span>Nice work! You made <span className="font-mono-num text-gain">${profitAbs.toFixed(2)}</span> this round 🎉</span>
          ) : (
            <span>Oops! You lost <span className="font-mono-num text-loss">${profitAbs.toFixed(2)}</span> this round 😬</span>
          )}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          {confidenceFeedback(confidence, outcome.profit)}
        </p>

        {hotStreak && (
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-amber px-4 py-1.5 text-sm font-extrabold text-accent-foreground shadow-amber">
            <Flame className="h-4 w-4" /> Hot Streak — 3 wins in a row!
          </div>
        )}
        {losingStreak && (
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-xs text-accent">
            <Sparkles className="h-4 w-4" /> Coach tip: Try spreading your money across more companies next time.
          </div>
        )}
      </div>

      {/* Per-company results */}
      <div className="mt-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Your trades</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {outcome.results.filter((r) => r.invested > 0).map((r) => {
            const c = COMPANIES[r.ticker];
            const up = r.returned >= r.invested;
            return (
              <div key={r.ticker} className="panel p-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-mono-num text-lg font-extrabold tracking-wider text-primary">{r.ticker}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{c.name}</span>
                  </div>
                  <span className={`font-mono-num text-sm font-bold ${up ? "text-gain" : "text-loss"}`}>
                    {up ? "+" : ""}{(r.pctChange * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 font-mono-num text-sm">
                  <span className="text-muted-foreground">${r.invested.toFixed(2)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={`font-bold ${up ? "text-gain" : "text-loss"}`}>${r.returned.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.reason}</p>
              </div>
            );
          })}
          {outcome.results.every((r) => r.invested === 0) && (
            <div className="panel p-4 text-sm text-muted-foreground">You didn't invest in any company this round.</div>
          )}
        </div>
      </div>

      {/* Connection diagram */}
      <div className="mt-5">
        <ConnectionDiagram config={config} outcome={outcome} />
      </div>

      {/* What if + diversification */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-widest text-accent">What if?</div>
          {outcome.bestAlt ? (
            <p className="mt-2 text-sm">
              If you had put 80% in <span className="font-mono-num font-bold text-primary">{outcome.bestAlt.ticker}</span> instead, you would
              have made <span className="font-mono-num font-bold text-gain">${outcome.bestAlt.profitDelta.toFixed(2)}</span> more this round.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Nice — your allocation was already among the best for this round!
            </p>
          )}
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-widest text-accent">Diversification</div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i < outcome.diversificationStars ? "text-accent" : "text-muted-foreground/30"}`}
                fill={i < outcome.diversificationStars ? "currentColor" : "none"}
              />
            ))}
            <span className="ml-2 font-mono-num text-sm text-muted-foreground">{outcome.diversificationStars}/5</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{outcome.diversificationNote}</p>
        </div>
      </div>

      {/* Real world */}
      <div className="panel mt-3 border-secondary/40 p-4">
        <div className="text-xs uppercase tracking-widest text-secondary">🌍 Real-world connection</div>
        <p className="mt-2 text-sm text-muted-foreground">{outcome.realWorld}</p>
      </div>

      {/* Summary + next */}
      <div className="mt-5 flex flex-col items-center gap-4 text-center">
        <p className="text-sm">
          Your portfolio is now worth{" "}
          <span className="font-mono-num text-xl font-extrabold text-accent">${newWorth.toFixed(2)}</span>. Keep going!
        </p>
        <button
          onClick={onNext}
          className="rounded-xl bg-gradient-primary px-8 py-3 text-sm font-extrabold uppercase tracking-widest text-primary-foreground glow-primary hover:scale-105"
        >
          {isLast ? "See your final score →" : "Read the headlines →"}
        </button>
      </div>
    </div>
  );
}
