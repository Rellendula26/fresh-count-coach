"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import WaveformRange from "@/components/WaveformRange";
import TapTrainer from "@/components/TapTrainer";
import Metronome from "@/components/Metronome";
import { estimateTempoFromAudioUrlRange } from "@/lib/tempo";

type Range = { start: number; end: number };

export default function TrainPage() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [range, setRange] = useState<Range | null>(null);

  const [bpm, setBpm] = useState<number | null>(null);
  const [tempoStatus, setTempoStatus] = useState<string>("");
  const [apiStatus, setApiStatus] = useState<string>("");

  // tiny “backend” call (optional, but proves API works)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ping", { cache: "no-store" });
        const data = await res.json();
        setApiStatus(data?.ok ? "API: online" : "API: unknown");
      } catch {
        setApiStatus("API: offline");
      }
    })();
  }, []);

  async function onRangeChange(r: Range | null) {
    setRange(r);
    setBpm(null);

    if (!audioUrl || !r) {
      setTempoStatus("");
      return;
    }

    setTempoStatus("Detecting BPM...");
    try {
      const { bpm: detectedBpm, confidence } =
        await estimateTempoFromAudioUrlRange(audioUrl, r);

      setBpm(detectedBpm);
      setTempoStatus(
        `Detected ~${detectedBpm} BPM (confidence ${Math.round(
          confidence * 100
        )}%)`
      );
    } catch (e) {
      console.error(e);
      setTempoStatus("BPM detection failed. Try a cleaner/shorter range.");
    }
  }

  return (
    <main className="relative mx-auto max-w-4xl space-y-6 p-6">
      {/* keep content above the background */}
      <div className="relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white/70 px-4 py-2 text-sm text-zinc-700 backdrop-blur transition hover:bg-white hover:text-zinc-900"
          >
            <span className="transition group-hover:-translate-x-0.5">←</span>
            Home
          </Link>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{apiStatus}</span>
            <span>Upload → range → BPM → tap + metronome</span>
          </div>
        </div>

        {/* Header */}
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur">
          <h1 className="text-3xl font-bold text-zinc-900">Count Coach</h1>
          <p className="mt-1 text-zinc-600">
            Upload a mix, highlight a range, detect tempo, and sharpen timing
            with tap feedback + a metronome.
          </p>
        </div>

        {/* Upload + waveform */}
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur">
          {/* ✅ NICE FILE UPLOAD */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="block">
              <div className="text-sm font-medium text-zinc-700">Audio</div>

              <input
                type="file"
                accept="audio/*"
                className="mt-2 block w-full max-w-sm text-sm text-zinc-700
                  file:mr-4 file:rounded-full file:border file:border-zinc-300
                  file:bg-white/80 file:px-4 file:py-2 file:text-sm file:font-medium
                  hover:file:bg-white"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;

                  const url = URL.createObjectURL(f);
                  setAudioUrl(url);
                  setRange(null);
                  setBpm(null);
                  setTempoStatus("");
                }}
              />
            </label>

            {/* optional: show whether a file is loaded */}
            <div className="text-xs text-zinc-500">
              {audioUrl ? "File loaded ✅" : "No file yet"}
            </div>
          </div>

          <WaveformRange audioUrl={audioUrl} onRangeChange={onRangeChange} />

          {tempoStatus && (
            <div className="text-sm text-zinc-600">
              <b>Tempo:</b> {tempoStatus}
            </div>
          )}
        </div>

        {/* Training */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur">
            <TapTrainer range={range} bpm={bpm} />
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur">
            <Metronome bpm={bpm} enabled={!!range && bpm != null} accentEvery={8} />
          </div>
        </div>
      </div>
    </main>
  );
}
