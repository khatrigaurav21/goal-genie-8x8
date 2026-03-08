import { useState, useEffect } from "react";

export function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// Light mode: pastel backgrounds with dark text
// Dark mode: deep muted backgrounds with light text
export const PILLAR_COLORS_LIGHT = [
  "hsl(4, 60%, 92%)",
  "hsl(230, 30%, 92%)",
  "hsl(150, 15%, 92%)",
  "hsl(42, 50%, 92%)",
  "hsl(320, 30%, 92%)",
  "hsl(190, 30%, 92%)",
  "hsl(270, 25%, 92%)",
  "hsl(20, 40%, 92%)",
];

export const PILLAR_COLORS_DARK = [
  "hsl(4, 35%, 22%)",
  "hsl(230, 20%, 22%)",
  "hsl(150, 12%, 20%)",
  "hsl(42, 30%, 22%)",
  "hsl(320, 20%, 22%)",
  "hsl(190, 20%, 21%)",
  "hsl(270, 18%, 22%)",
  "hsl(20, 25%, 22%)",
];

export const PILLAR_DONE_COLORS_LIGHT = [
  "hsl(4, 45%, 82%)",
  "hsl(230, 22%, 82%)",
  "hsl(150, 12%, 80%)",
  "hsl(42, 38%, 82%)",
  "hsl(320, 22%, 82%)",
  "hsl(190, 22%, 80%)",
  "hsl(270, 18%, 82%)",
  "hsl(20, 30%, 82%)",
];

export const PILLAR_DONE_COLORS_DARK = [
  "hsl(4, 40%, 30%)",
  "hsl(230, 22%, 30%)",
  "hsl(150, 12%, 28%)",
  "hsl(42, 35%, 30%)",
  "hsl(320, 22%, 30%)",
  "hsl(190, 22%, 28%)",
  "hsl(270, 18%, 30%)",
  "hsl(20, 28%, 30%)",
];

export const PILLAR_BORDER_COLORS_LIGHT = [
  "hsl(4, 60%, 75%)",
  "hsl(230, 30%, 75%)",
  "hsl(150, 15%, 70%)",
  "hsl(42, 50%, 72%)",
  "hsl(320, 30%, 75%)",
  "hsl(190, 30%, 72%)",
  "hsl(270, 25%, 75%)",
  "hsl(20, 40%, 75%)",
];

export const PILLAR_BORDER_COLORS_DARK = [
  "hsl(4, 50%, 45%)",
  "hsl(230, 25%, 45%)",
  "hsl(150, 15%, 40%)",
  "hsl(42, 40%, 42%)",
  "hsl(320, 25%, 45%)",
  "hsl(190, 25%, 42%)",
  "hsl(270, 20%, 45%)",
  "hsl(20, 35%, 45%)",
];

export function usePillarColors() {
  const isDark = useIsDark();
  return {
    isDark,
    pillarColors: isDark ? PILLAR_COLORS_DARK : PILLAR_COLORS_LIGHT,
    pillarDoneColors: isDark ? PILLAR_DONE_COLORS_DARK : PILLAR_DONE_COLORS_LIGHT,
    pillarBorderColors: isDark ? PILLAR_BORDER_COLORS_DARK : PILLAR_BORDER_COLORS_LIGHT,
    emptyBg: isDark ? "hsl(220, 12%, 14%)" : "hsl(40, 25%, 93%)",
    textColor: isDark ? "hsl(40, 20%, 88%)" : "hsl(220, 20%, 12%)",
  };
}
