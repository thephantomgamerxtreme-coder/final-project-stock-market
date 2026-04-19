import { STARTING_CASH, MAX_STARS, getRank } from "@/game/constants";
import { Star, Trophy, Repeat, Map } from "lucide-react";
import { Logo } from "./Logo";

interface WinScreenProps {
  finalWorth: number;
  signalsRead: number;
  totalSignals: number;
  avgDiversification: number;
  totalStarsEarned: number;
  onPlayAgain: () => void;
  onBackToMap: () => void;
}

export function WinScreen({
  finalWorth, signalsRead, totalSignals, avgDiversification, totalStarsEarned, onPlayAgain, onBackToMap,
}: WinScreenProps) {
  const pct = ((finalWorth - STARTING_CASH) / STARTING_CASH) * 100;
  const win = finalWorth >= STARTING_CASH;
  const rank = getRank(totalStarsEarned);

  return (
    <div className="min-h-screen px-5 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex justify-center"><Logo size="md" /></div>
        <div className={`panel relative overflow-hidden p-8 text-center ${win ? "border-primary/50 shadow-glow" : "border-loss/40"}`}>
          <Trophy className={`mx-auto h-14 w-14 ${win ? "text-accent" : "text-muted-foreground"}`} />
          <div className="mt-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Quest complete</div>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            {win ? "You beat the market!" : "Great run — markets are tough!"}
          </h2>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-amber px-5 py-2 text-base font-extrabold text-accent-foreground shadow-amber">
            {rank.emoji} {rank.title}
          </div>

          <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Final worth" value={`$${finalWorth.toFixed(2)}`} accent />
            <Stat label="Total return" value={`${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`} positive={pct >= 0} />
            <Stat label="Stars" value={`${totalStarsEarned}/${MAX_STARS}`} />
            <Stat label="Avg. diversification" value={`${avgDiversification.toFixed(1)}★`} />
          </div>

          <div className="mx-auto mt-4 text-xs text-muted-foreground">
            Signals read correctly: <span className="font-mono-num font-bold text-foreground">{signalsRead}/{totalSignals}</span>
          </div>

          <div className="mx-auto mt-6 inline-flex items-center gap-1 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-5 w-5 ${i < Math.round(avgDiversification) ? "" : "text-muted-foreground/30"}`} fill={i < Math.round(avgDiversification) ? "currentColor" : "none"} />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onBackToMap}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold hover:border-accent hover:text-accent"
            >
              <Map className="h-4 w-4" /> Level Map
            </button>
            <button
              onClick={onPlayAgain}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-8 py-3 text-base font-extrabold uppercase tracking-widest text-primary-foreground glow-primary hover:scale-105"
            >
              <Repeat className="h-4 w-4" /> Play again
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground/80">
          StockQuest is for educational purposes only. It does not constitute financial advice.
          All companies and events are fictional or used for learning.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, positive }: { label: string; value: string; accent?: boolean; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono-num text-lg font-extrabold ${accent ? "text-accent" : positive === undefined ? "" : positive ? "text-gain" : "text-loss"}`}>
        {value}
      </div>
    </div>
  );
}
