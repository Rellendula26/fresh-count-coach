"use client";

import { useEffect, useRef, useState } from "react";

export default function Metronome({
  bpm,
  enabled,
  accentEvery = 8,
}: {
  bpm: number | null;
  enabled: boolean;
  accentEvery?: number;
}) {
  const [running, setRunning] = useState(false);

  // 🔊 volume controls (0–3x)
  const [volume, setVolume] = useState(1.0); // baseline = previous loudness
  const [accentBoost, setAccentBoost] = useState(1.6);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const timerRef = useRef<number | null>(null);
  const nextTimeRef = useRef<number>(0);
  const beatIndexRef = useRef<number>(0);

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();

      const g = ctxRef.current.createGain();
      g.gain.value = volume;
      g.connect(ctxRef.current.destination);
      masterGainRef.current = g;
    }
    return ctxRef.current;
  }

  // smooth volume changes
  useEffect(() => {
    const ctx = ctxRef.current;
    const g = masterGainRef.current;
    if (!ctx || !g) return;

    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.03);
  }, [volume]);

  function click(at: number, accent: boolean) {
    const ctx = getCtx();
    const master = masterGainRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = accent ? 1400 : 1000;

    // 🔊 3× louder envelope
    const hit = accent
      ? 1.0 * accentBoost   // was ~0.35
      : 0.65;               // was ~0.22

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(hit, at + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);

    osc.connect(gain);
    gain.connect(master);

    osc.start(at);
    osc.stop(at + 0.04);
  }

  function scheduleLoop() {
    const ctx = getCtx();
    const b = bpm ?? 120;
    const interval = 60 / b;

    const lookahead = 0.12;
    const tickEvery = 25;

    if (nextTimeRef.current === 0) {
      nextTimeRef.current = ctx.currentTime + 0.05;
    }

    while (nextTimeRef.current < ctx.currentTime + lookahead) {
      const idx = beatIndexRef.current;
      const accent = accentEvery > 0 ? idx % accentEvery === 0 : false;

      click(nextTimeRef.current, accent);

      beatIndexRef.current = idx + 1;
      nextTimeRef.current += interval;
    }

    timerRef.current = window.setTimeout(scheduleLoop, tickEvery);
  }

  function start() {
    if (!enabled || bpm == null) return;

    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    beatIndexRef.current = 0;
    nextTimeRef.current = 0;

    setRunning(true);
    scheduleLoop();
  }

  function stop() {
    setRunning(false);
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    nextTimeRef.current = 0;
  }

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled || bpm == null) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, bpm]);

  const disabled = !enabled || bpm == null;

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm uppercase tracking-wide text-slate-500">
            Metronome
          </div>
          <div className="text-lg font-semibold">
            {bpm == null ? "Detect BPM from range to enable" : `${bpm} BPM`}
          </div>
          <div className="text-slate-600 text-sm">
            Accents every {accentEvery} beats (downbeat = “1”).
          </div>
        </div>

        <button
          className={[
            "rounded-lg px-4 py-2 text-white transition",
            disabled
              ? "bg-slate-300 cursor-not-allowed"
              : running
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-emerald-600 hover:bg-emerald-700",
          ].join(" ")}
          disabled={disabled}
          onClick={() => (running ? stop() : start())}
        >
          {running ? "Stop" : "Start"}
        </button>
      </div>

      {/* 🔊 Volume controls */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3">
          <span className="w-20 text-sm text-slate-600">Volume</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
            disabled={disabled}
          />
          <span className="w-12 text-right text-sm text-slate-600">
            {volume.toFixed(2)}x
          </span>
        </label>

        <label className="flex items-center gap-3">
          <span className="w-20 text-sm text-slate-600">Accent</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={accentBoost}
            onChange={(e) => setAccentBoost(Number(e.target.value))}
            className="w-full"
            disabled={disabled}
          />
          <span className="w-12 text-right text-sm text-slate-600">
            {accentBoost.toFixed(2)}x
          </span>
        </label>
      </div>
    </div>
  );
}
