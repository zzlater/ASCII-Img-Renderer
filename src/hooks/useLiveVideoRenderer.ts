import { useEffect, useRef, type RefObject } from 'react'
import { createCanvas2DRenderer } from '../renderer/canvas2d-renderer'
import type { AsciiRenderer, RenderSettings } from '../renderer/types'

interface UseLiveVideoRendererResult {
  canvasRef: RefObject<HTMLCanvasElement | null>
}

/**
 * T4.2 — rAF-based live render loop for a playing <video> element, per
 * DEC-011: the per-frame path must never call setState. This owns its own
 * AsciiRenderer instance (independent of useAsciiRenderer's, which is a
 * separate one-shot static-render hook for the image path — see that file's
 * own doc comment) and drives its own internally-owned <canvas> ref
 * directly from the rAF callback.
 *
 * Settings are read from a ref, not the closed-over `settings` argument, so
 * a slider drag never needs to tear down and restart the play/pause-gated
 * loop below — only the videoElement identity does.
 */
export function useLiveVideoRenderer(
  videoElement: HTMLVideoElement | null,
  settings: RenderSettings,
): UseLiveVideoRendererResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<AsciiRenderer | null>(null)

  const settingsRef = useRef(settings)
  // Synced via effect (not assigned directly in the render body) since
  // eslint-plugin-react-hooks' refs rule forbids mutating a ref during
  // render; a no-deps effect still keeps this current before the next rAF
  // tick reads it, which is all the live loop needs.
  useEffect(() => {
    settingsRef.current = settings
  })

  useEffect(() => {
    const renderer = createCanvas2DRenderer()
    rendererRef.current = renderer
    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!videoElement) return

    let rafHandle: number | null = null

    function tick() {
      const canvas = canvasRef.current
      const renderer = rendererRef.current
      // videoElement is narrowed non-null by the outer guard, but the
      // closure needs its own reference since this effect's cleanup can
      // run (on unmount/element change) after a rAF callback has already
      // been scheduled but before it fires.
      if (canvas && renderer && videoElement) {
        renderer.render(videoElement, canvas, settingsRef.current)
      }
      rafHandle = requestAnimationFrame(tick)
    }

    function startLoop() {
      if (rafHandle !== null) return
      rafHandle = requestAnimationFrame(tick)
    }

    function stopLoop() {
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle)
        rafHandle = null
      }
    }

    videoElement.addEventListener('play', startLoop)
    videoElement.addEventListener('pause', stopLoop)
    videoElement.addEventListener('ended', stopLoop)

    // Covers the case where the video is already playing by the time this
    // effect (re-)attaches (e.g. autoplay fired before listeners existed).
    if (!videoElement.paused) {
      startLoop()
    }

    return () => {
      stopLoop()
      videoElement.removeEventListener('play', startLoop)
      videoElement.removeEventListener('pause', stopLoop)
      videoElement.removeEventListener('ended', stopLoop)
    }
  }, [videoElement])

  return { canvasRef }
}
