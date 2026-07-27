import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Target, ListChecks, Wrench, AlertTriangle, Sparkles, TrendingUp, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Maps known section headings (from the AI prompts in our edge functions) to an
// icon, so each section of an AI response reads as a distinct block instead of
// one undifferentiated wall of markdown text.
const SECTION_ICONS: [string, LucideIcon][] = [
  ["what this task means", Target],
  ["step-by-step", ListChecks],
  ["tools & resources", Wrench],
  ["tools and resources", Wrench],
  ["mistakes to avoid", AlertTriangle],
  ["encouragement", Sparkles],
  ["pattern analysis", TrendingUp],
  ["suggestion", Wrench],
  ["next week", Compass],
];

function iconFor(text: string): LucideIcon {
  const key = text.toLowerCase();
  for (const [needle, Icon] of SECTION_ICONS) {
    if (key.includes(needle)) return Icon;
  }
  return Sparkles;
}

function flattenText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return flattenText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function SectionHeading({ children }: { children: ReactNode }) {
  const text = flattenText(children);
  const Icon = iconFor(text);
  return (
    <div className="flex items-center gap-2.5 mt-6 mb-3 first:mt-0">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h3 className="font-serif font-bold text-foreground text-[15px] leading-snug">{children}</h3>
    </div>
  );
}

const markdownComponents = {
  h1: SectionHeading,
  h2: SectionHeading,
  h3: SectionHeading,
  h4: SectionHeading,
  p: ({ children }: { children?: ReactNode }) => (
    <p className="text-[13.5px] text-foreground/85 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="space-y-2 mb-4 pl-0.5">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="space-y-2 mb-4 pl-0.5 list-none counter-reset-none">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="flex items-start gap-2.5 text-[13.5px] text-foreground/85 leading-relaxed">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  hr: () => <div className="my-5 border-t border-border" />,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
      {children}
    </a>
  ),
};

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
