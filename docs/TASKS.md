# Tasks

Status values: `Not started`, `In progress`, `Needs review`, `Needs repair`, `Complete`.

Only the orchestrator may set a task to `Complete` (see `CLAUDE.md`). Builders set `Needs review`. When updating this file, also update `docs/PROJECT_STATE.md`'s "Current Active Task".

---

## Phase 0 — Repository / Application Setup

### T0.1 — Initialize Vite + React + TypeScript project
**Status:** Complete
**Objective:** Scaffold the app with `npm create vite@latest . -- --template react-ts` (or equivalent), producing a running dev server.
**Files/modules:** `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`.
**Acceptance criteria:** `npm run dev` serves a blank/default app; `npm run build` succeeds; repo has a `.gitignore` covering `node_modules`/`dist`.
**Required validation:** `npm install`, `npm run build`.
**Notes:** The Vite CLI generator refuses to run non-interactively in a non-empty directory (this repo already had docs/.claude/.git), so the scaffold was hand-written to match current `create-vite` output (project-references tsconfig, flat ESLint config). `typescript` pinned to `~6.0.3` — `typescript-eslint@8.x`'s peer range excludes the registry's `latest` (7.0.2).

### T0.2 — Configure ESLint, Prettier, and TypeScript strict mode
**Status:** Complete
**Objective:** Add lint config (TypeScript + React rules) and enable `strict: true` in `tsconfig.json`.
**Files/modules:** `.eslintrc*` or `eslint.config.*`, `.prettierrc*`, `tsconfig.json`.
**Acceptance criteria:** `npm run lint` runs clean on the scaffold; strict mode enabled with no suppressed errors.
**Required validation:** `npm run lint`, `npm run typecheck` (or `tsc --noEmit`).
**Notes:** `eslint-plugin-react-hooks` flat-config export lives at `reactHooks.configs.flat['recommended-latest']`, not the top-level key — reviewer confirmed this is load-bearing, not cosmetic. Nice-to-have from review: `eslint.config.js` sets `ecmaVersion: 2020` vs. tsconfig's `target: "ES2022"` — harmless, bump next time this file is touched.

### T0.3 — Set up Vitest
**Status:** Complete
**Objective:** Add Vitest (+ React Testing Library if component tests are anticipated) and one smoke test.
**Files/modules:** `vite.config.ts` (test block) or `vitest.config.ts`, `package.json` scripts, one `*.test.ts` smoke test.
**Acceptance criteria:** `npm test` runs and passes the smoke test.
**Required validation:** `npm test`.
**Notes:** Used a throwaway pure-function smoke test (`src/sum.ts`/`src/sum.test.ts`) instead of a React Testing Library render test, so jsdom/RTL weren't added before they're actually needed. **Delete `src/sum.ts`/`src/sum.test.ts` as part of T1.2**, once real pure-function tests exist under `src/processing/`.

### T0.4 — Establish base folder structure
**Status:** Complete
**Objective:** Create the empty directory structure proposed in `docs/ARCHITECTURE.md` (`src/sources`, `src/renderer`, `src/processing`, `src/export`, `src/components`, `src/hooks`, `src/state`, `src/diagnostics`) with a placeholder or `index.ts` where needed so the structure survives Git.
**Files/modules:** `src/**`.
**Acceptance criteria:** Structure matches `docs/ARCHITECTURE.md`; build still passes.
**Required validation:** `npm run build`.

### T0.5 — Document real dev commands in CLAUDE.md
**Status:** Complete
**Objective:** Once `package.json` scripts exist (T0.1–T0.3), replace the placeholder command block in `CLAUDE.md` with the actual scripts.
**Files/modules:** `CLAUDE.md`.
**Acceptance criteria:** Commands listed in `CLAUDE.md` match `package.json` `scripts` exactly.
**Required validation:** Manual diff of `CLAUDE.md` against `package.json`.

---

## Phase 1 — Renderer Core and Pure Utilities

### T1.1 — Define the Renderer interface
**Status:** Complete
**Objective:** Implement `src/renderer/types.ts` with the `Renderer`/`RenderSettings` shapes from `docs/ARCHITECTURE.md`.
**Files/modules:** `src/renderer/types.ts`.
**Acceptance criteria:** Interface compiles; documented with the fields needed for color/mono, char ramp, font metrics.
**Required validation:** `npm run typecheck`.
**Notes:** Final shape is `AsciiRenderer` with a single `render(source, target, settings)` method (no separate `configure`/`resize`) — see `docs/ARCHITECTURE.md` "Renderer Abstraction".

### T1.2 — Pure image-processing utilities: luminance and adjustments
**Status:** Complete
**Objective:** Implement `src/processing/luminance.ts` and `src/processing/adjustments.ts` (brightness/contrast/gamma/invert) as pure functions on pixel data.
**Files/modules:** `src/processing/luminance.ts`, `src/processing/adjustments.ts`, matching `*.test.ts`.
**Acceptance criteria:** No DOM/Canvas/React imports in these files; documented input/output ranges.
**Required validation:** `npm test`, `npm run typecheck`.
**Notes:** Formulas and ranges locked in as DEC-012/DEC-013. `src/sum.ts`/`src/sum.test.ts` deleted, superseded by these real tests.

### T1.3 — Character ramp mapping utility
**Status:** Complete
**Objective:** Implement `src/processing/char-ramp.ts`: luminance → character lookup, at least one built-in preset ramp, and support for a custom user-supplied ramp string.
**Files/modules:** `src/processing/char-ramp.ts`, `*.test.ts`.
**Acceptance criteria:** Pure function(s); handles empty/invalid custom ramp input without throwing.
**Required validation:** `npm test`.
**Notes:** All 5 product-facing presets implemented now (classic/blocks/minimal/binary/detailed), not deferred to Phase 3 — Phase 3's UI just references these constants. Ramp convention locked in as DEC-014.

### T1.4 — Grid/sampling math
**Status:** Complete
**Objective:** Implement `src/renderer/grid.ts`: given output width, source aspect ratio, and font-cell aspect ratio, compute grid columns/rows (DEC-010).
**Files/modules:** `src/renderer/grid.ts`, `*.test.ts`.
**Acceptance criteria:** Pure function; covered by unit tests for at least landscape, portrait, and square source aspect ratios.
**Required validation:** `npm test`.
**Notes:** Formula locked in as DEC-015, including a non-finite-input guard added during repair (review found `NaN` `outputWidthCols` wasn't clamped).

### T1.5 — Canvas 2D renderer implementation
**Status:** Complete
**Objective:** Implement `src/renderer/canvas2d-renderer.ts` implementing `Renderer` from T1.1, composing T1.2–T1.4 to sample a `CanvasImageSource` and draw characters to an output canvas.
**Files/modules:** `src/renderer/canvas2d-renderer.ts`.
**Acceptance criteria:** Implements the full `Renderer` interface; no direct DOM manipulation outside the target canvas passed in; disposes cleanly.
**Required validation:** `npm run typecheck`, `npm test` (any testable sub-logic extracted to pure functions), manual smoke check once T2.x wires it to UI.
**Notes:** Reuses an offscreen sampling canvas and cached font-cell metrics across calls (no rAF loop or FPS throttling here — that's T4.2's job). Review caught a real alpha-ghosting bug (offscreen canvas wasn't cleared before `drawImage`) — fixed in repair. DPI handled via `devicePixelRatio`-scaled backing store + CSS size. **Deferred manual smoke check to T2.x** (nothing renders to screen until Phase 2 wires this to UI).

---

## Phase 2 — Image Input and Static Rendering

### T2.1 — Image upload input source
**Status:** Complete
**Objective:** Implement `src/sources/image-source.ts`: accept a file via `<input type="file">`, decode to `ImageBitmap`/`HTMLImageElement`, expose a minimal `FrameSource` interface.
**Files/modules:** `src/sources/image-source.ts`, `src/sources/types.ts`.
**Acceptance criteria:** Handles common formats (PNG/JPEG/WebP); releases any object URL created.
**Required validation:** `npm run typecheck`, manual test with a sample image.
**Notes:** Implemented as plain standalone functions (`loadImageSource`/`disposeImageSource`), not a `FrameSource` interface — deliberate deviation from `docs/ARCHITECTURE.md`'s proposed shape, recorded as DEC-016. Revisit at T4.1 once a second source exists to extract a real shared interface from. `createImageBitmap` called with `{ imageOrientation: 'from-image' }` so EXIF-rotated JPEGs match the `<img>` preview's orientation (repair, see review round below). Manual test: uploaded a generated PNG in Chrome via `claude-in-chrome` — decoded and rendered correctly, no console errors.

### T2.2 — Wire static image through renderer to canvas output
**Status:** Complete
**Objective:** Connect T2.1's source through the Canvas2D renderer (T1.5) to an on-screen `<canvas>`, one static render on image load.
**Files/modules:** `src/hooks/` (new hook), `src/components/` (output canvas host).
**Acceptance criteria:** Uploading an image renders ASCII output on screen at default settings.
**Required validation:** `npm run build`, manual browser check.
**Notes:** Manual browser check performed 2026-08-13: uploaded a test PNG, ASCII output rendered on canvas (colored glyphs matching source gradient), header render-time readout showed a real value (15.8ms) instead of the empty-state dash, no console errors on load or after upload.

### T2.3 — Basic layout: upload panel + output canvas
**Status:** Complete
**Objective:** Minimal `App.tsx` layout: upload control on one side, output canvas on the other. No styling polish required yet.
**Files/modules:** `src/App.tsx`, `src/components/`.
**Acceptance criteria:** Usable end-to-end path: pick image file → see ASCII output.
**Required validation:** Manual browser check.
**Notes:** `Header`/`UploadPanel`/`SourcePreview`/`AsciiOutput` split out as separate components; full pick-file → ASCII-output path confirmed working in the T2.2 manual browser check above.

---

## Phase 3 — Controls and Visual Customization

### T3.1 — Character preset / custom ramp control
**Status:** Complete
**Objective:** UI control to pick a built-in preset ramp or enter a custom ramp string, wired to T1.3 and settings state.
**Files/modules:** `src/components/`, `src/state/`.
**Acceptance criteria:** Changing the ramp updates rendered output; invalid custom input doesn't crash the app.
**Required validation:** Manual browser check.
**Notes:** Implemented in `src/components/ControlsPanel.tsx` — preset `<select>` over `CHAR_RAMPS` plus a custom-ramp text input sanitized via `sanitizeCustomRamp` before reaching `settings.charRamp`. The text input mirrors raw user input locally (not the sanitized value) so the field doesn't snap back to the classic preset while being cleared/retyped. Manual check: switched preset to `blocks`, typed a custom ramp (`@#+. `) — output visibly changed both times, preset `<select>` correctly flipped to "Custom" on manual entry, no console errors.

### T3.2 — Font control
**Status:** Complete
**Objective:** Font family/size control that updates the cell aspect ratio used by T1.4's grid math.
**Files/modules:** `src/components/`, `src/state/`, `src/renderer/grid.ts` (consumer wiring only).
**Acceptance criteria:** Changing font updates grid dimensions and visual output correctly (no distortion).
**Required validation:** Manual browser check across at least 2 fonts.
**Notes:** Font-family `<select>` (System Monospace/Consolas/Courier New/Menlo/Lucida Console — hardcoded cross-platform stacks, no web-font network dependency) and a font-size number input in `ControlsPanel.tsx`. Added `safeFontSizePx` guard in `canvas2d-renderer.ts` (falls back to 15px default on non-finite/non-positive input) since a real number input can now produce `NaN` — this was the risk `PROJECT_STATE.md` flagged as deferred from Phase 1. Manual check: switched System Monospace → Consolas and 15px → 26px — output re-rendered correctly at each step, grid size adjusted, no distortion, no console errors.

### T3.3 — Brightness / contrast / gamma / invert controls
**Status:** Complete
**Objective:** UI sliders/toggle wired to T1.2's pure adjustment functions via settings state.
**Files/modules:** `src/components/`, `src/state/`.
**Acceptance criteria:** Each control visibly affects output independently; values stay within documented valid ranges.
**Required validation:** Manual browser check.
**Notes:** Range inputs at DEC-013's exact ranges (brightness `[-1,1]`, contrast `[0,2]`, gamma `(0,~3]`) plus an invert checkbox, in `ControlsPanel.tsx`. Manual check: set brightness 0.50, contrast 1.60, gamma 2.20, checked invert — output visibly changed after each, no console errors.

### T3.4 — Color / monochrome mode toggle
**Status:** Complete
**Objective:** Toggle between color and monochrome rendering (DEC-006), wired into the renderer's `RenderSettings`.
**Files/modules:** `src/components/`, `src/renderer/canvas2d-renderer.ts` (consumer of existing interface, no interface change if avoidable).
**Acceptance criteria:** Both modes render correctly; switching doesn't require reloading the source.
**Required validation:** Manual browser check.
**Notes:** No `RenderSettings`/renderer interface changes needed — `colorMode`/`monochromeColor` already existed since T1.1. `ControlsPanel.tsx` conditionally shows a monochrome-color `<input type="color">` only when `colorMode === 'monochrome'`. Manual check: toggled to Monochrome — color picker appeared, output switched to grayscale glyphs immediately without re-uploading the source image, no console errors.

### T3.5 — Output width / grid size control
**Status:** Complete
**Objective:** UI control for output width (characters), driving T1.4's grid math (DEC-010).
**Files/modules:** `src/components/`, `src/state/`.
**Acceptance criteria:** Height always derives correctly from width + aspect ratios; no manual height input exposed.
**Required validation:** Manual browser check at low/medium/high width values.
**Notes:** Number input for `outputWidthCols`, no height input anywhere. Review caught a real Important bug here: the input's `min`/`max` HTML attributes don't block direct keyboard entry, so a hand-typed extreme value reached `computeGridDimensions` unclamped and could make `getImageData` allocate a pathological buffer — with no `ErrorBoundary` in the tree, this would crash the whole app to a blank page. Fixed at the root (`src/renderer/grid.ts`, not just the UI) by adding `MAX_GRID_DIMENSION = 2000`, clamping both `cols` and `rows`. Manual check confirmed the live fix, not just the unit tests: typed `10` (0.6ms render, correct small output), `60` (correct), and `999999` (clamped internally, rendered in 733ms — slow but no crash, no console errors) — the exact scenario the bug report described no longer breaks the app.

---

## Phase 4 — Video / Webcam / Screen-Share Lifecycle

### T4.1 — Video file input source
**Status:** Complete
**Objective:** Implement `src/sources/video-source.ts`: load a video file into an `HTMLVideoElement`, handle play/pause, expose current-frame access.
**Files/modules:** `src/sources/video-source.ts`.
**Acceptance criteria:** Cleans up (`src = ''`, listeners removed) on unmount or source change.
**Required validation:** `npm run typecheck`, manual test with a sample video file.
**Notes:** `loadVideoSource`/`disposeVideoSource` point a React-owned, always-mounted `<video>` element (see T2.3-pattern `SourcePreview.tsx`) at a `File`; a `WeakMap<HTMLVideoElement, string>` tracks the object URL each element owns so it can be revoked precisely. Repair round added an `abort` listener (alongside `loadedmetadata`/`error`) so a preempted load — e.g. a rapid re-pick, or `disposeVideoSource` clearing `src` mid-load — doesn't leave the one-shot listener pair dangling; reviewer had flagged this as a literal gap against the "listeners removed... on source change" criterion. **Manual video-playback verification is incomplete** — see the note at the bottom of this task's block and `docs/PROJECT_STATE.md`'s Known Risks for the full explanation (a browser-automation environment limitation, not an app defect).

### T4.2 — rAF-based render loop decoupled from React state
**Status:** Complete
**Objective:** Implement the live render loop (hook in `src/hooks/`) that calls the renderer every frame via `requestAnimationFrame` and refs only — per DEC-011, no `setState` in the per-frame path.
**Files/modules:** `src/hooks/` (new render-loop hook).
**Acceptance criteria:** Verified (by code inspection and a reviewer pass) that no component re-render is triggered per frame; loop starts/stops cleanly with source lifecycle.
**Required validation:** `npm run typecheck`, manual browser check with a playing video, reviewer sign-off on the no-setState-per-frame requirement.
**Notes:** `useLiveVideoRenderer` owns its own `AsciiRenderer` instance and canvas, keeps settings in a ref (updated via a mount+update effect, never read from the render-body closure), and gates the rAF loop on the video's own `play`/`pause`/`ended` events rather than running unconditionally. Reviewer sign-off obtained: closures in the effect were traced by hand and confirmed `cancelAnimationFrame` always cancels the correct, up-to-date scheduled frame, and confirmed zero `setState` calls anywhere in the `tick()` path or its callees. **Manual browser check with a playing video could not be completed** — three different video files (two synthesized, one copied from a genuine Windows system file, `oobe-intro.mp4`) all failed to decode in this session's `claude-in-chrome` automated browser: `readyState` never advanced past `0` (`HAVE_NOTHING`), even for a plain HTTP-served file loaded into a fresh, app-code-free `<video>` element in a brand-new tab — conclusively an automated-browser-environment media-pipeline limitation (confirmed via `canPlayType()` reporting full codec support, a successful `fetch()` of the exact bytes, and the failure reproducing identically with zero app code involved), not an app defect. What *was* verified live: both file inputs accept files and update the UI correctly, the source badge and filename reflect the active source, and — most relevant to this task's cleanup logic — switching to an image while a video load was stuck pending correctly triggered `disposeVideoSource` mid-flight with no console errors, exercising the exact cross-source-cleanup path by hand. **Recommend a follow-up manual spot-check** (upload a real video, confirm ASCII output updates on play, pauses on pause) next time this repo is opened in a normal (non-automated) browser.

### T4.3 — Webcam input source
**Status:** Not started
**Objective:** Implement `src/sources/webcam-source.ts` using `getUserMedia`; handle permission denial and device-not-found errors; stop all tracks on cleanup.
**Files/modules:** `src/sources/webcam-source.ts`.
**Acceptance criteria:** Permission errors surface as a user-visible message, not a silent failure or unhandled rejection; all tracks stopped on unmount/source switch.
**Required validation:** Manual browser check (grant + deny permission paths).

### T4.4 — Screen-share input source
**Status:** Not started
**Objective:** Implement `src/sources/screen-share-source.ts` using `getDisplayMedia`; handle the user ending the share from the browser's own UI (track `ended` event), not just component unmount.
**Files/modules:** `src/sources/screen-share-source.ts`.
**Acceptance criteria:** Ending the share from the browser chrome (not the app) is detected and the app returns to a clean idle state.
**Required validation:** Manual browser check, including ending the share externally.

### T4.5 — FPS control / render loop throttle
**Status:** Not started
**Objective:** User-facing FPS control that throttles T4.2's render loop without reintroducing per-frame `setState`.
**Files/modules:** `src/hooks/` (render-loop hook), `src/components/`, `src/state/`.
**Acceptance criteria:** Loop respects the configured target FPS; changing FPS live doesn't restart the source.
**Required validation:** Manual browser check with diagnostics overlay (T5.2) once available, or console-timed check before then.

---

## Phase 5 — PNG Export and Diagnostics

### T5.1 — PNG export of current frame
**Status:** Not started
**Objective:** Implement `src/export/png-export.ts`: serialize the current output canvas to a downloadable PNG.
**Files/modules:** `src/export/png-export.ts`, `src/components/` (export button).
**Acceptance criteria:** Works for both static (image) and live (video/webcam/screen-share) sources; downloaded file opens as a valid PNG.
**Required validation:** Manual browser check, inspect the downloaded file.

### T5.2 — Performance diagnostics overlay
**Status:** Not started
**Objective:** Implement `src/diagnostics/` — fps, frame time, current grid size — updating on a throttled interval, not per frame (consistent with DEC-011).
**Files/modules:** `src/diagnostics/`, `src/components/`.
**Acceptance criteria:** Overlay updates without causing the per-frame render path to trigger React state updates; measured FPS is reasonably accurate against a manual stopwatch check.
**Required validation:** Manual browser check against the 30 FPS / moderate grid size target (DEC-008).

---

## Phase 6 — Testing, Responsive UI, Accessibility, Final Documentation

### T6.1 — Unit test coverage pass for pure utilities
**Status:** Not started
**Objective:** Ensure `src/processing/` and `src/renderer/grid.ts` have meaningful coverage of edge cases (empty ramp, zero-size source, extreme aspect ratios).
**Files/modules:** `src/processing/*.test.ts`, `src/renderer/grid.test.ts`.
**Acceptance criteria:** Edge cases from acceptance criteria of T1.2–T1.4 are all covered.
**Required validation:** `npm test`.

### T6.2 — Responsive layout pass
**Status:** Not started
**Objective:** Ensure the control panel and output canvas remain usable at common viewport widths (mobile/tablet/desktop).
**Files/modules:** `src/components/`, CSS.
**Acceptance criteria:** No horizontal overflow or unusable controls at 375px/768px/1440px widths.
**Required validation:** Manual browser check at each width.

### T6.3 — Accessibility pass
**Status:** Not started
**Objective:** Labels for all controls, keyboard operability, sufficient contrast, and appropriate ARIA for permission-error states (T4.3).
**Files/modules:** `src/components/`.
**Acceptance criteria:** All interactive controls reachable and operable via keyboard; form controls have associated labels.
**Required validation:** Manual keyboard-only pass; automated check (e.g. axe) if available by this phase.

### T6.4 — Final documentation pass
**Status:** Not started
**Objective:** Add a top-level `README.md` (setup + usage) and reconcile `docs/ARCHITECTURE.md` with whatever the actual structure became.
**Files/modules:** `README.md`, `docs/ARCHITECTURE.md`.
**Acceptance criteria:** A new contributor can go from clone to running app using only `README.md`; `docs/ARCHITECTURE.md` matches `src/` reality.
**Required validation:** Manual doc-vs-code diff by the verifier.
