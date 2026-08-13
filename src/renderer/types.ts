export type ColorMode = 'color' | 'monochrome'

export interface RenderSettings {
  /** Already-sanitized ramp string (see processing/char-ramp.ts). */
  charRamp: string
  colorMode: ColorMode
  /** CSS color, used for every glyph when colorMode === 'monochrome'. */
  monochromeColor: string
  /** Canvas background fill, dark by default. */
  backgroundColor: string
  invert: boolean
  /** See processing/adjustments.ts for exact ranges/defaults. */
  brightness: number
  contrast: number
  gamma: number
  fontFamily: string
  fontSizePx: number
  fontWeight: number | string
  /** Drives grid resolution (DEC-010); height is derived. */
  outputWidthCols: number
}

export interface RenderMetrics {
  gridWidth: number
  gridHeight: number
  /** Wall-clock time of this single render() call, in ms. */
  renderTimeMs: number
}

export interface AsciiRenderer {
  /**
   * Renders `source` as ASCII into `target`. Called once per frame (live
   * sources) or on-demand (static images). Internally resizes `target`'s
   * backing store if the computed grid/DPR changed since the last call —
   * there is no separate resize()/configure() step.
   */
  render(source: CanvasImageSource, target: HTMLCanvasElement, settings: RenderSettings): RenderMetrics
  dispose(): void
}
