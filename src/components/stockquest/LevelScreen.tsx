import { useEffect, useState } from "react";
import { COMPANIES, HINTS, LIFELINES, LevelConfig, NewsHint, TIMER_LEVELS, TIMER_SECONDS } from "@/game/constants";
import { Allocation, lifelineReveal } from "@/game/engine";
import { Lightbulb, AlertTriangle, Clock } from "lucide-react";
import { BossNewsModal } from "./BossNewsModal";

interface LevelScreenProps {
  config: LevelConfig;
  pool: number;
  lifelinesLeft: number;
  onUseLifeline: (hintId: string) => string; // returns sector revealed
  onInvest: (allocation: Allocation, confidence: "low" | "medium" | "high", bossHintId: string | null) => void;
}

export function LevelScreen({ config, pool, lifelinesLeft, onUseLifeline, onInvest }: LevelScreenProps) {
  const [allocation, setAllocation] = useState<Allocation>(() =>
    Object.fromEntries(config.tickers.map((t) => [t, 0])),
  );
  const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [showBoss, setShowBoss] = useState(false);
  const [bossSeen, setBossSeen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Timer for levels 9 & 10
  const hasTimer = TIMER_LEVELS.includes(config.level);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);

  useEffect(() => {
    if (!hasTimer) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [hasTimer]);

  const allocated = config.tickers.reduce((s, t) => s + (allocation[t] ?? 0), 0);
  const overAllocated = allocated > 100;
  const validAllocation = allocated > 0 && allocated <= 100;

  // Auto-submit when timer runs out
  useEffect(() => {
    if (hasTimer && secondsLeft === 0 && !pendingSubmit) {
      setPendingSubmit(true);
      onInvest(allocation, confidence ?? "low", config.isBoss && bossSeen ? config.bossNews!.id : null);
    }
  }, [secondsLeft, hasTimer, allocation, confidence, onInvest, pendingSubmit, config.isBoss, config.bossNews, bossSeen]);

  function setPct(ticker: string, val: number) {
    setAllocation((a) => ({ ...a, [ticker]: val }));
  }

  function handleInvestClick() {
    if (!validAllocation || !confidence) return;
    if (config.isBoss && !bossSeen) {
      setShowBoss(true);
      return;
    }
    onInvest(allocation, confidence, config.isBoss ? config.bossNews!.id : null);
  }

  function handleBossClose() {
    setShowBoss(false);
    setBossSeen(true);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerLow = secondsLeft < 60;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Level {config.level} {config.isBoss && <span className="ml-2 rounded bg-loss px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">BOSS</span>}
          </div>
          <h2 className="text-xl font-bold sm:text-2xl">
            Allocate your <span className="font-mono-num text-accent">${pool.toFixed(2)}</span>
          </h2>
        </div>
        {hasTimer && (
          <div className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono-num font-bold ${timerLow ? "border-loss text-loss animate-pulse" : "border-accent text-accent"}`}>
            <Clock className="h-4 w-4" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: companies */}
        <section>
          <div className="space-y-3">
            {config.tickers.map((t) => {
              const c = COMPANIES[t];
              const v = allocation[t] ?? 0;
              return (
                <div key={t} className="panel p-4 transition hover:border-primary/40">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num text-lg font-extrabold tracking-wider text-primary">{c.ticker}</span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{c.sector}</span>
                      </div>
                      <div className="mt-0.5 text-sm font-semibold">{c.name}</div>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Allocated</div>
                      <div className="font-mono-num text-lg font-bold">{v}%</div>
                      <div className="font-mono-num text-xs text-muted-foreground">${((pool * v) / 100).toFixed(2)}</div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={v}
                    onChange={(e) => setPct(t, Number(e.target.value))}
                    className="mt-3 w-full accent-primary"
                    aria-label={`Allocate percent to ${c.ticker}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Allocation totals + confidence + invest */}
          <div className="panel mt-4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total allocated</span>
              <span className={`font-mono-num text-xl font-extrabold ${overAllocated ? "text-loss" : allocated === 100 ? "text-primary" : "text-foreground"}`}>
                {allocated}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className={`h-full transition-all ${overAllocated ? "bg-loss" : "bg-gradient-primary"}`}
                style={{ width: `${Math.min(100, allocated)}%` }}
              />
            </div>
            {overAllocated && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-loss">
                <AlertTriangle className="h-3.5 w-3.5" /> Over 100% — reduce some sliders.
              </div>
            )}

            <div className="mt-5">
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Confidence meter</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "low", label: "Not sure", emoji: "🤔" },
                  { id: "medium", label: "Pretty sure", emoji: "👍" },
                  { id: "high", label: "Very confident", emoji: "🔥" },
                ] as const).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setConfidence(c.id)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      confidence === c.id
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface hover:border-accent/50"
                    }`}
                  >
                    <div className="text-base">{c.emoji}</div>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleInvestClick}
              disabled={!validAllocation || !confidence}
              className="mt-5 w-full rounded-xl bg-gradient-primary py-4 text-base font-extrabold uppercase tracking-widest text-primary-foreground transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 enabled:glow-primary enabled:animate-pulse-glow"
            >
              Invest now →
            </button>
          </div>
        </section>

        {/* Right: news + lifelines */}
        <section>
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Market signals</div>
                <h3 className="text-base font-bold">News feed</h3>
              </div>
              <div className="flex items-center gap-1.5" aria-label="Lifelines remaining">
                {Array.from({ length: LIFELINES }).map((_, i) => (
                  <Lightbulb
                    key={i}
                    className={`h-5 w-5 ${i < lifelinesLeft ? "text-accent" : "text-muted-foreground/30"}`}
                    fill={i < lifelinesLeft ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {config.hintIds.map((id) => {
                const h = HINTS[id];
                const reveal = revealed[id];
                return (
                  <NewsCard
                    key={id}
                    hint={h}
                    reveal={reveal}
                    canUseLifeline={lifelinesLeft > 0 && !reveal}
                    onUseLifeline={() => {
                      const sector = onUseLifeline(id);
                      setRevealed((r) => ({ ...r, [id]: sector }));
                    }}
                  />
                );
              })}
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground">
              Tip: hover or tap a card to read the explanation. Use a lifeline 💡 to reveal which sector it impacts most.
            </p>
          </div>
        </section>
      </div>

      {showBoss && config.bossNews && (
        <BossNewsModal news={config.bossNews} onClose={handleBossClose} />
      )}
    </div>
  );
}

function NewsCard({
  hint,
  reveal,
  canUseLifeline,
  onUseLifeline,
}: {
  hint: NewsHint;
  reveal?: string;
  canUseLifeline: boolean;
  onUseLifeline: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
      className="cursor-pointer rounded-lg border border-border bg-surface p-3 transition hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>{hint.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{hint.headline}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {hint.category}
            </span>
            {reveal && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                💡 hits {reveal}
              </span>
            )}
          </div>
          {open && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint.explanation}</p>
          )}
        </div>
        {canUseLifeline && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUseLifeline();
            }}
            className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent hover:bg-accent/20"
            aria-label="Use lifeline on this hint"
          >
            💡 Use
          </button>
        )}
      </div>
    </div>
  );
}
