interface UploadPanelProps {
  onFileSelected: (file: File) => void
  fileName: string | null
  error: string | null
}

/**
 * "Source: Image" badge is deliberately a visible label now, not hardcoded
 * prose — Phase 4 adds video/webcam/screen-share sources, at which point
 * this badge becomes dynamic (whichever source type is active) rather than
 * needing to be invented from scratch.
 */
export function UploadPanel({ onFileSelected, fileName, error }: UploadPanelProps) {
  return (
    <div className="upload-panel">
      <span className="source-badge">Source: Image</span>
      <label className="upload-label" htmlFor="image-upload-input">
        Upload an image
      </label>
      <input
        id="image-upload-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFileSelected(file)
        }}
      />
      {fileName && <span className="upload-filename">{fileName}</span>}
      {error && (
        <span className="upload-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
