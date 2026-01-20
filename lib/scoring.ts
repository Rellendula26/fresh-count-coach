export type TapStats = {
  meanAbsMs: number;
  stdMs: number;
  driftMsPerMin: number;
};

export function computeTimingStats({
  tapsMs,
  t0Ms,
  bpm,
}: {
  tapsMs: number[];
  t0Ms: number;
  bpm: number;
}): TapStats {
  // 8-count grid => beats are still every beat; "8-count" just framing.
  // Period per beat:
  const T = (60_000 / bpm); // ms

  // Map each tap to nearest beat time relative to t0
  const errors = tapsMs.map((t) => {
    const k = Math.round((t - t0Ms) / T);
    const beatTime = t0Ms + k * T;
    return t - beatTime; // ms (positive = late)
  });

  const meanAbsMs = mean(errors.map((e) => Math.abs(e)));
  const stdMs = stddev(errors);

  // Drift: linear regression slope of error vs time
  // Convert slope to ms/min.
  const driftMsPerMin = slope(errors, tapsMs) * 60_000;

  return { meanAbsMs, stdMs, driftMsPerMin };
}

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
}

function stddev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = mean(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function slope(y: number[], x: number[]) {
  if (y.length !== x.length || y.length < 2) return 0;
  const xbar = mean(x);
  const ybar = mean(y);
  let num = 0;
  let den = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - xbar) * (y[i] - ybar);
    den += (x[i] - xbar) ** 2;
  }
  return den === 0 ? 0 : num / den; // (ms error) per (ms time) => unitless; then scaled later
}
