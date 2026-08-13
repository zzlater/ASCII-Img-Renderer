/**
 * Character-ramp convention: a ramp string is ordered
 * dense/dark-glyph-first -> sparse/light-glyph-last. Index 0 (the
 * densest glyph, e.g. "@") represents the DARKEST luminance; the last
 * index (typically a space) represents the BRIGHTEST luminance. This
 * direction is load-bearing for luminanceToChar below and for every
 * preset here.
 */
export const CHAR_RAMPS = {
  classic: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  minimal: '#*:. ',
  binary: '10 ',
  // Paul Bourke's well-known long ASCII-art density ramp: hand-tuned by
  // eye for smooth, monotonically decreasing perceived density glyph by
  // glyph, giving finer luminance gradation than the short presets.
  detailed:
    '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
} as const

export type CharRampPreset = keyof typeof CHAR_RAMPS

/**
 * Maps normalized luminance (0-1, clamped) to a character in `ramp`.
 * Low luminance -> low index (dense glyph); high luminance -> high index
 * (sparse glyph/space) — index rises directly with luminance so it lands
 * on the ramp's dense-first..sparse-last ordering. Returns a space for
 * an empty ramp rather than throwing, since callers may pass unsanitized
 * input.
 */
export function luminanceToChar(luminance: number, ramp: string): string {
  if (ramp.length === 0) return ' '
  const clamped = Math.min(1, Math.max(0, luminance))
  const index = Math.min(ramp.length - 1, Math.max(0, Math.floor(clamped * (ramp.length - 1))))
  return ramp[index]
}

/**
 * Sanitizes a user-supplied custom ramp string: strips newlines, control
 * characters, and anything outside printable ASCII (0x20 space through
 * 0x7E "~"), including emoji/unicode. Iterates by code point (not UTF-16
 * code unit) so a surrogate-pair emoji is dropped as one character
 * rather than leaking a stray half. Falls back to the classic preset
 * only if nothing survives sanitization. Never throws.
 *
 * Duplicate characters are intentionally NOT deduped — a repeated
 * glyph in a ramp just makes that density band map to more of the
 * total 0-1 luminance range, which is harmless, so dedup is skipped
 * entirely rather than adding correctness-motivated complexity for a
 * non-problem.
 */
export function sanitizeCustomRamp(input: string): string {
  const sanitized = Array.from(input)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0
      return code >= 0x20 && code <= 0x7e
    })
    .join('')
  return sanitized.length > 0 ? sanitized : CHAR_RAMPS.classic
}
