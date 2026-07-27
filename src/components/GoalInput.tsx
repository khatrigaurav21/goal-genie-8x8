import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, Compass, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import AmbientBlobs from "@/components/AmbientBlobs";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
];

interface GoalInputProps {
  onGenerate: (goal: string, language: string) => void;
  isLoading: boolean;
}

export default function GoalInput({ onGenerate, isLoading }: GoalInputProps) {
  const [goal, setGoal] = useState("");
  const [language, setLanguage] = useState("en");
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) onGenerate(goal.trim(), language);
  };

  const examples = [
    "Run a marathon in under 4 hours",
    "Launch a profitable SaaS product",
    "Become fluent in Japanese",
    "Get accepted into a top MBA program",
  ];

  return (
    <div className="min-h-screen bg-background paper-texture flex flex-col relative overflow-hidden">
      <AmbientBlobs />

      {/* Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="font-serif text-2xl font-semibold tracking-wide">
            原<span className="text-primary">日</span>
            <span className="text-xs font-sans font-medium tracking-[0.16em] uppercase text-muted-foreground ml-2.5">HaraDaily</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/gallery">
              <Button variant="outline" size="sm">
                <Compass className="w-4 h-4 mr-1" /> Gallery
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Decorative kanji, gently floating */}
            <motion.div
              className="font-serif text-6xl sm:text-8xl text-primary/10 mb-4 select-none"
              aria-hidden
              animate={prefersReducedMotion ? { y: 0 } : { y: [0, -10, 0] }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              目標
            </motion.div>

            <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground leading-[1.08] mb-5">
              One goal.<br />
              <span className="text-primary italic">64 actions.</span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg mb-9 max-w-md mx-auto leading-relaxed">
              Transform any ambitious goal into a structured 8×8 action plan using the Harada Method —
              the same framework used by <span className="font-medium text-foreground">Shohei Ohtani</span>.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col gap-3 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-3 relative">
              {/* Soft pulsing glow behind the CTA */}
              <motion.div
                className="hidden sm:block absolute -inset-2 rounded-xl bg-primary/10 blur-xl -z-10"
                animate={prefersReducedMotion ? { opacity: 0.4 } : { opacity: [0.3, 0.55, 0.3] }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What is your one ambitious goal?"
                className="flex-1 h-14 text-base sm:text-lg px-5 rounded-xl bg-card border-border focus:ring-primary font-sans"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!goal.trim() || isLoading}
                className="h-14 px-8 text-base rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate My Plan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Language selector */}
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Output language:</span>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40 h-9 bg-card border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.form>

          {/* Examples */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-sm text-muted-foreground mb-3">Try an example:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {examples.map((ex, i) => (
                <motion.button
                  key={ex}
                  onClick={() => setGoal(ex)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.06, duration: 0.4 }}
                  whileHover={{ y: -2 }}
                  className="text-sm px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-sm transition-colors"
                >
                  {ex}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Ink line */}
          <div className="ink-brush-line mt-12 mb-6" />

          <p className="text-xs text-muted-foreground">
            Inspired by the Harada Method — 8 pillars, 64 tasks, one transformative goal.
          </p>
        </div>
      </main>
    </div>
  );
}
