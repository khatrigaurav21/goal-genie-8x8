import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildGridCells, type HaradaGrid } from "@/lib/harada";
import { toPng } from "html-to-image";
import { Download, Link2, X as XIcon, Linkedin, ChevronDown, Check, Star, Sparkles, Calendar, RefreshCw, Share2, Zap, PiggyBank, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { usePillarColors } from "@/lib/theme-colors";
import DailyFocusPanel from "@/components/DailyFocusPanel";
import TaskExpandPanel from "@/components/TaskExpandPanel";
import WeeklyReflection from "@/components/WeeklyReflection";
import { supabase } from "@/integrations/supabase/client";

interface PlanVersion {
  data: HaradaGrid;
  strategy: string;
}

interface HaradaGridViewProps {
  data: HaradaGrid;
  onReset: () => void;
  language?: string;
  plans?: PlanVersion[];
  activePlanIndex?: number;
  onSwitchPlan?: (index: number) => void;
  onGenerateAlternative?: (strategy: string) => void;
  isGenerating?: boolean;
}

export default function HaradaGridView({ data, onReset, language = "en" }: HaradaGridViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [celebratingPillar, setCelebratingPillar] = useState<number | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [expandedTask, setExpandedTask] = useState<{ task: string; pillar: string } | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const { isDark, pillarColors, pillarDoneColors, pillarBorderColors, emptyBg, textColor } = usePillarColors();
  const cells = buildGridCells(data);

  const highImpactSet = useMemo(() => new Set(data.highImpact || []), [data.highImpact]);

  const totalTasks = 64;
  const completedCount = completedTasks.size;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  const { pillarProgress, completedPillarSet } = useMemo(() => {
    const progress = data.pillars.map((_, i) => {
      let done = 0;
      completedTasks.forEach((key) => {
        if (key.startsWith(`${i}-`)) done++;
      });
      return done;
    });
    const cpSet = new Set<number>();
    data.pillars.forEach((p, i) => {
      if (p.tasks.every((t) => completedTasks.has(`${i}-${t}`))) cpSet.add(i);
    });
    return { pillarProgress: progress, completedPillarSet: cpSet };
  }, [completedTasks, data.pillars]);

  const prevPillarSetRef = useRef<Set<number>>(new Set());

  useMemo(() => {
    const prev = prevPillarSetRef.current;
    completedPillarSet.forEach((i) => {
      if (!prev.has(i)) {
        toast.success(`🎉 "${data.pillars[i].name}" pillar complete!`);
        setCelebratingPillar(i);
        setTimeout(() => setCelebratingPillar(null), 1200);
      }
    });
    prevPillarSetRef.current = new Set(completedPillarSet);
  }, [completedPillarSet, data.pillars]);

  const toggleTask = (_cellIndex: number, pillarIndex: number, taskText: string) => {
    const key = `${pillarIndex}-${taskText}`;
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setAllComplete(false);
      } else {
        next.add(key);
        if (next.size === totalTasks) {
          toast.success("🏆 All 64 tasks complete! You've mastered your goal!", { duration: 5000 });
          setAllComplete(true);
        }
      }
      return next;
    });
  };

  const handleFocusToggle = (pillarIndex: number, taskText: string) => {
    toggleTask(0, pillarIndex, taskText);
  };

  const shareText = `🎯 My Harada Method goal: "${data.goal}" — broken down into 8 pillars and 64 actionable tasks! ${progressPercent}% complete!`;
  const shareUrl = window.location.href;

  const handleDownload = async () => {
    if (!gridRef.current) return;
    try {
      const isDark = document.documentElement.classList.contains("dark");
      const dataUrl = await toPng(gridRef.current, { 
        pixelRatio: 2,
        backgroundColor: isDark ? "#191d24" : "#f5f0e8",
      });
      const link = document.createElement("a");
      link.download = `haradaily-${data.goal.slice(0, 30).replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Grid saved as image!");
    } catch {
      toast.error("Failed to save image");
    }
  };

  const handleShareX = () => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    toast.success("Link copied to clipboard!");
    setShareOpen(false);
  };

  return (
    <div className="min-h-screen bg-background paper-texture">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={onReset} className="font-serif text-xl font-bold text-foreground tracking-wide">
            原<span className="text-primary">日</span>
            <span className="text-sm font-sans font-normal text-muted-foreground ml-2">HaraDaily</span>
          </button>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 mr-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{completedCount}/{totalTasks}</span>
              <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs">{progressPercent}%</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowReflection(true)}>
              <Calendar className="w-4 h-4 mr-1" /> Reflect
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Save PNG
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(!shareOpen)}>
                <ChevronDown className="w-4 h-4 mr-1" /> Share
              </Button>
              <AnimatePresence>
                {shareOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
                  >
                    <button onClick={handleShareX} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                      <XIcon className="w-4 h-4" /> Share on X
                    </button>
                    <button onClick={handleShareLinkedIn} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                      <Linkedin className="w-4 h-4" /> Share on LinkedIn
                    </button>
                    <button onClick={handleCopyLink} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors border-t border-border">
                      <Link2 className="w-4 h-4" /> Copy Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button size="sm" onClick={onReset} className="bg-primary text-primary-foreground hover:bg-primary/90">
              New Goal
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile progress bar */}
      <div className="sm:hidden border-b border-border bg-background/80 px-4 py-2 flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{completedCount}/{totalTasks}</span>
        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{progressPercent}%</span>
      </div>

      {/* Progress tracker */}
      <div className="container max-w-5xl mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif font-bold text-foreground text-lg">Goal Progress</h2>
            <span className="text-sm font-medium text-primary">{progressPercent}% complete</span>
          </div>
          <div className="w-full h-3 rounded-full bg-secondary overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{completedCount}</span> / {totalTasks} tasks completed
          </p>
        </motion.div>
      </div>

      {/* Main content: Daily Focus + Grid */}
      <div className="container max-w-7xl mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Daily Focus Panel */}
          <div className="lg:w-72 lg:shrink-0">
            <DailyFocusPanel
              data={data}
              completedTasks={completedTasks}
              onToggleTask={handleFocusToggle}
            />
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div
                ref={gridRef}
                className="harada-grid rounded-lg overflow-hidden border border-border shadow-lg bg-background p-1"
              >
                {cells.flat().map((cell, i) => {
                  const pillarBg = cell.pillarIndex !== undefined ? pillarColors[cell.pillarIndex] : undefined;
                  const pillarDoneBg = cell.pillarIndex !== undefined ? pillarDoneColors[cell.pillarIndex] : undefined;
                  const pillarBorder = cell.pillarIndex !== undefined ? pillarBorderColors[cell.pillarIndex] : undefined;
                  const isTask = cell.type === "task" && cell.text;
                  const taskKey = cell.pillarIndex !== undefined ? `${cell.pillarIndex}-${cell.text}` : "";
                  const isDone = isTask && completedTasks.has(taskKey);
                  const isHighImpact = isTask && highImpactSet.has(taskKey);
                  const isPillarCelebrating = cell.pillarIndex !== undefined && celebratingPillar === cell.pillarIndex;
                  const isPillarComplete = cell.pillarIndex !== undefined && completedPillarSet.has(cell.pillarIndex);

                  return (
                    <motion.div
                      key={`${i}-${isDone ? "done" : "todo"}-${isPillarComplete ? "pc" : "pi"}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: isPillarCelebrating ? [1, 1.08, 0.96, 1.03, 1] : 1,
                        rotate: isPillarCelebrating ? [0, -2, 2, -1, 0] : 0,
                      }}
                      transition={
                        isPillarCelebrating
                          ? { duration: 0.6, ease: "easeInOut" }
                          : { delay: i * 0.008, duration: 0.3 }
                      }
                      onClick={isTask ? () => toggleTask(i, cell.pillarIndex!, cell.text) : undefined}
                      className={`harada-cell rounded-sm relative group ${
                        cell.type === "center"
                          ? "harada-cell-center"
                          : cell.type === "pillar"
                          ? "font-semibold font-serif"
                          : ""
                      } ${isTask ? "cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all active:scale-95" : ""}`}
                      style={{
                        backgroundColor:
                          cell.type === "center"
                            ? undefined
                            : cell.type === "pillar" && isPillarComplete
                            ? pillarDoneBg
                            : cell.type === "pillar"
                            ? pillarBg
                            : isDone
                            ? pillarDoneBg
                            : cell.type === "task"
                            ? `${pillarBg}80`
                            : emptyBg,
                        borderLeft: cell.type === "pillar" ? `3px solid ${pillarBorder}` : undefined,
                        color: cell.type === "center" ? undefined : textColor,
                        boxShadow: isPillarCelebrating
                          ? `0 0 16px 4px ${pillarBorder}60`
                          : isPillarComplete && cell.type === "pillar"
                          ? `inset 0 0 12px ${pillarBorder}30`
                          : undefined,
                      }}
                    >
                      {/* High Impact star */}
                      {isHighImpact && !isDone && (
                        <Star className="absolute top-0.5 left-0.5 w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                      )}

                      {/* AI Expand button */}
                      {isTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTask({
                              task: cell.text,
                              pillar: data.pillars[cell.pillarIndex!].name,
                            });
                          }}
                          className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-primary/10 hover:bg-primary/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="AI Expand"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-primary" />
                        </button>
                      )}

                      {/* Pillar confetti */}
                      {cell.type === "pillar" && isPillarCelebrating && (
                        <>
                          {["🎉", "✨", "⭐", "🎊", "💫", "🌟"].map((emoji, ei) => (
                            <motion.span
                              key={ei}
                              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                              animate={{
                                opacity: [1, 1, 0],
                                scale: [0.5, 1.2, 0.8],
                                x: Math.cos((ei / 6) * Math.PI * 2) * 35,
                                y: Math.sin((ei / 6) * Math.PI * 2) * 35 - 10,
                              }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="absolute z-20 text-sm pointer-events-none"
                              style={{ top: "50%", left: "50%" }}
                            >
                              {emoji}
                            </motion.span>
                          ))}
                        </>
                      )}
                      {cell.type === "pillar" && isPillarComplete && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15, delay: isPillarCelebrating ? 0.6 : 0 }}
                          className="absolute -top-1.5 -right-1.5 z-10 text-base select-none"
                        >
                          🎉
                        </motion.div>
                      )}
                      {isPillarCelebrating && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.8 }}
                          className="absolute inset-0 rounded-sm"
                          style={{
                            background: `linear-gradient(135deg, transparent 30%, ${pillarBorder}40 50%, transparent 70%)`,
                          }}
                        />
                      )}
                      {isDone && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                        </motion.div>
                      )}
                      <span className={isDone ? "line-through opacity-60" : ""}>{cell.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* All-complete celebration */}
            <AnimatePresence>
              {allComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 text-center p-4 rounded-lg border border-primary/30 bg-primary/5"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-3xl mb-2"
                  >
                    🏆
                  </motion.div>
                  <p className="font-serif font-bold text-foreground">Goal Mastered!</p>
                  <p className="text-sm text-muted-foreground">All 64 tasks complete. Incredible discipline.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              {data.pillars.map((p, i) => {
                const isComplete = completedPillarSet.has(i);
                return (
                  <motion.div
                    key={i}
                    className={`flex items-center gap-1.5 text-xs ${isComplete ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <div
                      className="w-3 h-3 rounded-sm relative"
                      style={{ backgroundColor: pillarColors[i] }}
                    >
                      {isComplete && (
                        <Check className="w-3 h-3 text-primary absolute inset-0" strokeWidth={3} />
                      )}
                    </div>
                    <span className={isComplete ? "line-through" : ""}>{p.name}</span>
                    <span className="text-[10px] font-medium ml-0.5">
                      ({pillarProgress[i]}/8)
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* High Impact legend */}
            {(data.highImpact?.length ?? 0) > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                <span>= High Impact task</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Expand Panel */}
      {expandedTask && (
        <TaskExpandPanel
          task={expandedTask.task}
          pillar={expandedTask.pillar}
          goal={data.goal}
          language={language}
          onClose={() => setExpandedTask(null)}
        />
      )}

      {/* Weekly Reflection */}
      <AnimatePresence>
        {showReflection && (
          <WeeklyReflection
            goal={data.goal}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            language={language}
            pillars={data.pillars}
            onClose={() => setShowReflection(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
