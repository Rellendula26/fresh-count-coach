"use client";

import { useMemo, useState } from "react";
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

  const canTrain = !!audioUrl && !!range && bpm != null;

  async function onRangeChange(r: Range | null) {
    setRange(r);
    setBpm(null);

    if (!audioUrl || !r) {
      setTempoStatus("");
      return;
    }

    setTempoStatus("Detecting BPM...");
    try {
      const { bpm, confidence } = await estimateTempoFromAudioUrlRange(audioUrl, r);
      setBpm(bpm);
      setTempoStatus(`Detected ~${bpm} BPM (confidence ${Math.round(confidence * 100)}%)`);
    } catch (e) {
      console.error(e);
      setTempoStatus("BPM detection failed. Try a cleaner/shorter range.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Count Coach</h1>
        <p className="text-slate-600">
          Upload a mix, set a range, we detect BPM, then practice with metronome + tapping.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <label className="text-sm text-slate-700">
          Audio{" "}
          <input
            type="file"
            accept="audio/*"
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

        <WaveformRange audioUrl={audioUrl} onRangeChange={onRangeChange} />

        {tempoStatus && (
          <div className="text-sm text-slate-600">
            <b>Tempo:</b> {tempoStatus}
          </div>
        )}
      </div>

      <TapTrainer range={range} bpm={bpm} />
      <Metronome bpm={bpm} enabled={!!range && bpm != null} accentEvery={8} />
    </main>
  );
}
