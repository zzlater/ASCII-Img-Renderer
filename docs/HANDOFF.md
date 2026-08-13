# Handoff Template

Copy this section to the top of the "Handoff Log" below every time a session ends with completed or in-progress work. Keep entries newest-first.

## Before editing anything, the next session must

1. Read `CLAUDE.md` in full.
2. Read `docs/PROJECT_STATE.md`.
3. Read `docs/TASKS.md` and note the current active task's status.
4. Run `git log --oneline -10` to see recent history.

Only after those four steps should any edit be made.

---

## Handoff Entry Template

```
### Handoff — <date>

**Task ID:** <e.g. T1.3>

**What changed:**
- <bullet summary>

**Files modified:**
- <path> — <one line on what/why>

**Important technical decisions:**
- <anything decided during this task not already in docs/DECISIONS.md, or a pointer to a new DEC-NNN entry>

**Commands run and result:**
- `<command>` — <pass/fail, one-line summary>

**Known issues / risks:**
- <anything left unresolved, flaky, or worth a reviewer's attention>

**Exact next task recommended:**
- <Task ID from docs/TASKS.md, and why it's next>
```

---

## Handoff Log

### Handoff — 2026-08-12 (Phase 1 complete)

**Task ID:** T1.1, T1.2, T1.3, T1.4, T1.5 — all Complete

**What changed:**
- Implemented the `AsciiRenderer` interface (`src/renderer/types.ts`), pure image-processing utilities (`src/processing/{luminance,adjustments,char-ramp}.ts`), grid dimension math (`src/renderer/grid.ts`), and the Canvas 2D renderer (`src/renderer/canvas2d-renderer.ts`).
- Deleted the Phase 0 throwaway `src/sum.ts`/`src/sum.test.ts`, superseded by 44 real unit tests.
- Updated `docs/ARCHITECTURE.md`'s "Renderer Abstraction" snippet to match the final interface.
- Builder → reviewer (2 Important findings, no Blockers) → repair builder (both fixed) → verifier (PASS) all completed.

**Files modified:**
- New: `src/renderer/{types,grid,canvas2d-renderer}.ts`, `src/renderer/grid.test.ts`, `src/processing/{luminance,adjustments,char-ramp}.ts` + matching `*.test.ts`.
- Deleted: `src/sum.ts`, `src/sum.test.ts`.
- Modified: `docs/ARCHITECTURE.md` (Renderer Abstraction section).

**Important technical decisions:**
- DEC-012 (Rec. 601 luminance), DEC-013 (adjustment pipeline order/ranges), DEC-014 (dense-first char-ramp convention), DEC-015 (grid dimension formula) — all newly recorded in `docs/DECISIONS.md`.
- The task spec's original luminance-to-char-index formula was self-inconsistent with its own stated convention; the builder caught this and implemented the corrected, self-consistent version instead — verified by the reviewer via hand-traced examples.

**Commands run and result:**
- `npm run lint` — PASS. `npm run typecheck` — PASS. `npm test` — PASS (44/44). `npm run build` — PASS.
- All four independently re-run and confirmed by both reviewer and verifier at each stage (initial pass and post-repair).

**Known issues / risks:**
- Two Important bugs found and fixed during repair: (1) offscreen sample canvas wasn't cleared before `drawImage`, causing alpha-ghosting for transparent PNG sources; (2) `computeGridDimensions` didn't guard against non-finite `outputWidthCols`, risking an uncaught `IndexSizeError`. Both fixed and covered by new tests.
- `fontSizePx` still has no non-finite-input guard at its `grid.ts` call site — deliberately deferred since no real caller can reach it with `NaN` until Phase 3's font-size control exists. **Revisit at T3.2.**
- `getImageData` allocates a fresh buffer every `render()` call — flagged as a perf watch-item for Phase 4's live render loop, not fixed (no in-place-reuse API available).
- Nothing renders to screen yet — `App.tsx` is still the default Vite scaffold. T1.5's manual smoke check is deferred to T2.x.

**Exact next task recommended:**
- **T2.1–T2.3** (Phase 2: image upload input source, wiring `createCanvas2DRenderer()` to an on-screen canvas, minimal upload-panel + output-canvas layout) — first phase that produces a visible, demoable app and enables the deferred manual smoke check.

---

### Handoff — 2026-08-12 (Phase 0 complete)

**Task ID:** T0.1, T0.2, T0.3, T0.4, T0.5 — all Complete

**What changed:**
- Scaffolded Vite + React + TypeScript (hand-written; the CLI generator won't run non-interactively in a non-empty directory).
- Added ESLint (flat config) + Prettier + TypeScript strict mode.
- Added Vitest with a throwaway smoke test.
- Created the `src/` folder structure from `docs/ARCHITECTURE.md`.
- Synced `CLAUDE.md`'s Development Commands section to the real `package.json` scripts.
- Builder → reviewer (no blockers/material findings) → verifier (PASS) all completed; see `docs/TASKS.md` per-task notes for details.

**Files modified:**
- New: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/sum.ts`, `src/sum.test.ts`, `src/{app,components,sources,renderer,processing,export,hooks,state,diagnostics}/.gitkeep`.
- Modified: `CLAUDE.md` (Development Commands section), `.gitignore` (added `.claude/scheduled_tasks.lock`).

**Important technical decisions:**
- `typescript` pinned to `~6.0.3`, not registry `latest` (7.0.2) — `typescript-eslint@8.x` peer range excludes TS 7. Revisit when upstream adds support.
- `eslint-plugin-react-hooks` flat config must come from `reactHooks.configs.flat['recommended-latest']`, not the top-level key (confirmed by reviewer via package source inspection).

**Commands run and result:**
- `npm install` — 178 packages, 0 vulnerabilities.
- `npm run lint` — PASS (clean).
- `npm run typecheck` — PASS (clean).
- `npm test` — PASS (1/1).
- `npm run build` — PASS, `dist/` produced.
- All four independently re-run and confirmed by both reviewer and verifier, not just the builder's self-report.

**Known issues / risks:**
- `src/sum.ts`/`src/sum.test.ts` are placeholder smoke-test files — delete as part of T1.2 once real `src/processing/*.test.ts` coverage exists.
- `eslint.config.js`'s `ecmaVersion: 2020` vs. tsconfig `target: "ES2022"` mismatch — harmless, fix opportunistically.
- TypeScript version pin (above) — watch `typescript-eslint` for TS 7 support.

**Exact next task recommended:**
- **T1.1–T1.5** (Phase 1: Renderer interface, pure image-processing utilities, char-ramp mapping, grid/aspect-ratio math, Canvas 2D renderer) — bundle as one builder pass, same rationale as Phase 0 (tightly-coupled foundational code, not independently reviewable increments).

---

### Handoff — 2026-08-12

**Task ID:** none (workflow scaffold only)

**What changed:**
- Created the orchestrator/builder/reviewer/verifier workflow: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/PROJECT_STATE.md`, `docs/HANDOFF.md`, and `.claude/agents/*.md`.
- Initialized the Git repository.

**Files modified:**
- All files listed above — new.

**Important technical decisions:**
- See `docs/DECISIONS.md` DEC-001 through DEC-011.

**Commands run and result:**
- `git init` and initial commit — see git log.

**Known issues / risks:**
- None yet; no application code exists.

**Exact next task recommended:**
- **T0.1** — Initialize Vite + React + TypeScript project (`docs/TASKS.md`, Phase 0).
