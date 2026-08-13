/**
 * Perceived luminance from an sRGB triplet, using the Rec. 601 luma
 * weighting: L = 0.299*R + 0.587*G + 0.114*B.
 *
 * Input: r, g, b each in the 0-255 range (as read from ImageData).
 * Output: normalized luminance in 0-1 (0 = black, 1 = white).
 *
 * No clamping is performed here: any r/g/b in 0-255 already produces a
 * result in 0-1 by construction (the weights sum to 1.0), so this stays a
 * pure, allocation-free formula rather than defensive-clamping input that
 * ImageData never actually supplies out of range.
 */
export function luminanceFromRgb(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
