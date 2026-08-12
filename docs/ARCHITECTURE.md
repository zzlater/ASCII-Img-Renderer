# Architecture

## System Overview

ASCII Img Renderer is a single-page, browser-only React + TypeScript application. An **input source** (image file, video file, webcam, or screen-share) produces frames; a **renderer** samples each frame into a character grid and draws it to an output `<canvas>`; a thin layer of **React UI** controls source selection and rendering parameters (character ramp, font, color mode, brightness/contrast/gamma, invert, output grid width, FPS) without participating in the per-frame draw loop itself.

There is no backend. All processing — decoding, sampling, luminance mapping, drawing, PNG export — happens client-side.

## Proposed Source Structure

```
src/
  app/                    # App shell, routing (if any), top-level layout
  components/             # Presentational React components (controls, panels, canvas host)
  sources/                # Input-source lifecycle: image, video file, webcam, screen-share
    image-source.ts
    video-source.ts
    webcam-source.ts
    screen-share-source.ts
    types.ts              # Shared FrameSource interface
  renderer/                # Rendering engine, behind an abstraction
    types.ts               # Renderer interface (see below)
    canvas2d-renderer.ts   # v1 implementation
    grid.ts                 # output-width -> grid resolution / aspect ratio math (pure)
  processing/              # Pure image-processing utilities (no DOM/Canvas/React)
    luminance.ts
    adjustments.ts          # brightness/contrast/gamma/invert
    char-ramp.ts             # luminance -> character mapping, presets
  export/                    # PNG (later: video/GIF) export
    png-export.ts
  hooks/                      # React hooks bridging sources/renderer into components
  state/                       # App-level settings state (React context or a small store)
  diagnostics/                 # FPS/frame-time measurement and overlay
```

This structure is a starting direction, not a contract — adjust as Phase 0/1 tasks land, and update this document when it changes materially.

## Boundaries

| Layer | Owns | Must not do |
|---|---|---|
| **React UI** (`components/`, `app/`) | Layout, controls, reading/writing settings state | Touch Canvas pixels directly; run per-frame logic in render/state updates |
| **Input-source lifecycle** (`sources/`) | Acquiring/releasing `MediaStream`/`HTMLVideoElement`/`ImageBitmap`, permissions, cleanup on unmount or track end | Know about the renderer or React state |
| **Rendering engine** (`renderer/`) | Sampling a frame into a character grid and drawing it, at whatever cadence the caller drives | Own input-source acquisition; hold React state; assume Canvas 2D forever (see abstraction below) |
| **Pure image-processing utilities** (`processing/`) | Luminance, brightness/contrast/gamma, char-ramp lookup, grid math | Touch the DOM, Canvas, or React in any way — these are plain functions, unit-tested in isolation |
| **Export** (`export/`) | Serializing a rendered frame/canvas to an output file (PNG now; video/GIF later) | Drive the render loop itself |

The render loop (video/webcam/screen-share) runs via `requestAnimationFrame` driven from a ref-based effect, calling into `renderer/` and `processing/` directly. It must never call `setState` per frame; diagnostics (fps counters, etc.) update on a throttled interval, not every frame.

## Renderer Abstraction

The rendering engine is accessed through a `Renderer` interface (proposed shape, finalized in Phase 1):

```ts
interface Renderer {
  configure(settings: RenderSettings): void;
  renderFrame(source: CanvasImageSource, target: HTMLCanvasElement): void;
  dispose(): void;
}
```

`canvas2d-renderer.ts` is the only v1 implementation. UI and hooks code depend on `Renderer`, never on `CanvasRenderingContext2D` directly, so a future `webgl-renderer.ts` / `webgpu-renderer.ts` can be swapped in behind the same interface without touching `components/`.

## Extension Points (not built in v1, but the abstraction must not block them)

- **WebGL/WebGPU renderer** — alternate `Renderer` implementation for higher grid resolutions / higher FPS.
- **Dithering** — an additional pass in `processing/` between luminance and char-ramp lookup.
- **Edge-aware rendering** — character selection informed by local gradient/edge direction, not luminance alone.
- **Video/GIF export** — extends `export/` beyond single-frame PNG; will need a frame-capture strategy independent of the live render loop.
- **Vision-aware rendering** — e.g. saliency- or content-aware sampling density; a candidate future pass in `processing/` or a new `renderer/` variant.

## Version 1 Constraint

Canvas 2D is the version-1 renderer only. It must not become load-bearing in the UI layer — no component should assume a `CanvasRenderingContext2D` is available; everything goes through the `Renderer` interface described above.
