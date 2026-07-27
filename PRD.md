# Product Requirements Document: Dojo64 (Goal Genie 8x8)

**Status:** Living document, describes the product as currently implemented
**Owner:** Gaurav
**Last updated:** 2026-07-26

## 1. Summary

Dojo64 turns one ambitious goal into a structured, 64-task action plan using the Harada Method (also known as the Mandala Chart or "Open Window 64"), the same goal-setting framework popularized by Shohei Ohtani's high school baseball coach. The user types a single goal in natural language; the app uses AI to break it into 8 supporting pillars, each with 8 concrete tasks, arranged in a 9x9 grid with the goal at the center. From there, the app helps the user track daily progress, reflect weekly, and share or reuse plans.

The product is intentionally scoped as a single-session planning and tracking tool, not an accounts-based habit tracker: there is no login, and a plan lives in the browser tab unless the user explicitly shares or downloads it.

## 2. Problem

Ambitious goals ("launch a profitable SaaS," "run a sub-4-hour marathon," "become fluent in Japanese") are easy to state and hard to operationalize. Most people default to a vague to-do list or nothing at all, because breaking a big goal into a complete, balanced set of concrete actions is tedious and easy to get wrong. It's easy to over-invest in one area (e.g. just "grind harder") and neglect others (e.g. recovery, community, finance).

The Harada Method solves this structurally by forcing coverage across 8 distinct pillars before tasks are even considered, but manually filling in a 9x9 grid (64 cells) is slow. Dojo64 removes that friction: AI proposes a first draft in seconds, in the user's language and in a strategic style they choose, and the user refines from there.

## 3. Goals

- Get a user from "I have a goal" to a complete, usable 64-task plan in under a minute.
- Make the plan genuinely actionable day-to-day, not just a one-time artifact, via a daily focus list and per-task check-off.
- Support reflection, not just execution: a weekly check-in that reads the user's actual completed/incomplete tasks and gives coached feedback.
- Make plans easy to show off and easy to copy: social proof and low-friction onboarding for new users via the Gallery and public share links.
- Work in the user's language: 10 supported output languages, not just English.

## 4. Non-goals (current scope)

- **No user accounts or authentication.** A plan exists only in the current browser session unless shared (creates a public, unauthenticated row) or exported as a PNG.
- **No native mobile app**, responsive web only.
- **No reminders, notifications, or calendar integration.**
- **No multi-plan personal library.** A user cannot currently save multiple plans to "their" account and switch between them across visits, only alternative *strategy* variants of the currently open plan (see §5.1), and the Gallery's fixed example plans.
- **No collaboration** (shared editing, comments, assigning tasks to other people).

## 5. Core features

### 5.1 Goal input & AI plan generation
The landing screen ("Dojo64") takes a single free-text goal (≤300 characters), an output language (10 options: English, Japanese, Spanish, French, German, Portuguese, Chinese, Korean, Arabic, Hindi), and generates a complete grid via the `generate-harada` Supabase edge function, backed by Gemini (`gemini-flash-latest`) through structured function-calling. The model returns exactly 8 pillars x 8 tasks (64 total) plus the 10 highest-impact tasks across the whole plan.

Generation also accepts a **strategy**, selectable after the first plan exists ("Generate alternative plan"):
- **Balanced** (default): well-rounded coverage.
- **Fast Execution**: quick wins, parallelization, momentum.
- **Low Budget**: free/DIY-first tasks.
- **Long-Term Strategic**: sustainable, compounding, foundation-first tasks.

Each generated alternative is kept as a distinct plan version the user can switch between without losing prior versions (in-session only).

### 5.2 The Harada grid (main workspace)
A 9x9 grid rendered as a 3x3 arrangement of 3x3 blocks: the center block holds the goal (center cell) ringed by the 8 pillar names; each of the other 8 blocks is one pillar's own 3x3 (pillar name at center, 8 tasks around it). Before the user "opens" the plan, only the goal and pillar names are visible. The full 64 tasks fly in on first interaction, reducing initial overwhelm.

Each task cell is checkable; checking updates progress instantly (dial, per-pillar bars, legend, Daily Focus list) and animates a celebration when a full pillar is completed. High-impact tasks (the 10 the AI flagged) carry a star indicator, and any task can be expanded via `ai-expand-task` for a coached, step-by-step breakdown (what it means, how to do it, tools/resources, common mistakes) rendered as markdown.

**Category color-coding & iconography:** each pillar has a distinct color (light and dark mode variants) and a keyword-matched icon (e.g. deploy/CI → rocket, design/UX → palette, health/fitness → dumbbell) so pillars are scannable by shape and color, not just by reading every label.

**Focus Mode:** clicking any pillar's name (in the center hub ring, on its own block, or in the legend) spotlights that block: it scales up with emphasis while the rest of the grid dims, blurs, and becomes non-interactive, so the user can work one category at a time on a dense 64-cell surface. A pill above the grid ("Focused on [pillar] ×") shows the current focus and exits it.

### 5.3 Status dashboard
A dedicated, visually separated "Status" section above the grid shows an animated progress dial (percent complete, tick-marked like an instrument gauge) and a per-pillar segmented bar-chart timeline, deliberately distinct from the "Action" section (the grid) below it: status-at-a-glance vs. where-to-act-next.

### 5.4 Today's Focus
A sidebar panel that auto-selects 3–5 tasks to work on right now, preferring high-impact tasks spread across different pillars (not all from one category). Includes a shuffle control to get a different selection. Checking a task off keeps it visible briefly with a strike-through animation and a success-tinted card before it clears, rather than disappearing instantly. Locked (with a "Unfold your plan" prompt) until the user has opened the full grid.

### 5.5 Weekly Reflection
A structured check-in modal: the user notes what they completed, challenges faced, and next-week focus; `weekly-reflection` sends this plus the raw completion count to Gemini, which returns a warm, coached summary (encouragement, pattern analysis, suggested adjustments, next-week priorities) as markdown.

### 5.6 Gallery
Five hand-authored example plans (Sports/marathon, Business/SaaS launch, and others across Education, Creative, Health) act as a static, always-available library, for inspiration, and as a zero-cost way for a new user to see a complete plan without waiting on AI generation. Filterable by category; opening one loads it straight into the grid view (read/interact only, not owned by the user unless copied via a shared link).

### 5.7 Sharing
Any open plan can be shared via a public link (writes goal, pillars, high-impact list, completed-task state, language, and strategy to the `shared_plans` table; no auth required to read or write). The share-link recipient can view progress and, via "Copy This Plan," clone it into their own session to track independently. Plans can also be exported as a PNG snapshot of the grid (via `html-to-image`) for posting elsewhere (X/LinkedIn share intents and a "copy link + text" action are also built in).

### 5.8 Theming
System-aware light/dark mode, persisted in `localStorage`, applied consistently across all pillar colors, grid glows, and typography.

## 6. Primary user flow

1. Land on the goal-input screen → type a goal, pick a language → Generate.
2. Land on the grid with just the goal + 8 pillar names visible → click the center goal to reveal all 64 tasks.
3. Work the grid: check off tasks, optionally use Focus Mode to concentrate on one pillar, optionally expand a task for AI coaching.
4. Use Today's Focus for a lighter, prioritized daily view.
5. Periodically run a Weekly Reflection for coached feedback.
6. Optionally: generate an alternative-strategy version, share a link, download a PNG, or browse the Gallery for inspiration on a different goal.

## 7. Technical architecture

**Frontend:** Vite + React 18 + TypeScript, Tailwind CSS with a custom design-token layer (`index.css` / `tailwind.config.ts`), shadcn-ui (Radix primitives) for form/menu/dialog components, TanStack Query, react-router-dom, framer-motion for animation, `html-to-image` for PNG export, `react-markdown` for AI-generated markdown content.

**Backend:** Supabase: Postgres (single public table, `shared_plans`, RLS-open for anonymous read/insert) and three Deno edge functions:
- `generate-harada`: goal → full grid (Gemini function-calling, strict JSON schema: 8 pillars × 8 tasks + 10 high-impact indices).
- `ai-expand-task`: single task → coached markdown breakdown.
- `weekly-reflection`: progress + user notes → coached markdown summary.

All three call Gemini (`gemini-flash-latest`) through its OpenAI-compatible chat-completions endpoint, server-side only (`GEMINI_API_KEY` never reaches the client). Each function validates input length and handles upstream 429/402 (rate limit / quota) distinctly from generic failures.

**Testing:** Vitest (`npm run test` / `test:watch`).

## 8. Data model (client-side)

```
HaradaGrid {
  goal: string
  pillars: Pillar[8]        // exactly 8
  highImpact?: string[]     // task keys, "{pillarIndex}-{taskText}"
}
Pillar {
  name: string
  tasks: string[8]          // exactly 8
}
```
`buildGridCells()` deterministically maps this into the 9x9 layout (center = goal, ring = pillar names, 8 blocks = pillar tasks). Task completion is tracked client-side as a `Set<"{pillarIndex}-{taskText}">`, not persisted server-side except when explicitly shared.

## 9. Design principles

The visual language (established in the most recent design pass) is an editorial, "premium" take on a Japanese-paper motif: a display serif (Fraunces, with Shippori Mincho preserved for the CJK brand glyphs) paired with Inter for UI text; a warm terracotta accent (shifted from an earlier, more neon vermillion) as the single primary color; restrained, directional shadows on the grid rather than heavy glows; and category identity carried by color + icon rather than by weight or size, so the dense 64-cell grid stays scannable without feeling loud.

## 10. Known limitations / risks

- **No durable personal storage.** Refreshing the tab without sharing loses the plan. This is a deliberate scope cut, but it's the single biggest gap between this and a "real" habit-tracking product.
- **AI dependency.** Plan generation, task expansion, and weekly reflection are all single-provider (Gemini) and fail closed with a user-facing error on rate-limit/quota/outage. There's no offline or template fallback.
- **Open write access.** `shared_plans` accepts anonymous inserts with no rate limiting or moderation at the database level; abuse (spam plans) is possible.
- **No analytics** currently instrumented, so actual usage of Focus Mode, Gallery, sharing, etc. against this spec is not yet measurable.

## 11. Potential future work (not committed)

- Optional lightweight accounts (magic-link) to persist multiple plans and history over time.
- Reminders/notifications for daily focus tasks.
- Rate-limiting or CAPTCHA on `shared_plans` inserts.
- Usage analytics to validate which features (Focus Mode, Gallery, sharing) actually get used.
- Mobile app or installable PWA.
