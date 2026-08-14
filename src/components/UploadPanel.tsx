interface UploadPanelProps {
  sourceType: 'image' | 'video' | null
  onImageFileSelected: (file: File) => void
  onVideoFileSelected: (file: File) => void
  fileName: string | null
  error: string | null
}

const SOURCE_LABEL: Record<'image' | 'video', string> = {
  image: 'Image',
  video: 'Video',
}

/**
 * Two sibling file inputs (image, video) rather than a separate mode toggle
 * — picking a file in either one is itself the "switch source type" action,
 * so there's no extra mode state to keep in sync with what's actually
 * loaded. The badge (no longer hardcoded "Image", per its own prior
 * comment) reflects whichever source is actually active.
 */
export function UploadPanel({ sourceType, onImageFileSelected, onVideoFileSelected, fileName, error }: UploadPanelProps) {
  return (
    <div className="upload-panel">
      <span className="source-badge">Source: {sourceType ? SOURCE_LABEL[sourceType] : 'None'}</span>
      <div className="upload-field">
        <label className="upload-label" htmlFor="image-upload-input">
          Upload an image
        </label>
        <input
          id="image-upload-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImageFileSelected(file)
          }}
        />
      </div>
      <div className="upload-field">
        <label className="upload-label" htmlFor="video-upload-input">
          Upload a video
        </label>
        <input
          id="video-upload-input"
          type="file"
          accept="video/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onVideoFileSelected(file)
          }}
        />
      </div>
      {fileName && <span className="upload-filename">{fileName}</span>}
      {error && (
        <span className="upload-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
