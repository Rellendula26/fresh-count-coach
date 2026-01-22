"use client";

import { useMemo } from "react";

type Bubble = {
  top: string;
  left: string;
  size: number;
  color: string;
  dur: number;
  x1: number;
  y1: number;
};

export default function AmbientBackground({
  notes = true,
}: {
  notes?: boolean;
}) {
  const bubbles = useMemo(() => {
    const colors = [
      "rgba(99,102,241,0.35)",   // indigo
      "rgba(59,130,246,0.30)",   // blue
      "rgba(16,185,129,0.28)",   // emerald
      "rgba(244,63,94,0.22)",    // rose
      "rgba(168,85,247,0.22)",   // purple
      "rgba(245,158,11,0.18)",   // amber
    ];

    const out: Bubble[] = [];
    for (let i = 0; i < 18; i++) {
      const size = Math.floor(120 + Math.random() * 340);
      out.push({
        top: `${Math.floor(Math.random() * 100)}%`,
        left: `${Math.floor(Math.random() * 100)}%`,
        size,
        color: colors[i % colors.length],
        dur: Math.floor(14 + Math.random() * 18),
        x1: Math.floor(-50 + Math.random() * 100),
        y1: Math.floor(-70 + Math.random() * 140),
      });
    }
    return out;
  }, []);

  return (
    <div className={`bg-ambient ${notes ? "bg-notes" : ""}`}>
      {bubbles.map((b, idx) => (
        <div
          key={idx}
          className="bubble"
          style={{
            top: b.top,
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: b.color,
            ["--dur" as any]: `${b.dur}s`,
            ["--x1" as any]: `${b.x1}px`,
            ["--y1" as any]: `${b.y1}px`,
          }}
        />
      ))}
    </div>
  );
}
