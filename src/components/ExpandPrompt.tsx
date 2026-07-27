import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ExpandPromptProps {
  visible: boolean;
}

// Small Japanese-art-inspired motion cue: a breathing origami fan glyph
// (reuses the vermillion/gold facet language from the icon set) plus a
// caption inviting the user to tap the center goal to reveal their plan.
export default function ExpandPrompt({ visible }: ExpandPromptProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, scale: 0.92 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center gap-1.5 mb-4 select-none pointer-events-none"
        >
          <motion.svg
            width="32"
            height="32"
            viewBox="-22 -22 44 44"
            animate={prefersReducedMotion ? { rotate: 0, scale: 1 } : { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon points="0,-18 5,-5 -5,-5" fill="hsl(var(--primary))" />
            <polygon points="18,0 5,-5 5,5" fill="hsl(var(--gold))" />
            <polygon points="0,18 5,5 -5,5" fill="hsl(var(--primary))" />
            <polygon points="-18,0 -5,-5 -5,5" fill="hsl(var(--gold))" />
          </motion.svg>
          <p className="text-xs sm:text-sm font-serif text-muted-foreground text-center">
            Tap the center goal to unfold your plan
          </p>
          <motion.span
            animate={prefersReducedMotion ? { y: 0 } : { y: [0, 4, 0] }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-primary/50 text-xs leading-none"
          >
            ▾
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
