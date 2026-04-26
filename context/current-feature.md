# Current Feature

Dashboard UI Phase 1 — initial dashboard scaffold with shadcn/ui, routing, layout shell, dark mode, and a display-only top bar. See @context/features/dashboard-phase-1-spec.md.

## Status

Completed

## Goals

- Initialize shadcn/ui and install required components
- Create the `/dashboard` route
- Build the main dashboard layout and global styles
- Enable dark mode by default
- Add a top bar with search input and "New Item" button (display only — no behavior yet)
- Add placeholders for the sidebar and main area (`<h2>Sidebar</h2>` and `<h2>Main</h2>`)

## Notes

- Phase 1 of 3. Subsequent phases are tracked in @context/features/dashboard-phase-2-spec.md and @context/features/dashboard-phase-3-spec.md.
- Use @context/screenshots/dashboard-ui-main.png as the visual reference.
- Mock data lives in @src/lib/mock-data.ts and will be wired up in later phases.

## History

<!-- Keep thsis updated. Earliest to latest -->

- Initial Next.js and Tailwind setup
- Mock data added for dashboard UI (`src/lib/mock-data.ts`)
- Dashboard UI Phase 1 — Completed
