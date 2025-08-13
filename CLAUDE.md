# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
```bash
pnpm dev          # Start dev server with Turbopack on http://localhost:3000
pnpm build        # Build static export to /out directory
pnpm lint         # Run ESLint 9 + Next.js config
```

**Testing production build locally:**
```bash
cd out && python3 -m http.server 3000
# Then visit http://localhost:3000/ChairChart/
```

⚠️ **Do not use `pnpm start`** - it will fail because this is a static export app with no server.

## Architecture

**Static Next.js App** - No backend, no API routes, no SSR, no middleware. Everything runs client-side with data persisted to localStorage.

**Key Technologies:**
- **Framework**: Next.js 15 (App Router) with static export
- **Canvas**: Konva.js via react-konva for interactive seating chart canvas
- **State**: Zustand for state management 
- **Styling**: Tailwind CSS v4
- **Types**: TypeScript throughout
- **Compression**: lz-string for URL sharing (compact plan encoding ~2k chars)

**Canvas Architecture:**
- `CanvasStage.tsx` - Main infinite canvas with grid, zoom, pan, and keyboard controls
- World space coordinates with grid snapping (20px units)
- Smooth zoom animations with easing
- Multi-modal interaction: space+drag, middle-click drag, trackpad pan/zoom
- Demo draggable rectangle showing component patterns

## Static Export & GitHub Pages Configuration

**Critical basePath handling** for GitHub Pages deployment under `/ChairChart`:

**Production vs Development:**
- Dev: Assets load from root `/` (e.g. `/next.svg`)
- Production: Assets load from `/ChairChart/` (e.g. `/ChairChart/next.svg`)

**Asset prefix pattern** (see `src/app/page.tsx`):
```javascript
const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
<img src={`${prefix}/next.svg`} />
```

**Configuration files:**
- `next.config.mjs` - Canonical config with `output: 'export'`, conditional `basePath`
- `next.config.ts` - Mirror config (keep in sync, prefer .mjs)

**Production testing:** Always visit `/ChairChart/` when serving from `/out`, not server root.

## Client Components & Patterns

**All interactive components must use `"use client"`** - especially anything touching:
- `window`, `localStorage`, DOM events
- Konva.js canvas interactions
- State management hooks

**Component patterns:**
- Dynamic imports with `{ ssr: false }` for client-only components
- Viewport size tracking with window resize handlers
- Ref-based Konva node manipulation
- Grid-based coordinate systems and snapping

## File Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with Geist fonts
│   ├── page.tsx        # Home page with dynamic CanvasStage import
│   └── globals.css     # Tailwind imports and CSS variables
├── components/
│   └── CanvasStage.tsx # Main canvas component (450+ lines)
└── shims/
    └── empty.js        # Canvas module shim for webpack
```

## Development Patterns

**State Management:**
- Zustand for global state (not yet implemented)
- localStorage for persistence
- URL encoding for sharing (lz-string compression)

**Canvas Interactions:**
- Grid snapping: `snap = (v) => Math.round(v / GRID) * GRID`
- Viewport transforms: screen ↔ world coordinate conversion
- Event bubbling control for draggable nodes vs stage panning
- Animation cancellation patterns for smooth interactions

**Keyboard shortcuts in CanvasStage:**
- Space: Toggle pan mode
- +/-: Zoom in/out
- 0: Reset view to origin
- 1: Fit demo node to view
- Arrow keys: Pan (Shift for larger steps)

## Common Pitfalls

1. **Missing `/ChairChart` base path** in production → 404s on assets/links
2. **Using `next start`** for static export (will fail)
3. **Server-side features** break `output: 'export'`
4. **Forgetting `"use client"`** for interactive components
5. **Canvas coordinate confusion** between screen and world space

## Dependencies

Current key dependencies: `react`, `next`, `konva`, `react-konva`, `zustand`, `clsx`, `tailwindcss`, `typescript`

When adding features, install dependencies first and check they work with static export mode.