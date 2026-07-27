import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Target, RefreshCw, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { HaradaGrid } from "@/lib/harada";
import { usePillarColors } from "@/lib/theme-colors";
import { getPillarIcon } from "@/lib/pillar-icons";

interface DailyFocusPanelProps {
  data: HaradaGrid;
  completedTasks: Set<string>;
  onToggleTask: (pillarIndex: number, taskText: string) => void;
  locked?: boolean;
}

export default function DailyFocusPanel({ data, completedTasks, onToggleTask, locked = false }: DailyFocusPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  // Tasks that were just checked off — kept visible briefly with a strike-through +
  // success tint before they slide out, so completion reads as a satisfying moment
  // rather than an abrupt disappearance.
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());
  const { pillarBorderColors } = usePillarColors();

  const handleCheck = (key: string, pillarIndex: number, task: string) => {
    if (!completedTasks.has(key)) {
      setJustCompleted((prev) => new Set(prev).add(key));
      window.setTimeout(() => {
        setJustCompleted((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 650);
    }
    onToggleTask(pillarIndex, task);
  };

  const focusTasks = useMemo(() => {
    const allTasks: { key: string; task: string; pillar: string; pillarIndex: number; isHighImpact: boolean }[] = [];
    const highImpactSet = new Set(data.highImpact || []);

    data.pillars.forEach((p, pi) => {
      p.tasks.forEach((t) => {
        const key = `${pi}-${t}`;
        if (!completedTasks.has(key) || justCompleted.has(key)) {
          allTasks.push({ key, task: t, pillar: p.name, pillarIndex: pi, isHighImpact: highImpactSet.has(key) });
        }
      });
    });

    // Sort: high impact first, then distribute across pillars
    allTasks.sort((a, b) => {
      if (a.isHighImpact && !b.isHighImpact) return -1;
      if (!a.isHighImpact && b.isHighImpact) return 1;
      return 0;
    });

    // Pick 3-5 tasks, preferring high impact and variety across pillars
    const selected: typeof allTasks = [];
    const usedPillars = new Set<number>();

    // First pass: high impact from different pillars
    for (const t of allTasks) {
      if (selected.length >= 5) break;
      if (t.isHighImpact && !usedPillars.has(t.pillarIndex)) {
        selected.push(t);
        usedPillars.add(t.pillarIndex);
      }
    }

    // Second pass: fill to at least 3
    for (const t of allTasks) {
      if (selected.length >= 5) break;
      if (!selected.includes(t)) {
        selected.push(t);
      }
    }

    return selected.slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, completedTasks, justCompleted, refreshKey]);

  const allFocusDone = focusTasks.length === 0;

  if (locked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
        className="bg-card/60 backdrop-blur-sm border border-dashed border-border rounded-xl p-5 shadow-sm text-center h-full flex flex-col items-center justify-center"
      >
        <Target className="w-6 h-6 text-muted-foreground mb-2 opacity-60" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground/80">Today's Focus</p>
        <p className="text-xs text-muted-foreground mt-1">Unfold your plan to see today's tasks</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
      className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-5 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="font-serif font-medium tracking-tight text-foreground">Today's Focus</h3>
        </div>
        {!allFocusDone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-muted-foreground hover:text-foreground"
            title="Shuffle today's focus"
            aria-label="Shuffle today's focus"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {allFocusDone ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">All focus tasks done!</p>
          <p className="text-xs text-muted-foreground mt-1">Great work today 🎉</p>
        </motion.div>
      ) : (
        <div className="space-y-2 flex-1">
          <AnimatePresence mode="popLayout">
            {focusTasks.map((t) => {
              const isDone = completedTasks.has(t.key);
              const PillarIcon = getPillarIcon(t.pillar, t.pillarIndex);
              return (
                <motion.div
                  key={t.key}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  className={`flex items-start gap-3 p-2.5 rounded-md border transition-colors duration-300 ${
                    isDone
                      ? "border-primary/25 bg-primary/[0.06]"
                      : t.isHighImpact
                      ? "border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/5"
                      : "border-border bg-background"
                  }`}
                >
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => handleCheck(t.key, t.pillarIndex, t.task)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {t.isHighImpact && !isDone && (
                        <Star className="w-3.5 h-3.5 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                      )}
                      <span className="relative inline-block">
                        <span
                          className={`text-sm font-medium leading-tight transition-colors duration-300 ${
                            isDone ? "text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {t.task}
                        </span>
                        {isDone && (
                          <motion.span
                            className="absolute left-0 top-1/2 h-[1.5px] bg-muted-foreground/70 origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ width: "100%" }}
                          />
                        )}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <PillarIcon
                        className="w-2.5 h-2.5 shrink-0"
                        style={{ color: pillarBorderColors[t.pillarIndex] }}
                        aria-hidden="true"
                      />
                      {t.pillar}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
