import { INVESTOR_TYPES, InvestorType } from "@/game/constants";
import { Logo } from "./Logo";

interface HomeScreenProps {
  selectedType: InvestorType["id"] | null;
  onSelectType: (id: InvestorType["id"]) => void;
  onStart: () => void;
}

export function HomeScreen({ selectedType, onSelectType, onStart }: HomeScreenProps) {
  return (
    <div className="min-h-screen px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="sr-only">StockQuest — educational stock market game for kids</h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
            A fun, kid-friendly trading floor where you read the news, allocate your money, and learn how
            real markets actually move. You start with{" "}
            <span className="font-mono-num font-bold text-accent">$500</span>. Can you grow it across 10 levels?
          </p>
        </header>

        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">Pick your investor type</h2>
            <span className="hidden sm:inline text-xs uppercase tracking-widest text-muted-foreground">Step 1 of 1</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {INVESTOR_TYPES.map((t) => {
              const active = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectType(t.id)}
                  className={`panel relative overflow-hidden p-5 text-left transition-all ${
                    active
                      ? "border-primary glow-primary -translate-y-0.5"
                      : "hover:border-primary/50 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="text-4xl">{t.emoji}</div>
                  <div className="mt-3 text-lg font-bold">{t.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-primary">{t.tagline}</div>
                  <p className="mt-3 text-sm text-muted-foreground">{t.description}</p>
                  {active && (
                    <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                      ✓ Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            disabled={!selectedType}
            className="rounded-xl bg-gradient-primary px-10 py-4 text-lg font-extrabold uppercase tracking-wider text-primary-foreground transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 enabled:glow-primary"
          >
            Start trading →
          </button>
          {!selectedType && (
            <p className="text-xs text-muted-foreground">Pick an investor type to start</p>
          )}
        </div>

        <p className="mt-16 text-center text-[11px] leading-relaxed text-muted-foreground/80">
          StockQuest is for educational purposes only. It does not constitute financial advice.
          All companies and events are fictional or used for learning. This game was created by Nisarg N Bharadwaj, Grade 8, Jain Heritage School as part of the 
          AI Summer Camp for students by the Times of India. It teaches Stock Market from the chapter Financial Markets from Grade 12 .Business Studies
        </p>
      </div>
    </div>
  );
}
