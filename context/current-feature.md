# Current Feature: Add Pro Badge to Sidebar

<!-- Feature name and short description -->

Add a PRO badge to the `files` and `images` item types in the sidebar to indicate they are Pro-only features.

## Status

In Progress

## Goals

- Render a PRO badge next to the `files` and `images` item type entries in the sidebar
- Use the shadcn/ui Badge component
- Badge text is "PRO" (all uppercase)
- Keep the badge clean and subtle so it does not compete with the type label

## Notes

- Source spec: `context/features/add-pro-badge-sidebar.md`
- Only the `file` and `image` system types are Pro-gated per `context/project-overview.md`
- shadcn Badge component may need to be added if not already present in the project

## History

<!-- Keep thsis updated. Earliest to latest -->

- Initial Next.js and Tailwind setup
- Mock data added for dashboard UI (`src/lib/mock-data.ts`)
- Dashboard UI Phase 1 — Completed
- Dashboard UI Phase 2 — Completed
- Dashboard UI Phase 3 — Completed
- Prisma + Neon PostgreSQL setup — Completed
- Database seed (demo user + system types + 5 collections / 18 items) — Completed
- Dashboard collections wired to Neon DB + sidebar polish (uppercase TYPES/COLLECTIONS, chevrons, separator) — Completed
- Dashboard items (pinned + recent) wired to Neon DB with empty-state for pinned — Completed
- Sidebar wired to Neon DB (item types with counts, collections favorites/recent with dominant-type circles, View all link) + COLLECTIONS group collapse toggle — Completed
