"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  id: string;
  char: string;
  left: number; // %
  top: number; // %
  size: number; // px
  dur: number; // s
  delay: number; // s
  drift: number; // px
  rot: number; // deg
  opacity: number; // 0..1
};

const CHARS = ["♪", "♫", "♩", "♬"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function NotesBackground({ count = 22 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);

  // Only render after mount -> no server/client mismatch
  useEffect(() => setMounted(true), []);

  const notes = useMemo<Note[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      const char = CHARS[Math.floor(rand(0, CHARS.length))];
      return {
        id: `${i}-${Math.random().toString(16).slice(2)}`,
        char,
        left: rand(2, 98),
        top: rand(5, 95),
        size: rand(18, 52),
        dur: rand(8, 16),
        delay: rand(0, 6),
        drift: rand(-22, 22),
        rot: rand(-18, 18),
        opacity: rand(0.10, 0.22),
      };
    });
  }, [count]);

  if (!mounted) return null;

  return (
    <div className="notes-bg" aria-hidden>
      {notes.map((n) => (
        <span
          key={n.id}
          className="note"
          style={{
            left: `${n.left}%`,
            top: `${n.top}%`,
            fontSize: `${n.size}px`,
            opacity: n.opacity,
            animationDuration: `${n.dur}s`,
            animationDelay: `${n.delay}s`,
            // custom CSS vars used by keyframes
            ["--drift" as any]: `${n.drift}px`,
            ["--r" as any]: `${n.rot}deg`,
          }}
        >
          {n.char}
        </span>
      ))}
    </div>
  );
}
