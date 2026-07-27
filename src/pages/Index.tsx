import { useState, useEffect } from "react";
import GoalInput from "@/components/GoalInput";
import HaradaGridView from "@/components/HaradaGridView";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { HaradaGrid } from "@/lib/harada";
import { parseHaradaGrid } from "@/lib/schema";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PlanVersion {
  data: HaradaGrid;
  strategy: string;
}

const Index = () => {
  const [plans, setPlans] = useState<PlanVersion[]>([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("en");

  // Check for copied plan from shared page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("copy") === "true") {
      const raw = sessionStorage.getItem("copyPlan");
      if (raw) {
        try {
          const parsed = parseHaradaGrid(JSON.parse(raw));
          sessionStorage.removeItem("copyPlan");
          window.history.replaceState({}, "", "/");
          if (parsed.success) {
            setPlans([{ data: parsed.data, strategy: "balanced" }]);
            setActivePlanIndex(0);
            toast.success("Plan copied! You can now track your own progress.");
          } else {
            toast.error("That plan couldn't be copied. Its data looks corrupted.");
          }
        } catch {
          sessionStorage.removeItem("copyPlan");
          toast.error("That plan couldn't be copied. Its data looks corrupted.");
        }
      }
    }
  }, []);

  const handleGenerate = async (goal: string, language: string = "en", strategy: string = "balanced") => {
    setIsLoading(true);
    setLoadingGoal(goal);
    setCurrentLanguage(language);
    try {
      const { data, error } = await supabase.functions.invoke("generate-harada", {
        body: { goal, language, strategy },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const parsed = parseHaradaGrid(data);
      if (!parsed.success) {
        throw new Error("The AI returned an unexpected plan format. Please try again.");
      }

      const newPlan: PlanVersion = { data: parsed.data, strategy };
      setPlans((prev) => [...prev, newPlan]);
      setActivePlanIndex(plans.length); // point to newly added
    } catch (e: any) {
      console.error("Generation error:", e);
      toast.error(e.message || "Failed to generate plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAlternative = async (strategy: string) => {
    const currentGoal = plans[activePlanIndex]?.data.goal;
    if (!currentGoal) return;
    await handleGenerate(currentGoal, currentLanguage, strategy);
  };

  const gridData = plans[activePlanIndex]?.data || null;

  if (gridData && !isLoading) {
    return (
      <HaradaGridView
        data={gridData}
        onReset={() => { setPlans([]); setActivePlanIndex(0); }}
        language={currentLanguage}
        plans={plans}
        activePlanIndex={activePlanIndex}
        onSwitchPlan={setActivePlanIndex}
        onGenerateAlternative={handleGenerateAlternative}
        isGenerating={isLoading}
      />
    );
  }

  if (isLoading) {
    return <LoadingSkeleton goal={loadingGoal} />;
  }

  return <GoalInput onGenerate={handleGenerate} isLoading={isLoading} />;
};

export default Index;
