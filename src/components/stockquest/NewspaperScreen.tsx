import { useEffect, useState } from "react";
import { LevelConfig } from "@/game/constants";

interface NewspaperScreenProps {
  config: LevelConfig;
  onContinue: () => void;
}

export function NewspaperScreen({ config, onContinue }: NewspaperScreenProps) {
  const [secs, setSecs] = useState(4);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (secs <= 0) onContinue();
  }, [secs, onContinue]);

  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-10">
      <div className="w-full max-w-3xl animate-flash-in">
        <div className="rounded-xl border-4 border-foreground bg-[hsl(40_40%_94%)] p-6 text-[hsl(222_50%_8%)] shadow-card sm:p-10" style={{ fontFamily: '"Times New Roman", Georgia, serif' }}>
          <div className="flex items-end justify-between border-b-4 border-double border-[hsl(222_50%_8%)] pb-3">
            <div className="text-3xl font-black uppercase tracking-tight sm:text-4xl">The StockQuest Gazette</div>
            <div className="hidden text-xs sm:block">{date}</div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span>Vol. {config.level} · Edition {config.level}</span>
            <span>Markets desk</span>
          </div>

          <h1 className="mt-6 text-3xl font-black leading-[1.05] sm:text-5xl">
            {config.newspaper.headline}
          </h1>
          <p className="mt-3 text-base italic sm:text-lg">{config.newspaper.subhead}</p>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[hsl(222_50%_8%)/0.3] pt-4 text-xs leading-relaxed">
            <p>Traders gathered on the floor as the latest figures crossed the wire, with portfolios shifting on every fresh signal.</p>
            <p>Analysts continue to debate which sectors stand to benefit while volatility keeps casual investors on their toes.</p>
            <p>Tomorrow's session promises new surprises as the market digests this fast-moving narrative cycle.</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={onContinue}
            className="rounded-md border border-border bg-surface px-5 py-2 text-sm font-bold uppercase tracking-widest hover:border-primary"
          >
            Skip ({Math.max(0, secs)})
          </button>
        </div>
      </div>
    </div>
  );
}
