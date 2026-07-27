import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Ritual {
  id: string;
  label: string;
}

interface StoredState {
  rituals: Ritual[];
  completedDates: Record<string, string>; // ritual id -> ISO date last completed
}

const STORAGE_KEY = "haradaily-rituals";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): StoredState {
  if (typeof window === "undefined") return { rituals: [], completedDates: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rituals: [], completedDates: {} };
    const parsed = JSON.parse(raw);
    return {
      rituals: Array.isArray(parsed.rituals) ? parsed.rituals : [],
      completedDates: parsed.completedDates && typeof parsed.completedDates === "object" ? parsed.completedDates : {},
    };
  } catch {
    return { rituals: [], completedDates: {} };
  }
}

// Small, user-authored daily habits — separate from the 64 one-off Harada tasks.
// Unlike the rest of the plan (which is session-only), this persists to
// localStorage since it's low-stakes and benefits most from surviving a reload.
// Completion resets each calendar day by construction: a ritual only reads as
// "done" when its stored date matches today.
export default function DailyRituals() {
  const [state, setState] = useState<StoredState>(() => loadState());
  const [draft, setDraft] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const today = todayISO();

  const toggleRitual = (id: string) => {
    setState((prev) => {
      const isDone = prev.completedDates[id] === today;
      const nextDates = { ...prev.completedDates };
      if (isDone) delete nextDates[id];
      else nextDates[id] = today;
      return { ...prev, completedDates: nextDates };
    });
  };

  const addRitual = () => {
    const label = draft.trim();
    if (!label) return;
    setState((prev) => ({
      ...prev,
      rituals: [...prev.rituals, { id: crypto.randomUUID(), label }],
    }));
    setDraft("");
  };

  const removeRitual = (id: string) => {
    const removed = state.rituals.find((r) => r.id === id);
    const removedCompletedDate = state.completedDates[id];

    setState((prev) => ({
      rituals: prev.rituals.filter((r) => r.id !== id),
      completedDates: Object.fromEntries(Object.entries(prev.completedDates).filter(([k]) => k !== id)),
    }));

    if (removed) {
      toast("Ritual removed", {
        description: removed.label,
        action: {
          label: "Undo",
          onClick: () => {
            setState((prev) => ({
              rituals: [...prev.rituals, removed],
              completedDates: removedCompletedDate
                ? { ...prev.completedDates, [removed.id]: removedCompletedDate }
                : prev.completedDates,
            }));
          },
        },
      });
    }
  };

  const doneCount = state.rituals.filter((r) => state.completedDates[r.id] === today).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.16 }}
      className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-5 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="font-serif font-medium tracking-tight text-foreground">Daily Rituals</h3>
        </div>
        {state.rituals.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {doneCount}/{state.rituals.length}
          </span>
        )}
      </div>

      {state.rituals.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed flex-1">
          Small habits that support the goal. Saved on this device, resets each day.
        </p>
      ) : (
        <div className="space-y-1.5 mb-3 flex-1">
          <AnimatePresence initial={false}>
            {state.rituals.map((r) => {
              const isDone = state.completedDates[r.id] === today;
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md border transition-colors duration-300 ${
                    isDone ? "border-primary/25 bg-primary/[0.06]" : "border-border bg-background"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleRitual(r.id)}
                    className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isDone ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}
                    aria-label={isDone ? `Mark ${r.label} not done` : `Mark ${r.label} done`}
                  >
                    {isDone && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                      />
                    )}
                  </button>
                  <span
                    className={`flex-1 min-w-0 text-sm leading-tight transition-colors duration-300 ${
                      isDone ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {r.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRitual(r.id)}
                    className="opacity-50 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                    aria-label={`Remove ${r.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addRitual();
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a daily ritual…"
          maxLength={80}
          className="flex-1 min-w-0 h-8 text-xs px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Add ritual"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}
