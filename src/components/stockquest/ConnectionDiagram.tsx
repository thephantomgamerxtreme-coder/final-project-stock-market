import { COMPANIES, HINTS, LevelConfig } from "@/game/constants";
import { LevelOutcome } from "@/game/engine";

interface ConnectionDiagramProps {
  config: LevelConfig;
  outcome: LevelOutcome;
}

// Renders companies on the left and active news hints on the right with colored dotted lines.
export function ConnectionDiagram({ config, outcome }: ConnectionDiagramProps) {
  const tickers = config.tickers;
  // Active hints = level hints + boss news if it was used (boss news shocks already in outcome.sectorShocks via drivers)
  const activeHintIds = Array.from(
    new Set(Object.values(outcome.drivers).flat().map((d) => d.hintId)),
  );

  const W = 600;
  const H = Math.max(220, Math.max(tickers.length, activeHintIds.length) * 60 + 40);
  const leftX = 80;
  const rightX = W - 80;

  function yFor(i: number, total: number) {
    if (total === 1) return H / 2;
    const usable = H - 60;
    return 30 + (usable * i) / (total - 1);
  }

  return (
    <div className="panel overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold">How the news moved your stocks</h4>
        <div className="flex gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 border-t-2 border-dashed border-gain" /> gain</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 border-t-2 border-dashed border-loss" /> loss</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[520px] w-full" role="img" aria-label="Connections between companies and news events">
          {/* Lines */}
          {tickers.map((t, ti) => {
            const drivers = outcome.drivers[t] ?? [];
            return drivers.map((d) => {
              const hi = activeHintIds.indexOf(d.hintId);
              if (hi === -1) return null;
              const y1 = yFor(ti, tickers.length);
              const y2 = yFor(hi, activeHintIds.length);
              const positive = d.pct >= 0;
              const stroke = positive ? "hsl(var(--gain))" : "hsl(var(--loss))";
              const midX = (leftX + rightX) / 2;
              const midY = (y1 + y2) / 2;
              return (
                <g key={`${t}-${d.hintId}`}>
                  <line
                    x1={leftX + 50}
                    y1={y1}
                    x2={rightX - 50}
                    y2={y2}
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    opacity={0.7}
                  />
                  <text x={midX} y={midY - 4} textAnchor="middle" fill={stroke} fontSize={10} fontWeight={700} fontFamily="ui-monospace">
                    {positive ? "+" : ""}{Math.round(d.pct * 100)}%
                  </text>
                </g>
              );
            });
          })}
          {/* Tickers */}
          {tickers.map((t, i) => {
            const y = yFor(i, tickers.length);
            return (
              <g key={t}>
                <rect x={leftX - 50} y={y - 16} width={100} height={32} rx={6} fill="hsl(var(--surface-elevated))" stroke="hsl(var(--border))" />
                <text x={leftX} y={y + 5} textAnchor="middle" fill="hsl(var(--primary))" fontSize={13} fontWeight={800} fontFamily="ui-monospace">{t}</text>
              </g>
            );
          })}
          {/* Hints */}
          {activeHintIds.map((id, i) => {
            const h = HINTS[id];
            const y = yFor(i, activeHintIds.length);
            return (
              <g key={id}>
                <rect x={rightX - 50} y={y - 16} width={100} height={32} rx={6} fill="hsl(var(--surface-elevated))" stroke="hsl(var(--border))" />
                <text x={rightX} y={y + 6} textAnchor="middle" fontSize={18}>{h.emoji}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Tickers on the left, headlines on the right. Each line shows how that news pushed the sector this round.
      </div>
    </div>
  );
}
