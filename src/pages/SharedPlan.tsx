import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { buildGridCells, type HaradaGrid } from "@/lib/harada";
import { motion } from "framer-motion";
import { Check, Star, Copy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePillarColors } from "@/lib/theme-colors";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

export default function SharedPlan() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { pillarColors, pillarDoneColors, pillarBorderColors, emptyBg, textColor } = usePillarColors();

  useEffect(() => {
    if (!id) return;
    supabase
      .from("shared_plans")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError("Plan not found");
        else setPlan(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading plan...</div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-foreground font-serif">Plan not found</p>
        <Link to="/">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Home</Button>
        </Link>
      </div>
    );
  }

  const gridData: HaradaGrid = {
    goal: plan.goal,
    pillars: plan.pillars as any,
    highImpact: (plan.high_impact || []) as string[],
  };
  const cells = buildGridCells(gridData);
  const completedSet = new Set<string>((plan.completed_tasks || []) as string[]);
  const highImpactSet = new Set<string>(gridData.highImpact || []);
  const completedCount = completedSet.size;
  const progressPercent = Math.round((completedCount / 64) * 100);

  const handleCopyPlan = () => {
    // Store plan data in sessionStorage so the Index page can pick it up
    sessionStorage.setItem("copyPlan", JSON.stringify(gridData));
    toast.success("Plan copied! Redirecting...");
    window.location.href = "/?copy=true";
  };

  const strategyLabels: Record<string, string> = {
    balanced: "Balanced",
    fast: "Fast Execution",
    "low-budget": "Low Budget",
    "long-term": "Long-Term Strategic",
  };

  return (
    <div className="min-h-screen bg-background paper-texture">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-xl font-bold text-foreground tracking-wide">
            原<span className="text-primary">日</span>
            <span className="text-sm font-sans font-normal text-muted-foreground ml-2">HaraDaily</span>
          </Link>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <Button onClick={handleCopyPlan} className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
              <Copy className="w-4 h-4 mr-1" /> Copy This Plan
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
          <h1 className="font-serif font-bold text-foreground text-xl mb-1">🎯 {gridData.goal}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Strategy: <span className="font-medium text-foreground">{strategyLabels[plan.strategy] || "Balanced"}</span></span>
            <span>•</span>
            <span><span className="font-semibold text-foreground">{completedCount}</span>/64 tasks ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mt-2">
            <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 pb-8">
        <div className="harada-grid rounded-lg overflow-hidden border border-border shadow-lg bg-background p-1">
          {cells.flat().map((cell, i) => {
            const pillarBg = cell.pillarIndex !== undefined ? pillarColors[cell.pillarIndex] : undefined;
            const pillarDoneBg = cell.pillarIndex !== undefined ? pillarDoneColors[cell.pillarIndex] : undefined;
            const pillarBorder = cell.pillarIndex !== undefined ? pillarBorderColors[cell.pillarIndex] : undefined;
            const isTask = cell.type === "task" && cell.text;
            const taskKey = cell.pillarIndex !== undefined ? `${cell.pillarIndex}-${cell.text}` : "";
            const isDone = isTask && completedSet.has(taskKey);
            const isHighImpact = isTask && highImpactSet.has(taskKey);

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.008, duration: 0.3 }}
                className={`harada-cell rounded-sm relative ${
                  cell.type === "center" ? "harada-cell-center" :
                  cell.type === "pillar" ? "font-semibold font-serif" : ""
                }`}
                style={{
                  backgroundColor: cell.type === "center" ? undefined :
                    cell.type === "pillar" ? pillarBg :
                    isDone ? pillarDoneBg :
                    cell.type === "task" ? `${pillarBg}80` : emptyBg,
                  borderLeft: cell.type === "pillar" ? `3px solid ${pillarBorder}` : undefined,
                  color: cell.type === "center" ? undefined : textColor,
                }}
              >
                {isHighImpact && !isDone && (
                  <Star className="absolute top-0.5 left-0.5 w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                )}
                {isDone && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <span className={isDone ? "line-through opacity-60" : ""}>{cell.text}</span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          {gridData.pillars.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: pillarColors[i] }} />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
