import { useState, type ChangeEvent } from 'react'
import { CHAR_RAMPS, sanitizeCustomRamp, type CharRampPreset } from '../processing/char-ramp'
import type { ColorMode, RenderSettings } from '../renderer/types'

interface ControlsPanelProps {
  settings: RenderSettings
  onChange: (patch: Partial<RenderSettings>) => void
}

const RAMP_PRESET_KEYS = Object.keys(CHAR_RAMPS) as CharRampPreset[]

/** Common monospace stacks available on every OS, no web-font loading needed. */
const FONT_FAMILY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'System Monospace', value: 'ui-monospace, "Cascadia Code", "SF Mono", Consolas, monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Menlo', value: 'Menlo, monospace' },
  { label: 'Lucida Console', value: '"Lucida Console", monospace' },
]

export function ControlsPanel({ settings, onChange }: ControlsPanelProps) {
  // Mirrors the raw text the user is typing, decoupled from the sanitized
  // value fed to settings.charRamp — binding the input directly to the
  // sanitized value would snap an emptied field back to the classic preset
  // mid-edit (sanitizeCustomRamp('') falls back to classic), making it
  // impossible to clear the field to type a fresh ramp.
  const [customRampText, setCustomRampText] = useState(settings.charRamp)

  const matchedPreset = RAMP_PRESET_KEYS.find((key) => CHAR_RAMPS[key] === settings.charRamp)

  function handlePresetChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    if (value === 'custom') return
    const ramp = CHAR_RAMPS[value as CharRampPreset]
    setCustomRampText(ramp)
    onChange({ charRamp: ramp })
  }

  function handleCustomRampChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    setCustomRampText(raw)
    onChange({ charRamp: sanitizeCustomRamp(raw) })
  }

  return (
    <section className="panel controls-panel">
      <h2 className="panel-title">Controls</h2>

      <div className="control-group">
        <label className="control-label" htmlFor="char-ramp-preset">
          Character ramp preset
        </label>
        <select id="char-ramp-preset" value={matchedPreset ?? 'custom'} onChange={handlePresetChange}>
          {RAMP_PRESET_KEYS.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="char-ramp-custom">
          Custom ramp (dark to light)
        </label>
        <input id="char-ramp-custom" type="text" value={customRampText} onChange={handleCustomRampChange} />
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="font-family">
          Font family
        </label>
        <select
          id="font-family"
          value={settings.fontFamily}
          onChange={(event) => onChange({ fontFamily: event.target.value })}
        >
          {FONT_FAMILY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="font-size">
          Font size (px)
        </label>
        <input
          id="font-size"
          type="number"
          min={8}
          max={32}
          step={1}
          value={settings.fontSizePx}
          onChange={(event) => onChange({ fontSizePx: event.target.valueAsNumber })}
        />
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="control-label" htmlFor="brightness">
            Brightness
          </label>
          <input
            id="brightness"
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={settings.brightness}
            onChange={(event) => onChange({ brightness: event.target.valueAsNumber })}
          />
          <span className="control-value">{settings.brightness.toFixed(2)}</span>
        </div>
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="control-label" htmlFor="contrast">
            Contrast
          </label>
          <input
            id="contrast"
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={settings.contrast}
            onChange={(event) => onChange({ contrast: event.target.valueAsNumber })}
          />
          <span className="control-value">{settings.contrast.toFixed(2)}</span>
        </div>
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="control-label" htmlFor="gamma">
            Gamma
          </label>
          <input
            id="gamma"
            type="range"
            min={0.1}
            max={3}
            step={0.01}
            value={settings.gamma}
            onChange={(event) => onChange({ gamma: event.target.valueAsNumber })}
          />
          <span className="control-value">{settings.gamma.toFixed(2)}</span>
        </div>
      </div>

      <div className="control-group">
        <div className="control-row">
          <input
            id="invert"
            type="checkbox"
            checked={settings.invert}
            onChange={(event) => onChange({ invert: event.target.checked })}
          />
          <label className="control-label" htmlFor="invert">
            Invert
          </label>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="color-mode">
          Color mode
        </label>
        <select
          id="color-mode"
          value={settings.colorMode}
          onChange={(event) => onChange({ colorMode: event.target.value as ColorMode })}
        >
          <option value="color">Color</option>
          <option value="monochrome">Monochrome</option>
        </select>
      </div>

      {settings.colorMode === 'monochrome' && (
        <div className="control-group">
          <label className="control-label" htmlFor="monochrome-color">
            Monochrome color
          </label>
          <input
            id="monochrome-color"
            type="color"
            value={settings.monochromeColor}
            onChange={(event) => onChange({ monochromeColor: event.target.value })}
          />
        </div>
      )}

      <div className="control-group">
        <label className="control-label" htmlFor="output-width">
          Output width (columns)
        </label>
        <input
          id="output-width"
          type="number"
          min={10}
          max={400}
          step={1}
          value={settings.outputWidthCols}
          onChange={(event) => onChange({ outputWidthCols: event.target.valueAsNumber })}
        />
      </div>
    </section>
  )
}
