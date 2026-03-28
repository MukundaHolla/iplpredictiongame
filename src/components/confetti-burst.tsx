"use client";

import { motion } from "framer-motion";

type ConfettiBurstProps = {
  burstKey: number;
};

const CONFETTI_COLORS = [
  "#2563eb",
  "#60a5fa",
  "#38bdf8",
  "#f59e0b",
  "#f97316",
  "#22c55e",
] as const;

type ConfettiPiece = {
  id: string;
  left: number;
  top: number;
  x: number;
  y: number;
  delay: number;
  size: number;
  height: number;
  rotation: number;
  spin: number;
  color: string;
};

function createConfettiPieces(seed: number) {
  const pieces: ConfettiPiece[] = [];

  for (let index = 0; index < 22; index += 1) {
    const spread = index - 10.5;
    const left = 50 + spread * 1.8;
    const top = 18 + (index % 3) * 2;
    const x = spread * 14;
    const y = 180 + Math.abs(spread) * 7 + (index % 4) * 22;
    const size = 8 + (index % 4);
    const height = index % 5 === 0 ? size * 1.6 : size;
    const rotation = spread * 12 + seed * 3;
    const spin = spread >= 0 ? 280 : -280;
    const delay = (index % 6) * 0.025;
    const color = CONFETTI_COLORS[(index + seed) % CONFETTI_COLORS.length];

    pieces.push({
      id: `${seed}-${index}`,
      left,
      top,
      x,
      y,
      delay,
      size,
      height,
      rotation,
      spin,
      color,
    });
  }

  return pieces;
}

export function ConfettiBurst({ burstKey }: ConfettiBurstProps) {
  if (burstKey === 0) {
    return null;
  }

  const pieces = createConfettiPieces(burstKey);

  return (
    <div
      key={burstKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
    >
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute block rounded-sm"
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            width: piece.size,
            height: piece.height,
            backgroundColor: piece.color,
          }}
          initial={{
            x: 0,
            y: -10,
            rotate: piece.rotation,
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            x: piece.x,
            y: piece.y,
            rotate: piece.rotation + piece.spin,
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1, 1, 0.9],
          }}
          transition={{
            duration: 1.15,
            delay: piece.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}
