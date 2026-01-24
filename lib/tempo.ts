// lib/tempo.ts
export type TempoResult = { bpm: number; confidence: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function estimateTempoFromAudioBufferRange(
  audioBuf: AudioBuffer,
  range: { start: number; end: number }
): TempoResult {
  const sr = audioBuf.sampleRate;

  const startS = clamp(range.start, 0, audioBuf.duration);
  const endS = clamp(range.end, 0, audioBuf.duration);

  const start = Math.floor(startS * sr);
  const end = Math.floor(endS * sr);

  const ch0 = audioBuf.getChannelData(0);
  const ch1 = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : null;

  const len = end - start;
  if (len <= 0) return { bpm: 0, confidence: 0 };

  // mono mixdown
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const a = ch0[start + i];
    const b = ch1 ? ch1[start + i] : a;
    mono[i] = 0.5 * (a + b);
  }

  // onset envelope from short-time energy change
  const win = 1024;
  const hop = 256;

  const frames = Math.max(0, Math.floor((mono.length - win) / hop) + 1);
  if (frames < 8) return { bpm: 0, confidence: 0 };

  const env = new Float32Array(frames);

  let prev = 0;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const off = f * hop;
    const stop = Math.min(off + win, mono.length);
    for (let j = off; j < stop; j++) {
      const x = mono[j];
      sum += x * x;
    }
    const denom = Math.max(1, stop - off);
    const e = Math.sqrt(sum / denom);
    const diff = Math.max(0, e - prev);
    env[f] = diff;
    prev = e;
  }

  // normalize envelope
  let max = 0;
  for (let i = 0; i < env.length; i++) max = Math.max(max, env[i]);
  if (max <= 1e-8) return { bpm: 0, confidence: 0 };
  for (let i = 0; i < env.length; i++) env[i] /= max;

  // autocorrelation over plausible BPM range
  const fps = sr / hop;
  const minBpm = 80;
  const maxBpm = 200;

  const minLag = Math.max(1, Math.floor((60 * fps) / maxBpm));
  const maxLag = Math.min(env.length - 1, Math.floor((60 * fps) / minBpm));
  if (maxLag <= minLag) return { bpm: 0, confidence: 0 };

  let bestLag = minLag;
  let bestScore = -Infinity;
  let secondBest = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    const lim = env.length - lag;
    for (let i = 0; i < lim; i++) score += env[i] * env[i + lag];

    if (score > bestScore) {
      secondBest = bestScore;
      bestScore = score;
      bestLag = lag;
    } else if (score > secondBest) {
      secondBest = score;
    }
  }

  // BPM from best lag
  const bpmRaw = (60 * fps) / bestLag;
  let bpm = bpmRaw;

  // common half/double-time correction
  if (bpm < 90) bpm *= 2;
  if (bpm > 190) bpm /= 2;

  // ✅ better confidence: "peakiness" of best autocorr peak vs runner-up
  // raw: 0..1 where 0 means ambiguous, 1 means very dominant peak
  const raw =
    bestScore > 0 && Number.isFinite(secondBest)
      ? (bestScore - secondBest) / bestScore
      : 0;

  // make it more human-friendly (optional): sqrt lifts mid-range values
  const confidence = Math.max(0, Math.min(1, Math.pow(raw, 0.5)));

  return { bpm: Math.round(bpm), confidence };
}
