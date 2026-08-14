import { useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { UploadPanel } from './components/UploadPanel'
import { SourcePreview } from './components/SourcePreview'
import { AsciiOutput } from './components/AsciiOutput'
import { ControlsPanel } from './components/ControlsPanel'
import { loadImageSource, disposeImageSource } from './sources/image-source'
import { loadVideoSource, disposeVideoSource } from './sources/video-source'
import { useAsciiRenderer } from './hooks/useAsciiRenderer'
import { useLiveVideoRenderer } from './hooks/useLiveVideoRenderer'
import { DEFAULT_RENDER_SETTINGS } from './state/default-render-settings'
import type { RenderSettings } from './renderer/types'
import './styles/app.css'

function App() {
  const [sourceType, setSourceType] = useState<'image' | 'video' | null>(null)
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<RenderSettings>(DEFAULT_RENDER_SETTINGS)
  const requestIdRef = useRef(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // The live-render hook needs the current video element as a render-time
  // value (to pass conditionally based on sourceType), but reading
  // videoRef.current directly in the render body trips
  // eslint-plugin-react-hooks' refs rule. SourcePreview's <video> is always
  // mounted and never replaced, so this only needs to run once: an effect
  // reads the now-attached ref right after mount and mirrors it into state.
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  useEffect(() => {
    setVideoElement(videoRef.current)
  }, [])

  // Releases the previously-decoded bitmap the instant it's replaced by a
  // new one, and on unmount (effect cleanup fires in both cases). Also
  // fires when switching to the video source, since that path nulls
  // imageBitmap out to hand this effect ownership of the teardown.
  useEffect(() => {
    return () => disposeImageSource(imageBitmap)
  }, [imageBitmap])

  // Same pattern for the preview <img>'s object URL.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // The video path's mirror of the imageBitmap effect above: unlike the
  // <video> element itself (always-mounted, see SourcePreview), whatever
  // object URL/playback state it owns is only otherwise torn down when
  // switching to the image source (handleImageFileSelected), never on App
  // unmounting. Empty deps: this only needs to run once, and videoRef.current
  // in the cleanup closure will still correctly refer to the one persistent
  // element whenever unmount happens.
  useEffect(() => {
    const videoEl = videoRef.current
    return () => disposeVideoSource(videoEl)
  }, [])

  // requestIdRef is shared across both handlers (not one per source type) so
  // that an image upload and a video upload racing each other resolve in
  // "last pick wins" order regardless of which one settles first — the same
  // stale-request guard the single-source version already used, just now
  // guarding both async paths against each other too.
  async function handleImageFileSelected(file: File) {
    const requestId = ++requestIdRef.current
    try {
      const bitmap = await loadImageSource(file)
      // A newer upload started while this one was decoding — drop this
      // result instead of clobbering the newer state, and dispose the
      // bitmap since it never reaches state for the effect cleanup to own.
      if (requestId !== requestIdRef.current) {
        disposeImageSource(bitmap)
        return
      }
      // Switching from video (or a no-op if video was never loaded): stop
      // playback and release its object URL so it doesn't keep running
      // off-screen once the image becomes the active source.
      disposeVideoSource(videoRef.current)
      setImageBitmap(bitmap)
      setPreviewUrl(URL.createObjectURL(file))
      setFileName(file.name)
      setSourceType('image')
      setError(null)
    } catch {
      if (requestId !== requestIdRef.current) return
      setError('Could not load that image. Try a PNG, JPEG, WebP, or GIF file.')
    }
  }

  async function handleVideoFileSelected(file: File) {
    const videoEl = videoRef.current
    // The <video> element is always mounted (see SourcePreview), so this is
    // only ever null before first paint — file inputs can't fire that early.
    if (!videoEl) return
    const requestId = ++requestIdRef.current
    try {
      await loadVideoSource(videoEl, file)
      if (requestId !== requestIdRef.current) {
        // A newer upload started while this one was loading metadata;
        // dispose what we just pointed the shared <video> element at
        // instead of letting a stale source clobber the newer pick.
        disposeVideoSource(videoEl)
        return
      }
      // Switching from image: let the bitmap/preview-url cleanup effects
      // above own the actual teardown, triggered by nulling their state.
      setImageBitmap(null)
      setPreviewUrl(null)
      setFileName(file.name)
      setSourceType('video')
      setError(null)
    } catch {
      if (requestId !== requestIdRef.current) return
      setError('Could not load that video. Try a common format such as MP4 or WebM.')
    }
  }

  function handleSettingsChange(patch: Partial<RenderSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const { canvasRef: imageCanvasRef, metrics } = useAsciiRenderer(
    sourceType === 'image' ? imageBitmap : null,
    settings,
  )
  const { canvasRef: videoCanvasRef } = useLiveVideoRenderer(
    sourceType === 'video' ? videoElement : null,
    settings,
  )
  const canvasRef = sourceType === 'video' ? videoCanvasRef : imageCanvasRef

  return (
    <div className="app-shell">
      <Header renderTimeMs={metrics?.renderTimeMs ?? null} />
      <UploadPanel
        sourceType={sourceType}
        onImageFileSelected={handleImageFileSelected}
        onVideoFileSelected={handleVideoFileSelected}
        fileName={fileName}
        error={error}
      />
      <ControlsPanel settings={settings} onChange={handleSettingsChange} />
      <main className="preview-grid">
        <SourcePreview sourceType={sourceType} previewUrl={previewUrl} videoRef={videoRef} />
        <AsciiOutput canvasRef={canvasRef} hasSource={sourceType !== null} />
      </main>
    </div>
  )
}

export default App
