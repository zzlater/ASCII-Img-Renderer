import type { RefObject } from 'react'

interface AsciiOutputProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  hasSource: boolean
}

/**
 * The canvas element only mounts once a source exists, so there's no blank/
 * zero-size canvas artifact visible before the first upload (see App.tsx's
 * empty-state choice). The renderer (via useAsciiRenderer) draws directly
 * to this <canvas> — one element for the whole grid, never one DOM node
 * per glyph.
 */
export function AsciiOutput({ canvasRef, hasSource }: AsciiOutputProps) {
  return (
    <section className="panel ascii-output">
      <h2 className="panel-title">ASCII Output</h2>
      <div className="preview-frame">
        {hasSource ? (
          <canvas ref={canvasRef} className="ascii-canvas" />
        ) : (
          <p className="empty-state">ASCII output will appear here.</p>
        )}
      </div>
    </section>
  )
}
