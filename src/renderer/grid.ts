/**
 * DEC-010: output width (character columns) drives grid resolution;
 * height is derived, never set independently.
 *
 * sourceAspectRatio = sourceWidth / sourceHeight.
 * cellAspectRatio = fontCellWidthPx / fontCellHeightPx — a monospace
 * character cell is normally taller than it is wide, so this is
 * normally < 1 (e.g. ~0.55); it's a parameter here, measured by the
 * caller (the canvas2d renderer) from the real font.
 *
 * Derivation: the output grid's pixel aspect ratio must match the
 * source's. Grid pixel width = cols * cellWidthPx, grid pixel height =
 * rows * cellHeightPx, so:
 *   cols * cellWidthPx / (rows * cellHeightPx) = sourceAspectRatio
 *   rows = cols * (cellWidthPx / cellHeightPx) / sourceAspectRatio
 *   rows = cols * cellAspectRatio / sourceAspectRatio
 *
 * Sanity check: a square source (sourceAspectRatio = 1) with square
 * cells (cellAspectRatio = 1) yields rows === cols, a square grid.
 */
export function computeGridDimensions(
  outputWidthCols: number,
  sourceAspectRatio: number,
  cellAspectRatio: number,
): { cols: number; rows: number } {
  const cols = Number.isFinite(outputWidthCols) ? Math.max(1, Math.round(outputWidthCols)) : 1
  const rows = Math.max(1, Math.round((cols * cellAspectRatio) / sourceAspectRatio))
  return { cols, rows }
}
