import type { Rgb } from '../hid/protocol'

export type { Rgb }

export const BLACK: Rgb = [0, 0, 0]

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
const fract = (v: number) => v - Math.floor(v)

export function hex(value: string): Rgb {
  const h = value.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function toHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('').toUpperCase()
}

export const css = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`

/** h in degrees, s and v in 0..1 */
export function hsv(h: number, s = 1, v = 1): Rgb {
  const k = (n: number) => (n + h / 60) % 6
  const f = (n: number) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1))
  return [clamp255(f(5) * 255), clamp255(f(3) * 255), clamp255(f(1) * 255)]
}

export function toHsv([r, g, b]: Rgb): [number, number, number] {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb), d = max - min
  let h = 0
  if (d) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
  }
  return [(h * 60 + 360) % 360, max ? d / max : 0, max]
}

export const scale = ([r, g, b]: Rgb, k: number): Rgb => [clamp255(r * k), clamp255(g * k), clamp255(b * k)]

export const add = (a: Rgb, b: Rgb): Rgb => [clamp255(a[0] + b[0]), clamp255(a[1] + b[1]), clamp255(a[2] + b[2])]

export function hueShift(c: Rgb, degrees: number): Rgb {
  if (!degrees) return c
  const [h, s, v] = toHsv(c)
  return hsv((h + degrees) % 360, s, v)
}

// Gradients mix in OKLab so midpoints stay vivid instead of going muddy.
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)

function toOklab([r, g, b]: Rgb): [number, number, number] {
  const lr = toLinear(r / 255), lg = toLinear(g / 255), lb = toLinear(b / 255)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function fromOklab([L, a, b]: [number, number, number]): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [clamp255(fromLinear(r) * 255), clamp255(fromLinear(g) * 255), clamp255(fromLinear(bl) * 255)]
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  if (t <= 0) return a
  if (t >= 1) return b
  const A = toOklab(a), B = toOklab(b)
  return fromOklab([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t])
}

/** Samples evenly spaced colour stops at t in 0..1. */
export function ramp(stops: readonly Rgb[], t: number, wrap = false): Rgb {
  if (stops.length === 1) return stops[0]
  if (wrap) {
    const p = fract(t) * stops.length
    const i = Math.floor(p)
    return mix(stops[i], stops[(i + 1) % stops.length], p - i)
  }
  const p = Math.min(Math.max(t, 0), 1) * (stops.length - 1)
  const i = Math.min(Math.floor(p), stops.length - 2)
  return mix(stops[i], stops[i + 1], p - i)
}

/** Colour temperature (1000-12000 K) to RGB, after Tanner Helland's fit. */
export function kelvin(k: number): Rgb {
  const t = k / 100
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307
  return [clamp255(r), clamp255(g), clamp255(b)]
}

export { fract }
