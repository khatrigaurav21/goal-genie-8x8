import { motion } from "framer-motion";

const PILLAR_COLORS_MUTED = [
  "hsl(4, 40%, 90%)",
  "hsl(230, 20%, 90%)",
  "hsl(150, 10%, 90%)",
  "hsl(42, 35%, 90%)",
  "hsl(320, 20%, 90%)",
  "hsl(190, 20%, 90%)",
  "hsl(270, 15%, 90%)",
  "hsl(20, 25%, 90%)",
];

const TIPS = [
  "Breaking your goal into 8 pillars…",
  "Generating 64 actionable tasks…",
  "Applying the Harada Method…",
  "Crafting your personal mandala…",
];

export default function LoadingSkeleton({ goal }: { goal: string }) {
  // Build a fake 9x9 grid for the skeleton
  const cells = Array.from({ length: 81 }, (_, i) => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(col / 3);
    const localRow = row % 3;
    const localCol = col % 3;
    const isCenter = row === 4 && col === 4;
    const isCenterBlock = blockRow === 1 && blockCol === 1;
    const isPillarCenter = localRow === 1 && localCol === 1 && !isCenter;

    // Map block position to pillar index
    const blockMap: Record<string, number> = {
      "0,0": 0, "0,1": 1, "0,2": 2,
      "1,0": 3, "1,2": 4,
      "2,0": 5, "2,1": 6, "2,2": 7,
    };
    const key = `${blockRow},${blockCol}`;
    const pillarIdx = isCenterBlock
      ? undefined
      : blockMap[key];

    return { isCenter, isPillarCenter, pillarIdx, isCenterBlock };
  });

  return (
    <div className="min-h-screen bg-background paper-texture flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container max-w-5xl mx-auto flex items-center px-4 py-4">
          <div className="font-serif text-2xl font-bold tracking-wide">
            原<span className="text-primary">日</span>
            <span className="text-sm font-sans font-normal text-muted-foreground ml-2">HaraDaily</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-2">
            Building your plan…
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            &ldquo;{goal}&rdquo;
          </p>
        </motion.div>

        {/* Skeleton grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="grid grid-cols-9 grid-rows-9 gap-[2px] aspect-square rounded-lg overflow-hidden border border-border bg-border/30 p-[2px]">
            {cells.map((cell, i) => (
              <motion.div
                key={i}
                className="rounded-[2px]"
                style={{
                  backgroundColor: cell.isCenter
                    ? "hsl(var(--primary))"
                    : cell.isPillarCenter && cell.pillarIdx !== undefined
                    ? PILLAR_COLORS_MUTED[cell.pillarIdx]
                    : cell.pillarIdx !== undefined
                    ? `${PILLAR_COLORS_MUTED[cell.pillarIdx]}80`
                    : cell.isCenterBlock && cell.isPillarCenter
                    ? "hsl(var(--muted))"
                    : "hsl(40, 15%, 93%)",
                }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: (Math.floor(i / 9) + (i % 9)) * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Rotating tips */}
        <motion.div
          className="mt-6 text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <RotatingTips tips={TIPS} />
        </motion.div>
      </main>
    </div>
  );
}

function RotatingTips({ tips }: { tips: string[] }) {
  const [index, setIndex] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  return <span>{tips[index]}</span>;
}

import { useState } from "react";
