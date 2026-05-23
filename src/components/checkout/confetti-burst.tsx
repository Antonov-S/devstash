"use client";

import { useEffect, useState } from "react";

const PIECE_COUNT = 60;
const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#fde047",
  "#ec4899",
  "#10b981"
];

type Piece = {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
  color: string;
  size: number;
};

export function ConfettiBurst() {
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPieces(
      Array.from({ length: PIECE_COUNT }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 250,
        duration: 1400 + Math.random() * 500,
        drift: (Math.random() - 0.5) * 240,
        rotation: 360 + Math.random() * 540,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6
      }))
    );
    const cleanup = window.setTimeout(() => setPieces(null), 2000);
    return () => window.clearTimeout(cleanup);
  }, []);

  if (!pieces) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece absolute top-0 block rounded-[1px]"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 0.4}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
            ["--confetti-x" as string]: `${piece.drift}px`,
            ["--confetti-rot" as string]: `${piece.rotation}deg`
          }}
        />
      ))}
    </div>
  );
}
