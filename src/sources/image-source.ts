/**
 * T2.1 — Image upload input source.
 *
 * Decodes an uploaded file into an ImageBitmap: the CanvasImageSource fed
 * to the renderer (src/renderer/canvas2d-renderer.ts already handles
 * ImageBitmap via its generic width/height fallback in getSourceDimensions,
 * so no renderer changes are needed to consume this).
 *
 * Why ImageBitmap over HTMLImageElement here: createImageBitmap(file)
 * decodes directly from the File/Blob, so there is no
 * URL.createObjectURL/revokeObjectURL pair to manage for this path at all
 * — nothing to leak. The one resource it does hold is decoded bitmap
 * memory, released via ImageBitmap.close() (disposeImageSource below)
 * whenever the source is replaced or the owning component unmounts. (The
 * app's on-screen source *preview* is a separate plain <img>, which does
 * use an object URL — see App.tsx — since that's the natural way to give
 * an <img> a src; that URL is revoked there on replacement/unmount.)
 *
 * Animated GIFs decode to their first frame only, which is the documented
 * acceptable behavior for this task — no frame-freezing logic needed.
 */
export async function loadImageSource(file: File): Promise<ImageBitmap> {
  // 'from-image' matches the <img> preview's always-applied EXIF rotation,
  // since createImageBitmap's default orientation handling isn't
  // guaranteed to agree with that across browsers.
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

/** Releases decoded bitmap memory. Safe to call with null/undefined. */
export function disposeImageSource(bitmap: ImageBitmap | null | undefined): void {
  bitmap?.close()
}
