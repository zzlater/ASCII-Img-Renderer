import { useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { UploadPanel } from './components/UploadPanel'
import { SourcePreview } from './components/SourcePreview'
import { AsciiOutput } from './components/AsciiOutput'
import { ControlsPanel } from './components/ControlsPanel'
import { loadImageSource, disposeImageSource } from './sources/image-source'
import { useAsciiRenderer } from './hooks/useAsciiRenderer'
import { DEFAULT_RENDER_SETTINGS } from './state/default-render-settings'
import type { RenderSettings } from './renderer/types'
import './styles/app.css'

function App() {
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<RenderSettings>(DEFAULT_RENDER_SETTINGS)
  const requestIdRef = useRef(0)

  // Releases the previously-decoded bitmap the instant it's replaced by a
  // new one, and on unmount (effect cleanup fires in both cases).
  useEffect(() => {
    return () => disposeImageSource(imageBitmap)
  }, [imageBitmap])

  // Same pattern for the preview <img>'s object URL.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFileSelected(file: File) {
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
      setImageBitmap(bitmap)
      setPreviewUrl(URL.createObjectURL(file))
      setFileName(file.name)
      setError(null)
    } catch {
      if (requestId !== requestIdRef.current) return
      setError('Could not load that image. Try a PNG, JPEG, WebP, or GIF file.')
    }
  }

  function handleSettingsChange(patch: Partial<RenderSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const { canvasRef, metrics } = useAsciiRenderer(imageBitmap, settings)

  return (
    <div className="app-shell">
      <Header renderTimeMs={metrics?.renderTimeMs ?? null} />
      <UploadPanel onFileSelected={handleFileSelected} fileName={fileName} error={error} />
      <ControlsPanel settings={settings} onChange={handleSettingsChange} />
      <main className="preview-grid">
        <SourcePreview previewUrl={previewUrl} />
        <AsciiOutput canvasRef={canvasRef} hasSource={imageBitmap !== null} />
      </main>
    </div>
  )
}

export default App
