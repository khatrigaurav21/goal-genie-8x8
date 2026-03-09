import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Target, RefreshCw, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { HaradaGrid } from "@/lib/harada";

interface DailyFocusPanelProps {
  data: HaradaGrid;
  completedTasks: Set<string>;
  onToggleTask: (pillarIndex: number, taskText: string) => void;
}

export default function DailyFocusPanel({ data, completedTasks, onToggleTask }: DailyFocusPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const focusTasks = useMemo(() => {
    const allTasks: { key: string; task: string; pillar: string; pillarIndex: number; isHighImpact: boolean }[] = [];
    const highImpactSet = new Set(data.highImpact || []);

    data.pillars.forEach((p, pi) => {
      p.tasks.forEach((t) => {
        const key = `${pi}-${t}`;
        if (!completedTasks.has(key)) {
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
  }, [data, completedTasks, refreshKey]);

  const allFocusDone = focusTasks.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card border border-border rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-serif font-bold text-foreground">Today's Focus</h3>
        </div>
        {!allFocusDone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {allFocusDone ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-4"
        >
          <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">All focus tasks done!</p>
          <p className="text-xs text-muted-foreground mt-1">Great work today 🎉</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {focusTasks.map((t) => (
              <motion.div
                key={t.key}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                className={`flex items-start gap-3 p-2.5 rounded-md border transition-colors ${
                  t.isHighImpact
                    ? "border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/5"
                    : "border-border bg-background"
                }`}
              >
                <Checkbox
                  checked={completedTasks.has(t.key)}
                  onCheckedChange={() => onToggleTask(t.pillarIndex, t.task)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {t.isHighImpact && <Star className="w-3.5 h-3.5 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                    <span className="text-sm font-medium text-foreground leading-tight">{t.task}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{t.pillar}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
