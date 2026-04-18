import { BookOpen } from "lucide-react";
import { InvestorType } from "@/game/constants";

interface HudProps {
  portfolio: number;
  totalWorth: number;
  level: number;
  totalLevels: number;
  investor: InvestorType;
  onOpenDictionary: () => void;
  unlockedCount: number;
}

export function Hud({ portfolio, totalWorth, level, totalLevels, investor, onOpenDictionary, unlockedCount }: HudProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
            <span className="text-sm font-extrabold">$Q</span>
          </div>
          <span className="hidden font-extrabold tracking-tight sm:inline">StockQuest</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          <Stat label="Cash pool" value={`$${portfolio.toFixed(2)}`} />
          <Stat label="Total worth" value={`$${totalWorth.toFixed(2)}`} accent />
          <Badge>
            <span className="text-muted-foreground">Lv</span>{" "}
            <span className="font-bold text-accent">{level}</span>
            <span className="text-muted-foreground">/{totalLevels}</span>
          </Badge>
          <Badge>
            <span className="mr-1">{investor.emoji}</span>
            <span className="hidden sm:inline">{investor.name}</span>
            <span className="sm:hidden">{investor.name.replace("The ", "")}</span>
          </Badge>
          <button
            onClick={onOpenDictionary}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
            aria-label="Open market dictionary"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dictionary</span>
            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">{unlockedCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-mono-num text-sm font-bold ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium">
      {children}
    </span>
  );
}
