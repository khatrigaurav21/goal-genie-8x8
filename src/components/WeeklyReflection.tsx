import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import MarkdownContent from "@/components/MarkdownContent";

interface WeeklyReflectionProps {
  goal: string;
  completedTasks: Set<string>;
  totalTasks: number;
  language: string;
  pillars: { name: string; tasks: string[] }[];
  onClose: () => void;
}

export default function WeeklyReflection({ goal, completedTasks, totalTasks, language, pillars, onClose }: WeeklyReflectionProps) {
  const [completedText, setCompletedText] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextWeekFocus, setNextWeekFocus] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Build completed tasks text from set
      const completedList = Array.from(completedTasks).map((key) => {
        const [pi, ...rest] = key.split("-");
        const pillar = pillars[parseInt(pi)]?.name || "";
        return `[${pillar}] ${rest.join("-")}`;
      }).join("\n");

      const { data, error } = await supabase.functions.invoke("weekly-reflection", {
        body: {
          goal,
          completedTasks: completedText || completedList,
          challenges,
          nextWeekFocus,
          totalCompleted: completedTasks.size,
          totalTasks,
          language,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-medium tracking-tight text-foreground">Weekly Reflection</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {!summary ? (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Which tasks did you complete this week?
                </label>
                <Textarea
                  value={completedText}
                  onChange={(e) => setCompletedText(e.target.value)}
                  placeholder="List the tasks you completed..."
                  className="bg-background border-border resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  What challenges did you face?
                </label>
                <Textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Describe any obstacles or difficulties..."
                  className="bg-background border-border resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  What should you focus on next week?
                </label>
                <Textarea
                  value={nextWeekFocus}
                  onChange={(e) => setNextWeekFocus(e.target.value)}
                  placeholder="What are your priorities for next week?"
                  className="bg-background border-border resize-none"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Summary...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Get AI Reflection</>
                )}
              </Button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MarkdownContent content={summary} />
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setSummary(null)}>New Reflection</Button>
                <Button onClick={onClose}>Done</Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
