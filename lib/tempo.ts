// lib/tempo.ts
export type TempoResult = { bpm: number; confidence: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Very solid "first pass" tempo estimation for dance music:
 * - bandpass-ish by focusing on energy change (spectral flux-lite)
 * - compute onset envelope from short-time energy
 * - autocorrelate onset envelope to find periodicity
 */
export async function estimateTempoFromAudioUrlRange(
  audioUrl: string,
  range: { start: number; end: number }
): Promise<TempoResult> {
  const res = await fetch(audioUrl);
  const arrayBuf = await res.arrayBuffer();

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));

  const sr = audioBuf.sampleRate;

  const startS = clamp(range.start, 0, audioBuf.duration);
  const endS = clamp(range.end, 0, audioBuf.duration);
  const start = Math.floor(startS * sr);
  const end = Math.floor(endS * sr);

  // mono mixdown
  const ch0 = audioBuf.getChannelData(0);
  const ch1 = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : null;

  const len = end - start;
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const a = ch0[start + i];
    const b = ch1 ? ch1[start + i] : a;
    mono[i] = 0.5 * (a + b);
  }

  // Short-time energy envelope
  const win = 1024;
  const hop = 256;
  const frames = Math.floor((mono.length - win) / hop);
  const env = new Float32Array(frames);

  let prev = 0;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const off = f * hop;
    for (let j = 0; j < win; j++) {
      const x = mono[off + j];
      sum += x * x;
    }
    // "onset-ish": positive energy change
    const e = Math.sqrt(sum / win);
    const diff = Math.max(0, e - prev);
    env[f] = diff;
    prev = e;
  }

  // Normalize
  let max = 0;
  for (let i = 0; i < env.length; i++) max = Math.max(max, env[i]);
  if (max > 0) for (let i = 0; i < env.length; i++) env[i] /= max;

  // Autocorrelation over plausible BPM range
  // BPM 80..200 typical; convert to lag in frames
  const fps = sr / hop;
  const minBpm = 80;
  const maxBpm = 200;

  const minLag = Math.floor((60 * fps) / maxBpm);
  const maxLag = Math.floor((60 * fps) / minBpm);

  let bestLag = minLag;
  let bestScore = -1;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    // correlate
    for (let i = 0; i < env.length - lag; i++) {
      score += env[i] * env[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  const bpmRaw = (60 * fps) / bestLag;

  // Common half/double-time correction (dance mixes do this a lot)
  let bpm = bpmRaw;
  if (bpm < 90) bpm *= 2;
  if (bpm > 190) bpm /= 2;

  // Confidence (simple)
  const confidence = Math.min(1, bestScore / (env.length || 1));

  // Close the temp context (release resources)
  ctx.close().catch(() => {});

  return { bpm: Math.round(bpm), confidence };
}

export async function estimateTempoFromAudioFileRange(
  audioFile: File,
  range: { start: number; end: number }
): Promise<TempoResult> {
  const arrayBuf = await audioFile.arrayBuffer();

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));

  const sr = audioBuf.sampleRate;

  const startS = clamp(range.start, 0, audioBuf.duration);
  const endS = clamp(range.end, 0, audioBuf.duration);
  const start = Math.floor(startS * sr);
  const end = Math.floor(endS * sr);

  // mono mixdown
  const ch0 = audioBuf.getChannelData(0);
  const ch1 = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : null;

  const len = end - start;
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const a = ch0[start + i];
    const b = ch1 ? ch1[start + i] : a;
    mono[i] = 0.5 * (a + b);
  }

  // Short-time energy envelope
  const win = 1024;
  const hop = 256;
  const frames = Math.floor((mono.length - win) / hop);
  const env = new Float32Array(frames);

  let prev = 0;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const off = f * hop;
    for (let j = 0; j < win; j++) {
      const x = mono[off + j];
      sum += x * x;
    }
    // "onset-ish": positive energy change
    const e = Math.sqrt(sum / win);
    const diff = Math.max(0, e - prev);
    env[f] = diff;
    prev = e;
  }

  // Normalize
  let max = 0;
  for (let i = 0; i < env.length; i++) max = Math.max(max, env[i]);
  if (max > 0) for (let i = 0; i < env.length; i++) env[i] /= max;

  // Autocorrelation over plausible BPM range
  const fps = sr / hop;
  const minBpm = 80;
  const maxBpm = 200;

  const minLag = Math.floor((60 * fps) / maxBpm);
  const maxLag = Math.floor((60 * fps) / minBpm);

  let bestLag = minLag;
  let bestScore = -1;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = 0; i < env.length - lag; i++) {
      score += env[i] * env[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  const bpmRaw = (60 * fps) / bestLag;

  // Common half/double-time correction
  let bpm = bpmRaw;
  if (bpm < 90) bpm *= 2;
  if (bpm > 190) bpm /= 2;

  const confidence = Math.min(1, bestScore / (env.length || 1));

  ctx.close().catch(() => {});

  return { bpm: Math.round(bpm), confidence };
}
