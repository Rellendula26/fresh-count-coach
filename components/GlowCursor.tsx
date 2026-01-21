"use client";

import { useEffect, useRef } from "react";

export default function GlowCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const glow = glowRef.current;
    if (!dot || !glow) return;

    let x = 0,
      y = 0;
    let gx = 0,
      gy = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const tick = () => {
      gx += (x - gx) * 0.10;
      gy += (y - gy) * 0.10;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    requestAnimationFrame(tick);

    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      {/* Glow */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/25 blur-2xl"
      />
      {/* Dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 shadow-[0_0_18px_rgba(59,130,246,0.55)]"
      />
    </>
  );
}
