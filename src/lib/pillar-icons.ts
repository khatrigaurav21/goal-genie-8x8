import {
  Rocket, ShieldCheck, Code, TestTube, BookOpen, Palette, Gauge, Lock,
  TrendingUp, Search, Users, DollarSign, Megaphone, Wrench, Dumbbell,
  Heart, GraduationCap, Briefcase, Globe, Layers, Target, Sparkles,
  type LucideIcon,
} from "lucide-react";

// Keyword -> icon mapping so any AI-generated pillar name still gets a sensible,
// instantly-scannable icon without requiring a fixed category taxonomy.
const KEYWORD_ICON_MAP: [RegExp, LucideIcon][] = [
  [/deploy|ci\s?\/?\s?cd|release|infra|devops|pipeline/i, Rocket],
  [/quality|test|qa\b|bug|reliab/i, TestTube],
  [/security|privacy|complian|risk|audit/i, Lock],
  [/code|engineer|dev(elopment)?|architecture|technical/i, Code],
  [/doc|content|writing|knowledge|blog/i, BookOpen],
  [/design|ui\b|ux\b|brand|visual|creative/i, Palette],
  [/performance|speed|optimi[sz]e|metric|analytics/i, Gauge],
  [/growth|market|sales|acquisition|revenue|customer/i, TrendingUp],
  [/research|analy|data|insight|experiment/i, Search],
  [/team|people|hiring|community|network/i, Users],
  [/finance|budget|money|invest|fund/i, DollarSign],
  [/pr\b|comms|outreach|social|promotion/i, Megaphone],
  [/tool|process|ops|operations|logistics/i, Wrench],
  [/health|fitness|body|nutrition|sleep/i, Dumbbell],
  [/mind|mental|mindset|habit|wellbeing|recovery/i, Heart],
  [/learn|educat|skill|study|training/i, GraduationCap],
  [/career|job|professional|leadership/i, Briefcase],
  [/global|travel|language|culture|international/i, Globe],
  [/quality assurance|verif|standard/i, ShieldCheck],
  [/inspir|motivat|vision|creativ/i, Sparkles],
];

const FALLBACK_ICONS: LucideIcon[] = [Target, Layers, Rocket, Gauge, Palette, Search, Users, Wrench];

export function getPillarIcon(name: string, index: number): LucideIcon {
  for (const [pattern, icon] of KEYWORD_ICON_MAP) {
    if (pattern.test(name)) return icon;
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}
