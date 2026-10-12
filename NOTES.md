# NOTES

## Status

- [x] Requirements, AI guidelines and prompt log
- [ ] Monorepo scaffold (Bun workspaces, oxlint, prettier)
- [ ] Server: EDGAR client + cache
- [ ] Server: `GET /companies/:ticker/filings`
- [ ] Server: `GET /filings/summary`
- [ ] Web: filings list
- [ ] Web: summary view
- [ ] Run instructions in README

## Decisions & trade-offs

- **Monorepo (Bun workspaces):** server and web live side by side; the web app imports the server's types via Eden treaty, so the API contract has one source of truth.
- **Elysia on Bun:** Quartr's own stack; typed routes and built-in validation.
- **Next.js for the React frontend:** App Router + server components keep data fetching on the server; shadcn/ui for components. Plain Vite + React would also work and be lighter.
- **Cache: in-memory + `bun:sqlite`:** no extra infrastructure for reviewers and survives restarts. Redis would be the production choice for a multi-instance deployment.
- **pino** for structured logs.

## What's missing & how I'd finish it

_TBD_

## Time log

| Step                         | Time |
| ---------------------------- | ---- |
| Requirements & repo docs     |      |
