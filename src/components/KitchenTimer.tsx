"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS_MIN = [1, 3, 5, 10, 15, 20, 30, 60, 90];

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function KitchenTimer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [totalSeconds, setTotalSeconds] = useState(5 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [customHour, setCustomHour] = useState("");
  const [customMin, setCustomMin] = useState("");
  const [customSec, setCustomSec] = useState("");
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!finished) return;
    // Beep using the Web Audio API — no external assets needed.
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioCtxRef.current ?? new AudioContextClass();
    audioCtxRef.current = ctx;

    let beepsPlayed = 0;
    const playBeep = () => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
      beepsPlayed += 1;
    };

    playBeep();
    const interval = setInterval(() => {
      if (beepsPlayed >= 4) {
        clearInterval(interval);
        return;
      }
      playBeep();
    }, 600);
    return () => clearInterval(interval);
  }, [finished]);

  if (!open) return null;

  function setPreset(minutes: number) {
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setRunning(false);
    setFinished(false);
  }

  function applyCustom(e: React.FormEvent) {
    e.preventDefault();
    const hour = Math.max(0, Number(customHour) || 0);
    const min = Math.max(0, Math.min(59, Number(customMin) || 0));
    const sec = Math.max(0, Math.min(59, Number(customSec) || 0));
    const seconds = hour * 3600 + min * 60 + sec;
    if (seconds <= 0) return;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setRunning(false);
    setFinished(false);
    setCustomHour("");
    setCustomMin("");
    setCustomSec("");
  }

  function toggleRunning() {
    if (finished) {
      setRemainingSeconds(totalSeconds);
      setFinished(false);
    }
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setFinished(false);
    setRemainingSeconds(totalSeconds);
  }

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-surface p-8 shadow-xl">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-xl font-semibold">Timer kuchenny</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-full p-2 text-foreground/50 hover:bg-surface-muted"
          >
            ✕
          </button>
        </div>

        <div
          className={`relative flex h-48 w-48 items-center justify-center rounded-full border-8 transition-colors ${
            finished ? "border-accent-coral" : "border-accent-teal"
          }`}
          style={{
            background: `conic-gradient(var(--accent-teal) ${progress * 360}deg, var(--surface-muted) 0deg)`,
          }}
        >
          <span className="flex h-36 w-36 items-center justify-center rounded-full bg-surface text-4xl font-semibold tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
        </div>

        {finished && (
          <p className="text-lg font-medium text-accent-coral">⏰ Czas minął!</p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS_MIN.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setPreset(min)}
              className="rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium hover:bg-border"
            >
              {min >= 60
                ? `${min % 60 === 0 ? min / 60 : (min / 60).toFixed(1)} godz.`
                : `${min} min`}
            </button>
          ))}
        </div>

        <form onSubmit={applyCustom} className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="godz"
            value={customHour}
            onChange={(e) => setCustomHour(e.target.value)}
            className="w-16 rounded-lg border border-border p-2 text-center text-lg"
          />
          <span className="text-foreground/50">:</span>
          <input
            type="number"
            min={0}
            max={59}
            inputMode="numeric"
            placeholder="min"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            className="w-16 rounded-lg border border-border p-2 text-center text-lg"
          />
          <span className="text-foreground/50">:</span>
          <input
            type="number"
            min={0}
            max={59}
            inputMode="numeric"
            placeholder="sek"
            value={customSec}
            onChange={(e) => setCustomSec(e.target.value)}
            className="w-16 rounded-lg border border-border p-2 text-center text-lg"
          />
          <button
            type="submit"
            className="rounded-full bg-surface-muted px-4 py-2 text-sm font-medium hover:bg-border"
          >
            Ustaw
          </button>
        </form>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={toggleRunning}
            className="rounded-full bg-accent-teal px-6 py-3 text-lg font-medium text-white hover:brightness-95"
          >
            {running ? "Pauza" : finished ? "Od nowa" : "Start"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-surface-muted px-6 py-3 text-lg font-medium hover:bg-border"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
