# Decisions

Accepted architectural and product decisions. Append new decisions rather than editing old ones; if a decision is superseded, add a new entry and mark the old one Superseded with a pointer.

Format: `DEC-NNN` — decision — Status — rationale.

---

### DEC-001 — Browser-first React + TypeScript application
**Status:** Accepted
Everything runs client-side in the browser. No server-rendered pages.

### DEC-002 — Vite as the build tool
**Status:** Accepted
Fast dev server and build for a client-only React + TypeScript app; no need for a heavier framework (Next.js etc.) since there is no backend or routing complexity.

### DEC-003 — Canvas 2D renderer for v1
**Status:** Accepted
Simplest correct implementation for real-time ASCII rendering at moderate grid sizes. See `docs/ARCHITECTURE.md` for the abstraction that keeps a future GPU renderer swappable.

### DEC-004 — No backend, authentication, database, or paid APIs
**Status:** Accepted
Keeps the project a static, deployable-anywhere client app with no operating cost and no account system.

### DEC-005 — Input sources: image upload, video upload, webcam, screen-share
**Status:** Accepted
Covers the full set of planned input modes using only browser-native APIs (`<input type="file">`, `getUserMedia`, `getDisplayMedia`).

### DEC-006 — Color and monochrome rendering modes
**Status:** Accepted
Both modes are first-class; monochrome is not merely "color with saturation removed" in the UI — it is a distinct render mode.

### DEC-007 — PNG export of the current frame
**Status:** Accepted
V1 export scope is a single current-frame PNG. Video/GIF export is a documented future extension point, not built now.

### DEC-008 — Primary performance goal: 30 FPS at moderate grid size
**Status:** Accepted
This is the target the Canvas 2D renderer and render-loop design are held to for live sources (video/webcam/screen-share).

### DEC-009 — Renderer abstraction must allow a later GPU implementation
**Status:** Accepted
UI and hooks depend on a `Renderer` interface, not on `CanvasRenderingContext2D` directly. See `docs/ARCHITECTURE.md`.

### DEC-010 — Output width drives grid resolution
**Status:** Accepted
The user sets output width (in characters); grid height is derived from source aspect ratio and font-cell aspect ratio, not set independently. Keeps the control surface simple and the output visually correct.

### DEC-011 — No React state updates inside the per-frame render loop
**Status:** Accepted
Per-frame draws for live sources run via `requestAnimationFrame` and refs. React `setState` in that path would cause re-renders at frame rate and blow the 30 FPS target (DEC-008). Diagnostics update on a throttled interval instead.

### DEC-012 — Luminance uses Rec. 601 weighting
**Status:** Accepted
`(0.299*R + 0.587*G + 0.114*B) / 255`, implemented in `src/processing/luminance.ts`. A standard, well-known perceptual weighting; no reason to use a more expensive formula for v1.

### DEC-013 — Fixed brightness/contrast/gamma/invert pipeline order and ranges
**Status:** Accepted
Applied in this exact order (`src/processing/adjustments.ts`): brightness (additive, range `[-1, 1]`) → contrast (CSS-`filter: contrast()`-like, `(v-0.5)*c+0.5`, range `[0, 2]`) → gamma (`v**(1/gamma)`, range `(0, ~3]`, non-positive gamma falls back to `1`, negative base floored to `0` before exponentiating to avoid `NaN`) → clamp to `[0,1]` → invert (`1-v`) → clamp to `[0,1]` again. Locked in because Phase 3's UI sliders must match these exact ranges — changing the ranges later is a breaking change to both the processing code and the controls.

### DEC-014 — Character ramp convention: dense-glyph-first, index rises with luminance
**Status:** Accepted
A ramp string is ordered dense/dark-glyph-first → sparse/light-glyph-last (e.g. `classic = "@%#*+=-:. "`). `luminanceToChar` maps luminance directly to index (`floor(clamp01(luminance) * (ramp.length-1))`) — low luminance (dark source pixel) → low index → dense glyph. This is the traditional ASCII-art convention the built-in presets are written in; the user-facing "Invert" control flips it, rather than the ramp itself having an ambiguous direction.

### DEC-015 — Grid dimension formula
**Status:** Accepted
`rows = round(cols * cellAspectRatio / sourceAspectRatio)` where `cellAspectRatio = fontCellWidthPx / fontCellHeightPx` (measured from the actual font via Canvas `measureText`, not hardcoded) and `sourceAspectRatio = sourceWidth / sourceHeight`. Both `cols` and `rows` are clamped to a minimum of 1, and non-finite `outputWidthCols` (e.g. a cleared number input) falls back to `1` rather than propagating `NaN`. Implements DEC-010.

### DEC-016 — No `FrameSource` interface until a second input source exists
**Status:** Accepted
`docs/ARCHITECTURE.md`'s proposed `sources/types.ts` (a shared `FrameSource` interface) was not implemented alongside T2.1's `image-source.ts`; `loadImageSource`/`disposeImageSource` are plain standalone functions instead. With only one input source implemented (image upload), an interface would have exactly one implementer — an unrequested abstraction under `CLAUDE.md`'s "no interface with a single implementation" rule. Revisit at T4.1 (video file input source), the first point a second source actually needs a shared shape; extract the interface then, once its real shape is informed by two concrete implementations instead of guessed in advance.
