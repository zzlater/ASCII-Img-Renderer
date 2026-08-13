import { describe, expect, test } from 'vitest'
import {
  applyAdjustments,
  applyBrightness,
  applyContrast,
  applyGamma,
  applyInvert,
  clamp01,
} from './adjustments'

describe('clamp01', () => {
  test('clamps below 0 and above 1', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(1.5)).toBe(1)
    expect(clamp01(0.3)).toBe(0.3)
  })
})

describe('applyBrightness', () => {
  test('is additive and unclamped at this step', () => {
    expect(applyBrightness(0.5, 0.2)).toBeCloseTo(0.7, 10)
    expect(applyBrightness(0.9, 0.5)).toBeCloseTo(1.4, 10) // intentionally > 1, clamped later
    expect(applyBrightness(0.2, -0.5)).toBeCloseTo(-0.3, 10) // intentionally < 0
  })
})

describe('applyContrast', () => {
  test('identity at contrast = 1', () => {
    expect(applyContrast(0.7, 1)).toBeCloseTo(0.7, 10)
  })

  test('contrast = 0 flattens everything to the midpoint', () => {
    expect(applyContrast(0.9, 0)).toBe(0.5)
    expect(applyContrast(0.1, 0)).toBe(0.5)
  })

  test('contrast = 2 doubles the distance from the midpoint', () => {
    expect(applyContrast(0.75, 2)).toBeCloseTo(1, 10)
  })
})

describe('applyGamma', () => {
  test('identity at gamma = 1', () => {
    expect(applyGamma(0.6, 1)).toBeCloseTo(0.6, 10)
  })

  test('gamma = 2 applies a square-root curve', () => {
    expect(applyGamma(0.25, 2)).toBeCloseTo(0.5, 10)
  })

  test('non-positive gamma is guarded to behave like gamma = 1', () => {
    expect(applyGamma(0.5, 0)).toBeCloseTo(0.5, 10)
    expect(applyGamma(0.5, -3)).toBeCloseTo(0.5, 10)
  })

  test('negative input base is clamped to 0 rather than producing NaN', () => {
    expect(applyGamma(-0.3, 2)).toBe(0)
    expect(Number.isNaN(applyGamma(-0.3, 2))).toBe(false)
  })
})

describe('applyInvert', () => {
  test('flips around 0.5', () => {
    expect(applyInvert(0)).toBe(1)
    expect(applyInvert(1)).toBe(0)
    expect(applyInvert(0.3)).toBeCloseTo(0.7, 10)
  })
})

describe('applyAdjustments (composed pipeline)', () => {
  const defaults = { brightness: 0, contrast: 1, gamma: 1, invert: false }

  test('is identity at default settings', () => {
    expect(applyAdjustments(0.42, defaults)).toBeCloseTo(0.42, 10)
  })

  test('clamps a brightness overshoot to 1', () => {
    expect(applyAdjustments(0.5, { ...defaults, brightness: 0.6 })).toBe(1)
  })

  test('invert is applied after the intermediate clamp', () => {
    expect(applyAdjustments(0, { ...defaults, invert: true })).toBe(1)
    expect(applyAdjustments(1, { ...defaults, invert: true })).toBe(0)
  })

  test('contrast = 0 flattens output to mid-gray before invert', () => {
    expect(applyAdjustments(0.9, { ...defaults, contrast: 0 })).toBe(0.5)
  })

  test('never returns NaN even when brightness/gamma combine adversarially', () => {
    const result = applyAdjustments(0.1, { brightness: -0.5, contrast: 1, gamma: 2, invert: false })
    expect(Number.isNaN(result)).toBe(false)
    expect(result).toBe(0)
  })

  test('output always stays within [0, 1]', () => {
    const result = applyAdjustments(0.8, { brightness: 1, contrast: 2, gamma: 0.2, invert: false })
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })
})
