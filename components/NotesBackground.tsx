"use client";

import { useMemo } from "react";

type Note = {
  id: number;
  x: number; // vw
  y: number; // vh
  size: number; // px
  drift: number; // px
  duration: number; // s
  delay: number; // s
  opacity: number; // 0..1
  symbol: string;
};

const SYMBOLS = ["♪", "♫", "♩", "♬"];

export default function NotesBackground({ count = 18 }: { count?: number }) {
  const notes = useMemo<Note[]>(() => {
    // deterministic-ish random (fine for UI)
    return Array.from({ length: count }).map((_, i) => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = 18 + Math.random() * 42; // 18..60
      const drift = 12 + Math.random() * 38; // 12..50
      const duration = 10 + Math.random() * 18; // 10..28
      const delay = Math.random() * 6; // 0..6
      const opacity = 0.08 + Math.random() * 0.12; // subtle
      const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      return { id: i, x, y, size, drift, duration, delay, opacity, symbol };
    });
  }, [count]);

  return (
    <div className="notes-bg" aria-hidden>
      {notes.map((n) => (
        <span
          key={n.id}
          className="note"
          style={{
            left: `${n.x}vw`,
            top: `${n.y}vh`,
            fontSize: `${n.size}px`,
            opacity: n.opacity,
            animationDuration: `${n.duration}s`,
            animationDelay: `${n.delay}s`,
            // pass drift via CSS var
            ["--drift" as any]: `${n.drift}px`,
          }}
        >
          {n.symbol}
        </span>
      ))}
    </div>
  );
}
