/**
 * Pure brightness/contrast/gamma/invert pipeline applied to a normalized
 * luminance value (0-1 in, 0-1 out, clamped). These are the exact ranges
 * and defaults the Phase 3 UI sliders map to — do not invent different
 * ones downstream.
 *
 * Pipeline order (fixed): brightness -> contrast -> gamma -> clamp[0,1]
 * -> invert -> clamp[0,1]. Only brightness/contrast/gamma can push the
 * value outside 0-1 mid-pipeline; the first clamp brings it back before
 * invert (`1 - v`) is applied, and the final clamp is a no-op safety net
 * since invert of an already-clamped value stays in range.
 */
export interface AdjustmentSettings {
  /** Additive, range [-1, 1], default 0. */
  brightness: number
  /** Multiplicative around the midpoint (CSS filter: contrast()-like), range [0, 2], default 1. */
  contrast: number
  /** Power curve, range (0, ~3], default 1. Values <= 0 are treated as 1. */
  gamma: number
  /** Applied last, after brightness/contrast/gamma and the intermediate clamp. */
  invert: boolean
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

export function applyBrightness(v: number, brightness: number): number {
  return v + brightness
}

export function applyContrast(v: number, contrast: number): number {
  return (v - 0.5) * contrast + 0.5
}

export function applyGamma(v: number, gamma: number): number {
  // Guard divide-by-zero / negative gamma (out of the documented range).
  const safeGamma = gamma > 0 ? gamma : 1
  // A power curve with a fractional exponent is undefined for a negative
  // base (Math.pow(-x, 0.5) is NaN in JS); brightness/contrast run before
  // this step and can push v below 0, so clamp the base at 0. Values > 1
  // are left as-is and caught by the pipeline's post-gamma clamp.
  const base = v < 0 ? 0 : v
  return base ** (1 / safeGamma)
}

export function applyInvert(v: number): number {
  return 1 - v
}

export function applyAdjustments(luminance: number, settings: AdjustmentSettings): number {
  let v = applyBrightness(luminance, settings.brightness)
  v = applyContrast(v, settings.contrast)
  v = applyGamma(v, settings.gamma)
  v = clamp01(v)
  if (settings.invert) {
    v = applyInvert(v)
  }
  return clamp01(v)
}
