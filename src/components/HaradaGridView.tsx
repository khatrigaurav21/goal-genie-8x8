import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildGridCells, type HaradaGrid, type GridCell } from "@/lib/harada";
import { toPng } from "html-to-image";
import {
  Download, Link2, X as XIcon, Linkedin, ChevronDown, Check, Star, Sparkles,
  Calendar, RefreshCw, Share2, Zap, PiggyBank, Target, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { usePillarColors } from "@/lib/theme-colors";
import DailyFocusPanel from "@/components/DailyFocusPanel";
import TaskExpandPanel from "@/components/TaskExpandPanel";
import WeeklyReflection from "@/components/WeeklyReflection";
import AmbientBlobs from "@/components/AmbientBlobs";
import ProgressRing from "@/components/ProgressRing";
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

interface BlockInfo {
  key: string;
  blockRow: number;
  blockCol: number;
  isCenter: boolean;
  pillarIndex?: number;
  items: { cell: GridCell; row: number; col: number }[];
}

export default function HaradaGridView({
  data, onReset, language = "en",
  plans = [], activePlanIndex = 0, onSwitchPlan, onGenerateAlternative, isGenerating = false,
}: HaradaGridViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [altPlanOpen, setAltPlanOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [celebratingPillar, setCelebratingPillar] = useState<number | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [expandedTask, setExpandedTask] = useState<{ task: string; pillar: string } | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { isDark, pillarColors, pillarDoneColors, pillarBorderColors, textColor } = usePillarColors();

  const cells = useMemo(() => buildGridCells(data), [data]);

  const blocks: BlockInfo[] = useMemo(() => {
    const out: BlockInfo[] = [];
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const items: { cell: GridCell; row: number; col: number }[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = br * 3 + r;
            const col = bc * 3 + c;
            items.push({ cell: cells[row][col], row, col });
          }
        }
        const isCenter = br === 1 && bc === 1;
        const pillarIndex = !isCenter
          ? items.find((it) => it.cell.pillarIndex !== undefined)?.cell.pillarIndex
          : undefined;
        out.push({ key: `${br}-${bc}`, blockRow: br, blockCol: bc, isCenter, pillarIndex, items });
      }
    }
    return out;
  }, [cells]);

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

  const toggleTask = (pillarIndex: number, taskText: string) => {
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
    toggleTask(pillarIndex, taskText);
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
    setMoreOpen(false);
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
    setMoreOpen(false);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    toast.success("Link copied to clipboard!");
    setShareOpen(false);
    setMoreOpen(false);
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
    <div className="min-h-screen bg-background paper-texture relative">
      <AmbientBlobs />

      {/* Header */}
      <header className="border-b border-border bg-background/85 backdrop-blur-md sticky top-0 z-30">
        <div className="container max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Brand */}
            <button onClick={onReset} className="flex items-center gap-1.5 shrink-0 group">
              <span className="font-serif text-lg sm:text-xl font-bold text-foreground tracking-wide">
                原<span className="text-primary">日</span>
              </span>
              <span className="hidden sm:inline text-sm font-sans font-normal text-muted-foreground group-hover:text-foreground transition-colors">
                HaraDaily
              </span>
            </button>

            {/* Progress */}
            <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-[220px]">
              <ProgressRing percent={progressPercent} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">
                  {completedCount}/{totalTasks} tasks
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />

              {/* Desktop icon toolbar */}
              <div className="hidden lg:flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Weekly reflection" onClick={() => setShowReflection(true)}>
                  <Calendar className="w-4 h-4" />
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8" title="Generate alternative plan"
                    onClick={() => setAltPlanOpen(!altPlanOpen)} disabled={isGenerating}
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
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

                <Button variant="ghost" size="icon" className="h-8 w-8" title="Save as PNG" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8" title="Create share link" onClick={handleShareGoalPlan} disabled={isSharing}>
                  <Share2 className={`w-4 h-4 ${isSharing ? "animate-pulse" : ""}`} />
                </Button>

                <div className="relative">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Social share" onClick={() => setShareOpen(!shareOpen)}>
                    <ChevronDown className="w-4 h-4" />
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
              </div>

              {/* Mobile / tablet: single "more" menu */}
              <div className="relative lg:hidden">
                <Button variant="outline" size="icon" className="h-8 w-8" title="More actions" onClick={() => setMoreOpen(!moreOpen)}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
                    >
                      <button onClick={() => { setShowReflection(true); setMoreOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                        <Calendar className="w-4 h-4" /> Weekly reflection
                      </button>
                      <button onClick={handleDownload} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                        <Download className="w-4 h-4" /> Save PNG
                      </button>
                      <button onClick={() => { handleShareGoalPlan(); setMoreOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                        <Share2 className="w-4 h-4" /> Create share link
                      </button>
                      <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground font-medium">Alternative plan</div>
                      {strategies.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => { setMoreOpen(false); onGenerateAlternative?.(s.key); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          <s.icon className="w-4 h-4 text-primary" /> {s.label}
                        </button>
                      ))}
                      <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground font-medium">Share to</div>
                      <button onClick={handleShareX} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                        <XIcon className="w-4 h-4" /> X
                      </button>
                      <button onClick={handleShareLinkedIn} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </button>
                      <button onClick={handleCopyLink} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                        <Link2 className="w-4 h-4" /> Copy link
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
        </div>
      </header>

      {/* Mobile progress bar */}
      <div className="md:hidden border-b border-border bg-background/80 px-4 py-2 flex items-center gap-3 relative z-10">
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

      {/* Progress tracker card */}
      <div className="container max-w-5xl mx-auto px-4 pt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-6 shadow-sm"
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
      <div className="container max-w-7xl mx-auto px-4 pb-10 relative z-10">
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
            <div
              ref={gridRef}
              className="harada-mega-grid rounded-2xl bg-background/40 p-1"
            >
              {blocks.map((block, blockIdx) => {
                const isPillarComplete = block.pillarIndex !== undefined && completedPillarSet.has(block.pillarIndex);
                const isPillarCelebrating = block.pillarIndex !== undefined && celebratingPillar === block.pillarIndex;
                const blockBorderColor = block.pillarIndex !== undefined ? pillarBorderColors[block.pillarIndex] : undefined;
                const blockAccentBg = block.pillarIndex !== undefined
                  ? (isPillarComplete ? pillarDoneColors[block.pillarIndex] : pillarColors[block.pillarIndex])
                  : undefined;
                // Dark mode: keep the block surface neutral and let color live in the
                // border + pillar-label chip only — full saturated fills read muddy on near-black.
                const blockBg = block.isCenter
                  ? undefined
                  : isDark
                  ? "hsl(var(--card))"
                  : blockAccentBg;

                // Directional glow: each block's accent border lives only on the edge(s)
                // facing the center block, so the whole grid visually points inward at the goal.
                const dRow = 1 - block.blockRow; // >0: center is below this block
                const dCol = 1 - block.blockCol; // >0: center is to the right of this block
                const glowTop = dRow < 0;
                const glowBottom = dRow > 0;
                const glowLeft = dCol < 0;
                const glowRight = dCol > 0;
                // The true outer edge of the whole mega-grid (the side facing away from
                // everything, toward the page) gets no border at all — left fully open.
                const outsideTop = block.blockRow === 0;
                const outsideBottom = block.blockRow === 2;
                const outsideLeft = block.blockCol === 0;
                const outsideRight = block.blockCol === 2;
                const faintBorder = `1px solid ${blockBorderColor}${isDark ? "22" : "1c"}`;
                const glowBorder = `2px solid ${blockBorderColor}`;
                const noBorder = "1.5px solid transparent";
                const directionalShadowParts: string[] = [];
                if (glowTop) directionalShadowParts.push(`0 -7px 18px -5px ${blockBorderColor}a0`);
                if (glowBottom) directionalShadowParts.push(`0 7px 18px -5px ${blockBorderColor}a0`);
                if (glowLeft) directionalShadowParts.push(`-7px 0 18px -5px ${blockBorderColor}a0`);
                if (glowRight) directionalShadowParts.push(`7px 0 18px -5px ${blockBorderColor}a0`);
                const directionalShadow = directionalShadowParts.join(", ");

                return (
                  <motion.div
                    key={block.key}
                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                    animate={{
                      opacity: 1, y: 0,
                      scale: isPillarCelebrating ? [1, 1.03, 0.99, 1.01, 1] : 1,
                    }}
                    transition={
                      isPillarCelebrating
                        ? { duration: 0.6, ease: "easeInOut" }
                        : { delay: blockIdx * 0.07, duration: 0.45, ease: "easeOut" }
                    }
                    whileHover={!block.isCenter ? { y: -3 } : undefined}
                    className={`harada-block relative rounded-2xl p-1.5 sm:p-2 overflow-hidden ${block.isCenter ? "harada-block-center" : ""}`}
                    style={
                      block.isCenter
                        ? {
                            border: "1.5px solid hsl(var(--primary) / 0.35)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }
                        : {
                            backgroundColor: blockBg,
                            borderTop: glowTop ? glowBorder : outsideTop ? noBorder : faintBorder,
                            borderBottom: glowBottom ? glowBorder : outsideBottom ? noBorder : faintBorder,
                            borderLeft: glowLeft ? glowBorder : outsideLeft ? noBorder : faintBorder,
                            borderRight: glowRight ? glowBorder : outsideRight ? noBorder : faintBorder,
                            boxShadow: isPillarCelebrating
                              ? `0 0 24px 6px ${blockBorderColor}50, ${directionalShadow}`
                              : isPillarComplete
                              ? `0 2px 14px ${blockBorderColor}30, ${directionalShadow}`
                              : `${directionalShadow}, 0 1px 3px rgba(0,0,0,0.05)`,
                          }
                    }
                  >
                    {isPillarComplete && !block.isCenter && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: isPillarCelebrating ? 0.6 : 0 }}
                        className="absolute -top-2 -right-2 z-10 text-lg select-none"
                      >
                        🎉
                      </motion.div>
                    )}

                    {isPillarCelebrating && (
                      <>
                        {["🎉", "✨", "⭐", "🎊", "💫", "🌟"].map((emoji, ei) => (
                          <motion.span
                            key={ei}
                            initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                            animate={{
                              opacity: [1, 1, 0],
                              scale: [0.5, 1.2, 0.8],
                              x: Math.cos((ei / 6) * Math.PI * 2) * 50,
                              y: Math.sin((ei / 6) * Math.PI * 2) * 50 - 10,
                            }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="absolute z-20 text-base pointer-events-none"
                            style={{ top: "50%", left: "50%" }}
                          >
                            {emoji}
                          </motion.span>
                        ))}
                      </>
                    )}

                    <div className="grid grid-cols-3 gap-1 w-full">
                      {block.items.map(({ cell, row, col }, ci) => {
                        const isTask = cell.type === "task" && cell.text;
                        const isCenterGoal = cell.type === "center";
                        const isPillarLabel = cell.type === "pillar";
                        const taskKey = cell.pillarIndex !== undefined ? `${cell.pillarIndex}-${cell.text}` : "";
                        const isDone = isTask && completedTasks.has(taskKey);
                        const isHighImpact = isTask && highImpactSet.has(taskKey);
                        const cellPillarBorder = cell.pillarIndex !== undefined ? pillarBorderColors[cell.pillarIndex] : undefined;
                        const cellDoneBg = cell.pillarIndex !== undefined ? pillarDoneColors[cell.pillarIndex] : undefined;

                        // In the center block, each pillar-label chip gets a gold border, but the
                        // side facing outward (toward that pillar's real block) is left empty —
                        // same "outside stays open" rule used on the 8 blocks themselves.
                        const isHubLabel = isPillarLabel && block.isCenter;
                        const hubDr = row - 4;
                        const hubDc = col - 4;
                        const hubGold = "1.5px solid hsl(var(--gold) / 0.65)";
                        const hubEmpty = "1.5px solid transparent";

                        return (
                          <div
                            key={ci}
                            onClick={isTask ? () => toggleTask(cell.pillarIndex!, cell.text) : undefined}
                            title={isCenterGoal ? cell.text : undefined}
                            className={`harada-cell rounded-lg relative group p-1 sm:p-1.5 text-[9px] sm:text-[10.5px] ${
                              isCenterGoal
                                ? "font-bold font-serif text-[8.5px] sm:text-[10px] line-clamp-5 bg-primary text-primary-foreground shadow-inner"
                                : isPillarLabel
                                ? "font-semibold font-serif"
                                : "line-clamp-3"
                            } ${isTask ? "cursor-pointer hover:ring-2 hover:ring-primary/40 active:scale-95" : ""}`}
                            style={{
                              backgroundColor: isCenterGoal
                                ? undefined
                                : isPillarLabel
                                ? blockAccentBg
                                : isDone
                                ? (isDark ? `${cellDoneBg}` : cellDoneBg)
                                : isDark
                                ? "hsl(var(--secondary) / 0.5)"
                                : "hsl(var(--card) / 0.65)",
                              borderTop: isHubLabel ? (hubDr < 0 ? hubEmpty : hubGold) : !isHubLabel && isPillarLabel && glowTop ? `3px solid ${cellPillarBorder}` : undefined,
                              borderBottom: isHubLabel ? (hubDr > 0 ? hubEmpty : hubGold) : !isHubLabel && isPillarLabel && glowBottom ? `3px solid ${cellPillarBorder}` : undefined,
                              borderLeft: isHubLabel ? (hubDc < 0 ? hubEmpty : hubGold) : !isHubLabel && isPillarLabel && glowLeft ? `3px solid ${cellPillarBorder}` : undefined,
                              borderRight: isHubLabel ? (hubDc > 0 ? hubEmpty : hubGold) : !isHubLabel && isPillarLabel && glowRight ? `3px solid ${cellPillarBorder}` : undefined,
                              color: isCenterGoal ? undefined : isPillarLabel ? (isDark ? "hsl(40 20% 92%)" : textColor) : textColor,
                            }}
                          >
                            {isHighImpact && !isDone && (
                              <Star className="absolute top-0.5 left-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                            )}

                            {isTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTask({
                                    task: cell.text,
                                    pillar: data.pillars[cell.pillarIndex!].name,
                                  });
                                }}
                                className="absolute bottom-0.5 right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/10 hover:bg-primary/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="AI Expand"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-primary" />
                              </button>
                            )}

                            {isDone && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-primary flex items-center justify-center"
                              >
                                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-primary-foreground" strokeWidth={3} />
                              </motion.div>
                            )}

                            <span className={isDone ? "line-through opacity-60" : ""}>{cell.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>

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
