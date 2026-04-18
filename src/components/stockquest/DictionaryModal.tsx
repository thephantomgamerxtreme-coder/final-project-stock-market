import { MARKET_DICTIONARY } from "@/game/constants";
import { X } from "lucide-react";

interface DictionaryModalProps {
  open: boolean;
  unlocked: string[];
  newlyUnlocked: string[];
  onClose: () => void;
}

export function DictionaryModal({ open, unlocked, newlyUnlocked, onClose }: DictionaryModalProps) {
  if (!open) return null;
  const allKeys = Object.keys(MARKET_DICTIONARY);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="panel w-full max-w-2xl animate-flash-in p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent">Trophy case</div>
            <h2 className="text-2xl font-extrabold">Market Dictionary</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlocked {unlocked.length} of {allKeys.length} terms
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-surface" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
          {allKeys.map((k) => {
            const item = MARKET_DICTIONARY[k];
            const isUnlocked = unlocked.includes(k);
            const isNew = newlyUnlocked.includes(k);
            return (
              <div
                key={k}
                className={`rounded-lg border p-3 transition ${
                  isUnlocked
                    ? isNew
                      ? "border-accent bg-accent/10 shadow-amber"
                      : "border-border bg-surface"
                    : "border-dashed border-border/60 bg-surface/40 opacity-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{isUnlocked ? item.emoji : "🔒"}</span>
                  <span className="font-bold">{isUnlocked ? item.term : "Locked"}</span>
                  {isNew && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">NEW</span>}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {isUnlocked ? item.definition : "Keep playing to unlock!"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
