# Project State

_Last updated: 2026-08-13 by orchestrator (Phase 3 complete)._

## Current Status

Phase 0 through Phase 3 complete. The app is now a fully interactive static ASCII-art converter: upload an image, adjust character ramp, font, brightness/contrast/gamma, invert, color/monochrome mode, and output width, all live-updating the on-screen render. Video/webcam/screen-share (Phase 4), PNG export/diagnostics (Phase 5), and the final polish pass (Phase 6) remain.

## What Exists in the Repository

- `CLAUDE.md`, `docs/{ARCHITECTURE,DECISIONS,TASKS,PROJECT_STATE,HANDOFF}.md`, `.claude/agents/*.md` — workflow scaffold.
- Working Vite + React + TypeScript app (`npm run dev/build/preview/lint/typecheck/test`), strict TS, ESLint flat config, Vitest.
- `src/renderer/`: `types.ts` (`AsciiRenderer`/`RenderSettings`/`RenderMetrics`), `grid.ts` (grid dimension math, DEC-015, now clamps both `cols` and `rows` to `[1, MAX_GRID_DIMENSION=2000]`), `canvas2d-renderer.ts` (`createCanvas2DRenderer()` — the v1 implementation, now guards non-finite/non-positive `fontSizePx` via `safeFontSizePx`).
- `src/processing/`: `luminance.ts` (DEC-012), `adjustments.ts` (brightness/contrast/gamma/invert, DEC-013), `char-ramp.ts` (5 presets + sanitized custom ramps, DEC-014). All pure, zero DOM/Canvas/React imports, 46 unit tests total across `processing/` + `grid.ts`.
- `src/sources/image-source.ts`: `loadImageSource`/`disposeImageSource` — file → `ImageBitmap` via `createImageBitmap(file, { imageOrientation: 'from-image' })`, plain functions rather than a `FrameSource` interface (DEC-016).
- `src/hooks/useAsciiRenderer.ts`: owns one `AsciiRenderer` instance per component lifetime, static-renders `source`/`settings` changes into an internally-owned canvas ref.
- `src/state/default-render-settings.ts`: `DEFAULT_RENDER_SETTINGS` — the initial value for `App.tsx`'s now-mutable settings `useState`, which `ControlsPanel` reads and writes.
- `src/components/{Header,UploadPanel,SourcePreview,AsciiOutput,ControlsPanel}.tsx` + `src/styles/app.css`: full Phase 2+3 layout — upload control, source preview, ASCII canvas output, and the settings controls panel (char ramp preset/custom, font family/size, brightness/contrast/gamma sliders, invert, color/monochrome toggle + monochrome color picker, output width).
- `src/App.tsx`: wires the above together; `handleFileSelected` guards against stale async responses on rapid re-upload via a request-generation counter; settings state is `useState<RenderSettings>(DEFAULT_RENDER_SETTINGS)` with a shallow-merge `handleSettingsChange` patch setter.
- `src/{export,diagnostics}/` still empty placeholders — later phases.
- `typescript` pinned to `~6.0.3` (see known risks).
- Git repository with Phase 0, Phase 1, and Phase 2 committed. **Phase 3 is validated and ready to commit** (see below).

## Current Active Task

No task in progress. Next up is **Phase 4** (`docs/TASKS.md` T4.1–T4.5: video file input source, rAF-based live render loop decoupled from React state per DEC-011, webcam source, screen-share source, FPS control).

## Latest Validation

Phase 3, 2026-08-13: `npm run lint`, `npm run typecheck`, `npm test` (46/46), `npm run build` — all passed, independently confirmed by both reviewer and verifier after one repair round (1 Important finding fixed: `outputWidthCols` had no upper-bound clamp, so a hand-typed extreme value could make `getImageData` allocate a pathological buffer and crash the whole app with no `ErrorBoundary` to catch it — fixed at the root in `grid.ts` via `MAX_GRID_DIMENSION`, not just the UI). Manual browser check performed via `claude-in-chrome`: every control exercised individually (ramp preset + custom text, font family + size, brightness/contrast/gamma + invert, color/monochrome toggle, output width at 10/60/120/999999-clamped) — all produced correct visual changes, no console errors, and the extreme-width case specifically confirmed the crash fix holds in the live app (slow render, ~733ms, but no crash) rather than relying on the unit test alone.

## Known Risks

- **TypeScript version pin** (`~6.0.3`) blocks upgrading to TS 7 until `typescript-eslint` catches up — watch upstream.
- **`getImageData` allocates a fresh buffer every `render()` call** (`canvas2d-renderer.ts`) — flagged by review as a perf watch-item against the 30fps target (DEC-008) once Phase 4's live render loop exists; not fixed since the Canvas 2D API has no in-place-reuse overload. Profile once live sources are wired up. Now compounded by the fact that grid size can be as large as `MAX_GRID_DIMENSION=2000` per axis — worth an early profiling pass once Phase 4 starts.
- **No `FrameSource` interface yet** (`src/sources/image-source.ts` is plain functions, DEC-016) — deliberately deferred until T4.1 adds a second source, so the interface's real shape is informed by two concrete implementations instead of guessed.
- **`useAsciiRenderer`'s render-then-`setState` pattern** (correct for Phase 2/3's one-shot static render) must **not** be copied into T4.2's rAF live-render-loop hook — that hook must drive the canvas via refs only, per DEC-011. Flagged by review as a note for whoever picks up T4.2, not a current bug.
- **No `ErrorBoundary` anywhere in the app** (`src/main.tsx` renders `<App/>` directly) — the `MAX_GRID_DIMENSION` fix removes the one known way to trigger an uncaught render-path exception, but there's still no safety net if a future change reintroduces one. Worth considering before Phase 4 adds more live-input failure modes (camera/screen-share errors already have their own required user-visible-message handling per T4.3/T4.4, but an `ErrorBoundary` is a separate, cheap backstop).
- **No debounce on Phase 3's sliders/number inputs** — every drag tick or keystroke triggers a full settings-state update and re-render. Fine for static images; worth watching once Phase 4's live rAF loop exists alongside these same controls (not a Phase 3 bug, just a forward note).
- Architectural risk to watch once Phase 4 (video/webcam/screen-share) starts: React re-renders leaking into the per-frame render loop (`docs/DECISIONS.md` DEC-011) and MediaStream track cleanup on unmount.
- Minor: `eslint.config.js`'s `ecmaVersion: 2020` vs. tsconfig's `target: "ES2022"` (harmless; fix opportunistically).

## Next Recommended Action

Delegate Phase 4 (T4.1–T4.5: video file input source, rAF-based live render loop, webcam source, screen-share source, FPS control) to the builder. Unlike Phase 3, these are NOT safe to bundle as one pass — T4.1 (video source) and T4.2 (render loop) are tightly coupled and should go together, but T4.3 (webcam) and T4.4 (screen-share) are each independent input sources with their own permission/error-handling surface and should be reviewed separately; T4.5 (FPS control) depends on T4.2 existing first. Recommend sequencing as T4.1+T4.2 together, then T4.3, then T4.4, then T4.5 — each its own builder→reviewer→verifier round given DEC-011's no-`setState`-per-frame constraint is the highest-risk architectural rule in the whole project and deserves focused review each time it's touched.
