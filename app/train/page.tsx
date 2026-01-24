"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import WaveformRange from "@/components/WaveformRange";
import Metronome from "@/components/Metronome";
import { estimateTempoFromAudioBufferRange } from "@/lib/tempo";

type Range = { start: number; end: number };

export default function TrainPage() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // ✅ Decode once and reuse
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufRef = useRef<AudioBuffer | null>(null);

  const [range, setRange] = useState<Range | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [tempoStatus, setTempoStatus] = useState<string>("");
  const [apiStatus, setApiStatus] = useState<string>("");

  // ✅ Fix "sometimes works": debounce + ignore stale runs
  const detectRunIdRef = useRef(0);
  const detectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [detecting, setDetecting] = useState(false);

  // ✅ prevent re-running BPM on essentially the same range
  const lastRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ping", { cache: "no-store" });
        const data = await res.json();
        setApiStatus(data?.ok ? "API: online" : "API: unknown");
      } catch {
        setApiStatus("API: local");
      }
    })();
  }, []);

  async function onRangeChange(r: Range | null) {
    setRange(r);

    // Clear any pending debounce
    if (detectDebounceRef.current) {
      clearTimeout(detectDebounceRef.current);
      detectDebounceRef.current = null;
    }

    // If range cleared
    if (!r) {
      lastRangeRef.current = null;
      setBpm(null);
      setTempoStatus("");
      setDetecting(false);
      return;
    }

    // If audio isn't decoded yet, tell user
    const audioBuf = audioBufRef.current;
    if (!audioBuf) {
      setBpm(null);
      setTempoStatus("Decoding audio...");
      setDetecting(false);
      return;
    }

    // Ignore tiny/no-op changes (prevents flicker + repeated runs)
    const last = lastRangeRef.current;
    const EPS = 0.02; // 20ms
    if (
      last &&
      Math.abs(last.start - r.start) < EPS &&
      Math.abs(last.end - r.end) < EPS
    ) {
      return;
    }
    lastRangeRef.current = r;

    setTempoStatus(bpm != null ? "Updating BPM..." : "Detecting BPM...");
    setDetecting(true);

    // Debounce: wait for user to stop adjusting range
    detectDebounceRef.current = setTimeout(() => {
      const runId = ++detectRunIdRef.current;

      try {
        // Sanity: make sure the function is actually imported
        if (typeof estimateTempoFromAudioBufferRange !== "function") {
          throw new Error(
            "estimateTempoFromAudioBufferRange is not a function (export/import mismatch)."
          );
        }

        // ✅ Hard cap analysis window for speed/stability
        const MAX = 20; // seconds
        const safeStart = r.start;
        const safeEnd = Math.min(r.end, r.start + MAX);

        const { bpm: detectedBpm, confidence } = estimateTempoFromAudioBufferRange(
          audioBuf,
          { start: safeStart, end: safeEnd }
        );

        // Ignore stale run if user changed range again
        if (runId !== detectRunIdRef.current) return;

        // Treat "0" as failure (common when the segment has weak onsets)
        if (!detectedBpm || detectedBpm <= 0) {
          setBpm(null);
          setTempoStatus("No clear tempo found. Try a shorter/cleaner range.");
          return;
        }

        // ✅ Option B: bucket confidence into a human label ("stability")
        const pct = Math.round(confidence * 100);
        const stability =
          pct >= 60 ? "high" : pct >= 35 ? "medium" : pct >= 15 ? "low" : "very low";

        setBpm(detectedBpm);
        setTempoStatus(`Detected ~${detectedBpm} BPM (stability: ${stability})`);
      } catch (e: any) {
        if (runId !== detectRunIdRef.current) return;
        console.error("BPM detection failed:", e);
        setBpm(null);
        setTempoStatus(`BPM detection failed: ${String(e?.message ?? e)}`);
      } finally {
        if (runId === detectRunIdRef.current) setDetecting(false);
      }
    }, 350);
  }

  return (
    <main className="relative mx-auto max-w-4xl space-y-6 p-6">
      <div className="relative z-10">
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
            <span>Upload → range → BPM → metronome</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur">
          <h1 className="text-3xl font-bold text-zinc-900">Count Coach</h1>
          <p className="mt-1 text-zinc-600">
            Upload a mix, highlight a range, detect tempo, and overlay a metronome.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur">
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
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;

                  // cancel any pending/in-flight detection
                  detectRunIdRef.current++;
                  if (detectDebounceRef.current) {
                    clearTimeout(detectDebounceRef.current);
                    detectDebounceRef.current = null;
                  }
                  setDetecting(false);

                  // prevent stale blob issues when re-uploading
                  if (audioUrl) URL.revokeObjectURL(audioUrl);

                  setAudioFile(f);

                  const url = URL.createObjectURL(f);
                  setAudioUrl(url);

                  // reset state
                  lastRangeRef.current = null;
                  setRange(null);
                  setBpm(null);
                  setTempoStatus("Decoding audio...");

                  try {
                    if (!audioCtxRef.current) {
                      audioCtxRef.current = new (window.AudioContext ||
                        (window as any).webkitAudioContext)();
                    }
                    const buf = await f.arrayBuffer();
                    const decoded = await audioCtxRef.current.decodeAudioData(buf.slice(0));
                    audioBufRef.current = decoded;
                    setTempoStatus(""); // ready
                  } catch (err: any) {
                    console.error(err);
                    audioBufRef.current = null;
                    setTempoStatus(`Audio decode failed: ${String(err?.message ?? err)}`);
                  }
                }}
              />
            </label>

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

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 backdrop-blur">
            <Metronome bpm={bpm} enabled={!!range && bpm != null && !detecting} accentEvery={8} />
          </div>
        </div>
      </div>
    </main>
  );
}
