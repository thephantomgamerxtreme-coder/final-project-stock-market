import { LEVELS, MAX_STARS, getRank, VAULT_UNLOCK_LEVEL } from "@/game/constants";
import { ProgressionState } from "@/game/progression";
import { Lock, Star, Crown, Sparkles, ArrowLeft, Vault } from "lucide-react";
import { Logo } from "./Logo";

interface LevelSelectScreenProps {
  state: ProgressionState;
  onPickLevel: (levelNum: number) => void;
  onBackHome: () => void;
}

export function LevelSelectScreen({ state, onPickLevel, onBackHome }: LevelSelectScreenProps) {
  const stars = state.levels.reduce((s, l) => s + l.stars, 0);
  const rank = getRank(stars);

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-accent hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </button>
          <Logo size="sm" />
          <div className="w-[68px]" />
        </div>

        {/* Rank bar */}
        <div className="panel mb-8 grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-amber text-2xl shadow-amber">
              {rank.emoji}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rank</div>
              <div className="text-lg font-extrabold text-accent">{rank.title}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Stars earned</div>
            <div className="mt-1 inline-flex items-center gap-1.5">
              <Star className="h-5 w-5 text-accent" fill="currentColor" />
              <span className="font-mono-num text-xl font-extrabold">
                <span className="text-accent">{stars}</span>
                <span className="text-muted-foreground">/{MAX_STARS}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-amber transition-all"
                style={{ width: `${(stars / MAX_STARS) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Portfolio</div>
            <div className="font-mono-num text-xl font-extrabold text-primary">
              ${state.worth.toFixed(2)}
            </div>
            {state.vaultUnlocked && (
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-secondary">
                <Vault className="h-3 w-3" /> Vault: <span className="font-mono-num font-bold">${state.vault.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <h2 className="mb-1 text-center text-2xl font-extrabold sm:text-3xl">Your Quest Map</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Tap an unlocked level to play. Boss levels glow gold ⭐ — vault unlocks at Level {VAULT_UNLOCK_LEVEL}.
        </p>

        {/* Map grid with dotted trail */}
        <div className="relative">
          {/* Decorative dotted trail (SVG) */}
          <TrailSVG />

          <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {LEVELS.map((cfg) => {
              const rec = state.levels[cfg.level - 1];
              return (
                <LevelCard
                  key={cfg.level}
                  level={cfg.level}
                  subtitle={cfg.subtitle}
                  companies={cfg.tickers.length}
                  isBoss={!!cfg.isBoss}
                  unlocked={rec.unlocked}
                  played={rec.played}
                  stars={rec.stars}
                  lastProfit={rec.lastProfit}
                  isCurrent={state.currentLevel === cfg.level && rec.unlocked && !rec.played}
                  onClick={() => rec.unlocked && onPickLevel(cfg.level)}
                />
              );
            })}
          </div>
        </div>

        <p className="mt-12 text-center text-[10px] leading-relaxed text-muted-foreground/70">
          StockQuest is for educational purposes only. It does not constitute financial advice.
        </p>
      </div>
    </div>
  );
}

function TrailSVG() {
  // Decorative dotted journey line behind the cards. Purely visual.
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path
        d="M 10 20 Q 30 5, 50 20 T 90 20 Q 95 50, 50 55 T 10 80 Q 30 95, 50 80 T 90 80"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="0.4"
        strokeDasharray="1.5,1.5"
        opacity="0.35"
      />
    </svg>
  );
}

interface LevelCardProps {
  level: number;
  subtitle: string;
  companies: number;
  isBoss: boolean;
  unlocked: boolean;
  played: boolean;
  stars: number;
  lastProfit: number | null;
  isCurrent: boolean;
  onClick: () => void;
}

function LevelCard({
  level, subtitle, companies, isBoss, unlocked, played, stars, lastProfit, isCurrent, onClick,
}: LevelCardProps) {
  const locked = !unlocked;
  const ready = unlocked && !played;

  const baseBorder = isBoss
    ? "border-accent/70"
    : played
      ? "border-primary/40"
      : ready
        ? "border-primary/60"
        : "border-border";

  return (
    <button
      onClick={onClick}
      disabled={locked}
      aria-label={`Level ${level}: ${subtitle}${locked ? " (locked)" : ""}`}
      className={`panel relative aspect-[3/4] overflow-hidden p-3 text-left transition-all ${baseBorder} ${
        locked
          ? "cursor-not-allowed opacity-50"
          : "hover:-translate-y-0.5 hover:border-accent"
      } ${isCurrent ? "animate-pulse-glow" : ""} ${isBoss ? "shadow-amber" : ""} ${
        ready && !locked ? "animate-pulse-glow" : ""
      }`}
    >
      {/* Boss crown */}
      {isBoss && (
        <div className="absolute right-2 top-2 text-accent" title="Boss level">
          <Crown className="h-4 w-4" fill="currentColor" />
        </div>
      )}

      {/* Locked padlock */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <div className="flex h-full flex-col">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Level</div>
        <div className={`font-mono-num text-4xl font-extrabold leading-none ${isBoss ? "text-accent" : "text-primary"}`}>
          {level}
        </div>
        <div className="mt-1 text-xs font-bold leading-tight">{subtitle}</div>
        <div className="mt-1 text-[10px] text-muted-foreground">{companies} companies</div>

        <div className="mt-auto">
          {played ? (
            <>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < stars ? "text-accent" : "text-muted-foreground/30"}`}
                    fill={i < stars ? "currentColor" : "none"}
                  />
                ))}
              </div>
              {lastProfit !== null && (
                <div className={`mt-1 font-mono-num text-xs font-bold ${lastProfit >= 0 ? "text-gain" : "text-loss"}`}>
                  {lastProfit >= 0 ? "+" : ""}${lastProfit.toFixed(2)}
                </div>
              )}
            </>
          ) : ready && !locked ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Ready
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}
