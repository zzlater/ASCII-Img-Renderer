interface HeaderProps {
  /** Last static render's wall-clock time (RenderMetrics.renderTimeMs). Null before any render. */
  renderTimeMs: number | null
}

export function Header({ renderTimeMs }: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <h1>ASCII Img Renderer</h1>
        <p className="subtitle">
          Turn images, video, webcam, and screen captures into live ASCII art.
        </p>
      </div>
      {/* Placeholder slot: Phase 5 replaces this with a live fps/frame-time
          diagnostics readout. For now it just shows the last static render's
          own timing, trivially available from useAsciiRenderer's metrics. */}
      <div className="metrics-slot" aria-label="Render time">
        {renderTimeMs != null ? `${renderTimeMs.toFixed(1)} ms` : '—'}
      </div>
    </header>
  )
}
