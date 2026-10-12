# Prompt log

AI tool: Claude Code (Claude Opus 5.5). Each entry has the verbatim prompt and a summary of the output. Raw session transcripts are exported at the end as a backup.

## Tools & plugins used

Only tools and plugins that actually took part in building this project. Rows are added as new ones are used.

| Name                 | What it is                                     | How it was used                                                                                                        |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Claude Code (Opus 5.5) | AI coding agent in the terminal              | Plan mode to agree on each step before acting; AskUserQuestion for the 4 stack decisions; read the assignment PDF; wrote docs, ran git and Bun. |
| `vercel` plugin      | Claude Code plugin with Next.js/Vercel guidance | Its session-start hook injected current Next.js and platform context and greenfield-project guidance.                  |
| `ponytail` plugin    | Claude Code plugin enforcing minimal changes   | Its session-start hook keeps changes minimal; shaped scope, e.g. deferring older filings (`filings.files[]`) and avoiding extra packages. |

---

## 1. Project kickoff (2026-10-12)

**Prompt**

> I am applying for this position https://quartr.com/careers/job/full-stack-engineer-data-tooling_8203880 and I have the assignment in @docs/Data_Tooling_-_Coding_Assignment.pdf
>
> Part of the tasks is to use AI to develop this system and I would like you to help me trace my work while working on these tasks. To start I would like to make this a monorepo with two projects one for a server that will serve as a mediator for the api and the nextjs application which will be responsible to render the frontend.
>
> Let's start creating a notes.md file as described in the assignment in docs I would like a requirements document (markdown file) and a claude md specifying the use of bun as a server and package manager, typescript, nextjs and some tooling like oxlint, prettier and something for logging.
>
> For the UI I am planning to use shadcn and incorporate into shadcn a Typography component that allows me to set tag, variant, size, color and weight.
>
> On the backend I think caching will be an important factor for this work so we are not constantly making api calls to the APIs

**Output summary**

- Read the assignment PDF; found Bun was not installed.
- Asked four clarifying questions. Answers: **Elysia** backend, **pino** logging, **in-memory TTL + `bun:sqlite`** cache (user considered Redis more realistic but chose SQLite so reviewers need no extra infra), curated **`docs/prompt-log.md`**.
- Proposed a plan: docs → monorepo scaffold → shadcn + Typography.

## 2. Narrow scope to requirements (2026-10-12)

**Prompt**

> I just installed bun, I would like you to add .gitignore file with the standard files for this kind of project. Also I would like on the claude.md to specify the use of conventional commit standard. Let's ignore step 2 and 3 because I want the requirement plan for now

**Output summary**

- Dropped scaffold and shadcn steps for now.
- Created:
  - `.gitignore` — Bun/Next.js/TS ignores, env files (keeps `.env.example`), local SQLite cache, editor/OS files.
  - `CLAUDE.md` — Bun-only, TS strict, Elysia + Eden, Next.js + shadcn + Typography, cache rules, EDGAR User-Agent/rate limit, oxlint/prettier/pino, **Conventional Commits**, prompt-log upkeep.
  - `docs/REQUIREMENTS.md` — BE-1..4, FE-1..2, filing shape, API contract, error codes, EDGAR rules, caching TTLs, Typography spec, extensions.
  - `NOTES.md` — status checklist, decisions & trade-offs, time log.
  - `docs/prompt-log.md` — this file.

## 3. Commit, verify Bun, implementation plan (2026-10-12)

**Prompt**

> commit and make sure the bun command works. After doing this I would like you to write up an implementation plan on how you think all of this will work together. It would be useful as well on the prompt log to present the usage of plugins

Follow-up while reviewing the plan:

> Only list list the tools and plugins that are used in the development of this project. Remove the estimations from the build order & time budget because they are unrealistic being that claude is much faster than those estimates

**Output summary**

- Committed the docs: `9fe6bd9 docs: add requirements, notes, claude guidelines and prompt log`.
- Bun 1.4.3 works (`bun -e` smoke test passed). It lives in `~/.bun/bin`, and `~/.zshrc` adds it to PATH, but the running Claude Code session started before the install, so it needs a restart to see `bun` on PATH.
- Created `docs/IMPLEMENTATION_PLAN.md`: request flow (browser → Next.js RSC → Eden → Elysia → EDGAR), repo layout, cache/throttle/error design, build order without time estimates, test plan.
- Added the "Tools & plugins used" table at the top of this log, listing only what was actually used.

**Plugins/skills used:** `vercel` and `ponytail` session hooks (context only).
