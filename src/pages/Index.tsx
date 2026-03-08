import { useState } from "react";
import GoalInput from "@/components/GoalInput";
import HaradaGridView from "@/components/HaradaGridView";
import type { HaradaGrid } from "@/lib/harada";
import { toast } from "sonner";

// Mock generation - will be replaced with AI
function generateMockGrid(goal: string): HaradaGrid {
  const pillarSets: Record<string, { name: string; tasks: string[] }[]> = {};

  // Generic pillars based on any goal
  const defaultPillars = [
    { name: "Mindset", tasks: ["Daily visualization", "Read 1 book/month", "Find a mentor", "Write affirmations", "Track progress weekly", "Celebrate small wins", "Overcome 1 fear/month", "Practice gratitude"] },
    { name: "Skills", tasks: ["Take online course", "Practice 30min/day", "Get feedback weekly", "Study top performers", "Join a community", "Teach others", "Document learnings", "Attend workshops"] },
    { name: "Health", tasks: ["Sleep 7-8 hours", "Exercise 4x/week", "Eat balanced meals", "Stay hydrated", "Manage stress", "Take rest days", "Regular check-ups", "Morning routine"] },
    { name: "Network", tasks: ["Attend 2 events/month", "Connect with 5 people/week", "Find accountability partner", "Join online groups", "Seek mentorship", "Help others", "Share progress publicly", "Build partnerships"] },
    { name: "Planning", tasks: ["Set weekly goals", "Create daily schedule", "Review monthly", "Define milestones", "Remove distractions", "Prioritize tasks", "Use time blocks", "Adjust as needed"] },
    { name: "Resources", tasks: ["Set a budget", "Invest in tools", "Build a library", "Find free resources", "Allocate time", "Identify key assets", "Seek funding", "Optimize spending"] },
    { name: "Environment", tasks: ["Organize workspace", "Remove negativity", "Surround with supporters", "Create visual reminders", "Set up systems", "Eliminate friction", "Design for focus", "Build routines"] },
    { name: "Resilience", tasks: ["Prepare for setbacks", "Learn from failures", "Stay consistent", "Find alternatives", "Build backup plans", "Practice patience", "Stay adaptable", "Never give up"] },
  ];

  return { goal, pillars: defaultPillars };
}

const Index = () => {
  const [gridData, setGridData] = useState<HaradaGrid | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (goal: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with AI call
      await new Promise((r) => setTimeout(r, 1500));
      const data = generateMockGrid(goal);
      setGridData(data);
    } catch {
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (gridData) {
    return <HaradaGridView data={gridData} onReset={() => setGridData(null)} />;
  }

  return <GoalInput onGenerate={handleGenerate} isLoading={isLoading} />;
};

export default Index;
