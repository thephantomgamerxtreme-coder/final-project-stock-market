import { useEffect, useState, useCallback } from "react";
import { audio } from "./audioEngine";

const STORAGE_KEY = "stockquest:muted";

export function useMute() {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    audio.setMuted(muted);
    try { localStorage.setItem(STORAGE_KEY, muted ? "1" : "0"); } catch {}
  }, [muted]);

  const toggle = useCallback(() => setMutedState((m) => !m), []);
  return { muted, toggle, setMuted: setMutedState };
}

// Resume audio context on first user interaction (browser autoplay policy).
export function useAudioUnlock() {
  useEffect(() => {
    const handler = () => { audio.ensureRunning(); };
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);
}
