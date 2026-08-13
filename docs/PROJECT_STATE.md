# Project State

_Last updated: 2026-08-12 by orchestrator (Phase 1 complete)._

## Current Status

Phase 0 and Phase 1 complete. The app has a working `AsciiRenderer` (Canvas 2D implementation) and all its supporting pure utilities, fully unit-tested — but nothing renders to screen yet, since no UI wires a source or the renderer into `App.tsx`. That's Phase 2.

## What Exists in the Repository

- `CLAUDE.md`, `docs/{ARCHITECTURE,DECISIONS,TASKS,PROJECT_STATE,HANDOFF}.md`, `.claude/agents/*.md` — workflow scaffold.
- Working Vite + React + TypeScript app (`npm run dev/build/preview/lint/typecheck/test`), strict TS, ESLint flat config, Vitest.
- `src/renderer/`: `types.ts` (`AsciiRenderer`/`RenderSettings`/`RenderMetrics`), `grid.ts` (grid dimension math, DEC-015), `canvas2d-renderer.ts` (`createCanvas2DRenderer()` — the v1 implementation).
- `src/processing/`: `luminance.ts` (DEC-012), `adjustments.ts` (brightness/contrast/gamma/invert, DEC-013), `char-ramp.ts` (5 presets + sanitized custom ramps, DEC-014). All pure, zero DOM/Canvas/React imports, 44 unit tests total across `processing/` + `grid.ts`.
- `src/{app,components,sources,export,hooks,state,diagnostics}/` still empty placeholders — Phase 2+ territory.
- `src/App.tsx`/`main.tsx` still the default Vite scaffold — nothing wired up yet.
- `typescript` pinned to `~6.0.3` (see known risks).
- Git repository with Phase 0 and Phase 1 committed.

## Current Active Task

No task in progress. Next up is **Phase 2** (`docs/TASKS.md` T2.1–T2.3: image upload source, wiring the renderer through to an on-screen canvas, basic layout) — the first phase that produces a visible, demoable app.

## Latest Validation

Phase 1, 2026-08-12: `npm run lint`, `npm run typecheck`, `npm test` (44/44), `npm run build` — all passed, independently confirmed by both reviewer and verifier after one repair round.

## Known Risks

- **TypeScript version pin** (`~6.0.3`) blocks upgrading to TS 7 until `typescript-eslint` catches up — watch upstream.
- **`fontSizePx` has no non-finite-input guard yet** in `grid.ts`'s call site (`canvas2d-renderer.ts`) — deliberately deferred by the Phase 1 repair since no real caller can reach it with `NaN`/`Infinity` until Phase 3 builds the font-size UI control. **Revisit when T3.2 (font control) lands** — add the guard then if the input can actually go non-finite (e.g. an unvalidated number field).
- **`getImageData` allocates a fresh buffer every `render()` call** (`canvas2d-renderer.ts`) — flagged by review as a perf watch-item against the 30fps target (DEC-008) once Phase 4's live render loop exists; not fixed since the Canvas 2D API has no in-place-reuse overload. Profile once live sources are wired up.
- Architectural risk to watch once Phase 4 (video/webcam/screen-share) starts: React re-renders leaking into the per-frame render loop (`docs/DECISIONS.md` DEC-011) and MediaStream track cleanup on unmount.
- Minor: `eslint.config.js`'s `ecmaVersion: 2020` vs. tsconfig's `target: "ES2022"` (harmless; fix opportunistically).

## Next Recommended Action

Delegate Phase 2 (T2.1–T2.3: image upload input source, wiring it through `createCanvas2DRenderer()` to an on-screen `<canvas>`, and a minimal upload-panel + output-canvas layout in `App.tsx`) to the builder. This is the first phase where a manual browser smoke check (deferred from T1.5) becomes possible and should be part of the reviewer's checklist.
