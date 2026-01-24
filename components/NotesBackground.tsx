"use client";

import { useEffect, useState } from "react";

type Note = {
  id: string;
  char: string;
  left: number;   // vw
  top: number;    // vh
  size: number;   // px
  dur: number;    // s
  delay: number;  // s
  rot: number;    // deg
  drift: number;  // px
};

const CHARS = ["♪", "♫", "♩", "♬"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function NotesBackground({ count = 22 }: { count?: number }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setNotes(
      Array.from({ length: count }).map((_, i) => ({
        id: `${i}-${Math.random().toString(16).slice(2)}`,
        char: CHARS[Math.floor(rand(0, CHARS.length))],
        left: rand(-5, 105),
        top: rand(-5, 105),
        size: rand(18, 54),
        dur: rand(10, 18),
        delay: rand(0, 6),
        rot: rand(-18, 18),
        drift: rand(-22, 22),
      }))
    );
  }, [count]);

  return (
    <div className="notes-bg" aria-hidden>
      {notes.map((n) => (
        <span
          key={n.id}
          className="note"
          style={{
            left: `${n.left}vw`,
            top: `${n.top}vh`,
            fontSize: `${n.size}px`,
            animationDuration: `${n.dur}s`,
            animationDelay: `${n.delay}s`,
            ["--r" as any]: `${n.rot}deg`,
            ["--drift" as any]: `${n.drift}px`,
          }}
        >
          {n.char}
        </span>
      ))}
    </div>
  );
}
