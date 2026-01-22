"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

type Range = { start: number; end: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function parseTime(input: string): number | null {
  const s = input.trim();
  if (!s) return null;

  if (s.includes(":")) {
    const [mStr, secStr] = s.split(":");
    const m = Number(mStr);
    const sec = Number(secStr);
    if (!Number.isFinite(m) || !Number.isFinite(sec)) return null;
    return m * 60 + sec;
  }

  const sec = Number(s);
  if (!Number.isFinite(sec)) return null;
  return sec;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

export default function WaveformRange({
  audioUrl,
  onRangeChange,
}: {
  audioUrl: string | null;
  onRangeChange: (range: Range | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  // ✅ refs to avoid stale closure in timers
  const rangeRef = useRef<Range | null>(null);
  const loopRef = useRef<boolean>(true);

  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);

  const [range, setRange] = useState<Range | null>(null);
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");

  const disabled = useMemo(() => !audioUrl, [audioUrl]);

  // keep refs synced
  useEffect(() => {
    rangeRef.current = range;
    onRangeChange(range);
  }, [range, onRangeChange]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  // Create/destroy WaveSurfer when audioUrl changes
  useEffect(() => {
    if (!containerRef.current) return;

    wsRef.current?.destroy();
    wsRef.current = null;

    setIsReady(false);
    setIsPlaying(false);
    setDuration(0);

    setRange(null);
    setStartText("");
    setEndText("");

    if (!audioUrl) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 120,
      normalize: true,
      cursorWidth: 2,
      waveColor: "#cbd5e1",
      progressColor: "#2563eb",
      url: audioUrl,
    });

    wsRef.current = ws;

    ws.on("ready", () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));

    ws.on("error", (e) => {
      console.error("WaveSurfer error:", e);
      setIsReady(false);
    });

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  // ✅ Loop enforcement (uses refs so it always sees newest range/loop)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const ws = wsRef.current;
      const r = rangeRef.current;

      if (!ws) return;
      if (!ws.isPlaying()) return;
      if (!loopRef.current) return;
      if (!r) return;

      const t = ws.getCurrentTime();
      if (t < r.start || t > r.end) {
        ws.setTime(r.start);
      }
    }, 80);

    return () => window.clearInterval(interval);
  }, []);

  function togglePlay() {
    const ws = wsRef.current;
    if (!ws || !isReady) return;

    const r = rangeRef.current;

    if (r && loopRef.current) {
      const t = ws.getCurrentTime();
      if (t < r.start || t > r.end) ws.setTime(r.start);
    }

    ws.playPause();
  }

  function clearRange() {
    setRange(null);
    setStartText("");
    setEndText("");
  }

  function setStartFromPlayhead() {
    const ws = wsRef.current;
    if (!ws || !isReady) return;
    setStartText(fmt(ws.getCurrentTime()));
  }

  function setEndFromPlayhead() {
    const ws = wsRef.current;
    if (!ws || !isReady) return;
    setEndText(fmt(ws.getCurrentTime()));
  }

  function applyRange() {
    if (!isReady) return;

    const s = parseTime(startText);
    const e = parseTime(endText);
    if (s == null || e == null) return;

    let start = clamp(s, 0, duration);
    let end = clamp(e, 0, duration);
    if (end < start) [start, end] = [end, start];
    if (end - start < 0.1) return;

    setRange({ start, end });

    // ✅ makes it feel responsive: jump to start immediately
    wsRef.current?.setTime(start);
  }

  const overlay = useMemo(() => {
    if (!range || duration <= 0) return null;
    const leftPct = (range.start / duration) * 100;
    const widthPct = ((range.end - range.start) / duration) * 100;
    return { leftPct, widthPct };
  }, [range, duration]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-slate-100 p-2">
        <div className="relative">
          <div ref={containerRef} />

          {overlay && (
            <div
              className="pointer-events-none absolute top-0 h-full rounded-md border border-blue-500 bg-blue-500/15"
              style={{ left: `${overlay.leftPct}%`, width: `${overlay.widthPct}%` }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          onClick={togglePlay}
          disabled={disabled || !isReady}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
          onClick={clearRange}
          disabled={disabled || !isReady}
        >
          Clear range
        </button>

        <label className="ml-2 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            disabled={disabled || !isReady}
          />
          Loop range
        </label>

        {range ? (
          <div className="text-sm text-slate-700">
            Range: <b>{fmt(range.start)}</b> → <b>{fmt(range.end)}</b>{" "}
            <span className="text-slate-400">({(range.end - range.start).toFixed(2)}s)</span>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Set start/end, then Apply.</div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Start</span>
          <input
            className="w-28 rounded-md border px-2 py-1 text-sm"
            placeholder="0:30"
            value={startText}
            onChange={(e) => setStartText(e.target.value)}
            disabled={disabled || !isReady}
          />
          <button
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            onClick={setStartFromPlayhead}
            disabled={disabled || !isReady}
          >
            Set Start
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-6">
          <span className="text-sm font-medium text-slate-700">End</span>
          <input
            className="w-28 rounded-md border px-2 py-1 text-sm"
            placeholder="2:30"
            value={endText}
            onChange={(e) => setEndText(e.target.value)}
            disabled={disabled || !isReady}
          />
          <button
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            onClick={setEndFromPlayhead}
            disabled={disabled || !isReady}
          >
            Set End
          </button>
        </div>

        <div className="sm:ml-auto">
          <button
            className="rounded-lg bg-slate-800 px-4 py-2 text-white disabled:opacity-50"
            onClick={applyRange}
            disabled={disabled || !isReady}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
