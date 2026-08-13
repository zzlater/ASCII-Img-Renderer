# Project State

_Last updated: 2026-08-13 by orchestrator (Phase 2 complete)._

## Current Status

Phase 0, Phase 1, and Phase 2 complete. The app now renders on screen: uploading an image decodes it to an `ImageBitmap`, runs it through the Canvas 2D `AsciiRenderer`, and draws ASCII output live in the browser. The T1.5 manual smoke check deferred from Phase 1 is done.

## What Exists in the Repository

- `CLAUDE.md`, `docs/{ARCHITECTURE,DECISIONS,TASKS,PROJECT_STATE,HANDOFF}.md`, `.claude/agents/*.md` — workflow scaffold.
- Working Vite + React + TypeScript app (`npm run dev/build/preview/lint/typecheck/test`), strict TS, ESLint flat config, Vitest.
- `src/renderer/`: `types.ts` (`AsciiRenderer`/`RenderSettings`/`RenderMetrics`), `grid.ts` (grid dimension math, DEC-015), `canvas2d-renderer.ts` (`createCanvas2DRenderer()` — the v1 implementation).
- `src/processing/`: `luminance.ts` (DEC-012), `adjustments.ts` (brightness/contrast/gamma/invert, DEC-013), `char-ramp.ts` (5 presets + sanitized custom ramps, DEC-014). All pure, zero DOM/Canvas/React imports, 44 unit tests total across `processing/` + `grid.ts`.
- `src/sources/image-source.ts`: `loadImageSource`/`disposeImageSource` — file → `ImageBitmap` via `createImageBitmap(file, { imageOrientation: 'from-image' })`, plain functions rather than a `FrameSource` interface (DEC-016).
- `src/hooks/useAsciiRenderer.ts`: owns one `AsciiRenderer` instance per component lifetime, static-renders `source`/`settings` changes into an internally-owned canvas ref.
- `src/state/default-render-settings.ts`: `DEFAULT_RENDER_SETTINGS`, the Phase 2 static settings object (module-level constant, stable reference) that Phase 3's controls will read/write.
- `src/components/{Header,UploadPanel,SourcePreview,AsciiOutput}.tsx` + `src/styles/app.css`: the Phase 2 layout — upload control, source preview, ASCII canvas output.
- `src/App.tsx`: wires the above together; `handleFileSelected` guards against stale async responses on rapid re-upload via a request-generation counter.
- `src/{export,diagnostics}/` still empty placeholders — later phases.
- `typescript` pinned to `~6.0.3` (see known risks).
- Git repository with Phase 0, Phase 1, and Phase 2 committed.

## Current Active Task

No task in progress. Next up is **Phase 3** (`docs/TASKS.md` T3.1–T3.5: character ramp/font/brightness-contrast-gamma-invert/color-mode/output-width controls, wired to the existing settings state and pure `processing/` utilities).

## Latest Validation

Phase 2, 2026-08-13: `npm run lint`, `npm run typecheck`, `npm test` (44/44), `npm run build` — all passed, independently confirmed by both reviewer and verifier after one repair round (2 Important findings fixed: stale-async-response race on rapid re-upload, EXIF-orientation mismatch between source preview and ASCII output). Manual browser check performed via `claude-in-chrome`: upload → ASCII render round trip confirmed working, render-time readout populated, no console errors on load or after upload.

## Known Risks

- **TypeScript version pin** (`~6.0.3`) blocks upgrading to TS 7 until `typescript-eslint` catches up — watch upstream.
- **`fontSizePx` has no non-finite-input guard yet** in `grid.ts`'s call site (`canvas2d-renderer.ts`) — deliberately deferred since no real caller can reach it with `NaN`/`Infinity` until Phase 3 builds the font-size UI control. **Revisit when T3.2 (font control) lands** — add the guard then if the input can actually go non-finite (e.g. an unvalidated number field).
- **`getImageData` allocates a fresh buffer every `render()` call** (`canvas2d-renderer.ts`) — flagged by review as a perf watch-item against the 30fps target (DEC-008) once Phase 4's live render loop exists; not fixed since the Canvas 2D API has no in-place-reuse overload. Profile once live sources are wired up.
- **No `FrameSource` interface yet** (`src/sources/image-source.ts` is plain functions, DEC-016) — deliberately deferred until T4.1 adds a second source, so the interface's real shape is informed by two concrete implementations instead of guessed.
- **`useAsciiRenderer`'s render-then-`setState` pattern** (correct for Phase 2's one-shot static render) must **not** be copied into T4.2's rAF live-render-loop hook — that hook must drive the canvas via refs only, per DEC-011. Flagged by review as a note for whoever picks up T4.2, not a current bug.
- Architectural risk to watch once Phase 4 (video/webcam/screen-share) starts: React re-renders leaking into the per-frame render loop (`docs/DECISIONS.md` DEC-011) and MediaStream track cleanup on unmount.
- Minor: `eslint.config.js`'s `ecmaVersion: 2020` vs. tsconfig's `target: "ES2022"` (harmless; fix opportunistically).

## Next Recommended Action

Delegate Phase 3 (T3.1–T3.5: character preset/custom ramp control, font control, brightness/contrast/gamma/invert controls, color/monochrome toggle, output-width control) to the builder. All of these wire existing pure utilities (`src/processing/*`, already implemented and tested in Phase 1) and `DEFAULT_RENDER_SETTINGS`'s fields into new UI controls — no new processing logic should be needed, just state + component work.
