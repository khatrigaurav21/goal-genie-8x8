import type { HaradaGrid } from "./harada";

export interface PriorityTask {
  key: string;
  task: string;
  pillar: string;
  pillarIndex: number;
  isHighImpact: boolean;
}

// Ranks every task in a plan by priority: high-impact tasks first (one per distinct
// pillar, so the front of the list isn't dominated by a single category), then
// everything else in original order. Deterministic given the same plan data.
export function rankTasksByPriority(data: HaradaGrid): PriorityTask[] {
  const highImpactSet = new Set(data.highImpact || []);
  const all: PriorityTask[] = [];
  data.pillars.forEach((p, pi) => {
    p.tasks.forEach((t) => {
      const key = `${pi}-${t}`;
      all.push({ key, task: t, pillar: p.name, pillarIndex: pi, isHighImpact: highImpactSet.has(key) });
    });
  });

  const front: PriorityTask[] = [];
  const usedPillars = new Set<number>();
  for (const t of all) {
    if (t.isHighImpact && !usedPillars.has(t.pillarIndex)) {
      front.push(t);
      usedPillars.add(t.pillarIndex);
    }
  }
  const frontKeys = new Set(front.map((t) => t.key));
  const rest = all.filter((t) => !frontKeys.has(t.key));
  return [...front, ...rest];
}

// A stable set of "today's" priority task keys, pinned for the whole plan (not
// filtered by completion) so a completion-rate metric against it has a fixed
// denominator — unlike the rotating Today's Focus list, which intentionally drops
// completed tasks and backfills from the remaining pool.
export function pinnedTodaysFocusKeys(data: HaradaGrid, limit = 5): string[] {
  return rankTasksByPriority(data).slice(0, limit).map((t) => t.key);
}
