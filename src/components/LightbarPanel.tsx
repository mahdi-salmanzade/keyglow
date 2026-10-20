import { toHex, mix, type Rgb } from '../engine/color'
import { runtime } from '../engine/runtime'
import { LIGHTBAR_LEDS } from '../hid/lightbar'
import { WOOTING_80HE } from '../layout/wooting-80he'
import { useDevice } from '../state/device'
import { getState, setState, useEditor, type LightbarMode, type LightbarState } from '../state/store'

const MODES: { id: LightbarMode; name: string; hint: string }[] = [
  { id: 'keyboard', name: 'Keyboard', hint: 'The bar follows the keyboard’s own RGB effect. keyglow leaves it alone.' },
  { id: 'colours', name: 'Colours', hint: 'Click an LED to paint it with the primary colour.' },
  { id: 'pulse', name: 'Pulse', hint: 'The whole bar breathes in one colour.' },
  { id: 'mirror', name: 'Mirror', hint: 'The keyboard copies the number row (1 to 0) onto the bar, live.' },
  { id: 'off', name: 'Off', hint: 'The bar stays dark.' },
]

const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

function update(patch: Partial<LightbarState>) {
  setState((s) => ({ lightbar: { ...s.lightbar, ...patch } }))
}

function setLed(i: number, color: Rgb) {
  update({ colors: getState().lightbar.colors.map((c, j) => (j === i ? color : c)) })
}

/** Snapshot the number row's current colours onto the bar. */
function fromKeys() {
  const frame = runtime.current()
  const colors = NUMBER_ROW.map((id) => {
    const key = WOOTING_80HE.keys.find((k) => k.id === id)!
    return frame[key.leds[0]]
  })
  update({ mode: 'colours', colors })
}

export function LightbarPanel() {
  const lb = useEditor((s) => s.lightbar)
  const primary = useEditor((s) => s.primary)
  const secondary = useEditor((s) => s.secondary)
  const connected = useDevice().kind === 'connected'
  const mode = MODES.find((m) => m.id === lb.mode)!

  return (
    <section className="tool-section" aria-label="Light bar">
      <span className="label">
        Light bar · {connected ? (lb.mode === 'keyboard' ? 'not touched' : 'live on the keyboard') : 'connect to apply'}
      </span>
      <div className="filters" role="group" aria-label="Light bar mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            className="chip"
            aria-pressed={lb.mode === m.id}
            onClick={() => update(m.id === 'pulse' && lb.mode !== 'pulse' ? { mode: m.id, pulseColor: primary } : { mode: m.id })}
          >
            {m.name}
          </button>
        ))}
      </div>

      {lb.mode === 'colours' && (
        <>
          <div className="lightbar-strip" role="group" aria-label="Light bar LEDs, left to right">
            {lb.colors.slice(0, LIGHTBAR_LEDS).map((c, i) => (
              <button
                key={i}
                style={{ background: toHex(c) }}
                aria-label={`LED ${i + 1}: ${toHex(c)}. Paint with ${toHex(primary)}`}
                title={`LED ${i + 1} · ${toHex(c)}`}
                onClick={() => setLed(i, primary)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  update({ colors: lb.colors.map((_, j) => (j === i ? ([0, 0, 0] as Rgb) : lb.colors[j])) })
                }}
              />
            ))}
          </div>
          <div className="row-actions">
            <button className="btn quiet" onClick={() => update({ colors: Array.from({ length: LIGHTBAR_LEDS }, () => primary) })}>
              Fill
            </button>
            <button
              className="btn quiet"
              onClick={() => update({ colors: Array.from({ length: LIGHTBAR_LEDS }, (_, i) => mix(primary, secondary, i / (LIGHTBAR_LEDS - 1))) })}
            >
              Gradient
            </button>
            <button className="btn quiet" onClick={fromKeys} title="Copy the number row’s current colours onto the bar">
              From keys
            </button>
          </div>
        </>
      )}

      {lb.mode === 'pulse' && (
        <div className="colors">
          <span className="pulse-swatch" style={{ background: toHex(lb.pulseColor) }} aria-hidden="true" />
          <label className="axis" style={{ gap: 2 }}>
            <span className="label">Every {lb.pulseSeconds.toFixed(1)} s</span>
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.5}
              value={lb.pulseSeconds}
              aria-label="Pulse length in seconds"
              onChange={(e) => update({ pulseSeconds: Number(e.target.value) })}
            />
          </label>
          <button className="btn quiet" onClick={() => update({ pulseColor: primary })} title="Use the primary colour">
            Use primary
          </button>
        </div>
      )}

      {lb.mode !== 'keyboard' && lb.mode !== 'off' && (
        <label className="axis" style={{ gap: 2 }}>
          <span className="label">Brightness {Math.round(lb.brightness * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={lb.brightness}
            aria-label="Light bar brightness"
            onChange={(e) => update({ brightness: Number(e.target.value) })}
          />
        </label>
      )}

      <p className="tool-hint" style={{ margin: 0 }}>
        {mode.hint} Written to the keyboard’s active profile (its Light Indicator), so it keeps running after you close keyglow.
      </p>
    </section>
  )
}
