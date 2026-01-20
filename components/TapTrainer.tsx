"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeTimingStats, type TapStats } from "@/lib/scoring";
export default function TapTrainer({ range, bpm }: { range: Range | null; bpm: number | null })

type Range = { start: number; end: number };

export default function TapTrainer({ range }: { range: Range | null }) {
  const [isArmed, setIsArmed] = useState(false);
  const [t0, setT0] = useState<number | null>(null); // "Set 1" anchor (ms)
  const [taps, setTaps] = useState<number[]>([]); // ms relative to session start
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  const [bpm, setBpm] = useState(140);

  const hasAutoArmedRef = useRef(false);

  const stats: TapStats | null = useMemo(() => {
    if (t0 == null || taps.length === 0) return null;
    return computeTimingStats({ tapsMs: taps, t0Ms: t0, bpm });
  }, [t0, taps, bpm]);

  // Reset when range changes
  useEffect(() => {
    setIsArmed(false);
    setT0(null);
    setTaps([]);
    setSessionStart(null);
    hasAutoArmedRef.current = false;
  }, [range?.start, range?.end]);

  // ✅ Auto-arm once a valid range exists (per-range)
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
      if (!range) return;
      if (!isArmed) return;
      recordTap();
    }
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArmed, sessionStart, range, t0, taps]);

  function ensureSession() {
    if (sessionStart != null) return sessionStart;
    const now = performance.now();
    setSessionStart(now);
    return now;
  }

  function recordTap() {
    if (!range) return;
    const start = ensureSession();
    const now = performance.now();
    const ms = now - start;
    setTaps((prev) => [...prev, ms]);
  }

  function setOne() {
    if (!range) return;
    const start = ensureSession();
    const now = performance.now();
    const ms = now - start;
    setT0(ms);
  }

  function reset() {
    setT0(null);
    setTaps([]);
    setSessionStart(null);
  }

  const disabledNoRange = !range;
  const disabledNotArmed = !isArmed;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Tap Trainer</h2>
          <p className="text-slate-600">
            1) Select a range above. 2) Click Arm. 3) Click <b>Set “1”</b> on the downbeat.
            4) Tap with <b>spacebar</b> or the button.
          </p>

          {/* ✅ Inline warning + animation */}
          {!range ? (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="font-semibold">Select a range above to enable training.</span>{" "}
              Drag on the waveform to highlight the section you want (e.g., 0:30 → 2:30).
              <span className="ml-2 inline-block animate-pulse">⬆️</span>
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Range locked. {isArmed ? "Trainer is armed." : "Click Arm to start."}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-700">
            BPM&nbsp;
            <input
              className="w-24 rounded-md border px-2 py-1"
              type="number"
              value={bpm}
              min={40}
              max={240}
              onChange={(e) => setBpm(Number(e.target.value))}
              disabled={disabledNoRange}
            />
          </label>

          {/* ✅ Better disabled state + tooltip + animated armed state */}
          <button
            className={[
              "rounded-lg px-4 py-2 text-white transition",
              disabledNoRange
                ? "bg-slate-300 cursor-not-allowed"
                : isArmed
                ? "bg-emerald-600 shadow-sm animate-pulse"
                : "bg-slate-700 hover:bg-slate-800",
            ].join(" ")}
            onClick={() => {
              if (!range) return;
              setIsArmed((v) => !v);
            }}
            disabled={disabledNoRange}
            title={disabledNoRange ? "Select a range on the waveform first." : "Toggle training input."}
          >
            {disabledNoRange ? "Select range" : isArmed ? "Armed" : "Arm"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg border px-4 py-2 disabled:opacity-50 transition"
          onClick={setOne}
          disabled={disabledNoRange || disabledNotArmed}
          title={disabledNoRange ? "Select a range first." : disabledNotArmed ? "Click Arm first." : "Click on the downbeat (the 1)."}
        >
          Set “1” (anchor)
        </button>

        <button
          className="rounded-lg border px-4 py-2 disabled:opacity-50 transition"
          onClick={recordTap}
          disabled={disabledNoRange || disabledNotArmed}
          title={disabledNoRange ? "Select a range first." : disabledNotArmed ? "Click Arm first." : "Tap with this button or press Space."}
        >
          Tap
        </button>

        <button className="rounded-lg border px-4 py-2 transition hover:bg-slate-50" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Anchor set?" value={t0 == null ? "No" : "Yes"} />
        <Stat label="Taps" value={String(taps.length)} />
        <Stat label="Mode" value="8-count grid (phase locked by “1”)" />
      </div>

      <div className="rounded-lg border bg-slate-50 p-4">
        {!range ? (
          <p className="text-slate-600">
            Select a waveform range first. Then the trainer will auto-arm.
          </p>
        ) : t0 == null ? (
          <p className="text-slate-600">
            Click <b>Set “1”</b> on the downbeat to lock the grid. Then your taps are scored.
          </p>
        ) : taps.length === 0 ? (
          <p className="text-slate-600">Now tap along (Spacebar works).</p>
        ) : (
          <div className="space-y-2">
            <div className="text-lg font-semibold">Timing Stats</div>
            <ul className="text-slate-700 space-y-1">
              <li>
                Mean abs error: <b>{stats?.meanAbsMs.toFixed(1)} ms</b>
              </li>
              <li>
                Consistency (std dev): <b>{stats?.stdMs.toFixed(1)} ms</b>
              </li>
              <li>
                Drift: <b>{stats?.driftMsPerMin.toFixed(1)} ms/min</b>{" "}
                <span className="text-slate-500">
                  ({stats && stats.driftMsPerMin > 0 ? "lagging" : "rushing"})
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
