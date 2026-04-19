import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { COMPANIES } from "@/game/constants";

interface TickerItem {
  ticker: string;
  pct: number;
}

function generateTicks(seed: number): TickerItem[] {
  // Deterministic-per-mount pseudo-random so SSR-safe & avoids re-render churn.
  const tickers = Object.keys(COMPANIES);
  return tickers.map((ticker, i) => {
    const r = Math.sin(seed + i * 13.37) * 10000;
    const frac = r - Math.floor(r);
    // Range roughly -5.00% to +5.00%
    const pct = +(frac * 10 - 5).toFixed(2);
    return { ticker, pct };
  });
}

export function TickerTape() {
  const items = useMemo(() => generateTicks(Date.now() % 100000), []);
  // Duplicate the list so the marquee loops seamlessly.
  const loop = [...items, ...items];

  return (
    <div className="ticker-tape relative overflow-hidden border-b border-border">
      <div className="flex w-max animate-ticker whitespace-nowrap py-1.5">
        {loop.map((item, idx) => {
          const up = item.pct >= 0;
          return (
            <div
              key={`${item.ticker}-${idx}`}
              className="flex items-center gap-1.5 px-4 text-xs font-mono-num"
            >
              <span className="font-extrabold tracking-wider text-foreground/90">
                {item.ticker}
              </span>
              {up ? (
                <ArrowUp className="h-3 w-3 text-gain" />
              ) : (
                <ArrowDown className="h-3 w-3 text-loss" />
              )}
              <span className={`font-bold ${up ? "text-gain" : "text-loss"}`}>
                {up ? "+" : ""}
                {item.pct.toFixed(2)}%
              </span>
              <span className="ml-3 text-muted-foreground/40">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
