import { CHAR_RAMPS } from '../processing/char-ramp'
import type { RenderSettings } from '../renderer/types'

/**
 * Initial value for App.tsx's `useState<RenderSettings>`, and the default
 * every ControlsPanel control should reflect on first render. A module-level
 * constant (not a factory) is intentional: `useState(DEFAULT_RENDER_SETTINGS)`
 * only reads this reference once (on mount), so it doesn't need to be stable
 * across renders the way a value passed on every render would.
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
