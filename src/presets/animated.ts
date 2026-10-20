import { hsv, kelvin, scale } from '../engine/color'
import { BLACK, along, angle, fill, fract, hash, hex, mix, noise1, nx, ny, radial, ramp } from '../engine/helpers'
import type { PresetDraft, RenderContext } from '../engine/types'
import type { Rgb } from '../engine/color'

// Every loop stays below ~3 Hz at 1x speed: no strobes, no flashing.

const animated = (p: Omit<PresetDraft, 'category' | 'animated'>): PresetDraft => ({ ...p, category: 'Animated', animated: true })

const SUNSET = ['#FF3D6E', '#FF8A3D', '#FFD23D', '#7B5CFF'].map(hex)
const VAPOR = ['#FF71CE', '#B967FF', '#01CDFE', '#05FFA1'].map(hex)
const AURORA = ['#00FFA3', '#03E1FF', '#7A00FF', '#FF2EC4'].map(hex)
const FIRE = ['#000000', '#7F0000', '#FF2A00', '#FF8A00', '#FFE066'].map(hex)
const OCEAN = ['#001A4D', '#0057D9', '#00B4D8', '#CFFAFF'].map(hex)
const LAVA = ['#2A0000', '#B3001B', '#FF5F1F', '#FFB347'].map(hex)
const RAINBOW = [0, 60, 120, 180, 240, 300].map((h) => hsv(h))

const wave = (ctx: RenderContext, led: Parameters<typeof along>[0]) => along(led, ctx.direction) * ctx.spread

/** Moving palette wave in the chosen direction. */
const paletteWave = (id: string, name: string, palette: Rgb[], period: number, tags?: string[]): PresetDraft =>
  animated({
    id, name, period, tags, direction: 'right', swatch: palette,
    render: (ctx, out) => fill(ctx, out, (led) => ramp(palette, wave(ctx, led) - ctx.t / period, true)),
  })

export const ANIMATED: PresetDraft[] = [
  paletteWave('rainbow-wave', 'Rainbow Wave', RAINBOW, 4, ['rainbow']),
  animated({
    id: 'rainbow-rise', name: 'Rainbow Rise', period: 4, direction: 'up', swatch: RAINBOW, tags: ['rainbow'],
    render: (ctx, out) => fill(ctx, out, (led) => hsv(fract(wave(ctx, led) - ctx.t / 4) * 360)),
  }),
  animated({
    id: 'rainbow-spiral', name: 'Rainbow Spiral', period: 5, swatch: RAINBOW, tags: ['rainbow'],
    render: (ctx, out) => fill(ctx, out, (led) => hsv(fract(angle(led) + radial(led) * 0.6 * ctx.spread - ctx.t / 5) * 360)),
  }),
  animated({
    id: 'rainbow-ring', name: 'Rainbow Rings', period: 3, direction: 'out', swatch: RAINBOW, tags: ['rainbow'],
    render: (ctx, out) => fill(ctx, out, (led) => hsv(fract(wave(ctx, led) * 1.5 - ctx.t / 3) * 360)),
  }),
  animated({
    id: 'color-cycle', name: 'Colour Cycle', period: 12, swatch: RAINBOW,
    render: (ctx, out) => fill(ctx, out, () => hsv(fract(ctx.t / 12) * 360)),
  }),
  animated({
    id: 'breathing', name: 'Breathing', period: 4, swatch: [hex('#FF8A3D')], tags: ['your colour', 'calm'],
    render: (ctx, out) => {
      const k = 0.08 + 0.92 * (0.5 - 0.5 * Math.cos((ctx.t / 4) * 2 * Math.PI)) ** 1.6
      fill(ctx, out, () => scale(ctx.primary, k))
    },
  }),
  animated({
    id: 'breathing-rainbow', name: 'Breathing Rainbow', period: 4, swatch: RAINBOW, tags: ['calm'],
    render: (ctx, out) => {
      const k = 0.08 + 0.92 * (0.5 - 0.5 * Math.cos((ctx.t / 4) * 2 * Math.PI)) ** 1.6
      fill(ctx, out, () => scale(hsv((Math.floor(ctx.t / 4) * 47) % 360), k))
    },
  }),
  paletteWave('sunset-drift', 'Sunset Drift', SUNSET, 10, ['calm']),
  paletteWave('vapor-drift', 'Vapor Drift', VAPOR, 8),
  animated({
    id: 'two-tone-wave', name: 'Two-Tone Wave', period: 3, direction: 'right', swatch: [hex('#FF8A3D'), hex('#7B5CFF')], tags: ['your colour'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => mix(ctx.primary, ctx.secondary, 0.5 + 0.5 * Math.sin((wave(ctx, led) * 2 - ctx.t / 3) * 2 * Math.PI))),
  }),
  animated({
    id: 'matrix-rain', name: 'Matrix Rain', period: 2, swatch: [hex('#00FF41'), hex('#008F11'), BLACK], tags: ['code', 'falling'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const col = Math.round(led.x * 2)
        const speed = 0.6 + hash(col) * 0.8
        const head = fract(ctx.t * speed / 2 + hash(col + 50)) * 1.6
        const d = head - ny(led)
        if (d < 0 || d > 0.7) return BLACK
        return d < 0.08 ? hex('#D9FFE0') : scale(hex('#00FF41'), 1 - d / 0.7)
      }),
  }),
  animated({
    id: 'flames', name: 'Flames', period: 1, swatch: FIRE.slice(1), tags: ['fire', 'warm'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const flicker = noise1(led.x * 1.7 + ctx.t * 3) * 0.55 + noise1(led.x * 0.6 - ctx.t * 1.3) * 0.45
        return ramp(FIRE, Math.max(0, (1 - ny(led)) * 0.35 + flicker * 0.75 - 0.15))
      }),
  }),
  animated({
    id: 'aurora-drift', name: 'Aurora Drift', period: 16, swatch: AURORA, tags: ['calm', 'night'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const band = 0.5 + 0.5 * Math.sin(nx(led) * 5 * ctx.spread + ctx.t * 0.4 + Math.sin(ny(led) * 3 + ctx.t * 0.25) * 1.5)
        return scale(ramp(AURORA, noise1(led.x * 0.4 + ctx.t * 0.2)), 0.25 + band * 0.75)
      }),
  }),
  animated({
    id: 'plasma', name: 'Plasma', period: 6, swatch: RAINBOW,
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const x = led.x * 0.45 * ctx.spread, y = led.y * 0.6, t = ctx.t * 0.8
        const v = Math.sin(x + t) + Math.sin(y + t * 0.7) + Math.sin((x + y + t) * 0.7) + Math.sin(Math.hypot(x - 4, y - 2) - t)
        return hsv(fract(v / 8 + ctx.t / 12) * 360)
      }),
  }),
  animated({
    id: 'ocean-swell', name: 'Ocean Swell', period: 5, swatch: OCEAN, tags: ['water', 'calm'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const swell = Math.sin(nx(led) * 6 * ctx.spread - ctx.t * 1.2 + Math.sin(ny(led) * 4) * 0.8)
        return ramp(OCEAN, 0.35 + 0.35 * swell + (1 - ny(led)) * 0.2)
      }),
  }),
  animated({
    id: 'lava-lamp', name: 'Lava Lamp', period: 20, swatch: LAVA, tags: ['warm', 'calm'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        let v = 0
        for (let b = 0; b < 4; b++) {
          const bx = 8.6 + Math.sin(ctx.t * 0.17 + b * 1.9) * 7
          const by = 3.1 + Math.sin(ctx.t * 0.23 + b * 2.7) * 2.6
          v += 1.6 / (1 + Math.hypot(led.x - bx, (led.y - by) * 1.4))
        }
        return ramp(LAVA, Math.min(1, v * 0.55))
      }),
  }),
  animated({
    id: 'starfield', name: 'Starfield', period: 6, swatch: [hex('#060B2B'), hex('#FFFFFF'), hex('#9DB7FF')], tags: ['night', 'twinkle'],
    render: (ctx, out) =>
      fill(ctx, out, (_, i) => {
        const phase = fract(ctx.t / (3 + hash(i) * 5) + hash(i + 9))
        const tw = Math.max(0, Math.sin(phase * Math.PI)) ** 6
        return mix(hex('#060B2B'), hash(i + 3) > 0.7 ? hex('#9DB7FF') : hex('#FFFFFF'), tw)
      }),
  }),
  animated({
    id: 'scanner', name: 'Scanner', period: 2.4, direction: 'right', swatch: [hex('#FF1A1A'), BLACK], tags: ['retro'],
    render: (ctx, out) => {
      const p = 0.5 - 0.5 * Math.cos((ctx.t / 2.4) * 2 * Math.PI)
      fill(ctx, out, (led) => scale(hex('#FF1A1A'), Math.max(0, 1 - Math.abs(along(led, ctx.direction) - p) * 7)))
    },
  }),
  animated({
    id: 'heartbeat', name: 'Heartbeat', period: 1.2, swatch: [hex('#FF1A3D'), BLACK], tags: ['your colour', 'pulse'],
    render: (ctx, out) => {
      const p = fract(ctx.t / 1.2)
      const beat = Math.max(Math.exp(-((p - 0.1) ** 2) / 0.002), 0.7 * Math.exp(-((p - 0.3) ** 2) / 0.002))
      fill(ctx, out, (led) => scale(ctx.primary, Math.max(0.05, beat * (1 - radial(led) * 0.6))))
    },
  }),
  animated({
    id: 'snowfall', name: 'Snowfall', period: 4, swatch: [hex('#0A1E4A'), hex('#FFFFFF')], tags: ['winter', 'falling'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const col = Math.round(led.x * 1.5)
        const flake = fract(ctx.t * (0.15 + hash(col) * 0.15) + hash(col + 7))
        return mix(hex('#0A1E4A'), hex('#FFFFFF'), Math.max(0, 1 - Math.abs(flake * 1.2 - ny(led)) * 9))
      }),
  }),
  animated({
    id: 'rain', name: 'Rain', period: 1.5, swatch: [hex('#020814'), hex('#4DA6FF')], tags: ['water', 'falling'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const col = Math.round(led.x * 2)
        const drop = fract(ctx.t * (0.6 + hash(col) * 0.5) + hash(col + 11))
        const d = drop * 1.3 - ny(led)
        return d < 0 || d > 0.35 ? hex('#020814') : scale(hex('#4DA6FF'), 1 - d / 0.35)
      }),
  }),
  animated({
    id: 'spectrum-bars', name: 'Spectrum Bars', period: 2, swatch: [hex('#00FFA3'), hex('#FFE600'), hex('#FF1A1A')], tags: ['music', 'equaliser'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const band = Math.floor(led.x)
        const level = 0.2 + 0.8 * (0.5 * noise1(ctx.t * 2.2 + band * 3.1) + 0.5 * noise1(ctx.t * 1.1 + band * 7.3))
        const h = 1 - ny(led)
        return h <= level ? ramp([hex('#00FFA3'), hex('#FFE600'), hex('#FF1A1A')], h) : BLACK
      }),
  }),
  animated({
    id: 'candlelight', name: 'Candlelight', period: 1, swatch: [kelvin(1900), kelvin(2600)], tags: ['warm', 'calm'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => scale(kelvin(1800 + noise1(ctx.t * 2 + led.x * 0.3) * 900), 0.55 + 0.45 * noise1(ctx.t * 4 + led.x * 0.8))),
  }),
  animated({
    id: 'sunrise', name: 'Sunrise', period: 60, swatch: [hex('#0B1033'), hex('#FF6B3D'), kelvin(6000)], tags: ['calm', 'slow'],
    render: (ctx, out) => {
      const p = 0.5 - 0.5 * Math.cos((ctx.t / 60) * 2 * Math.PI)
      const sky = ramp([hex('#0B1033'), hex('#5B2A86'), hex('#FF6B3D'), hex('#FFD9A0'), kelvin(6000)], p)
      fill(ctx, out, (led) => mix(sky, scale(sky, 0.55), ny(led) * (1 - p)))
    },
  }),
  animated({
    id: 'pulse-rings', name: 'Pulse Rings', period: 2, direction: 'out', swatch: [hex('#FF8A3D'), hex('#7B5CFF')], tags: ['your colour'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const ring = fract(wave(ctx, led) * 2 - ctx.t / 2)
        return mix(ctx.secondary, ctx.primary, Math.max(0, 1 - ring * 4))
      }),
  }),
  animated({
    id: 'checker-shift', name: 'Checker Shift', period: 3, swatch: [hex('#FF8A3D'), hex('#7B5CFF')], tags: ['your colour', 'pattern'],
    render: (ctx, out) => {
      const k = 0.5 - 0.5 * Math.cos((ctx.t / 3) * 2 * Math.PI)
      fill(ctx, out, (led) => ((led.row + led.col) % 2 ? mix(ctx.primary, ctx.secondary, k) : mix(ctx.secondary, ctx.primary, k)))
    },
  }),
  animated({
    id: 'barber-pole', name: 'Barber Pole', period: 2, swatch: [hex('#FF8A3D'), hex('#7B5CFF')], tags: ['your colour', 'pattern'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => (fract((led.x + led.y) * 0.25 * ctx.spread - ctx.t / 2) < 0.5 ? ctx.primary : ctx.secondary)),
  }),
  animated({
    id: 'comet', name: 'Comet', period: 3, swatch: [hex('#FFFFFF'), hex('#00E5FF')], tags: ['your colour'],
    render: (ctx, out) => {
      const p = fract(ctx.t / 3)
      fill(ctx, out, (led) => {
        const pos = (led.row + nx(led)) / 6
        const d = fract(p - pos)
        return d < 0.12 ? mix(ctx.primary, BLACK, d / 0.12) : BLACK
      })
    },
  }),
]
