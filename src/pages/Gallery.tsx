import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Target, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { galleryItems, type GalleryCategory } from "@/lib/gallery-data";
import { buildGridCells, type HaradaGrid } from "@/lib/harada";
import HaradaGridView from "@/components/HaradaGridView";

const CATEGORIES: GalleryCategory[] = ["Sports", "Business", "Education", "Creative", "Health"];

const CATEGORY_EMOJI: Record<GalleryCategory, string> = {
  Sports: "🏅",
  Business: "💼",
  Education: "📚",
  Creative: "🎨",
  Health: "💪",
};

const PILLAR_COLORS = [
  "hsl(4, 60%, 92%)",
  "hsl(230, 30%, 92%)",
  "hsl(150, 15%, 92%)",
  "hsl(42, 50%, 92%)",
  "hsl(320, 30%, 92%)",
  "hsl(190, 30%, 92%)",
  "hsl(270, 25%, 92%)",
  "hsl(20, 40%, 92%)",
];

function MiniGrid({ data }: { data: typeof galleryItems[0]["data"] }) {
  const cells = buildGridCells(data);
  return (
    <div className="grid grid-cols-9 grid-rows-9 gap-[1px] w-full aspect-square rounded overflow-hidden">
      {cells.flat().map((cell, i) => (
        <div
          key={i}
          className={`${cell.type === "center" ? "bg-primary" : ""}`}
          style={{
            backgroundColor:
              cell.type === "center"
                ? undefined
                : cell.type === "pillar"
                ? PILLAR_COLORS[cell.pillarIndex ?? 0]
                : cell.pillarIndex !== undefined
                ? `${PILLAR_COLORS[cell.pillarIndex]}80`
                : "hsl(40, 25%, 93%)",
          }}
        />
      ))}
    </div>
  );
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | "All">("All");
  const [selectedItem, setSelectedItem] = useState<HaradaGrid | null>(null);

  const filtered = activeCategory === "All"
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  if (selectedItem) {
    return <HaradaGridView data={selectedItem} onReset={() => setSelectedItem(null)} />;
  }

  return (
    <div className="min-h-screen bg-background paper-texture">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-xl font-bold text-foreground tracking-wide">
            原<span className="text-primary">日</span>
            <span className="text-sm font-sans font-normal text-muted-foreground ml-2">HaraDaily</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Create Your Own
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-10">
            <div className="font-serif text-4xl text-primary/10 mb-2 select-none" aria-hidden>感動</div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-3">Inspiration Gallery</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Explore how others break down ambitious goals into 64 actionable steps.
            </p>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setActiveCategory("All")}
              className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                activeCategory === "All"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <Filter className="w-3.5 h-3.5 inline mr-1.5" />
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {CATEGORY_EMOJI[cat]} {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedItem(item.data)}
            >
              <div className="p-4">
                <MiniGrid data={item.data} />
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {CATEGORY_EMOJI[item.category]} {item.category}
                  </span>
                </div>
                <h3 className="font-serif font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                  {item.data.goal}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {item.data.pillars.map((p) => p.name).join(" · ")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
