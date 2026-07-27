import { useRef, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { buildGridCells, type HaradaGrid, type GridCell } from "@/lib/harada";
import { toPng } from "html-to-image";
import {
  Download, Link2, X as XIcon, Linkedin, ChevronDown, Check, Star, Sparkles,
  Calendar, RefreshCw, Share2, Zap, PiggyBank, Target, MoreHorizontal, Maximize2, Minimize2, Gauge,
  MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { usePillarColors, withAlpha } from "@/lib/theme-colors";
import { getPillarIcon } from "@/lib/pillar-icons";
import { pinnedTodaysFocusKeys } from "@/lib/focus-tasks";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import DailyFocusPanel from "@/components/DailyFocusPanel";
import DailyRituals from "@/components/DailyRituals";
import TaskExpandPanel from "@/components/TaskExpandPanel";
import WeeklyReflection from "@/components/WeeklyReflection";
import AmbientBlobs from "@/components/AmbientBlobs";
import ProgressRing from "@/components/ProgressRing";
import ExpandPrompt from "@/components/ExpandPrompt";
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
  const [expanded, setExpanded] = useState(false);
  const [focusedPillar, setFocusedPillar] = useState<number | null>(null);
  const [hasSpotlit, setHasSpotlit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const { isDark, pillarColors, pillarDoneColors, pillarBorderColors, textColor } = usePillarColors();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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

  // "Daily Discipline": completion rate against a stable set of top-priority tasks
  // (same priority order Today's Focus draws from), so the metric has a fixed
  // denominator instead of shrinking as the rotating focus list backfills.
  const todaysFocusKeys = useMemo(() => pinnedTodaysFocusKeys(data), [data]);
  const dailyDisciplinePercent = todaysFocusKeys.length
    ? Math.round(
        (todaysFocusKeys.filter((k) => completedTasks.has(k)).length / todaysFocusKeys.length) * 100
      )
    : 0;

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

  // The whole plan lives only in component state (no persistence), so resetting
  // is destructive and irreversible. Skip the confirmation when there's nothing
  // to lose, but require it once real progress exists.
  const requestReset = () => {
    if (completedCount > 0) {
      setConfirmResetOpen(true);
    } else {
      onReset();
    }
  };

  const handleToggleFullscreen = () => {
    if (!gridRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      gridRef.current.requestFullscreen().catch(() => {
        toast.error("Fullscreen isn't available in this browser");
      });
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
            <button onClick={requestReset} className="flex items-center gap-2 shrink-0 group">
              <span className="font-serif text-lg sm:text-xl font-semibold text-foreground tracking-wide">
                原<span className="text-primary">日</span>
              </span>
              <span className="hidden sm:inline text-xs font-sans font-medium tracking-[0.16em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
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
              {/* Compact glanceable progress for mobile, where the full ring+bar above is hidden.
                  Sticky (lives in the header), so it doesn't need to duplicate as its own bar below. */}
              <span className="md:hidden text-xs font-semibold text-foreground tabular-nums" aria-label={`${progressPercent}% complete`}>
                {progressPercent}%
              </span>
              <ThemeToggle />

              {/* Desktop icon toolbar */}
              <div className="hidden lg:flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Weekly reflection" aria-label="Weekly reflection" onClick={() => setShowReflection(true)}>
                  <Calendar className="w-4 h-4" />
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8" title="Generate alternative plan"
                    aria-label="Generate alternative plan"
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

                <Button variant="ghost" size="icon" className="h-8 w-8" title="Save as PNG" aria-label="Save as PNG" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8" title="Create share link" aria-label="Create share link" onClick={handleShareGoalPlan} disabled={isSharing}>
                  <Share2 className={`w-4 h-4 ${isSharing ? "animate-pulse" : ""}`} />
                </Button>

                <div className="relative">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Social share" aria-label="Social share" onClick={() => setShareOpen(!shareOpen)}>
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
                <Button variant="outline" size="icon" className="h-8 w-8" title="More actions" aria-label="More actions" onClick={() => setMoreOpen(!moreOpen)}>
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

              <Button size="sm" onClick={requestReset} className="bg-primary text-primary-foreground hover:bg-primary/90">
                New Goal
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Today: Goal Progress, Today's Focus, and Daily Rituals as three peer cards,
          top-aligned and stretched to a shared height so the row reads as one
          composed unit rather than three separately-sized widgets. */}
      <div className="container max-w-7xl mx-auto px-4 pt-8 pb-10 relative z-10">
        <p className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
          Today
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="order-1 lg:order-1 md:col-span-2 lg:col-span-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl p-5 shadow-sm h-full flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="font-serif font-medium tracking-tight text-foreground">Goal Progress</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <ProgressRing percent={progressPercent} size={128} ticks label="complete" />
              <p className="text-sm text-muted-foreground mt-3">
                <span className="font-semibold text-foreground">{completedCount}</span> of {totalTasks} tasks complete
              </p>

              <div className="w-full max-w-[260px] mt-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                    Daily Discipline
                  </span>
                  <span className="text-[11px] font-semibold text-foreground">{dailyDisciplinePercent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyDisciplinePercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            <div
              className="w-full grid grid-cols-4 sm:grid-cols-8 gap-2 items-end mt-6"
              style={{ height: 56 }}
            >
              {data.pillars.map((p, i) => {
                const done = pillarProgress[i] ?? 0;
                const isComplete = completedPillarSet.has(i);
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full gap-1 group" title={`${p.name}: ${done}/8`}>
                    <div className="w-full flex-1 flex flex-col-reverse gap-[1.5px]">
                      {Array.from({ length: 8 }).map((_, segIdx) => {
                        const filled = segIdx < done;
                        return (
                          <motion.div
                            key={segIdx}
                            className="w-full flex-1 rounded-[1.5px] origin-bottom"
                            style={{
                              // Filled segments use the saturated border-tier color, not the pale
                              // wash tier (pillarColors) — that tier is tuned for large-area block
                              // backgrounds and reads as nearly invisible at this size against the
                              // secondary track, especially in dark mode. (Previously this also
                              // appended a hex alpha suffix like `d9`/`c0` directly onto an
                              // `hsl(...)` string to distinguish in-progress from complete — that's
                              // invalid CSS, so the browser silently dropped the whole declaration
                              // for every in-progress segment, i.e. almost always. The in-progress
                              // vs. complete distinction now lives entirely in the opacity/scale
                              // animation below instead, so the color itself stays valid CSS.)
                              backgroundColor: filled ? pillarBorderColors[i] : "hsl(var(--secondary) / 0.6)",
                            }}
                            animate={{
                              scaleY: filled ? 1 : 0.85,
                              opacity: filled ? (isComplete ? 1 : 0.85) : 0.7,
                            }}
                            transition={{ duration: 0.25, delay: filled ? segIdx * 0.025 : 0, ease: "easeOut" }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium leading-none">{done}/8</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="order-3 lg:order-2 md:col-span-1 lg:col-span-5 h-full">
            <DailyFocusPanel
              data={data}
              completedTasks={completedTasks}
              onToggleTask={handleFocusToggle}
              locked={!expanded}
            />
          </div>

          <div className="order-4 lg:order-3 md:col-span-1 lg:col-span-3 h-full">
            <DailyRituals />
          </div>

          {/* Action: the 8x8 working grid. Ordered right after Goal Progress on mobile/tablet
              so the core interaction surface isn't buried under both info cards; on desktop it
              drops back into its own full-width row below the hero cards. */}
          <div className="order-2 lg:order-4 md:col-span-2 lg:col-span-12 mt-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
            Action
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "View grid fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "View grid fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title="Save grid as image"
              aria-label="Save grid as image"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
            <ExpandPrompt visible={!expanded} />

            <AnimatePresence>
              {expanded && !hasSpotlit && focusedPillar === null && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                >
                  <motion.span
                    animate={!prefersReducedMotion ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 shrink-0"
                  >
                    <MousePointerClick className="w-3 h-3 text-primary" aria-hidden="true" />
                  </motion.span>
                  <span className="text-xs font-medium text-foreground/80">
                    Click a category name to <span className="text-primary font-semibold">spotlight</span> it and dim the rest
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {expanded && focusedPillar !== null && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  onClick={() => setFocusedPillar(null)}
                  className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={{
                    borderColor: withAlpha(pillarBorderColors[focusedPillar], 0.5),
                    color: pillarBorderColors[focusedPillar],
                    backgroundColor: pillarColors[focusedPillar],
                  }}
                  aria-label={`Exit spotlight on ${data.pillars[focusedPillar].name}`}
                >
                  Spotlighting {data.pillars[focusedPillar].name}
                  <XIcon className="w-3 h-3" aria-hidden="true" />
                </motion.button>
              )}
            </AnimatePresence>

            <div
              ref={gridRef}
              className="harada-mega-grid rounded-xl bg-background/40 p-1"
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
                // Uses the dedicated --grid-surface token (not --card) since it needs a real
                // lightness gap from --background on its own — dark blocks get no colored fill
                // to help separate them, unlike light mode's pale pillar washes.
                const blockBg = block.isCenter
                  ? undefined
                  : isDark
                  ? "hsl(var(--grid-surface))"
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
                // blockBorderColor is an hsl(H, S%, L%) functional string, not a hex literal —
                // use withAlpha() rather than concatenating a hex suffix onto it (that's invalid
                // CSS and gets silently dropped, which is why these directional borders/glows
                // weren't actually rendering).
                const faintBorderColor = withAlpha(blockBorderColor ?? "hsl(0 0% 50%)", isDark ? 0.26 : 0.11);
                const faintBorder = `1px solid ${faintBorderColor}`;
                const glowBorder = `1.5px solid ${withAlpha(blockBorderColor ?? "hsl(0 0% 50%)", 0.85)}`;
                const noBorder = "1.5px solid transparent";
                const shadowColor = withAlpha(blockBorderColor ?? "hsl(0 0% 50%)", 0.44);
                const directionalShadowParts: string[] = [];
                if (glowTop) directionalShadowParts.push(`0 -6px 16px -7px ${shadowColor}`);
                if (glowBottom) directionalShadowParts.push(`0 6px 16px -7px ${shadowColor}`);
                if (glowLeft) directionalShadowParts.push(`-6px 0 16px -7px ${shadowColor}`);
                if (glowRight) directionalShadowParts.push(`6px 0 16px -7px ${shadowColor}`);
                const directionalShadow = directionalShadowParts.join(", ");

                // Focus mode: clicking a block's category label spotlights that block and
                // dims/blurs its neighbors so the user can work one category at a time.
                const isFocused = expanded && focusedPillar !== null && block.pillarIndex === focusedPillar;
                const isDimmedByFocus = expanded && focusedPillar !== null && !block.isCenter && block.pillarIndex !== focusedPillar;

                return (
                  <motion.div
                    key={block.key}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16, scale: prefersReducedMotion ? 1 : 0.95 }}
                    animate={{
                      opacity: isDimmedByFocus ? 0.32 : 1,
                      y: 0,
                      scale: prefersReducedMotion
                        ? 1
                        : isPillarCelebrating
                        ? [1, 1.03, 0.99, 1.01, 1]
                        : isFocused
                        ? 1.035
                        : isDimmedByFocus
                        ? 0.97
                        : 1,
                      filter: !prefersReducedMotion && isDimmedByFocus ? "blur(1.5px) saturate(0.7)" : "blur(0px) saturate(1)",
                    }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.15 }
                        : isPillarCelebrating
                        ? { duration: 0.6, ease: "easeInOut" }
                        : { delay: blockIdx * 0.07, duration: 0.45, ease: "easeOut" }
                    }
                    whileHover={!block.isCenter && !isDimmedByFocus ? { y: -3 } : undefined}
                    className={`harada-block relative rounded-xl p-1.5 sm:p-2 ${
                      block.isCenter ? "harada-block-center overflow-hidden" : "overflow-visible"
                    }`}
                    style={{
                      ...(block.isCenter
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
                            boxShadow: isFocused
                              ? `0 12px 32px -8px ${withAlpha(blockBorderColor ?? "hsl(0 0% 50%)", 0.44)}, ${directionalShadow}`
                              : isPillarCelebrating
                              ? `0 0 24px 6px ${withAlpha(blockBorderColor ?? "hsl(0 0% 50%)", 0.31)}, ${directionalShadow}`
                              : isPillarComplete
                              ? `0 2px 14px ${withAlpha(blockBorderColor ?? "hsl(0 0% 50%)", 0.19)}, ${directionalShadow}`
                              : `${directionalShadow}, 0 1px 3px rgba(0,0,0,0.05)`,
                          }),
                      zIndex: isFocused ? 5 : undefined,
                      pointerEvents: isDimmedByFocus ? "none" : undefined,
                    }}
                    aria-hidden={isDimmedByFocus ? true : undefined}
                  >
                    {!block.isCenter && (
                      <GlowingEffect
                        disabled={isDimmedByFocus || Boolean(prefersReducedMotion)}
                        glow
                        proximity={40}
                        spread={28}
                        inactiveZone={0.3}
                        borderWidth={2}
                        movementDuration={1.2}
                      />
                    )}

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

                    {isPillarCelebrating && !prefersReducedMotion && (
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

                        // Pillar-name labels: the center hub ring always shows all 8 names
                        // permanently. Once expanded, each outer block grows its own copy
                        // of its label, flying in from the direction of the center block.
                        if (isPillarLabel) {
                          const isHubLabel = block.isCenter;
                          const hubDr = row - 4;
                          const hubDc = col - 4;
                          const hubGold = "1.5px solid hsl(var(--gold) / 0.65)";
                          const hubEmpty = "1.5px solid transparent";
                          const PillarIcon = cell.pillarIndex !== undefined ? getPillarIcon(cell.text, cell.pillarIndex) : Target;

                          if (isHubLabel) {
                            return (
                              <button
                                key={ci}
                                type="button"
                                onClick={() => {
                                  if (cell.pillarIndex === undefined) return;
                                  if (!expanded) setExpanded(true);
                                  setFocusedPillar(cell.pillarIndex);
                                  setHasSpotlit(true);
                                }}
                                className="harada-cell rounded-lg relative font-semibold font-serif p-1 sm:p-1.5 text-[9px] sm:text-[10.5px] flex-col gap-0.5 cursor-pointer hover:brightness-95 transition-[filter]"
                                style={{
                                  backgroundColor: blockAccentBg,
                                  borderTop: hubDr < 0 ? hubEmpty : hubGold,
                                  borderBottom: hubDr > 0 ? hubEmpty : hubGold,
                                  borderLeft: hubDc < 0 ? hubEmpty : hubGold,
                                  borderRight: hubDc > 0 ? hubEmpty : hubGold,
                                  color: isDark ? "hsl(40 20% 92%)" : textColor,
                                }}
                                title={`Spotlight ${cell.text}`}
                                aria-label={`Spotlight ${cell.text}`}
                              >
                                <PillarIcon
                                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-80"
                                  style={{ color: cellPillarBorder }}
                                  aria-hidden="true"
                                />
                                <span>{cell.text}</span>
                              </button>
                            );
                          }

                          if (!expanded) {
                            return (
                              <div
                                key={ci}
                                className="harada-cell rounded-lg"
                                style={{ backgroundColor: isDark ? "hsl(var(--secondary) / 0.2)" : "hsl(var(--card) / 0.25)" }}
                              />
                            );
                          }

                          return (
                            <motion.button
                              key={ci}
                              type="button"
                              tabIndex={isDimmedByFocus ? -1 : undefined}
                              onClick={() => {
                                if (cell.pillarIndex === undefined) return;
                                setFocusedPillar((prev) => (prev === cell.pillarIndex ? null : cell.pillarIndex!));
                                setHasSpotlit(true);
                              }}
                              initial={{ opacity: 0, x: dCol * 90, y: dRow * 90, scale: 0.4 }}
                              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                              transition={{ type: "spring", stiffness: 130, damping: 16, delay: 0.15 }}
                              className="harada-cell rounded-lg relative font-semibold font-serif p-1 sm:p-1.5 text-[9px] sm:text-[10.5px] flex-col gap-0.5 cursor-pointer hover:brightness-95 transition-[filter]"
                              style={{
                                backgroundColor: blockAccentBg,
                                borderTop: glowTop ? `3px solid ${cellPillarBorder}` : undefined,
                                borderBottom: glowBottom ? `3px solid ${cellPillarBorder}` : undefined,
                                borderLeft: glowLeft ? `3px solid ${cellPillarBorder}` : undefined,
                                borderRight: glowRight ? `3px solid ${cellPillarBorder}` : undefined,
                                color: isDark ? "hsl(40 20% 92%)" : textColor,
                              }}
                              title={isFocused ? "Show all categories" : `Spotlight ${cell.text}`}
                              aria-label={isFocused ? "Show all categories" : `Spotlight ${cell.text}`}
                            >
                              <PillarIcon
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-80"
                                style={{ color: cellPillarBorder }}
                                aria-hidden="true"
                              />
                              <span>{cell.text}</span>
                            </motion.button>
                          );
                        }

                        return (
                          <motion.div
                            key={ci}
                            onClick={
                              isTask && expanded
                                ? () => toggleTask(cell.pillarIndex!, cell.text)
                                : isCenterGoal && !expanded
                                ? () => setExpanded(true)
                                : undefined
                            }
                            title={isCenterGoal ? cell.text : undefined}
                            animate={
                              isTask
                                ? { opacity: expanded ? 1 : 0, scale: expanded ? 1 : 0.85 }
                                : isCenterGoal && !expanded
                                ? {
                                    boxShadow: [
                                      "inset 0 2px 4px 0 rgba(0,0,0,0.06), 0 0 0 0 hsl(var(--primary) / 0)",
                                      "inset 0 2px 4px 0 rgba(0,0,0,0.06), 0 0 0 6px hsl(var(--primary) / 0.18)",
                                      "inset 0 2px 4px 0 rgba(0,0,0,0.06), 0 0 0 0 hsl(var(--primary) / 0)",
                                    ],
                                  }
                                : undefined
                            }
                            transition={
                              isTask
                                ? { delay: expanded ? 0.5 + ci * 0.03 : 0, duration: 0.35, ease: "easeOut" }
                                : isCenterGoal && !expanded
                                ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                                : undefined
                            }
                            whileHover={isCenterGoal && !expanded ? { scale: 1.05 } : undefined}
                            className={`harada-cell rounded-lg relative group p-1 sm:p-1.5 text-[9px] sm:text-[10.5px] ${
                              isCenterGoal
                                ? `font-bold font-serif text-[8.5px] sm:text-[10px] line-clamp-5 bg-primary text-primary-foreground shadow-inner ${!expanded ? "cursor-pointer" : ""}`
                                : "line-clamp-3"
                            } ${isTask && expanded ? "cursor-pointer hover:ring-2 hover:ring-primary/40 active:scale-95" : ""} ${
                              isTask && !expanded ? "pointer-events-none" : ""
                            }`}
                            style={{
                              backgroundColor: isCenterGoal
                                ? undefined
                                : isDone
                                ? (isDark ? `${cellDoneBg}` : cellDoneBg)
                                : isDark
                                ? "hsl(var(--secondary) / 0.5)"
                                : "hsl(var(--card) / 0.65)",
                              color: isCenterGoal ? undefined : textColor,
                            }}
                          >
                            {isHighImpact && !isDone && expanded && (
                              <Star className="absolute top-0.5 left-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                            )}

                            {isTask && expanded && (
                              <button
                                tabIndex={isDimmedByFocus ? -1 : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTask({
                                    task: cell.text,
                                    pillar: data.pillars[cell.pillarIndex!].name,
                                  });
                                }}
                                className="absolute bottom-0.5 right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/10 hover:bg-primary/30 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity"
                                title="AI insight"
                                aria-label={`AI insight for ${cell.text}`}
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

                            {isCenterGoal ? (
                              <span className="flex flex-col items-center">
                                <span>{cell.text}</span>
                                <span
                                  aria-hidden="true"
                                  className="mt-1 sm:mt-1.5 h-px w-8 sm:w-10"
                                  style={{
                                    background: "linear-gradient(90deg, transparent, hsl(var(--primary-foreground) / 0.55), transparent)",
                                  }}
                                />
                              </span>
                            ) : (
                              <span className={isDone ? "line-through opacity-60" : ""}>{!isTask || expanded ? cell.text : ""}</span>
                            )}
                          </motion.div>
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

            {/* Legend — also doubles as a Focus Mode entry point, same icon language as the grid */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {data.pillars.map((p, i) => {
                const isComplete = completedPillarSet.has(i);
                const LegendIcon = getPillarIcon(p.name, i);
                const isThisFocused = expanded && focusedPillar === i;
                return (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!expanded) setExpanded(true);
                      setFocusedPillar((prev) => (prev === i ? null : i));
                      setHasSpotlit(true);
                    }}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
                      isComplete ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    style={{
                      borderColor: isThisFocused ? withAlpha(pillarBorderColors[i], 0.56) : "transparent",
                      backgroundColor: isThisFocused ? `${pillarColors[i]}` : "transparent",
                    }}
                    animate={isComplete && !prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    title={`Spotlight ${p.name}`}
                    aria-label={`Spotlight ${p.name}`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center relative shrink-0"
                      style={{ backgroundColor: pillarColors[i] }}
                    >
                      {isComplete ? (
                        <Check className="w-3 h-3" style={{ color: pillarBorderColors[i] }} strokeWidth={3} />
                      ) : (
                        <LegendIcon className="w-3 h-3" style={{ color: pillarBorderColors[i] }} aria-hidden="true" />
                      )}
                    </span>
                    <span className={isComplete ? "line-through" : ""}>{p.name}</span>
                    <span className="text-[10px] font-medium ml-0.5">
                      ({pillarProgress[i]}/8)
                    </span>
                  </motion.button>
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
      </div>

      {/* Task Expand Panel */}
      <AnimatePresence>
        {expandedTask && (
          <TaskExpandPanel
            task={expandedTask.task}
            pillar={expandedTask.pillar}
            goal={data.goal}
            language={language}
            onClose={() => setExpandedTask(null)}
          />
        )}
      </AnimatePresence>

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

      {/* Confirm before discarding an in-progress plan — there's no persistence,
          so this is the only safety net against an accidental click. */}
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new goal?</AlertDialogTitle>
            <AlertDialogDescription>
              You've completed <span className="font-semibold text-foreground">{completedCount}</span> of {totalTasks} tasks
              on this plan. Starting a new goal will discard this progress, and it can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working on this plan</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>Start new goal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
