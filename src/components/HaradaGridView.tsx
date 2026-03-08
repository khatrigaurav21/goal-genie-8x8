import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildGridCells, type HaradaGrid } from "@/lib/harada";
import { toPng } from "html-to-image";
import { Download, Link2, X as XIcon, Linkedin, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PILLAR_COLORS = [
  "hsl(4, 60%, 92%)",
  "hsl(230, 30%, 92%)",
  "hsl(150, 15%, 92%)",
  "hsl(42, 50%, 92%)",
  "hsl(320, 30%, 92%)",
  "hsl(190, 30%, 92%)",
  "hsl(270, 25%, 92%)",
  "hsl(20, 40%, 92%)",
];

const PILLAR_DONE_COLORS = [
  "hsl(4, 45%, 82%)",
  "hsl(230, 22%, 82%)",
  "hsl(150, 12%, 80%)",
  "hsl(42, 38%, 82%)",
  "hsl(320, 22%, 82%)",
  "hsl(190, 22%, 80%)",
  "hsl(270, 18%, 82%)",
  "hsl(20, 30%, 82%)",
];

const PILLAR_BORDER_COLORS = [
  "hsl(4, 60%, 75%)",
  "hsl(230, 30%, 75%)",
  "hsl(150, 15%, 70%)",
  "hsl(42, 50%, 72%)",
  "hsl(320, 30%, 75%)",
  "hsl(190, 30%, 72%)",
  "hsl(270, 25%, 75%)",
  "hsl(20, 40%, 75%)",
];

interface HaradaGridViewProps {
  data: HaradaGrid;
  onReset: () => void;
}

export default function HaradaGridView({ data, onReset }: HaradaGridViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [completedPillars, setCompletedPillars] = useState<Set<number>>(new Set());
  const [celebratingPillar, setCelebratingPillar] = useState<number | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const cells = buildGridCells(data);

  const totalTasks = 64;
  const completedCount = completedTasks.size;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  // Per-pillar progress
  const pillarProgress = useMemo(() => {
    return data.pillars.map((_, i) => {
      let done = 0;
      completedTasks.forEach((key) => {
        if (key.startsWith(`${i}-`)) done++;
      });
      return done;
    });
  }, [completedTasks, data.pillars]);

  const toggleTask = (cellIndex: number, pillarIndex: number, taskText: string) => {
    const key = `${pillarIndex}-${taskText}`;
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Un-complete pillar if unchecking
        if (completedPillars.has(pillarIndex)) {
          setCompletedPillars((p) => { const n = new Set(p); n.delete(pillarIndex); return n; });
        }
        setAllComplete(false);
      } else {
        next.add(key);
        const pillarDone = data.pillars[pillarIndex].tasks.every((t) => next.has(`${pillarIndex}-${t}`));
        if (pillarDone && !completedPillars.has(pillarIndex)) {
          toast.success(`🎉 "${data.pillars[pillarIndex].name}" pillar complete!`);
          setCompletedPillars((p) => new Set(p).add(pillarIndex));
          setCelebratingPillar(pillarIndex);
          setTimeout(() => setCelebratingPillar(null), 1200);
        }
        if (next.size === totalTasks) {
          toast.success("🏆 All 64 tasks complete! You've mastered your goal!", { duration: 5000 });
          setAllComplete(true);
        }
      }
      return next;
    });
  };

  const shareText = `🎯 My Harada Method goal: "${data.goal}" — broken down into 8 pillars and 64 actionable tasks! ${progressPercent}% complete!`;
  const shareUrl = window.location.href;

  const handleDownload = async () => {
    if (!gridRef.current) return;
    try {
      const dataUrl = await toPng(gridRef.current, { 
        pixelRatio: 2,
        backgroundColor: "#f5f0e8",
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
            {/* Progress badge */}
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

      {/* Grid */}
      <div className="container max-w-5xl mx-auto px-4 py-8">
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
              const pillarBg = cell.pillarIndex !== undefined ? PILLAR_COLORS[cell.pillarIndex] : undefined;
              const pillarDoneBg = cell.pillarIndex !== undefined ? PILLAR_DONE_COLORS[cell.pillarIndex] : undefined;
              const pillarBorder = cell.pillarIndex !== undefined ? PILLAR_BORDER_COLORS[cell.pillarIndex] : undefined;
              const isTask = cell.type === "task" && cell.text;
              const taskKey = cell.pillarIndex !== undefined ? `${cell.pillarIndex}-${cell.text}` : "";
              const isDone = isTask && completedTasks.has(taskKey);
              const isPillarCelebrating = cell.pillarIndex !== undefined && celebratingPillar === cell.pillarIndex;
              const isPillarComplete = cell.pillarIndex !== undefined && completedPillars.has(cell.pillarIndex);

              return (
                <motion.div
                  key={i}
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
                  className={`harada-cell rounded-sm relative ${
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
                        : "hsl(40, 25%, 93%)",
                    borderLeft: cell.type === "pillar" ? `3px solid ${pillarBorder}` : undefined,
                    color: cell.type === "center" ? undefined : "hsl(220, 20%, 12%)",
                    boxShadow: isPillarCelebrating
                      ? `0 0 16px 4px ${pillarBorder}60`
                      : isPillarComplete && cell.type === "pillar"
                      ? `inset 0 0 12px ${pillarBorder}30`
                      : undefined,
                  }}
                >
                  {/* Pillar complete badge */}
                  {cell.type === "pillar" && isPillarComplete && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10 shadow-sm"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </motion.div>
                  )}
                  {/* Celebration shimmer */}
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

        {/* All-complete celebration overlay */}
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

        {/* Legend with per-pillar progress */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          {data.pillars.map((p, i) => {
            const isComplete = completedPillars.has(i);
            return (
              <motion.div
                key={i}
                className={`flex items-center gap-1.5 text-xs ${isComplete ? "text-foreground font-medium" : "text-muted-foreground"}`}
                animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <div
                  className="w-3 h-3 rounded-sm relative"
                  style={{ backgroundColor: PILLAR_COLORS[i] }}
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
      </div>
    </div>
  );
}
