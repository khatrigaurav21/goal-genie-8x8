import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import MarkdownContent from "@/components/MarkdownContent";

interface TaskExpandPanelProps {
  task: string;
  pillar: string;
  goal: string;
  language: string;
  onClose: () => void;
}

export default function TaskExpandPanel({ task, pillar, goal, language, onClose }: TaskExpandPanelProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExpand = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-expand-task", {
        body: { task, goal, pillar, language },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setExplanation(data.explanation);
    } catch (e: any) {
      setError(e.message || "Failed to generate explanation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border px-5 py-4 flex items-start justify-between gap-3 z-10">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{pillar}</p>
                <h3 className="font-serif font-semibold tracking-tight text-foreground leading-snug">{task}</h3>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-5">
            {!explanation && !isLoading && !error && (
              <div className="text-center py-14 px-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
                  Get a step-by-step breakdown of how to actually complete this task, plus tools and common pitfalls.
                </p>
                <Button onClick={handleExpand} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Expand
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-14">
                <Loader2 className="w-7 h-7 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Generating guidance...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button variant="outline" onClick={handleExpand}>Try again</Button>
              </div>
            )}

            {explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <MarkdownContent content={explanation} />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
