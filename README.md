# Goal Genie (8x8)

A goal-planning app built around the Harada Method (the "8x8" grid): one core goal
surrounded by 8 supporting pillars, each broken into 8 concrete tasks — 64 cells
total. Goal Genie generates that grid for you, tracks daily progress against it,
and helps you reflect on how the week went.

## Features

- **Harada grid view** — the full 64-cell grid with per-task completion tracking
  and pillar-completion celebrations.
- **AI-assisted planning** — generate a starting grid from a single goal, and
  expand any task into more detail, via Supabase edge functions.
- **Daily focus panel** — a pared-down view of what matters today.
- **Weekly reflection** — a structured check-in against the grid.
- **Gallery & sharing** — save plans, browse past ones, and share a plan via a
  public link with PNG export.
- **Light/dark theme.**

## Stack

Vite, React 18, TypeScript, Tailwind CSS, shadcn-ui (Radix primitives), TanStack
Query, react-router-dom, and Supabase (Postgres + edge functions) for the
backend.

## Getting started

```sh
# 1. Clone the repo
git clone <this-repo-url>
cd goal-genie-8x8

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# then fill in your Supabase project's URL, project ID, and publishable (anon) key

# 4. Run the dev server
npm run dev
```

## Building for production

```sh
npm run build
```

This runs a Vite production build to `dist/`. Confirm it exits with no errors
and that the app loads correctly from a local preview (`npm run preview`)
before deploying.

## Supabase

This project uses three Supabase edge functions (`supabase/functions/`):

- `generate-harada` — generates a starting 8x8 grid from a goal.
- `ai-expand-task` — expands a single task into more detail.
- `weekly-reflection` — powers the weekly reflection flow.

The Supabase project ID and schema migration live under `supabase/`. The
`VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` is the public anon key, safe for
client-side use, but should still never be committed to version control since
it's tied to a specific project.

## Testing

```sh
npm run test        # run once
npm run test:watch  # watch mode
```

## Deployment

Any static host that can serve a Vite build works (Vercel, Netlify, Cloudflare
Pages, etc). Point the build command at `npm run build` and the output
directory at `dist/`, and set the three `VITE_SUPABASE_*` environment
variables in your host's dashboard.
