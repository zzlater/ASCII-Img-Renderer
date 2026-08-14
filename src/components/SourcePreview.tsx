import type { RefObject } from 'react'

interface SourcePreviewProps {
  sourceType: 'image' | 'video' | null
  previewUrl: string | null
  videoRef: RefObject<HTMLVideoElement | null>
}

/**
 * The <video> element is always mounted (never conditionally added/removed
 * by sourceType) so its ref is populated on App's first commit — well
 * before any file is picked. That's what lets App.tsx read a non-null
 * videoRef.current the moment sourceType flips to 'video', instead of
 * needing an extra render pass to pick up a ref that only just attached.
 * It's the same persistent node used both as this visible preview AND as
 * the exact CanvasImageSource the live render loop reads every frame (see
 * sources/video-source.ts) — just hidden via CSS while not the active
 * source, never unmounted/remounted.
 *
 * `controls` gives play/pause/seek for free (T4.1's "handle play/pause"
 * acceptance criterion) with no hand-rolled transport UI.
 */
export function SourcePreview({ sourceType, previewUrl, videoRef }: SourcePreviewProps) {
  const showImage = sourceType === 'image' && previewUrl
  const showVideo = sourceType === 'video'

  return (
    <section className="panel source-preview">
      <h2 className="panel-title">Source</h2>
      <div className="preview-frame">
        {!showImage && !showVideo && <p className="empty-state">Upload an image or video to get started.</p>}
        {showImage && <img className="preview-image" src={previewUrl} alt="Uploaded source preview" />}
        <video
          ref={videoRef}
          className={`preview-video${showVideo ? '' : ' is-hidden'}`}
          controls
          muted
          playsInline
        />
      </div>
    </section>
  )
}
