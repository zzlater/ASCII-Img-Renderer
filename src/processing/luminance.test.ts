import { describe, expect, test } from 'vitest'
import { luminanceFromRgb } from './luminance'

describe('luminanceFromRgb', () => {
  test('black is 0', () => {
    expect(luminanceFromRgb(0, 0, 0)).toBe(0)
  })

  test('white is 1', () => {
    expect(luminanceFromRgb(255, 255, 255)).toBe(1)
  })

  test('pure red weighted at 0.299', () => {
    expect(luminanceFromRgb(255, 0, 0)).toBeCloseTo(0.299, 5)
  })

  test('pure green weighted at 0.587', () => {
    expect(luminanceFromRgb(0, 255, 0)).toBeCloseTo(0.587, 5)
  })

  test('pure blue weighted at 0.114', () => {
    expect(luminanceFromRgb(0, 0, 255)).toBeCloseTo(0.114, 5)
  })

  test('mid gray is approximately 0.5', () => {
    expect(luminanceFromRgb(128, 128, 128)).toBeCloseTo(128 / 255, 5)
  })
})
