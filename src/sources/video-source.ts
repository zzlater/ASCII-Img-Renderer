/**
 * T4.1 — Video file input source.
 *
 * Unlike image-source.ts, there is no separate "source object" produced
 * here: the caller (App.tsx) owns one persistent <video> DOM element
 * (rendered via JSX, see SourcePreview.tsx) that doubles as both the
 * visible preview AND the exact CanvasImageSource fed to the renderer every
 * frame. This module just knows how to point that element at a File and
 * clean up after it — no detached/off-DOM video element is ever created,
 * and no wrapper "source" type is introduced (see DEC-016: an extracted
 * FrameSource interface is deferred until a shared shape is actually
 * needed, and image/video's shapes remain different enough here that
 * standalone functions, matching image-source.ts's own precedent, are the
 * right amount of abstraction).
 *
 * Format support is whatever the browser's <video> element can decode;
 * there is no format allowlist (unlike T2.1's image accept-type list)
 * since decoding failure already surfaces via the element's own `error`
 * event/a rejected promise here.
 */

/**
 * Tracks which object URL a given <video> element currently owns, so
 * loadVideoSource/disposeVideoSource can revoke the right one without a
 * wrapper return type or a DOM-attached marker attribute.
 */
const ownedObjectUrls = new WeakMap<HTMLVideoElement, string>()

/**
 * Points `videoElement` at `file` and resolves once metadata has loaded
 * (the point at which videoWidth/videoHeight become available), or rejects
 * on decode error. Revokes any object URL this element previously owned
 * before assigning the new one. The one-shot loadedmetadata/error listeners
 * are removed as soon as either fires, so nothing is left attached once
 * this promise settles.
 *
 * Reassigning `videoElement.src` while a load is pending (a fresh call here,
 * or `disposeVideoSource` clearing `src`) fires `abort` on the element per
 * the media element spec — neither `loadedmetadata` nor `error`. An `abort`
 * listener runs the same `cleanup()` so a preempted load doesn't leave the
 * other two listeners dangling on the element; it deliberately does not
 * resolve/reject, since the caller (App.tsx) already tracks staleness itself
 * via its own request-id guard.
 */
export function loadVideoSource(videoElement: HTMLVideoElement, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    function cleanup() {
      videoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
      videoElement.removeEventListener('error', onError)
      videoElement.removeEventListener('abort', onAbort)
    }
    function onLoadedMetadata() {
      cleanup()
      resolve()
    }
    function onError() {
      cleanup()
      reject(new Error('Video source failed to load'))
    }
    function onAbort() {
      cleanup()
      // No resolve/reject: the caller's own stale-request guard handles
      // this case; this listener exists only so a preempted load doesn't
      // leave stale loadedmetadata/error listeners attached to the element.
    }

    videoElement.addEventListener('loadedmetadata', onLoadedMetadata)
    videoElement.addEventListener('error', onError)
    videoElement.addEventListener('abort', onAbort)

    const previousUrl = ownedObjectUrls.get(videoElement)
    if (previousUrl) URL.revokeObjectURL(previousUrl)

    const url = URL.createObjectURL(file)
    ownedObjectUrls.set(videoElement, url)

    // Needed cross-browser for any autoplay/inline playback (e.g. iOS
    // Safari blocks non-muted/non-inline video from playing at all).
    videoElement.muted = true
    videoElement.playsInline = true
    videoElement.src = url
  })
}

/**
 * Pauses playback, revokes the object URL this element owns (if any), and
 * clears `src` — the exact cleanup T4.1 requires on unmount or source
 * change. Safe to call with null/undefined or an element with no active
 * video source.
 */
export function disposeVideoSource(videoElement: HTMLVideoElement | null | undefined): void {
  if (!videoElement) return
  videoElement.pause()
  const url = ownedObjectUrls.get(videoElement)
  if (url) {
    URL.revokeObjectURL(url)
    ownedObjectUrls.delete(videoElement)
  }
  videoElement.src = ''
}
