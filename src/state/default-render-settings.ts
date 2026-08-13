import { CHAR_RAMPS } from '../processing/char-ramp'
import type { RenderSettings } from '../renderer/types'

/**
 * Phase 2 static default. Nothing in the UI can change these yet — Phase 3
 * adds the controls panel (ramp picker, font picker, sliders, width input)
 * that read/write a real settings store; these field values are exactly
 * what those controls should default to, so behavior doesn't jump when
 * Phase 3 lands. A module-level constant (not a factory) is intentional:
 * useAsciiRenderer's effect depends on `settings` by reference, so a
 * stable object here avoids re-rendering on every App render.
 */
export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  charRamp: CHAR_RAMPS.classic,
  colorMode: 'color',
  monochromeColor: '#e6e6e6',
  backgroundColor: '#0d0d0f',
  invert: false,
  brightness: 0,
  contrast: 1,
  gamma: 1,
  fontFamily: 'ui-monospace, "Cascadia Code", "SF Mono", Consolas, monospace',
  fontSizePx: 15,
  fontWeight: 'normal',
  outputWidthCols: 120,
}
