import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildGridCells, type HaradaGrid } from "@/lib/harada";
import { toPng } from "html-to-image";
import { Download, Link2, X as XIcon, Linkedin, ChevronDown } from "lucide-react";
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
  const cells = buildGridCells(data);

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

  const handleShare = async () => {
    const text = `🎯 My Harada Method goal: "${data.goal}" — broken down into 8 pillars and 64 actionable tasks!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "HaraDaily Goal Grid", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Save PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
            <Button size="sm" onClick={onReset} className="bg-primary text-primary-foreground hover:bg-primary/90">
              New Goal
            </Button>
          </div>
        </div>
      </header>

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
              const pillarBorder = cell.pillarIndex !== undefined ? PILLAR_BORDER_COLORS[cell.pillarIndex] : undefined;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.008, duration: 0.3 }}
                  className={`harada-cell rounded-sm ${
                    cell.type === "center"
                      ? "harada-cell-center"
                      : cell.type === "pillar"
                      ? "font-semibold font-serif"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      cell.type === "center"
                        ? undefined
                        : cell.type === "pillar"
                        ? pillarBg
                        : cell.type === "task"
                        ? `${pillarBg}80`
                        : "hsl(40, 25%, 93%)",
                    borderLeft: cell.type === "pillar" ? `3px solid ${pillarBorder}` : undefined,
                    color: cell.type === "center" ? undefined : "hsl(220, 20%, 12%)",
                  }}
                >
                  {cell.text}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {data.pillars.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: PILLAR_COLORS[i] }}
              />
              {p.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
