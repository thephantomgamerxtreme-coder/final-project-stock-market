import { LEVELS, HINTS } from "@/game/constants";
import { LevelRecord } from "@/game/progression";
import { Star, X, RotateCcw, Play, Award } from "lucide-react";

interface LevelDetailModalProps {
  levelNum: number;
  record: LevelRecord;
  onClose: () => void;
  onReplay: () => void;
  onContinue: () => void;
}

export function LevelDetailModal({ levelNum, record, onClose, onReplay, onContinue }: LevelDetailModalProps) {
  const cfg = LEVELS[levelNum - 1];
  const profit = record.lastProfit ?? 0;
  const win = profit >= 0;
  // Pull a real-world fact from the level's strongest hint.
  const hint = cfg.hintIds.map((id) => HINTS[id]).filter(Boolean)[0];
  const realWorld = cfg.bossNews?.realWorld ?? hint?.realWorld ?? "";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="panel relative w-full max-w-md animate-flash-in p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Level {levelNum}</div>
        <h3 className="text-2xl font-extrabold">{cfg.subtitle}</h3>

        {record.personalBest && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-amber px-3 py-1 text-xs font-extrabold text-accent-foreground shadow-amber">
            <Award className="h-3.5 w-3.5" /> Personal Best
          </div>
        )}

        <div className="mt-4 flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`h-6 w-6 ${i < record.stars ? "text-accent" : "text-muted-foreground/30"}`}
              fill={i < record.stars ? "currentColor" : "none"}
            />
          ))}
          <span className="ml-2 font-mono-num text-sm text-muted-foreground">{record.stars}/3</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Portfolio after" value={`$${(record.poolAfter ?? 0).toFixed(2)}`} accent />
          <Stat
            label={profit >= 0 ? "Profit" : "Loss"}
            value={`${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}`}
            positive={profit >= 0}
          />
        </div>

        <div className="mt-3 panel border-secondary/40 p-3">
          <div className="text-[10px] uppercase tracking-widest text-secondary">Diversification</div>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < record.diversificationStars ? "text-accent" : "text-muted-foreground/30"}`}
                fill={i < record.diversificationStars ? "currentColor" : "none"}
              />
            ))}
            <span className="ml-2 font-mono-num text-xs text-muted-foreground">
              {record.diversificationStars}/5
            </span>
          </div>
        </div>

        {realWorld && (
          <div className="mt-3 panel p-3">
            <div className="text-[10px] uppercase tracking-widest text-accent">🌍 Real-world connection</div>
            <p className="mt-1 text-xs text-muted-foreground">{realWorld}</p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onReplay}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2.5 text-sm font-bold hover:border-accent hover:text-accent"
          >
            <RotateCcw className="h-4 w-4" /> Replay
          </button>
          <button
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-primary py-2.5 text-sm font-extrabold text-primary-foreground hover:scale-[1.02]"
          >
            <Play className="h-4 w-4" fill="currentColor" /> Continue
          </button>
        </div>
        <p className={`mt-2 text-center text-[10px] ${win ? "text-muted-foreground" : "text-muted-foreground"}`}>
          {win ? "Replay only overwrites your stars if you do better." : "Try a different allocation — replay won't lower your best."}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, positive }: { label: string; value: string; accent?: boolean; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono-num text-base font-extrabold ${accent ? "text-accent" : positive === undefined ? "" : positive ? "text-gain" : "text-loss"}`}>
        {value}
      </div>
    </div>
  );
}
