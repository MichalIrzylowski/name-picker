# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a small Next.js app built for fun, for family use — not a production or commercial product. Keep things simple and lightweight; no need for enterprise-grade rigor. Scaffolded with `create-next-app`; `src/app/page.tsx` still contains the default template content, so there is no name-picker feature logic yet — treat any request to build one as greenfield work within this scaffold.

## Architecture

- **App Router** under [src/app/](src/app/): [layout.tsx](src/app/layout.tsx) defines the root HTML shell (loads Geist fonts, applies global `min-h-full flex flex-col`), [page.tsx](src/app/page.tsx) is the home route.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` (see [postcss.config.mjs](postcss.config.mjs)), with global styles in [src/app/globals.css](src/app/globals.css). No `tailwind.config.*` file — v4 configures via CSS.
- **Path alias**: `@/*` maps to `src/*` (see [tsconfig.json](tsconfig.json)).

## Workflow

All changes must be made on a new branch — never commit directly to `main`. Open a PR for review before merging.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (MichalIrzylowski/name-picker), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
