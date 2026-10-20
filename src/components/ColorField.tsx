import { ArrowLeftRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { hex, hsv, toHex, toHsv, type Rgb } from '../engine/color'
import { getState, pushRecent, setState, useEditor } from '../state/store'

type Slot = 'primary' | 'secondary'
const HEX = /^#?[0-9a-f]{6}$/i

/** Saturation/value field + hue strip + hex entry, editing the primary or secondary colour. */
export function ColorField() {
  const primary = useEditor((s) => s.primary)
  const secondary = useEditor((s) => s.secondary)
  const [slot, setSlot] = useState<Slot>('primary')
  const color = slot === 'primary' ? primary : secondary

  // HSV is held locally so dragging through greys or black doesn't snap the hue to 0.
  // When the colour changes from elsewhere (eyedropper, swatches, swap), re-derive it.
  const [hsvState, setHsv] = useState(() => toHsv(color))
  const [synced, setSynced] = useState(color)
  if (synced !== color) {
    setSynced(color)
    setHsv(toHsv(color))
  }

  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? toHex(color)

  const commit = (c: Rgb, next?: [number, number, number]) => {
    setSynced(c)
    if (next) setHsv(next)
    setState({ [slot]: c })
  }
  const setFromHsv = (h: number, s: number, v: number) => commit(hsv(h, s, v), [h, s, v])

  const drag = (el: HTMLElement, onMove: (fx: number, fy: number) => void) => (e: React.PointerEvent) => {
    el.setPointerCapture(e.pointerId)
    const move = (ev: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect()
      onMove(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)))
    }
    move(e)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      pushRecent(getState()[slot])
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const [h, s, v] = hsvState

  const nudge = (dh: number, ds: number, dv: number) =>
    setFromHsv((h + dh + 360) % 360, Math.min(1, Math.max(0, s + ds)), Math.min(1, Math.max(0, v + dv)))

  const pick = (next: Slot) => {
    const c = next === 'primary' ? primary : secondary
    setSlot(next)
    setSynced(c)
    setHsv(toHsv(c))
    setDraft(null)
  }

  return (
    <>
      <div
        ref={svRef}
        className="sv"
        style={{ '--h': h } as React.CSSProperties}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={`saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`}
        onPointerDown={(e) => drag(e.currentTarget, (fx, fy) => setFromHsv(h, fx, 1 - fy))(e)}
        onKeyDown={(e) => {
          const map: Record<string, [number, number]> = { ArrowRight: [0.02, 0], ArrowLeft: [-0.02, 0], ArrowUp: [0, 0.02], ArrowDown: [0, -0.02] }
          const d = map[e.key]
          if (!d) return
          e.preventDefault()
          nudge(0, d[0], d[1])
        }}
      >
        <span className="sv-thumb" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: toHex(color) }} />
      </div>
      <div
        ref={hueRef}
        className="hue"
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(h)}
        onPointerDown={(e) => drag(e.currentTarget, (fx) => setFromHsv(fx * 359.9, s, v))(e)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nudge(e.shiftKey ? 15 : 3, 0, 0)
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nudge(e.shiftKey ? -15 : -3, 0, 0)
          else return
          e.preventDefault()
        }}
      >
        <span className="hue-thumb" style={{ left: `${(h / 360) * 100}%` }} />
      </div>
      <div className="colors">
        <div className="pair">
          <button
            className="p"
            style={{ background: toHex(primary) }}
            aria-pressed={slot === 'primary'}
            aria-label={`Edit primary colour ${toHex(primary)}`}
            onClick={() => pick('primary')}
          />
          <button
            className="s"
            style={{ background: toHex(secondary) }}
            aria-pressed={slot === 'secondary'}
            aria-label={`Edit secondary colour ${toHex(secondary)}`}
            onClick={() => pick('secondary')}
          />
        </div>
        <input
          className="hex"
          value={text}
          aria-label={`${slot === 'primary' ? 'Primary' : 'Secondary'} colour hex`}
          aria-invalid={!HEX.test(text.trim())}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value)
            if (HEX.test(e.target.value.trim())) commit(hex(e.target.value.trim()), toHsv(hex(e.target.value.trim())))
          }}
          onBlur={() => setDraft(null)}
        />
        <button
          className="icon-btn"
          title="Swap colours (X)"
          aria-label="Swap primary and secondary colours"
          onClick={() => setState({ primary: secondary, secondary: primary })}
        >
          <ArrowLeftRight />
        </button>
      </div>
    </>
  )
}
