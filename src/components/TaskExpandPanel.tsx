import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

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
          className="relative w-full max-w-lg bg-card border-l border-border shadow-xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
            <div>
              <p className="text-xs text-muted-foreground">{pillar}</p>
              <h3 className="font-serif font-bold text-foreground">{task}</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-5">
            {!explanation && !isLoading && !error && (
              <div className="text-center py-12">
                <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 opacity-60" />
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered guidance on how to complete this task
                </p>
                <Button onClick={handleExpand} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Expand
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Generating guidance...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button variant="outline" onClick={handleExpand}>Try again</Button>
              </div>
            )}

            {explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              >
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
