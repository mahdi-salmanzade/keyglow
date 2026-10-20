import { WOOTING_80HE } from '../layout/wooting-80he'
import type { Led } from '../layout/types'
import { BLACK, fract, hex, mix, ramp, type Rgb } from './color'
import type { Direction, PresetDraft, RenderContext } from './types'

export { BLACK, fract, hex, mix, ramp }
export type { Rgb }

const W = WOOTING_80HE.width
const H = WOOTING_80HE.height
const CX = W / 2
const CY = H / 2
const MAX_R = Math.hypot(CX, CY)

export const nx = (led: Led) => led.x / W
export const ny = (led: Led) => led.y / H
export const radial = (led: Led) => Math.hypot(led.x - CX, (led.y - CY) * 1.6) / MAX_R
export const angle = (led: Led) => (Math.atan2(led.y - CY, led.x - CX) / (2 * Math.PI) + 1) % 1

/** 0..1 position of an LED along a direction ("out" grows from the centre). */
export function along(led: Led, dir: Direction): number {
  switch (dir) {
    case 'right': return nx(led)
    case 'left': return 1 - nx(led)
    case 'down': return ny(led)
    case 'up': return 1 - ny(led)
    case 'out': return Math.min(radial(led), 1)
    case 'in': return 1 - Math.min(radial(led), 1)
  }
}

/** Stable pseudo-random 0..1 per integer seed. */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Smooth value noise in 1D, for flicker and drift. */
export function noise1(x: number): number {
  const i = Math.floor(x), f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i) * (1 - u) + hash(i + 1) * u
}

/** Mirrored repeat so spread > 1 tiles a gradient without hard seams. */
export const pingpong = (t: number) => 1 - Math.abs(1 - 2 * fract(t / 2))

export function fill(ctx: RenderContext, out: Rgb[], color: (led: Led, i: number) => Rgb) {
  for (let i = 0; i < ctx.leds.length; i++) out[i] = color(ctx.leds[i], i)
}

/** Static gradient preset across the board. */
export function gradient(id: string, name: string, stops: string[], direction: Direction = 'right', tags?: string[]): PresetDraft {
  const rgb = stops.map(hex)
  return {
    id, name, category: 'Gradients', direction, tags, swatch: rgb,
    render: (ctx, out) => fill(ctx, out, (led) => ramp(rgb, pingpong(along(led, ctx.direction) * ctx.spread))),
  }
}

// Key groups, used by colourways, themes and game layouts.
const LETTERS = 'q w e r t y u i o p a s d f g h j k l z x c v b n m'.split(' ')
const PUNCT = ['lbracket', 'rbracket', 'backslash', 'semicolon', 'quote', 'comma', 'period', 'slash']

export const GROUPS = {
  esc: ['esc'],
  frow: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'],
  numrow: ['grave', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'minus', 'equal'],
  alpha: [...LETTERS, ...PUNCT],
  mods: ['tab', 'caps', 'lshift', 'rshift', 'lctrl', 'lwin', 'lalt', 'ralt', 'rctrl', 'fn', 'backspace'],
  enter: ['enter'],
  nav: ['ins', 'pgup', 'del', 'pgdn', 'prtsc', 'pause', 'mode'],
  arrows: ['up', 'left', 'down', 'right'],
  space: ['space'],
} as const

export type Zones = {
  alpha: string
  mods: string
  accent?: string
  esc?: string
  enter?: string
  frow?: string
  numrow?: string
  nav?: string
  arrows?: string
  space?: string
}

/** Paints keys by zone: alphas, modifiers, accents (Esc and Enter), and so on. */
export function zoned(zones: Zones): { swatch: Rgb[]; render: PresetDraft['render'] } {
  const accent = zones.accent ?? zones.mods
  const byKey = new Map<string, Rgb>()
  const set = (ids: readonly string[], c: string | undefined, fallback: string) => {
    for (const id of ids) byKey.set(id, hex(c ?? fallback))
  }
  set(GROUPS.alpha, zones.alpha, zones.alpha)
  set(GROUPS.numrow, zones.numrow, zones.alpha)
  set(GROUPS.mods, zones.mods, zones.mods)
  set(GROUPS.frow, zones.frow, zones.mods)
  set(GROUPS.nav, zones.nav, zones.mods)
  set(GROUPS.arrows, zones.arrows, accent)
  set(GROUPS.space, zones.space, zones.alpha)
  set(GROUPS.esc, zones.esc, accent)
  set(GROUPS.enter, zones.enter, accent)
  const swatch = [zones.alpha, zones.mods, accent, zones.frow, zones.arrows]
    .filter((c, i, all): c is string => !!c && all.indexOf(c) === i)
    .map(hex)
  return {
    swatch,
    render: (ctx, out) => fill(ctx, out, (led) => byKey.get(led.keyId) ?? BLACK),
  }
}

/** Dim base with highlighted key sets, for game layouts. */
export function highlight(base: string, sets: [string[], string][]): { swatch: Rgb[]; render: PresetDraft['render'] } {
  const byKey = new Map<string, Rgb>()
  for (const [ids, c] of sets) for (const id of ids) byKey.set(id, hex(c))
  const b = hex(base)
  return {
    swatch: [...[...new Set(sets.map(([, c]) => c))].map(hex), b],
    render: (ctx, out) => fill(ctx, out, (led) => byKey.get(led.keyId) ?? b),
  }
}

/** Horizontal stripes top to bottom, weighted by `parts`. */
export function stripes(colors: string[], parts?: number[]): { swatch: Rgb[]; render: PresetDraft['render'] } {
  const rgb = colors.map(hex)
  const weights = parts ?? colors.map(() => 1)
  const total = weights.reduce((a, b) => a + b, 0)
  const edges = weights.map((_, i) => weights.slice(0, i + 1).reduce((a, b) => a + b, 0) / total)
  return {
    swatch: rgb,
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const t = ny(led) + 0.0001
        return rgb[Math.max(0, edges.findIndex((e) => t <= e))]
      }),
  }
}

/** Vertical bands left to right. */
export function bands(colors: string[]): { swatch: Rgb[]; render: PresetDraft['render'] } {
  const rgb = colors.map(hex)
  return {
    swatch: rgb,
    render: (ctx, out) => fill(ctx, out, (led) => rgb[Math.min(rgb.length - 1, Math.floor(nx(led) * rgb.length))]),
  }
}
