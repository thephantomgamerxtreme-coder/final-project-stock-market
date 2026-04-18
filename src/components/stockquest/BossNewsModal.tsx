import { NewsHint } from "@/game/constants";
import { Zap } from "lucide-react";

interface BossNewsModalProps {
  news: NewsHint;
  onClose: () => void;
}

export function BossNewsModal({ news, onClose }: BossNewsModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-4 backdrop-blur">
      <div className="panel w-full max-w-lg animate-flash-in border-loss/60 p-6 shadow-[0_0_60px_hsl(var(--loss)/0.3)]">
        <div className="flex items-center gap-2 text-loss">
          <Zap className="h-5 w-5 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-[0.3em]">Breaking News</span>
        </div>
        <div className="mt-3 text-5xl">{news.emoji}</div>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{news.headline}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{news.explanation}</p>

        <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
          ⚠️ This event lands BEFORE you invest. Adjust your sliders if you want to react!
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gradient-amber py-3 text-sm font-extrabold uppercase tracking-widest text-accent-foreground hover:scale-[1.01]"
        >
          Got it — let me re-allocate
        </button>
      </div>
    </div>
  );
}
