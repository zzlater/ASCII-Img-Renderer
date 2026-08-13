import { useEffect, useRef, useState, type RefObject } from 'react'
import { createCanvas2DRenderer } from '../renderer/canvas2d-renderer'
import type { AsciiRenderer, RenderMetrics, RenderSettings } from '../renderer/types'

interface UseAsciiRendererResult {
  canvasRef: RefObject<HTMLCanvasElement | null>
  metrics: RenderMetrics | null
}

/**
 * Owns one AsciiRenderer instance for the component's lifetime (created on
 * mount, disposed on unmount) and re-renders `source` into an internally
 * owned <canvas> ref whenever `source` or `settings` change.
 *
 * This calls render() once per change — a static render, correct for
 * Phase 2's image source. Phase 4 adds a rAF loop for live sources on top
 * of the same renderer instance/interface; per DEC-011 that loop must
 * drive the canvas via refs, not by calling this hook every frame.
 */
export function useAsciiRenderer(
  source: CanvasImageSource | null,
  settings: RenderSettings,
): UseAsciiRendererResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<AsciiRenderer | null>(null)
  const [metrics, setMetrics] = useState<RenderMetrics | null>(null)

  useEffect(() => {
    const renderer = createCanvas2DRenderer()
    rendererRef.current = renderer
    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (!canvas || !renderer || !source) return
    setMetrics(renderer.render(source, canvas, settings))
  }, [source, settings])

  return { canvasRef, metrics }
}
