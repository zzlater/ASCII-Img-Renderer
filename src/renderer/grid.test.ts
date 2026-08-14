import { describe, expect, test } from 'vitest'
import { computeGridDimensions, MAX_GRID_DIMENSION } from './grid'

describe('computeGridDimensions', () => {
  test('square source, square cells -> square-ish grid (sanity check)', () => {
    expect(computeGridDimensions(50, 1, 1)).toEqual({ cols: 50, rows: 50 })
  })

  test('square source with a realistic monospace cell aspect ratio', () => {
    // rows = round(50 * 0.55 / 1) = round(27.5) = 28
    expect(computeGridDimensions(50, 1, 0.55)).toEqual({ cols: 50, rows: 28 })
  })

  test('landscape source (16:9) with a realistic monospace cell aspect ratio', () => {
    const sourceAspectRatio = 16 / 9
    // rows = round(100 * 0.55 / 1.7778) = round(30.9375) = 31
    expect(computeGridDimensions(100, sourceAspectRatio, 0.55)).toEqual({ cols: 100, rows: 31 })
  })

  test('portrait source (9:16) with a realistic monospace cell aspect ratio', () => {
    const sourceAspectRatio = 9 / 16
    // rows = round(80 * 0.55 / 0.5625) = round(78.222) = 78
    expect(computeGridDimensions(80, sourceAspectRatio, 0.55)).toEqual({ cols: 80, rows: 78 })
  })

  test('rows are clamped to at least 1 for an extreme wide/thin combination', () => {
    const result = computeGridDimensions(1, 100, 0.01)
    expect(result.rows).toBe(1)
  })

  test('cols are clamped to at least 1 for a non-positive output width', () => {
    const result = computeGridDimensions(0, 1, 1)
    expect(result.cols).toBe(1)
  })

  test('outputWidthCols is rounded to an integer', () => {
    expect(computeGridDimensions(50.6, 1, 1).cols).toBe(51)
  })

  test('non-finite outputWidthCols (e.g. a cleared number input) falls back to 1 instead of NaN', () => {
    expect(computeGridDimensions(NaN, 1, 1).cols).toBe(1)
    expect(computeGridDimensions(Infinity, 1, 1).cols).toBe(1)
  })

  test('cols are clamped to MAX_GRID_DIMENSION for an extreme hand-typed outputWidthCols', () => {
    const result = computeGridDimensions(999999, 1, 1)
    expect(result.cols).toBe(MAX_GRID_DIMENSION)
    expect(result.rows).toBe(MAX_GRID_DIMENSION)
  })

  test('rows are clamped to MAX_GRID_DIMENSION for an extreme aspect-ratio combination', () => {
    // A very tall, narrow source (sourceAspectRatio near 0) with a wide cell
    // aspect ratio drives the derived rows far above any usable grid size.
    const result = computeGridDimensions(100, 0.0001, 5)
    expect(result.rows).toBe(MAX_GRID_DIMENSION)
  })
})
