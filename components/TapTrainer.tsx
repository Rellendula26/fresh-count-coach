"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeTimingStats, type TapStats } from "@/lib/scoring";

type Range = { start: number; end: number };

export default function TapTrainer({
  range,
  bpm,
}: {
  range: Range | null;
  bpm: number | null;
}) {
  const [isArmed, setIsArmed] = useState(false);
  const [t0, setT0] = useState<number | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  const hasAutoArmedRef = useRef(false);

  const stats: TapStats | null = useMemo(() => {
    if (t0 == null || taps.length === 0 || bpm == null) return null;
    return computeTimingStats({
      tapsMs: taps,
      t0Ms: t0,
      bpm,
    });
  }, [t0, taps, bpm]);

  // Reset when range changes
  useEffect(() => {
    setIsArmed(false);
    setT0(null);
    setTaps([]);
    setSessionStart(null);
    hasAutoArmedRef.current = false;
  }, [range?.start, range?.end]);

  // Auto-arm once a valid range exists
  useEffect(() => {
    if (!range) return;
    if (hasAutoArmedRef.current) return;
    setIsArmed(true);
    hasAutoArmedRef.current = true;
  }, [range]);

  // Spacebar tap
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (!range || !isArmed || bpm == null) return;
      recordTap();
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isArmed, range, bpm]);

  function ensureSession() {
    if (sessionStart != null) return sessionStart;
    const now = performance.now();
    setSessionStart(now);
    return now;
  }

  function recordTap() {
    const start = ensureSession();
    const now = performance.now();
    setTaps((prev) => [...prev, now - start]);
  }

  function setOne() {
    const start = ensureSession();
    const now = performance.now();
    setT0(now - start);
  }

  function reset() {
    setT0(null);
    setTaps([]);
    setSessionStart(null);
  }

  const disabled = !range || !isArmed || bpm == null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Tap Trainer</h2>
          <p className="text-slate-600">
            Select a range → click <b>Set “1”</b> on the downbeat → tap with spacebar.
          </p>

          {!range && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Select a waveform range above to enable training.
            </div>
          )}

          {range && bpm == null && (
            <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              Detecting BPM from range…
            </div>
          )}

          {range && bpm != null && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              BPM locked at <b>{bpm}</b>. Trainer {isArmed ? "armed" : "ready"}.
            </div>
          )}
        </div>

        <button
          className={[
            "rounded-lg px-4 py-2 text-white transition",
            !range || bpm == null
              ? "bg-slate-300 cursor-not-allowed"
              : isArmed
              ? "bg-emerald-600 animate-pulse"
              : "bg-slate-700 hover:bg-slate-800",
          ].join(" ")}
          disabled={!range || bpm == null}
          onClick={() => setIsArmed((v) => !v)}
        >
          {isArmed ? "Armed" : "Arm"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
          onClick={setOne}
          disabled={disabled}
        >
          Set “1”
        </button>

        <button
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
          onClick={recordTap}
          disabled={disabled}
        >
          Tap
        </button>

        <button
          className="rounded-lg border px-4 py-2 hover:bg-slate-50"
          onClick={reset}
        >
          Reset
        </button>
      </div>

      <div className="rounded-lg border bg-slate-50 p-4">
        {!stats ? (
          <p className="text-slate-600">
            Set the downbeat and tap to see timing stats.
          </p>
        ) : (
          <ul className="space-y-1 text-slate-700">
            <li>
              Mean abs error: <b>{stats.meanAbsMs.toFixed(1)} ms</b>
            </li>
            <li>
              Consistency: <b>{stats.stdMs.toFixed(1)} ms</b>
            </li>
            <li>
              Drift: <b>{stats.driftMsPerMin.toFixed(1)} ms/min</b>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
