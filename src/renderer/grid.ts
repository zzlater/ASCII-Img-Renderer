/**
 * Upper bound on cols/rows in the computed grid. Both dimensions feed
 * directly into the offscreen sample canvas's width/height and a
 * getImageData(0, 0, cols, rows) call in canvas2d-renderer.ts — an
 * unbounded value (from a hand-typed outputWidthCols or a pathological
 * aspect-ratio combination) can throw synchronously there and, with no
 * ErrorBoundary in the tree, crash the whole app. Kept in the low
 * thousands, comfortably above any usable ASCII grid size.
 */
export const MAX_GRID_DIMENSION = 2000

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
 *
 * Both cols and rows are clamped to [1, MAX_GRID_DIMENSION] — cols
 * against a hand-typed outputWidthCols bypassing the UI's min/max
 * hints, rows against a pathological sourceAspectRatio/cellAspectRatio
 * combination — so a downstream getImageData call never receives an
 * unreasonably large buffer size.
 */
export function computeGridDimensions(
  outputWidthCols: number,
  sourceAspectRatio: number,
  cellAspectRatio: number,
): { cols: number; rows: number } {
  const cols = Number.isFinite(outputWidthCols)
    ? Math.min(MAX_GRID_DIMENSION, Math.max(1, Math.round(outputWidthCols)))
    : 1
  const rows = Math.min(
    MAX_GRID_DIMENSION,
    Math.max(1, Math.round((cols * cellAspectRatio) / sourceAspectRatio)),
  )
  return { cols, rows }
}
