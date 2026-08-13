import { describe, expect, test } from 'vitest'
import { CHAR_RAMPS, luminanceToChar, sanitizeCustomRamp } from './char-ramp'

describe('luminanceToChar', () => {
  test('darkest luminance maps to index 0 (densest glyph)', () => {
    expect(luminanceToChar(0, CHAR_RAMPS.classic)).toBe('@')
  })

  test('brightest luminance maps to the last index (sparsest glyph)', () => {
    expect(luminanceToChar(1, CHAR_RAMPS.classic)).toBe(' ')
  })

  test('mid luminance maps to a mid index', () => {
    const ramp = CHAR_RAMPS.classic
    const expectedIndex = Math.floor(0.5 * (ramp.length - 1))
    expect(luminanceToChar(0.5, ramp)).toBe(ramp[expectedIndex])
  })

  test('out-of-range luminance is clamped instead of indexing out of bounds', () => {
    expect(luminanceToChar(-5, CHAR_RAMPS.classic)).toBe('@')
    expect(luminanceToChar(5, CHAR_RAMPS.classic)).toBe(' ')
  })

  test('empty ramp returns a space instead of throwing', () => {
    expect(() => luminanceToChar(0.5, '')).not.toThrow()
    expect(luminanceToChar(0.5, '')).toBe(' ')
  })

  test('every built-in preset resolves both ends without throwing', () => {
    for (const ramp of Object.values(CHAR_RAMPS)) {
      expect(() => luminanceToChar(0, ramp)).not.toThrow()
      expect(() => luminanceToChar(1, ramp)).not.toThrow()
    }
  })
})

describe('sanitizeCustomRamp', () => {
  test('never throws on empty, whitespace, or unicode input', () => {
    expect(() => sanitizeCustomRamp('')).not.toThrow()
    expect(() => sanitizeCustomRamp('\n\t\n')).not.toThrow()
    expect(() => sanitizeCustomRamp('@#😀🎉')).not.toThrow()
  })

  test('empty input falls back to the classic preset', () => {
    expect(sanitizeCustomRamp('')).toBe(CHAR_RAMPS.classic)
  })

  test('control-character-only input falls back to the classic preset', () => {
    expect(sanitizeCustomRamp('\n\t\r')).toBe(CHAR_RAMPS.classic)
  })

  test('strips control characters embedded in otherwise valid input', () => {
    expect(sanitizeCustomRamp('ab\x01cd')).toBe('abcd')
  })

  test('strips emoji/unicode while keeping printable ASCII', () => {
    expect(sanitizeCustomRamp('@#😀🎉')).toBe('@#')
  })

  test('a ramp of plain spaces is preserved (non-empty, not thrown away)', () => {
    expect(sanitizeCustomRamp('   ')).toBe('   ')
  })

  test('does not dedupe repeated characters', () => {
    expect(sanitizeCustomRamp('##@@..')).toBe('##@@..')
  })

  test('built-in presets pass through unchanged (already printable ASCII)', () => {
    expect(sanitizeCustomRamp(CHAR_RAMPS.classic)).toBe(CHAR_RAMPS.classic)
    expect(sanitizeCustomRamp(CHAR_RAMPS.detailed)).toBe(CHAR_RAMPS.detailed)
  })
})
