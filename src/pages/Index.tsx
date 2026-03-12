import { useState, useEffect } from "react";
import GoalInput from "@/components/GoalInput";
import HaradaGridView from "@/components/HaradaGridView";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { HaradaGrid } from "@/lib/harada";
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
          const data = JSON.parse(raw) as HaradaGrid;
          setPlans([{ data, strategy: "balanced" }]);
          setActivePlanIndex(0);
          sessionStorage.removeItem("copyPlan");
          // Clean URL
          window.history.replaceState({}, "", "/");
          toast.success("Plan copied! You can now track your own progress.");
        } catch { /* ignore */ }
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

      const newPlan: PlanVersion = { data: data as HaradaGrid, strategy };
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
