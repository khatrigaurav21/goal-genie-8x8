import { z } from "zod";

// Runtime validation for HaradaGrid data coming from anywhere outside our own
// control: the AI edge function, sessionStorage, or the public shared_plans
// table (which anyone can insert into via the anon key, unvalidated). A `TS`
// type cast gives zero runtime protection. This is what actually stops a
// malformed payload from crashing the grid renderer with a blank screen.
export const pillarSchema = z.object({
  name: z.string().min(1).max(200),
  tasks: z.array(z.string().max(300)).min(1).max(8),
});

export const haradaGridSchema = z.object({
  goal: z.string().min(1).max(500),
  pillars: z.array(pillarSchema).min(1).max(8),
  highImpact: z.array(z.string()).optional(),
});

export type ValidatedHaradaGrid = z.infer<typeof haradaGridSchema>;

export function parseHaradaGrid(input: unknown):
  | { success: true; data: ValidatedHaradaGrid }
  | { success: false; error: string } {
  const result = haradaGridSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues[0]?.message || "Invalid plan data" };
}
