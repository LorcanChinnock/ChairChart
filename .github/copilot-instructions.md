# ChairChart — AI Agent Guide

Goal: Make changes productively in a client-only, static-export Next.js app deployed to GitHub Pages under /ChairChart.

Architecture and scope
- Static-only Next.js (App Router). No backend, no API routes, no middleware, no SSR. All state/data lives in browser localStorage. See `README.md` and PRD at `temp/ChairChart_PRD.json`.
- Deployed to GitHub Pages under `/ChairChart`. Static export is enabled; directories end with a trailing slash.

Build, run, and test
- Dev: `pnpm dev` (Turbopack) → http://localhost:3000
- Build: `pnpm build` → emits static site to `/out`
- Do not use `pnpm start` (expected to fail for static export). To test production locally: `cd out && python3 -m http.server 3000` then open http://localhost:3000/ChairChart/
- Lint: `pnpm lint` (ESLint 9 + Next config)

Configuration that matters
- Canonical config is `next.config.mjs`:
  - `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`
  - In prod only: `basePath: '/ChairChart'` and `assetPrefix: '/ChairChart/'`
  - Exposes `process.env.NEXT_PUBLIC_BASE_PATH` so client code can prefix asset URLs
- Note: `next.config.ts` also exists with static values. Prefer `next.config.mjs`. If both are kept, ensure they do not diverge; do not add server-only features.

Asset path pattern (important for GitHub Pages)
- Use the basePath prefix for public assets. Example from `src/app/page.tsx`:
  - `const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";`
  - `<img src={`${prefix}/next.svg`} ... />`
- When serving `/out`, always visit `/ChairChart/` or asset URLs will 404.

Styling and layout
- Tailwind CSS v4 via PostCSS plugin (`postcss.config.mjs`). Global styles in `src/app/globals.css` import `tailwindcss` and define CSS variables.
- Fonts via Geist in `src/app/layout.tsx` (App Router root). Keep `children: React.ReactNode` types explicit.

Client-only patterns to follow
- Interactive components must be client components (`"use client"`). Avoid server components for anything that touches window/localStorage/canvas.
- No Next.js server features (no Route Handlers, no Image Optimization server). `images.unoptimized` is already set.

Feature direction (from PRD/README)
- Canvas: Konva.js; State: Zustand; Persistence: localStorage; URL sharing via encoded plan data with compression (URL length ~2k chars). These libs are not yet in dependencies—install when implementing.
- Data model to target (Plan/Table/Attendee/SeatAssignment) is outlined in PRD.

Key files
- `next.config.mjs` — export/basePath/env for static hosting
- `src/app/page.tsx` — asset prefix usage pattern
- `src/app/layout.tsx` — fonts, global CSS
- `public/*.svg` — static assets referenced via prefixed URLs
- `README.md` — exact build/test instructions (including why `next start` won’t work)

Common pitfalls
- Forgetting the `/ChairChart` base path in prod → broken assets/links
- Using `next start` for a static export app
- Introducing server-only features that break `output: 'export'`
- Not marking interactive components as client components when needed

When in doubt
- Keep everything client-side, prefix asset paths using `NEXT_PUBLIC_BASE_PATH`, and verify production behavior by serving the `/out` folder and navigating to `/ChairChart/`.
