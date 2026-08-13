interface SourcePreviewProps {
  previewUrl: string | null
}

/**
 * Plain <img> with object-fit: contain (see styles/app.css) preserves the
 * source's aspect ratio with no hand-rolled math needed here — that math
 * already lives in renderer/grid.ts for the ASCII side.
 */
export function SourcePreview({ previewUrl }: SourcePreviewProps) {
  return (
    <section className="panel source-preview">
      <h2 className="panel-title">Source</h2>
      <div className="preview-frame">
        {previewUrl ? (
          <img className="preview-image" src={previewUrl} alt="Uploaded source preview" />
        ) : (
          <p className="empty-state">Upload an image to get started.</p>
        )}
      </div>
    </section>
  )
}
