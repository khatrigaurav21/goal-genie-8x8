import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, animate } from "framer-motion";

interface ProgressRingProps {
  percent: number;
  size?: number;
  ticks?: boolean;
  label?: string;
}

export default function ProgressRing({ percent, size = 36, ticks = false, label }: ProgressRingProps) {
  const prefersReducedMotion = useReducedMotion();
  // Displayed number tweens in lockstep with the ring's own stroke animation
  // (same 0.8s/easeOut) instead of snapping — the count-up is the legibility
  // cue that reinforces progress actually moved.
  const [displayPercent, setDisplayPercent] = useState(prefersReducedMotion ? percent : 0);
  const prevPercentRef = useRef(prefersReducedMotion ? percent : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayPercent(percent);
      prevPercentRef.current = percent;
      return;
    }
    const controls = animate(prevPercentRef.current, percent, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplayPercent(Math.round(v)),
    });
    prevPercentRef.current = percent;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent, prefersReducedMotion]);

  const strokeWidth = size >= 120 ? 7 : size >= 80 ? 6 : 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const tickCount = 40;
  const tickRadius = radius + strokeWidth / 2 + 3;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Dial bezel ticks — purely decorative, gives it an instrument-gauge feel */}
        {ticks && (
          <g>
            {Array.from({ length: tickCount }).map((_, i) => {
              const angle = (i / tickCount) * Math.PI * 2;
              const x1 = center + Math.cos(angle) * tickRadius;
              const y1 = center + Math.sin(angle) * tickRadius;
              const x2 = center + Math.cos(angle) * (tickRadius + 3.5);
              const y2 = center + Math.sin(angle) * (tickRadius + 3.5);
              const isActive = i / tickCount <= percent / 100;
              return (
                <line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={isActive ? 0.9 : 0.6}
                />
              );
            })}
          </g>
        )}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: prefersReducedMotion ? circumference - (percent / 100) * circumference : circumference }}
          animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={
            size >= 120
              ? "text-3xl font-medium font-serif tracking-tight text-foreground"
              : size >= 80
              ? "text-xl font-medium font-serif tracking-tight text-foreground"
              : "text-[9px] font-semibold text-foreground"
          }
        >
          {displayPercent}%
        </span>
        {label && size >= 80 && (
          <span className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">{label}</span>
        )}
      </div>
    </div>
  );
}
