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

### Handoff — 2026-08-13 (T4.1/T4.2 complete)

**Task ID:** T4.1 (video file input source), T4.2 (rAF-based live render loop) — both Complete

**What changed:**
- New `src/sources/video-source.ts`: `loadVideoSource`/`disposeVideoSource` for a React-owned, always-mounted `<video>` element.
- New `src/hooks/useLiveVideoRenderer.ts`: rAF loop gated on the video's `play`/`pause`/`ended` events, settings via ref, zero `setState` in the per-frame path (DEC-011).
- `src/App.tsx`: added `sourceType`, `videoRef`, `handleVideoFileSelected`, cross-source cleanup, wired both render hooks.
- `src/components/UploadPanel.tsx`: two sibling file inputs (image/video), dynamic source badge.
- `src/components/SourcePreview.tsx`: always-mounted `<video controls>` (hidden via CSS when inactive), alongside the existing `<img>` path.
- `src/styles/app.css`: `.upload-field`, `.preview-video`, `.is-hidden`.
- **Process note**: this task hit two mid-session connection failures (once during the initial builder run, once during the first reviewer pass). Both were handled by inspecting what was actually left in the working tree before deciding whether to resume or restart — the interrupted builder run had left complete, correct code for 4 of 5 files, so a follow-up builder session finished only the missing integration (`App.tsx` wiring + CSS) rather than redoing everything; the interrupted reviewer run left no partial artifact (read-only), so it was simply relaunched fresh.
- Reviewer found no Blockers, 2 Important findings (both fixed in repair) + 3 Nice-to-haves (left alone). DEC-011 compliance was reviewed with unusual rigor given it's the highest-risk rule in the project — every closure in the rAF effect was hand-traced, not just read.

**Files modified:**
- New: `src/sources/video-source.ts`, `src/hooks/useLiveVideoRenderer.ts`.
- Modified: `src/App.tsx`, `src/components/UploadPanel.tsx`, `src/components/SourcePreview.tsx`, `src/styles/app.css`.
- Docs: `docs/TASKS.md` (T4.1/T4.2 → Complete, notes added), `docs/PROJECT_STATE.md`, this file.

**Important technical decisions:**
- No renderer changes needed — `canvas2d-renderer.ts` already handled `HTMLVideoElement` sources and not-yet-decoded frames since Phase 1's forward-looking design.
- DEC-016 (`FrameSource` interface) deliberately still not extracted — video/image shapes remain different enough; explicitly flagged T4.3 (webcam) as the real revisit point, since it'll be the second `MediaStream`-ish live source.
- Settings reach the rAF loop via a ref updated in a `useEffect` (not a render-body assignment) — required by this repo's `eslint-plugin-react-hooks` refs rule, and incidentally the textbook-correct pattern anyway.

**Commands run and result:**
- `npm run lint`/`typecheck`/`test` (46/46)/`build` — all PASS, independently re-run by both reviewer and verifier before and after the repair round.
- **Manual browser check: incomplete, root-caused, and explicitly documented as a known gap** — not silently skipped. Three video files (two synthesized, one a genuine Windows system file) all failed to decode in this session's `claude-in-chrome` automated browser (`readyState` stuck at `0` indefinitely). Diagnosed via `canPlayType()` (reported full support), a successful `fetch()` of the identical bytes, and reproducing the exact same failure with a plain HTTP-served file in a fresh tab with zero app code involved — conclusively an automated-browser-environment media-pipeline limitation, not an app defect. What *was* verified live: both upload inputs work, badge/filename update correctly, and — most relevant to this task's review focus — switching to an image while a video load was stuck pending correctly disposed the video mid-flight with no console errors, live-exercising the cross-source-cleanup path.

**Known issues / risks:**
- **Follow-up recommended**: manual spot-check of actual video playback (upload → play → confirm ASCII canvas updates → pause → confirm it stops) next time this repo is opened in a normal, non-automated browser. This is the single most important outstanding verification in the project right now.
- `getImageData`'s per-`render()` allocation is now genuinely hot (every rAF tick during video playback, not just a future concern) — worth profiling once playback can be visually confirmed.
- No `ErrorBoundary` anywhere in the app — worth adding before T4.3/T4.4 introduce more live-input failure modes.
- Two independent `AsciiRenderer` instances exist simultaneously (one per hook, image + video) — harmless duplication, not a leak, left as-is per reviewer's Nice-to-have judgment.

**Exact next task recommended:**
- **T4.3** (webcam input source, `getUserMedia`) as its own standalone builder→reviewer→verifier round — do NOT bundle with T4.4/T4.5. Revisit DEC-016 here since it's the second live-source case.

---

### Handoff — 2026-08-13 (Phase 3 complete)

**Task ID:** T3.1, T3.2, T3.3, T3.4, T3.5 — all Complete

**What changed:**
- Bundled all five Phase 3 tasks into one builder pass (same rationale as Phase 0/1: tightly coupled — one settings state, one controls panel).
- New `src/components/ControlsPanel.tsx`: char-ramp preset/custom-text control, font family/size control, brightness/contrast/gamma sliders + invert checkbox, color/monochrome toggle + conditional monochrome-color picker, output-width control.
- `src/App.tsx`: settings are now a real `useState<RenderSettings>` (was the static `DEFAULT_RENDER_SETTINGS` constant) with a shallow-merge `handleSettingsChange` patch setter.
- `src/renderer/canvas2d-renderer.ts`: added `safeFontSizePx` guard (falls back to 15px on non-finite/non-positive input) — closes the risk flagged in Phase 1/2's PROJECT_STATE.md as deferred to T3.2.
- `src/renderer/grid.ts`: added `MAX_GRID_DIMENSION = 2000`, clamping both `cols` and `rows` in `computeGridDimensions` (repair round — see below).
- Reviewer found no Blockers, 1 Important finding + 3 Nice-to-haves. Repair builder fixed the Important finding. Verifier re-confirmed. Orchestrator then performed the manual browser check (builder/reviewer both explicitly flagged they had no browser tool available in their sessions).

**Files modified:**
- New: `src/components/ControlsPanel.tsx`.
- Modified: `src/App.tsx`, `src/state/default-render-settings.ts` (doc comment only), `src/renderer/canvas2d-renderer.ts`, `src/renderer/grid.ts`, `src/renderer/grid.test.ts`, `src/styles/app.css`.
- Docs: `docs/TASKS.md` (T3.1–T3.5 → Complete, notes added), `docs/PROJECT_STATE.md`, this file.

**Important technical decisions:**
- No new DECISIONS.md entry needed — `MAX_GRID_DIMENSION` and `safeFontSizePx` are bug fixes within DEC-015's and T1.5's existing design, not new architectural decisions.
- Settings state deliberately stayed as plain `useState` + props (App → ControlsPanel), not React Context or an external store — one settings owner, one consumer tree, so context would be an unrequested abstraction per CLAUDE.md.

**Commands run and result:**
- `npm run lint` — PASS. `npm run typecheck` — PASS. `npm test` — PASS (46/46, up from 44: two new `grid.test.ts` cases for the upper-bound clamp). `npm run build` — PASS. All independently re-run and confirmed by both reviewer and verifier, before and after the repair round.
- Manual browser check — PASS. Performed via `claude-in-chrome`: every control exercised (ramp preset `blocks` + custom text `@#+. `, font Consolas @ 26px, brightness 0.50/contrast 1.60/gamma 2.20/invert checked, color→monochrome toggle with color picker, output width 10/60/120/999999). The extreme-width case specifically re-verified the `MAX_GRID_DIMENSION` fix holds in the live app (rendered in ~733ms, no crash, no console errors) rather than trusting the unit test alone. Note: individual screenshot captures intermittently hit a 30s CDP timeout immediately after a DOM-changing action, always succeeding on an immediate retry with no page-state impact — a `claude-in-chrome`/CDP quirk, not an app bug (confirmed via clean console reads and correct subsequent screenshots each time).

**Known issues / risks:**
- No `ErrorBoundary` anywhere in the app — the `MAX_GRID_DIMENSION` fix removes the one currently-known way to trigger an uncaught render-path exception, but there's no safety net if a future change reintroduces one. Worth considering before Phase 4.
- No debounce on the new sliders/number inputs — fine for static images, worth watching once Phase 4's live rAF loop coexists with these same controls.
- `getImageData` per-`render()` allocation — still deferred to Phase 4 profiling, now compounded by grids up to 2000×2000 being reachable.
- `useAsciiRenderer`'s render-then-`setState` pattern must not be copied into T4.2's rAF loop hook (per DEC-011) — flagged again as a forward note.

**Exact next task recommended:**
- **T4.1 + T4.2 together** (video file input source + rAF-based live render loop) — first Phase 4 pair, tightly coupled. Recommend NOT bundling all of Phase 4 like Phase 3: T4.3 (webcam) and T4.4 (screen-share) are independent input sources with their own permission/error surfaces and deserve separate review rounds; T4.5 (FPS control) depends on T4.2 existing first.

---

### Handoff — 2026-08-13 (Phase 2 complete)

**Task ID:** T2.1, T2.2, T2.3 — all Complete

**What changed:**
- Implemented image upload source (`src/sources/image-source.ts`), the render-owning hook (`src/hooks/useAsciiRenderer.ts`), default settings (`src/state/default-render-settings.ts`), layout components (`src/components/{Header,UploadPanel,SourcePreview,AsciiOutput}.tsx`, `src/styles/app.css`), and wired them into `src/App.tsx`. The app now renders ASCII output on screen from an uploaded image.
- **Process note:** this code was found already written and uncommitted in the working tree at session start — implemented in a prior session outside the normal builder→reviewer→verifier pipeline, with `docs/TASKS.md`/`docs/PROJECT_STATE.md` never updated. This session ran it through the missing steps: reviewer pass → repair → verifier pass → docs → commit, same as if the builder step had just completed.
- Reviewer found no Blockers, 4 Important findings. Repair builder fixed 2 with code changes (stale-async-response race on rapid re-upload via a request-generation counter in `App.tsx`; EXIF-orientation mismatch fixed via `imageOrientation: 'from-image'` in `image-source.ts`) and deleted a redundant `src/sources/.gitkeep`. The other 2 were documentation gaps, resolved by the orchestrator: recorded the deliberate `FrameSource`-interface omission as DEC-016, and performed + recorded the missing manual browser check.
- Verifier re-ran lint/typecheck/test/build and independently confirmed both code fixes and the doc/code consistency.
- Manual browser check performed via the `claude-in-chrome` browser-automation skill (no project-specific run skill existed yet, no `chromium-cli` available in this environment): started `npm run dev`, uploaded a generated test PNG, confirmed source preview + ASCII canvas output both rendered, header render-time readout populated (15.8ms), console clean on load and after upload.

**Files modified:**
- New: `src/sources/image-source.ts`, `src/hooks/useAsciiRenderer.ts`, `src/state/default-render-settings.ts`, `src/components/{Header,UploadPanel,SourcePreview,AsciiOutput}.tsx`, `src/styles/app.css`.
- Modified: `src/App.tsx` (full wiring + stale-response guard), `src/index.css` (body background).
- Deleted: `src/sources/.gitkeep`.
- Docs: `docs/TASKS.md` (T2.1–T2.3 → Complete, notes added), `docs/DECISIONS.md` (DEC-016 added), `docs/PROJECT_STATE.md`, this file.

**Important technical decisions:**
- DEC-016: no `FrameSource` interface until a second input source exists (T4.1) — single-implementer interface would be an unrequested abstraction per `CLAUDE.md`.

**Commands run and result:**
- `npm run lint` — PASS. `npm run typecheck` — PASS. `npm test` — PASS (44/44). `npm run build` — PASS. All independently re-run and confirmed by both reviewer and verifier, before and after the repair round.
- Manual browser check — PASS (see above).

**Known issues / risks:**
- `useAsciiRenderer`'s render-then-`setState` pattern is correct for Phase 2's static render but must not be copied into T4.2's rAF live-loop hook (per DEC-011) — that hook needs a fresh, ref-only implementation.
- `fontSizePx` still has no non-finite-input guard at its `grid.ts` call site — still deferred to T3.2 (unchanged from Phase 1).
- `getImageData` per-`render()` allocation — still deferred to Phase 4 profiling (unchanged from Phase 1).

**Exact next task recommended:**
- **T3.1–T3.5** (Phase 3: character ramp/font/brightness-contrast-gamma-invert/color-mode/output-width controls) — all wire already-implemented, already-tested `src/processing/*` utilities into new UI, no new processing logic expected.

---

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
