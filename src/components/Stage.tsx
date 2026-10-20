import { useEffect, useRef, useState } from 'react'
import { runtime } from '../engine/runtime'
import { useDevice } from '../state/device'
import { PRESET_BY_ID, DEFAULT_PRESET_ID } from '../presets'
import { WOOTING_80HE } from '../layout/wooting-80he'
import { choosePreset, setState, useEditor, type Axis, type EditorState } from '../state/store'
import { Keyboard } from './Keyboard'

type AxisSpec = {
  id: Axis
  key: 'hueShift' | 'speed' | 'brightness' | 'spread'
  name: string
  short: string
  min: number
  max: number
  step: number
  initial: number
  format: (v: number) => string
  /** Scale labels printed at the slider ends. */
  ends: [string, string]
}

const AXES: AxisSpec[] = [
  {
    id: 'hue', key: 'hueShift', name: 'Hue shift', short: 'HUE', min: -180, max: 180, step: 1, initial: 0,
    format: (v) => `${Math.round(v) < 0 ? '−' : Math.round(v) > 0 ? '+' : ''}${String(Math.abs(Math.round(v))).padStart(3, '0')}°`,
    ends: ['−180°', '+180°'],
  },
  { id: 'speed', key: 'speed', name: 'Speed', short: 'SPEED', min: 0, max: 4, step: 0.05, initial: 1, format: (v) => `${v.toFixed(2)}×`, ends: ['0×', '4×'] },
  { id: 'brightness', key: 'brightness', name: 'Brightness', short: 'BRI', min: 0, max: 1.5, step: 0.01, initial: 1, format: (v) => `${Math.round(v * 100)}%`, ends: ['0%', '150%'] },
  { id: 'spread', key: 'spread', name: 'Spread', short: 'SPREAD', min: 0.25, max: 3, step: 0.05, initial: 1, format: (v) => v.toFixed(2), ends: ['0.25', '3.00'] },
]

const AXIS_BY_ID = new Map(AXES.map((a) => [a.id, a]))
const ARROW: Record<EditorState['direction'], string> = { right: '→', left: '←', up: '↑', down: '↓', out: 'OUT', in: 'IN' }

const clamp = (a: AxisSpec, v: number) => Math.min(a.max, Math.max(a.min, Math.round(v / a.step) * a.step))

function setAxis(a: AxisSpec, v: number) {
  setState({ [a.key]: clamp(a, v), activeAxis: a.id } as Partial<EditorState>)
}

/** The giant value: drag sideways (or use arrow keys) to scrub the active axis. */
function Readout() {
  const active = useEditor((s) => s.activeAxis)
  const axis = AXIS_BY_ID.get(active)!
  const value = useEditor((s) => s[axis.key])
  const drag = useRef<{ x: number; v: number } | null>(null)
  const perPx = (axis.max - axis.min) / 360

  return (
    <div className="readout">
      <button
        className="readout-value"
        aria-label={`${axis.name}: ${axis.format(value)}. Drag sideways or use arrow keys to change.`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, v: value }
        }}
        onPointerMove={(e) => {
          if (drag.current) setAxis(axis, drag.current.v + (e.clientX - drag.current.x) * perPx)
        }}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={() => setAxis(axis, axis.initial)}
        onKeyDown={(e) => {
          const big = e.shiftKey ? 10 : 1
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setAxis(axis, value + axis.step * big)
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setAxis(axis, value - axis.step * big)
          else return
          e.preventDefault()
        }}
      >
        {axis.format(value)}
      </button>
      <span className="readout-axis">
        <span className="label">{axis.name}</span>
        <span className="hint">drag to scrub · double-click resets</span>
      </span>
    </div>
  )
}

function Instance() {
  const presetId = useEditor((s) => s.presetId)
  const p = PRESET_BY_ID.get(presetId) ?? PRESET_BY_ID.get(DEFAULT_PRESET_ID)!
  const motion = p.reactive ? 'reacts to typing in this tab' : p.animated ? `loops every ${p.period ?? 4}s` : 'static'
  return (
    <div className="instance">
      <p className="instance-name">{p.name}</p>
      <div className="instance-meta">
        {p.category} · {p.code}
        <br />
        {motion}
      </div>
    </div>
  )
}

function LiveRate() {
  const [fps, setFps] = useState(runtime.fps)
  useEffect(() => {
    const id = setInterval(() => setFps(runtime.fps), 500)
    return () => clearInterval(id)
  }, [])
  return <>{fps} FPS</>
}

/** Facts about the board that the controls below don't already show. */
function ReadoutStrip() {
  const direction = useEditor((s) => s.direction)
  const presetId = useEditor((s) => s.presetId)
  const painted = useEditor((s) => Object.keys(s.paint).length)
  const selected = useEditor((s) => s.selection.length)
  const device = useDevice()
  return (
    <div className="strip-readout" aria-label="Board readout">
      <span>DIR {ARROW[direction]}</span>
      <span>PAINT {painted} LED{painted === 1 ? '' : 'S'}</span>
      <span>SEL {selected}</span>
      <span>{WOOTING_80HE.leds.length} LEDS · RGB565</span>
      <span>{device.kind === 'connected' ? <>LIVE <LiveRate /></> : 'PREVIEW'}</span>
      <span className="file">/ {presetId}.look</span>
    </div>
  )
}

function Axes() {
  const s = useEditor((st) => st)
  const preset = PRESET_BY_ID.get(s.presetId)
  return (
    <div className="axes">
      {AXES.map((a) => {
        const disabled = a.id === 'speed' && !preset?.animated
        const id = `axis-${a.id}`
        return (
          <div className="axis" key={a.id} data-active={s.activeAxis === a.id} data-disabled={disabled}>
            <div className="axis-top">
              <button
                className="axis-reset label"
                onClick={() => setAxis(a, a.initial)}
                title={`Reset ${a.name.toLowerCase()}`}
              >
                {a.name}
              </button>
              {disabled && <span className="axis-note">no motion in this preset</span>}
              {a.id === 'brightness' && s.brightness > 1 && <span className="axis-note">lifting mid-tones on the keyboard</span>}
            </div>
            <label className="axis-value" htmlFor={id}>{a.format(s[a.key])}</label>
            <input
              id={id}
              type="range"
              min={a.min}
              max={a.max}
              step={a.step}
              value={s[a.key]}
              aria-valuetext={a.format(s[a.key]) + (disabled ? ' (this preset does not move)' : '')}
              onFocus={() => setState({ activeAxis: a.id })}
              onChange={(e) => setAxis(a, Number(e.target.value))}
            />
            <div className="axis-ends" aria-hidden="true">
              <span>{a.ends[0]}</span>
              <span>{a.ends[1]}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InstanceRail() {
  const favourites = useEditor((s) => s.favourites)
  const presetId = useEditor((s) => s.presetId)
  const stops = favourites.map((id) => PRESET_BY_ID.get(id)).filter((p) => p !== undefined).slice(0, 8)
  if (!stops.length) return null
  return (
    <div className="rail-wrap">
      <span className="label">Starred instances</span>
      <div className="rail">
        <div className="rail-track">
          {stops.map((p) => (
            <button key={p.id} className="stop" aria-current={p.id === presetId} onClick={() => choosePreset(p.id)}>
              <i aria-hidden="true" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Stage() {
  return (
    <main className="stage">
      <div className="stage-head">
        <Readout />
        <Instance />
      </div>
      <Keyboard />
      <ReadoutStrip />
      <Axes />
      <InstanceRail />
    </main>
  )
}

