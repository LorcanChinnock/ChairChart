# ChairChart Development Guide

## Project Overview
ChairChart is a **client-side only** Next.js seating chart planner for weddings/events. All data is stored in localStorage - no backend, no database, no authentication. The app exports as static files (`output: 'export'`) for GitHub Pages deployment.

## Architecture & Key Decisions

### Static Export Configuration
- **Build Output**: Static files in `/out` directory via `next.config.mjs`
- **GitHub Pages**: Uses `basePath: '/ChairChart'` and `assetPrefix` in production
- **Dev vs Prod**: Run `pnpm dev` for development, serve static files from `/out` for production testing
- **No Server**: `next start` won't work - use static file server instead

### Core Tech Stack (Per PRD)
- **Canvas**: Konva.js (not Fabric.js) for performance and React integration
- **State**: Zustand (not Redux) for simpler state management  
- **Styling**: Tailwind CSS with Geist fonts via `next/font/google`
- **Storage**: Browser localStorage only - no server persistence

### File Structure
```
src/app/                 # Next.js 13+ App Router
├── layout.tsx          # Root layout with Geist fonts
├── page.tsx            # Landing page (currently default Next.js)  
├── globals.css         # Tailwind + custom CSS variables
public/                 # Static assets (SVG icons)
temp/ChairChart_PRD.json # Detailed product requirements
```

## Development Workflows

### Build & Deploy Process
```bash
pnpm dev                # Development server with Turbo
pnpm build              # Creates static export in /out
pnpm lint               # ESLint with Next.js configs
```

### Static File Testing
After `pnpm build`, serve static files:
```bash
cd out && python3 -m http.server 3000
# or use any static file server
```

## Critical Implementation Patterns

### Data Model (From PRD)
```typescript
interface Plan {
  id: string;
  tables: Table[];
  attendees: Attendee[];
  seatAssignments: Record<attendeeId, {tableId, seatIndex}>;
}

interface Table {
  id: string;
  shape: 'round' | 'rectangular' | 'square';
  name: string;
  seats: number;
  x: number; y: number;
}

interface Attendee {
  id: string; name: string; group: string;
  rsvp: 'Attending' | 'Declined' | 'Pending';
  dietary?: string; specialNeeds?: string;
}
```

### Core Features to Implement
1. **Canvas Component**: Konva.js with pan/zoom/snapping, drag-drop for tables/guests
2. **Guest Management Panel**: Side panel for attendee CRUD with color-coded groups
3. **URL Sharing**: Serialize plan data to URL params (handle length limits)
4. **localStorage Persistence**: Auto-save on changes, handle storage quotas

### TypeScript Requirements
- All components must have proper React types (`children: React.ReactNode`)
- Use `import type` for type-only imports
- Props interfaces should be explicit, not inferred

## Project-Specific Conventions

### Styling Approach
- Use Tailwind utility classes primarily
- CSS custom properties in `globals.css` for theming
- Dark/light mode via `prefers-color-scheme`
- Geist Sans/Mono fonts are pre-configured in layout

### Error Boundaries & UX
- Graceful localStorage failures (quota exceeded, disabled)
- Invalid shared URL handling → redirect to new project
- Canvas performance limits (200 guests, 25 tables per PRD)

### Development Focus Areas
1. **Canvas Performance**: Optimize Konva rendering for large datasets
2. **Data Compression**: URL sharing limited by browser URL length (~2000 chars)
3. **Accessibility**: Keyboard alternatives for drag-drop, WCAG 2.1 AA compliance
4. **Mobile**: Touch-friendly interactions (post-MVP consideration)

## Integration Points
- **No external APIs** - completely self-contained
- **localStorage** as single source of truth
- **URL encoding/decoding** for plan sharing
- **Static asset serving** from `/public`

## Common Pitfalls
- Don't use server-side Next.js features (API routes, SSR, middleware)
- Remember GitHub Pages path prefix in production URLs
- localStorage has size limits (~5-10MB) - implement compression
- Canvas interactions need both mouse and touch event handling
- URL sharing must handle encoding failures gracefully

## Future Considerations (Post-MVP)
- Database persistence and user accounts
- Real-time collaboration
- Mobile app versions  
- CSV import/export functionality
- Print/PDF generation
