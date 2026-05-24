# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`/backend`)
```bash
npm start          # Run dev server (tsx, port 8080)
npm run build      # TypeScript compilation
npm run test       # Vitest test suite
npm run coverage   # Test coverage report
npm run seed       # Seed the database via Prisma
npx prisma migrate dev   # Run DB migrations
npx prisma studio        # Open Prisma Studio GUI
```

### Frontend (`/frontend`)
```bash
npm run dev        # Vite dev server
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm run storybook  # Storybook on port 6006
npm run start:all  # Run dev + storybook in parallel
```

## Architecture

This is a monorepo with a separate `frontend/` and `backend/` directory — no shared packages or root-level scripts tie them together.

### Backend — Fastify + Prisma

- **Entry point**: `backend/index.ts` — creates the Fastify server, registers plugins, mounts routes, and sets a global error handler that maps Prisma error codes (e.g. `P2025` → 404).
- **Routes**: `backend/routes/` — each file exports a Fastify plugin. Currently only `users.ts` exists. Routes are mounted with a prefix in `index.ts`.
- **Schemas**: `backend/schemas/` — holds Prisma `select` objects used to shape API responses (avoid over-fetching). Keep response shape definitions here, not inline in route handlers.
- **Database**: PostgreSQL via Prisma ORM. The Prisma client is generated into `backend/generated/prisma/`. The schema at `backend/prisma/schema.prisma` defines 8 models: `User`, `Profile`, `Message`, `MessageStatus`, `ChatRoom`, `ChatRoomMember`, `Friend`, and enums `ChatRoomType` (DM/GROUP) and `ChatRoomRole` (ADMIN/MEMBER/BLOCKED).
- **Tests**: `backend/__test__/routes/` — Vitest, configured in `backend/vite.config.ts` to match `**/*.test.ts` in `__test__/`.
- **Env**: `backend/.env` sets `DATABASE_URL` pointing to a local PostgreSQL database named `howdi`, user `chat_app_dev`.

### Frontend — React 19 + TanStack Router + Vite

- **Routing**: TanStack Router with file-based routing under `frontend/src/routes/`. The Vite plugin auto-generates route types — adding a new file to `routes/` creates a new page.
- **UI components**: ShadCN primitives built on Radix UI, stored in `frontend/src/components/ui/`. Add new primitives with the ShadCN CLI; don't hand-edit the generated files.
- **Styling**: Tailwind CSS v4, configured via the Vite plugin (no separate `tailwind.config.js`).
- **Path alias**: `@/` maps to `frontend/src/` — use this for all non-relative imports.
- **State**: Zustand is installed but not yet wired up. Auth state will live there.
- **Storybook**: Stories live alongside components in `frontend/src/stories/`. Vitest is integrated into Storybook.

### Data flow

The frontend calls the Fastify REST API on port 8080. Authentication is not yet implemented — routes that require auth are marked with `// TODO: requires auth` in `backend/routes/users.ts`.

## Branch naming

`issue_{issue_no}_{backend|frontend}_{task_name}` (e.g. `issue_29_backend_get_user_api`)
