import { useState } from "react";
import GoalInput from "@/components/GoalInput";
import HaradaGridView from "@/components/HaradaGridView";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { HaradaGrid } from "@/lib/harada";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [gridData, setGridData] = useState<HaradaGrid | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState("");

  const handleGenerate = async (goal: string, language: string = "en") => {
    setIsLoading(true);
    setLoadingGoal(goal);
    try {
      const { data, error } = await supabase.functions.invoke("generate-harada", {
        body: { goal, language },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGridData(data as HaradaGrid);
    } catch (e: any) {
      console.error("Generation error:", e);
      toast.error(e.message || "Failed to generate plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (gridData) {
    return <HaradaGridView data={gridData} onReset={() => setGridData(null)} />;
  }

  if (isLoading) {
    return <LoadingSkeleton goal={loadingGoal} />;
  }

  return <GoalInput onGenerate={handleGenerate} isLoading={isLoading} />;
};

export default Index;
