# Project State

_Last updated: 2026-08-12 by orchestrator (Phase 0 complete)._

## Current Status

Phase 0 (repository/application setup) is complete. The app builds, lints, type-checks, and has a working test harness, but contains no ASCII-rendering functionality yet — it's the default Vite scaffold.

## What Exists in the Repository

- `CLAUDE.md`, `docs/{ARCHITECTURE,DECISIONS,TASKS,PROJECT_STATE,HANDOFF}.md`, `.claude/agents/*.md` — workflow scaffold.
- A working Vite + React + TypeScript app: `package.json` (scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`), `tsconfig.json`/`tsconfig.app.json`/`tsconfig.node.json` (strict mode), `eslint.config.js` (flat config, TS + React Hooks rules), `.prettierrc`, `vite.config.ts` (with embedded Vitest config).
- `src/` populated with the default scaffold (`main.tsx`, `App.tsx`, `index.css`, `vite-env.d.ts`) plus a throwaway smoke test (`sum.ts`/`sum.test.ts` — **to be deleted in T1.2**) and the empty target structure from `docs/ARCHITECTURE.md`: `app/`, `components/`, `sources/`, `renderer/`, `processing/`, `export/`, `hooks/`, `state/`, `diagnostics/` (each currently just a `.gitkeep`).
- `typescript` is pinned to `~6.0.3` (not the registry `latest`, 7.0.2) because `typescript-eslint@8.x` doesn't yet support TS 7. Revisit this pin when `typescript-eslint` adds TS 7 support.
- Git repository with Phase 0 committed.

## Current Active Task

No task in progress. Next up is **T1.1** (`docs/TASKS.md`, Phase 1: define the `Renderer` interface), likely bundled with the rest of Phase 1 (T1.1–T1.5) as one builder pass since they're all foundational, tightly-coupled renderer-core code.

## Latest Validation

Phase 0, 2026-08-12: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — all passed (verified independently by both reviewer and verifier). `npm run dev` smoke-started successfully.

## Known Risks

- **TypeScript version pin** (`~6.0.3`) blocks upgrading to TS 7 until `typescript-eslint` catches up — watch upstream.
- Architectural risk to watch once Phase 4 (video/webcam/screen-share) starts: React re-renders leaking into the per-frame render loop (`docs/DECISIONS.md` DEC-011) and MediaStream track cleanup on unmount.
- Minor: `eslint.config.js`'s `ecmaVersion: 2020` is inconsistent with tsconfig's `target: "ES2022"` (harmless; fix opportunistically).

## Next Recommended Action

Delegate Phase 1 (T1.1–T1.5: `Renderer` interface, pure image-processing utilities, character-ramp mapping, grid/aspect-ratio math, Canvas 2D renderer implementation) to the builder, per `docs/TASKS.md`. Include deleting `src/sum.ts`/`src/sum.test.ts` in favor of real `src/processing/*.test.ts` coverage as part of that pass.
