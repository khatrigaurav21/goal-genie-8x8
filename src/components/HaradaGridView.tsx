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

export default function HaradaGridView({
  data, onReset, language = "en",
  plans = [], activePlanIndex = 0, onSwitchPlan, onGenerateAlternative, isGenerating = false,
}: HaradaGridViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [altPlanOpen, setAltPlanOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [celebratingPillar, setCelebratingPillar] = useState<number | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [expandedTask, setExpandedTask] = useState<{ task: string; pillar: string } | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [focusedPillar, setFocusedPillar] = useState<number | null>(null);
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

  const handleShareGoalPlan = async () => {
    setIsSharing(true);
    try {
      const { data: result, error } = await supabase.from("shared_plans").insert({
        goal: data.goal,
        pillars: data.pillars as any,
        high_impact: (data.highImpact || []) as any,
        completed_tasks: Array.from(completedTasks) as any,
        language,
        strategy: plans[activePlanIndex]?.strategy || "balanced",
      }).select("id").single();

      if (error) throw error;
      const shareLink = `${window.location.origin}/plan/${result.id}`;
      await navigator.clipboard.writeText(shareLink);
      toast.success("Share link copied to clipboard!");
    } catch (e: any) {
      console.error("Share error:", e);
      toast.error("Failed to create share link");
    } finally {
      setIsSharing(false);
    }
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

  const strategies = [
    { key: "fast", label: "Fast Execution", icon: Zap, desc: "Quick wins & rapid iteration" },
    { key: "low-budget", label: "Low Budget", icon: PiggyBank, desc: "Free tools & bootstrapping" },
    { key: "long-term", label: "Long-Term Strategic", icon: Target, desc: "Sustainable growth & foundations" },
  ];

  const strategyLabels: Record<string, string> = {
    balanced: "Balanced", fast: "Fast Execution", "low-budget": "Low Budget", "long-term": "Long-Term Strategic",
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
          <div className="flex gap-2 items-center flex-wrap">
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
            {/* Alternative Plan */}
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setAltPlanOpen(!altPlanOpen)} disabled={isGenerating}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Generating..." : "Alt Plan"}
              </Button>
              <AnimatePresence>
                {altPlanOpen && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
                  >
                    {strategies.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => { setAltPlanOpen(false); onGenerateAlternative?.(s.key); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <s.icon className="w-4 h-4 text-primary" />
                        <div className="text-left">
                          <div className="font-medium">{s.label}</div>
                          <div className="text-xs text-muted-foreground">{s.desc}</div>
                        </div>
                      </button>
                    ))}
                    {plans.length > 1 && (
                      <>
                        <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground font-medium">Switch Plan</div>
                        {plans.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => { setAltPlanOpen(false); onSwitchPlan?.(i); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                              i === activePlanIndex ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"
                            }`}
                          >
                            <Check className={`w-3 h-3 ${i === activePlanIndex ? "opacity-100" : "opacity-0"}`} />
                            {strategyLabels[p.strategy] || "Balanced"} Plan
                          </button>
                        ))}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Save PNG
            </Button>
            {/* Share Goal Plan */}
            <Button variant="outline" size="sm" onClick={handleShareGoalPlan} disabled={isSharing}>
              <Share2 className="w-4 h-4 mr-1" /> {isSharing ? "Sharing..." : "Share Plan"}
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(!shareOpen)}>
                <ChevronDown className="w-4 h-4 mr-1" /> Social
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

      {/* Goal Card */}
      <div className="container max-w-5xl mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Your Goal</p>
              <h2 className="font-serif font-bold text-foreground text-xl sm:text-2xl leading-tight mb-2">{data.goal}</h2>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-xs h-2.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">{completedCount}/{totalTasks}</span>
                <span className="text-sm text-primary font-medium">{progressPercent}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pillar Navigation Bar */}
      <div className="container max-w-5xl mx-auto px-4 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFocusedPillar(null)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              focusedPillar === null
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            All Pillars
          </button>
          {data.pillars.map((p, i) => {
            const isComplete = completedPillarSet.has(i);
            return (
              <button
                key={i}
                onClick={() => setFocusedPillar(focusedPillar === i ? null : i)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  focusedPillar === i
                    ? "shadow-sm text-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
                style={focusedPillar === i ? { backgroundColor: pillarColors[i], borderColor: pillarBorderColors[i] } : {}}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pillarColors[i] }} />
                <span className="truncate max-w-[100px]">{p.name}</span>
                <span className={`text-[10px] ${isComplete ? "text-primary" : ""}`}>
                  {pillarProgress[i]}/8
                </span>
                {isComplete && <Check className="w-3 h-3 text-primary shrink-0" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content: Daily Focus + Pillar Cards */}
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

          {/* Pillar Cards Grid */}
          <div className="flex-1 min-w-0">
            {/* Hidden 9x9 grid for PNG export */}
            <div ref={gridRef} className="harada-grid rounded-lg overflow-hidden border border-border bg-background p-1 absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden>
              {cells.flat().map((cell, i) => {
                const pillarBg = cell.pillarIndex !== undefined ? pillarColors[cell.pillarIndex] : undefined;
                const pillarDoneBg = cell.pillarIndex !== undefined ? pillarDoneColors[cell.pillarIndex] : undefined;
                const pillarBorder = cell.pillarIndex !== undefined ? pillarBorderColors[cell.pillarIndex] : undefined;
                const isTask = cell.type === "task" && cell.text;
                const taskKey = cell.pillarIndex !== undefined ? `${cell.pillarIndex}-${cell.text}` : "";
                const isDone = isTask && completedTasks.has(taskKey);
                return (
                  <div
                    key={i}
                    className={`harada-cell rounded-sm ${
                      cell.type === "center" ? "harada-cell-center" : cell.type === "pillar" ? "font-semibold font-serif" : ""
                    }`}
                    style={{
                      backgroundColor: cell.type === "center" ? undefined : cell.type === "pillar" ? pillarBg : isDone ? pillarDoneBg : cell.type === "task" ? `${pillarBg}80` : emptyBg,
                      borderLeft: cell.type === "pillar" ? `3px solid ${pillarBorder}` : undefined,
                      color: cell.type === "center" ? undefined : textColor,
                    }}
                  >
                    <span className={isDone ? "line-through opacity-60" : ""}>{cell.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Visible Pillar Cards */}
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {data.pillars.map((pillar, i) => {
                  if (focusedPillar !== null && focusedPillar !== i) return null;
                  const isComplete = completedPillarSet.has(i);
                  const isCelebrating = celebratingPillar === i;
                  const pillarPercent = Math.round((pillarProgress[i] / 8) * 100);

                  return (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        scale: isCelebrating ? [1, 1.02, 0.98, 1] : 1,
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`rounded-xl border overflow-hidden transition-shadow ${
                        isComplete ? "shadow-md" : "shadow-sm"
                      } ${focusedPillar === i ? "md:col-span-2" : ""}`}
                      style={{
                        borderColor: pillarBorderColors[i],
                        boxShadow: isCelebrating ? `0 0 20px 4px ${pillarBorderColors[i]}40` : undefined,
                      }}
                    >
                      {/* Pillar header */}
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer"
                        style={{ backgroundColor: pillarColors[i] }}
                        onClick={() => setFocusedPillar(focusedPillar === i ? null : i)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: pillarBorderColors[i], color: "#fff" }}>
                            {i + 1}
                          </div>
                          <h3 className="font-serif font-bold text-sm truncate" style={{ color: textColor }}>
                            {pillar.name}
                          </h3>
                          {isComplete && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-base select-none shrink-0"
                            >
                              🎉
                            </motion.span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium" style={{ color: textColor }}>
                            {pillarProgress[i]}/8
                          </span>
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${pillarBorderColors[i]}30` }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: pillarBorderColors[i] }}
                              animate={{ width: `${pillarPercent}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tasks list */}
                      <div className="bg-card divide-y divide-border">
                        {pillar.tasks.map((task, ti) => {
                          const taskKey = `${i}-${task}`;
                          const isDone = completedTasks.has(taskKey);
                          const isHighImpact = highImpactSet.has(taskKey);

                          return (
                            <motion.div
                              key={ti}
                              className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                isDone ? "bg-muted/40" : "hover:bg-muted/30"
                              }`}
                              onClick={() => toggleTask(0, i, task)}
                              whileTap={{ scale: 0.98 }}
                            >
                              {/* Checkbox */}
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isDone ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"
                                }`}
                              >
                                {isDone && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                              </div>

                              {/* Task text */}
                              <span className={`flex-1 text-sm leading-snug ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {task}
                              </span>

                              {/* Badges */}
                              <div className="flex items-center gap-1 shrink-0">
                                {isHighImpact && !isDone && (
                                  <Star className="w-3.5 h-3.5 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedTask({ task, pillar: pillar.name });
                                  }}
                                  className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="AI Expand"
                                >
                                  <Sparkles className="w-3 h-3 text-primary" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Pillar celebration confetti */}
                      {isCelebrating && (
                        <div className="relative h-0">
                          {["🎉", "✨", "⭐", "🎊", "💫", "🌟"].map((emoji, ei) => (
                            <motion.span
                              key={ei}
                              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                              animate={{
                                opacity: [1, 1, 0],
                                scale: [0.5, 1.2, 0.8],
                                x: Math.cos((ei / 6) * Math.PI * 2) * 50,
                                y: Math.sin((ei / 6) * Math.PI * 2) * 30 - 20,
                              }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="absolute z-20 text-lg pointer-events-none"
                              style={{ top: "-20px", left: "50%" }}
                            >
                              {emoji}
                            </motion.span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* All-complete celebration */}
            <AnimatePresence>
              {allComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 text-center p-6 rounded-xl border border-primary/30 bg-primary/5"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl mb-3"
                  >
                    🏆
                  </motion.div>
                  <p className="font-serif font-bold text-foreground text-lg">Goal Mastered!</p>
                  <p className="text-sm text-muted-foreground">All 64 tasks complete. Incredible discipline.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* High Impact legend */}
            {(data.highImpact?.length ?? 0) > 0 && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
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
