import type { WootingDevice } from '../hid/device'
import { matrixIndex, MATRIX_COLS, MATRIX_ROWS, quantize } from '../hid/protocol'
import { WOOTING_80HE } from '../layout/wooting-80he'
import { PRESET_BY_ID, DEFAULT_PRESET_ID } from '../presets'
import { getState, subscribe, type EditorState } from '../state/store'
import { BLACK, hueShift, mix, scale, type Rgb } from './color'
import type { Hit, RenderContext } from './types'

const LAYOUT = WOOTING_80HE
const LED_COUNT = LAYOUT.leds.length
const FADE_MS = 280
const HIT_TTL = 6
const MAX_HITS = 24
const SEND_INTERVAL_MS = 15

type FrameListener = (colors: readonly Rgb[]) => void

const easeOutExpo = (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p))

// Above 100%, brightness lifts mid-tones on the keyboard (not on screen). The 80HE drives SDK
// colours through a steep curve, so mid values look much darker than on screen; at 150% the
// lift fully undoes a 2.2 curve. Pure channels (0 and 255) are untouched, so white stays white.
const LED_GAMMA = 2.2
const BOOST_RANGE = 0.5
function liftTable(brightness: number): Uint8Array | null {
  if (brightness <= 1) return null
  const t = Math.min(1, (brightness - 1) / BOOST_RANGE)
  const exponent = 1 / (1 + t * (LED_GAMMA - 1))
  return Uint8Array.from({ length: 256 }, (_, v) => Math.round(255 * (v / 255) ** exponent))
}

/**
 * Owns the lighting loop: renders the active preset, layers paint and the axes on top,
 * crossfades between presets, and streams frames to the keyboard and the on-screen view.
 */
class Runtime {
  private base: Rgb[] = Array.from({ length: LED_COUNT }, () => BLACK)
  private frame: Rgb[] = Array.from({ length: LED_COUNT }, () => BLACK)
  private fadeFrom: Rgb[] | null = null
  private fadeStart = 0
  private time = 0
  private lastTick = 0
  private lastSent = 0
  private lastSignature = ''
  private hits: Hit[] = []
  private counts = new Map<number, number>()
  private listeners = new Set<FrameListener>()
  private device: WootingDevice | null = null
  private presetId = getState().presetId
  private lastPaint = getState().paint
  private dirty = true
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  /** Rendered frames per second, for the status bar. */
  fps = 0
  private fpsWindow: number[] = []

  constructor() {
    subscribe(() => this.onState(getState()))
    document.addEventListener('visibilitychange', () => (this.dirty = true))
    const worker = new Worker(new URL('./ticker.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = () => this.tick(performance.now())
    this.tick(performance.now()) // first frame now, so keys never flash black before the first tick
  }

  /** True after "Restore profile lighting": frames stop until the look changes. */
  released = false
  private lookKey = ''
  private releaseListeners = new Set<() => void>()

  release() {
    this.released = true
    this.releaseListeners.forEach((l) => l())
  }

  onRelease(listener: () => void) {
    this.releaseListeners.add(listener)
    return () => void this.releaseListeners.delete(listener)
  }

  private onState(s: EditorState) {
    const lookKey = [s.presetId, s.hueShift, s.speed, s.brightness, s.spread, s.direction, s.primary, s.secondary].join('|')
    const paintChanged = s.paint !== this.lastPaint
    if (this.released && (lookKey !== this.lookKey || paintChanged)) {
      this.released = false
      this.lastSignature = ''
      this.releaseListeners.forEach((l) => l())
    }
    this.lookKey = lookKey
    this.lastPaint = s.paint
    if (s.presetId !== this.presetId) {
      this.presetId = s.presetId
      this.fadeFrom = this.reducedMotion.matches ? null : this.frame.slice()
      this.fadeStart = performance.now()
      this.counts.clear()
    }
    this.dirty = true
  }

  attach(device: WootingDevice | null) {
    this.device = device
    this.lastSignature = ''
    this.dirty = true
  }

  onFrame(listener: FrameListener) {
    this.listeners.add(listener)
    listener(this.frame)
    return () => void this.listeners.delete(listener)
  }

  current(): readonly Rgb[] {
    return this.frame
  }

  /** A physical key press, for reactive presets and the on-screen mirror. */
  press(ledIndices: number[]) {
    for (const i of ledIndices) {
      const led = LAYOUT.leds[i]
      this.hits.push({ x: led.x, y: led.y, ledIndex: led.index, at: this.time })
      this.counts.set(led.index, (this.counts.get(led.index) ?? 0) + 1)
    }
    if (this.hits.length > MAX_HITS) this.hits.splice(0, this.hits.length - MAX_HITS)
    this.dirty = true
  }

  private tick(now: number) {
    const dt = this.lastTick ? Math.min((now - this.lastTick) / 1000, 0.1) : 0
    this.lastTick = now
    const s = getState()
    const preset = PRESET_BY_ID.get(s.presetId) ?? PRESET_BY_ID.get(DEFAULT_PRESET_ID)!
    const fading = this.fadeFrom !== null
    if (!preset.animated && !this.dirty && !fading) return

    this.time += dt * s.speed
    this.hits = this.hits.filter((h) => this.time - h.at < HIT_TTL)

    const ctx: RenderContext = {
      t: this.time,
      layout: LAYOUT,
      leds: LAYOUT.leds,
      hits: this.hits,
      direction: s.direction,
      spread: s.spread,
      primary: s.primary,
      secondary: s.secondary,
      counts: this.counts,
    }
    preset.render(ctx, this.base)

    const fadeP = fading ? easeOutExpo((now - this.fadeStart) / FADE_MS) : 1
    for (let i = 0; i < LED_COUNT; i++) {
      const painted = s.paint[i]
      let c = hueShift(painted ?? this.base[i], s.hueShift)
      if (s.brightness < 1) c = scale(c, Math.max(0, s.brightness))
      this.frame[i] = this.fadeFrom && fadeP < 1 ? mix(this.fadeFrom[i], c, fadeP) : c
    }
    if (fadeP >= 1) this.fadeFrom = null
    this.dirty = false

    this.countFps(now)
    if (document.visibilityState === 'visible') for (const l of this.listeners) l(this.frame)
    this.send(now)
  }

  private countFps(now: number) {
    this.fpsWindow.push(now)
    while (this.fpsWindow.length && now - this.fpsWindow[0] > 1000) this.fpsWindow.shift()
    this.fps = this.fpsWindow.length
  }

  private lift: { brightness: number; table: Uint8Array | null } = { brightness: 1, table: null }

  /** The current frame as the keyboard gets it: brightness lift applied, quantised, at row * 21 + col. */
  deviceMatrix(): (Rgb | undefined)[] {
    const { brightness } = getState()
    if (brightness !== this.lift.brightness) this.lift = { brightness, table: liftTable(brightness) }
    const table = this.lift.table
    const matrix: (Rgb | undefined)[] = new Array(MATRIX_ROWS * MATRIX_COLS)
    for (let i = 0; i < LED_COUNT; i++) {
      const led = LAYOUT.leds[i]
      const c = this.frame[i]
      matrix[matrixIndex(led.row, led.col)] = quantize(table ? [table[c[0]], table[c[1]], table[c[2]]] : c)
    }
    return matrix
  }

  private send(now: number) {
    if (!this.device || this.released) return
    if (now - this.lastSent < SEND_INTERVAL_MS) {
      this.dirty = true // try again next tick so a static look's last change still lands
      return
    }
    const matrix = this.deviceMatrix()
    const signature = matrix.map((q) => q?.join(',') ?? '').join(';')
    if (signature === this.lastSignature) return
    this.lastSignature = signature
    this.lastSent = now
    this.device.sendFrame(matrix)
  }
}

export const runtime = new Runtime()
