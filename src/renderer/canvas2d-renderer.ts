import { luminanceFromRgb } from '../processing/luminance'
import { applyAdjustments } from '../processing/adjustments'
import { luminanceToChar } from '../processing/char-ramp'
import { computeGridDimensions } from './grid'
import type { AsciiRenderer, RenderMetrics, RenderSettings } from './types'

/** CSS-pixel cell height = fontSizePx * LINE_HEIGHT_FACTOR. 1.0 keeps rows tight (no extra leading). */
const LINE_HEIGHT_FACTOR = 1.0

interface CellMetrics {
  cellWidthPx: number
  cellHeightPx: number
}

/**
 * HTMLImageElement/HTMLVideoElement expose their natural size under
 * different property names; everything else CanvasImageSource-shaped in
 * this app (ImageBitmap) exposes plain width/height.
 */
function getSourceDimensions(source: CanvasImageSource): { width: number; height: number } {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight }
  }
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight }
  }
  const sized = source as unknown as { width: number; height: number }
  return { width: sized.width, height: sized.height }
}

function fontString(settings: Pick<RenderSettings, 'fontFamily' | 'fontSizePx' | 'fontWeight'>): string {
  return `${settings.fontWeight} ${settings.fontSizePx}px ${settings.fontFamily}`
}

// Returning a non-nullable type here (instead of relying on a null-check
// left behind at the call site) lets closures capturing the result stay
// typed as non-null too — TS narrowing from a plain `if (!x) throw` guard
// doesn't survive into functions declared later in the same scope.
function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Canvas2DRenderer: 2D context unavailable')
  }
  return ctx
}

export function createCanvas2DRenderer(): AsciiRenderer {
  // Offscreen canvas reused across calls for both font measurement and
  // the per-frame downsample step, so render() never allocates a canvas.
  let sampleCanvas: HTMLCanvasElement | null = document.createElement('canvas')
  const sampleCtx = getContext2D(sampleCanvas)

  let cachedFontKey = ''
  let cachedMetrics: CellMetrics | null = null

  function measureCell(settings: RenderSettings): CellMetrics {
    const key = `${settings.fontFamily}__${settings.fontSizePx}__${settings.fontWeight}`
    if (cachedMetrics && cachedFontKey === key) {
      return cachedMetrics
    }
    sampleCtx.font = fontString(settings)
    const cellWidthPx = sampleCtx.measureText('M').width
    const metrics: CellMetrics = { cellWidthPx, cellHeightPx: settings.fontSizePx * LINE_HEIGHT_FACTOR }
    cachedFontKey = key
    cachedMetrics = metrics
    return metrics
  }

  return {
    render(source: CanvasImageSource, target: HTMLCanvasElement, settings: RenderSettings): RenderMetrics {
      if (!sampleCanvas) {
        throw new Error('Canvas2DRenderer: render() called after dispose()')
      }

      // Step 1 (measure/cache font metrics) is excluded from the timed
      // region below since it's a no-op on cache hits.
      const { cellWidthPx, cellHeightPx } = measureCell(settings)

      const start = performance.now()

      // Step 2: source aspect ratio.
      const { width: srcWidth, height: srcHeight } = getSourceDimensions(source)
      if (srcWidth <= 0 || srcHeight <= 0) {
        // Source not yet decoded/ready (e.g. video before loadedmetadata).
        // Nothing sane to draw; skip this frame rather than dividing by zero.
        return { gridWidth: 0, gridHeight: 0, renderTimeMs: performance.now() - start }
      }
      const sourceAspectRatio = srcWidth / srcHeight
      const cellAspectRatio = cellWidthPx / cellHeightPx

      // Step 3: grid resolution.
      const { cols, rows } = computeGridDimensions(settings.outputWidthCols, sourceAspectRatio, cellAspectRatio)

      // Step 4: downsample source to one pixel per cell, read back once.
      if (sampleCanvas.width !== cols || sampleCanvas.height !== rows) {
        sampleCanvas.width = cols
        sampleCanvas.height = rows
      }
      // Clear leftover pixels from the previous frame before compositing the
      // new one — without this, transparent regions of an alpha-bearing
      // source (e.g. PNG) blend with stale pixel data instead of reading as
      // background, since drawImage composites via source-over.
      sampleCtx.clearRect(0, 0, cols, rows)
      sampleCtx.drawImage(source, 0, 0, cols, rows)
      const { data: pixels } = sampleCtx.getImageData(0, 0, cols, rows)

      // Step 5: resize target's backing store only if it actually changed.
      const dpr = window.devicePixelRatio || 1
      const cssWidth = cols * cellWidthPx
      const cssHeight = rows * cellHeightPx
      const backingWidth = Math.round(cssWidth * dpr)
      const backingHeight = Math.round(cssHeight * dpr)
      if (target.width !== backingWidth || target.height !== backingHeight) {
        target.width = backingWidth
        target.height = backingHeight
        target.style.width = `${cssWidth}px`
        target.style.height = `${cssHeight}px`
      }

      const ctx = target.getContext('2d')
      if (!ctx) {
        return { gridWidth: cols, gridHeight: rows, renderTimeMs: performance.now() - start }
      }

      // Draw in CSS-pixel coordinates; the transform maps them onto the
      // DPR-scaled backing store for crisp output on high-DPI displays.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Step 6: background.
      ctx.fillStyle = settings.backgroundColor
      ctx.fillRect(0, 0, cssWidth, cssHeight)

      // Step 7: glyphs. Font/baseline/align set once per call, not per cell.
      ctx.font = fontString(settings)
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = (row * cols + col) * 4
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]

          const luminance = luminanceFromRgb(r, g, b)
          const adjusted = applyAdjustments(luminance, settings)
          const char = luminanceToChar(adjusted, settings.charRamp)

          // Step 8: skip drawing spaces entirely.
          if (char === ' ') continue

          ctx.fillStyle = settings.colorMode === 'color' ? `rgb(${r}, ${g}, ${b})` : settings.monochromeColor
          ctx.fillText(char, col * cellWidthPx, row * cellHeightPx)
        }
      }

      return { gridWidth: cols, gridHeight: rows, renderTimeMs: performance.now() - start }
    },

    dispose() {
      sampleCanvas = null
      cachedMetrics = null
      cachedFontKey = ''
    },
  }
}
