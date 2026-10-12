# CLAUDE.md

Guidance for AI assistants working in this repo. Requirements: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). Design: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md). Decisions: [docs/DECISIONS.md](docs/DECISIONS.md) (append new ones). Step prompts: [docs/PROMPTS.md](docs/PROMPTS.md). Status: [NOTES.md](NOTES.md).

## Project

Quartr "Data Tooling" take-home: an API and UI over the SEC EDGAR submissions API.

Monorepo (Bun workspaces):

- `apps/server` — Elysia API that mediates and caches EDGAR calls.
- `apps/web` — Next.js (App Router) frontend.

## Stack rules

- **Bun** is the runtime and package manager. Use `bun install`, `bun add`, `bun run`, `bunx`. Never use npm, yarn or pnpm, and do not commit their lockfiles.
- **TypeScript** everywhere, `strict: true`. No `any`; use `unknown` and narrow.
- **Backend:** Elysia. Validate params/query with Elysia's `t` schemas. The web app calls the server through **Eden treaty** so types come from the server — do not duplicate DTOs.
- **Frontend:** Next.js App Router, **shadcn/ui** components, Tailwind. Use the shared `<Typography>` component for all text (props: `as`, `variant`, `size`, `color`, `weight`).
- **Caching:** EDGAR responses go through the server cache (in-memory TTL in front of `bun:sqlite`). Never call EDGAR from the web app.
- **EDGAR:** every request sends `User-Agent` from `SEC_USER_AGENT` env; stay under 10 req/s.

## Tooling

- Lint: **oxlint**. Format: **prettier**. Both must pass before committing.
- Logging: **pino** (with `pino-pretty` in dev). No `console.log` in committed code.

## Commands

TBD once scaffolded (dev, lint, format, typecheck, test).

## Commits

Use **Conventional Commits**: `<type>(<optional scope>): <summary>`

- Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`, `ci`, `style`.
- Scopes: `server`, `web`, `repo`, `docs`.
- Examples: `feat(server): add filings endpoint`, `docs: update prompt log`.
- Imperative mood, lowercase summary, no trailing period. Breaking changes use `!` (`feat(server)!: ...`).

## Prompt log

The submission must include the AI prompt log. After each prompt, append an entry to [docs/prompt-log.md](docs/prompt-log.md) with the verbatim prompt and a short summary of the output (files touched, decisions made).
