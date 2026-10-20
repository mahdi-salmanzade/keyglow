import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { css, mix, type Rgb } from '../engine/color'
import { runtime } from '../engine/runtime'
import { WOOTING_80HE } from '../layout/wooting-80he'
import type { Key } from '../layout/types'
import { KEY_BY_ID, paintKeys, targetKeys } from '../state/paint'
import { checkpoint, getState, pushRecent, setState, useEditor, type Paint } from '../state/store'

const LAYOUT = WOOTING_80HE

type Point = { x: number; y: number }
type Gesture =
  | { kind: 'paint'; erase: boolean }
  | { kind: 'gradient'; from: Point; to: Point }
  | { kind: 'marquee'; from: Point; to: Point; additive: boolean; base: string[] }

const luminance = ([r, g, b]: Rgb) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

function applyGradient(from: Point, to: Point) {
  const { primary, secondary } = getState()
  const dx = to.x - from.x, dy = to.y - from.y
  const len2 = dx * dx + dy * dy || 1
  checkpoint()
  setState((s) => {
    const paint: Paint = { ...s.paint }
    for (const k of targetKeys()) for (const i of k.leds) {
      const led = LAYOUT.leds[i]
      const t = ((led.x - from.x) * dx + (led.y - from.y) * dy) / len2
      paint[i] = mix(primary, secondary, Math.min(1, Math.max(0, t)))
    }
    return { paint }
  })
}

const KeyCap = memo(function KeyCap({
  k,
  selected,
  register,
}: {
  k: Key
  selected: boolean
  register: (id: string, el: HTMLElement | null) => void
}) {
  const style = {
    left: `${(k.x / LAYOUT.width) * 100}%`,
    top: `${(k.y / LAYOUT.height) * 100}%`,
    width: `${(k.w / LAYOUT.width) * 100}%`,
    height: `${(k.h / LAYOUT.height) * 100}%`,
  }
  return (
    <div
      className="key"
      role="gridcell"
      data-key={k.id}
      aria-selected={selected}
      aria-label={k.label || 'Space'}
      style={style}
      ref={(el) => register(k.id, el)}
    >
      <span className="cap">
        <span className="shift">{k.shift ?? ''}</span>
        <span>{k.label}</span>
      </span>
    </div>
  )
})

export function Keyboard() {
  const tool = useEditor((s) => s.tool)
  const selection = useEditor((s) => s.selection)
  const boardRef = useRef<HTMLDivElement>(null)
  const elements = useRef(new Map<string, HTMLElement>())
  const gesture = useRef<Gesture | null>(null)
  const [overlay, setOverlay] = useState<Gesture | null>(null)
  const previousTool = useRef(tool)

  useEffect(() => {
    if (tool !== 'eyedropper') previousTool.current = tool
  }, [tool])

  // Paint the live frame straight onto the key elements: no React render per frame.
  useEffect(
    () =>
      runtime.onFrame((colors) => {
        for (const k of LAYOUT.keys) {
          const el = elements.current.get(k.id)
          if (!el) continue
          const cs = k.leds.map((i) => colors[i])
          const bg = cs.length === 1 ? css(cs[0]) : `linear-gradient(90deg, ${cs.map(css).join(', ')})`
          el.style.setProperty('--c', bg)
          const lum = cs.reduce((a, c) => a + luminance(c), 0) / cs.length
          el.dataset.tone = lum > 0.5 ? 'light' : 'dark'
        }
      }),
    [],
  )

  // Mirror real key presses on screen.
  useEffect(() => {
    const byCode = new Map(LAYOUT.keys.filter((k) => k.code).map((k) => [k.code!, k]))
    const down = (e: KeyboardEvent) => {
      const k = byCode.get(e.code)
      if (!k) return
      elements.current.get(k.id)?.classList.add('pressed')
      if (!e.repeat) runtime.press(k.leds)
    }
    const up = (e: KeyboardEvent) => {
      const k = byCode.get(e.code)
      if (k) elements.current.get(k.id)?.classList.remove('pressed')
    }
    const clear = () => elements.current.forEach((el) => el.classList.remove('pressed'))
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    addEventListener('blur', clear)
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
      removeEventListener('blur', clear)
    }
  }, [])

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) elements.current.set(id, el)
    else elements.current.delete(id)
  }, [])

  const toBoard = (e: React.PointerEvent): Point => {
    const r = boardRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * LAYOUT.width, y: ((e.clientY - r.top) / r.height) * LAYOUT.height }
  }

  const keyAt = (e: React.PointerEvent): Key | undefined => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-key]')
    return el ? KEY_BY_ID.get(el.dataset.key!) : undefined
  }

  const keysInRect = (a: Point, b: Point) => {
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y)
    return LAYOUT.keys.filter((k) => k.x < x1 && k.x + k.w > x0 && k.y < y1 && k.y + k.h > y0).map((k) => k.id)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 2) return
    const key = keyAt(e)
    const p = toBoard(e)
    const s = getState()
    boardRef.current!.setPointerCapture(e.pointerId)
    const erase = e.altKey || e.button === 2

    switch (s.tool) {
      case 'paint':
        if (!key) return
        checkpoint()
        paintKeys([key], erase ? null : s.primary)
        if (!erase) pushRecent(s.primary)
        gesture.current = { kind: 'paint', erase }
        break
      case 'fill':
        checkpoint()
        paintKeys(targetKeys(), erase ? null : s.primary)
        if (!erase) pushRecent(s.primary)
        break
      case 'eyedropper': {
        if (!key) return
        const c = runtime.current()[key.leds[Math.floor(key.leds.length / 2)]]
        setState({ primary: c, tool: previousTool.current })
        pushRecent(c)
        break
      }
      case 'gradient':
        gesture.current = { kind: 'gradient', from: p, to: p }
        setOverlay(gesture.current)
        break
      case 'select': {
        const additive = e.shiftKey || e.metaKey || e.ctrlKey
        gesture.current = { kind: 'marquee', from: p, to: p, additive, base: additive ? s.selection : [] }
        if (key) {
          const has = s.selection.includes(key.id)
          setState({ selection: additive ? (has ? s.selection.filter((id) => id !== key.id) : [...s.selection, key.id]) : [key.id] })
        } else if (!additive) setState({ selection: [] })
        break
      }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g) return
    if (g.kind === 'paint') {
      const key = keyAt(e)
      if (key) paintKeys([key], g.erase ? null : getState().primary)
    } else if (g.kind === 'gradient') {
      g.to = toBoard(e)
      setOverlay({ ...g })
    } else {
      g.to = toBoard(e)
      if (Math.hypot(g.to.x - g.from.x, g.to.y - g.from.y) > 0.3) {
        setState({ selection: [...new Set([...g.base, ...keysInRect(g.from, g.to)])] })
        setOverlay({ ...g })
      }
    }
  }

  const onPointerUp = () => {
    const g = gesture.current
    gesture.current = null
    setOverlay(null)
    if (g?.kind === 'gradient') {
      const dist = Math.hypot(g.to.x - g.from.x, g.to.y - g.from.y)
      applyGradient(dist > 0.5 ? g.from : { x: 0, y: g.from.y }, dist > 0.5 ? g.to : { x: LAYOUT.width, y: g.from.y })
      pushRecent(getState().primary)
    }
  }

  const pct = (p: Point) => ({ x: (p.x / LAYOUT.width) * 100, y: (p.y / LAYOUT.height) * 100 })

  return (
    <div
      ref={boardRef}
      className="board"
      data-tool={tool}
      role="grid"
      aria-label="Wooting 80HE keys. Use the tools panel to paint, fill or select."
      aria-multiselectable="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {LAYOUT.keys.map((k) => (
        <KeyCap key={k.id} k={k} selected={selection.includes(k.id)} register={register} />
      ))}
      {LAYOUT.fixtures?.map((f) => (
        <div
          key={f.id}
          className="fixture"
          title="Light bar: runs its own Wootility effect. Wooting hasn't opened it to apps yet, so keyglow can't colour it."
          style={{
            left: `${(f.x / LAYOUT.width) * 100}%`,
            top: `${(f.y / LAYOUT.height) * 100}%`,
            width: `${(f.w / LAYOUT.width) * 100}%`,
            height: `${(f.h / LAYOUT.height) * 100}%`,
          }}
        >
          <span>{f.label}</span>
        </div>
      ))}
      {overlay?.kind === 'marquee' && (() => {
        const a = pct(overlay.from), b = pct(overlay.to)
        return (
          <div
            className="marquee"
            style={{
              left: `${Math.min(a.x, b.x)}%`, top: `${Math.min(a.y, b.y)}%`,
              width: `${Math.abs(a.x - b.x)}%`, height: `${Math.abs(a.y - b.y)}%`,
            }}
          />
        )
      })()}
      {overlay?.kind === 'gradient' && (
        <svg className="gradient-line" viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`} preserveAspectRatio="none" aria-hidden="true">
          <line
            x1={overlay.from.x} y1={overlay.from.y} x2={overlay.to.x} y2={overlay.to.y}
            stroke="var(--ink)" strokeWidth="2" vectorEffect="non-scaling-stroke"
          />
          <circle cx={overlay.from.x} cy={overlay.from.y} r="0.16" fill={css(getState().primary)} stroke="var(--ink)" vectorEffect="non-scaling-stroke" />
          <circle cx={overlay.to.x} cy={overlay.to.y} r="0.16" fill={css(getState().secondary)} stroke="var(--ink)" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  )
}
