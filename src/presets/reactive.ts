import { hsv, scale } from '../engine/color'
import { BLACK, fill, hash, hex, mix, ramp } from '../engine/helpers'
import type { Hit, PresetDraft, RenderContext } from '../engine/types'
import type { Rgb } from '../engine/color'

// Reactive presets respond to key presses while the keyglow tab is focused.
// `hit.at` is in the same scaled seconds as ctx.t.

const reactive = (p: Omit<PresetDraft, 'category' | 'reactive' | 'animated'>): PresetDraft => ({
  ...p, category: 'Reactive', reactive: true, animated: true,
})

const ambient = (ctx: RenderContext) => scale(ctx.secondary, 0.12)

/** Strongest contribution of recent hits to one LED. */
function strongest(ctx: RenderContext, x: number, y: number, f: (hit: Hit, age: number, dist: number) => number) {
  let best = 0
  for (const hit of ctx.hits) {
    const v = f(hit, ctx.t - hit.at, Math.hypot(x - hit.x, (y - hit.y) * 1.2))
    if (v > best) best = v
  }
  return best
}

const HEAT = ['#0A0F3D', '#1F4BFF', '#00E5FF', '#A6FF00', '#FFE600', '#FF1A1A'].map(hex)

export const REACTIVE: PresetDraft[] = [
  reactive({
    id: 'ripple', name: 'Ripple', swatch: [hex('#FF8A3D'), hex('#7B5CFF')], tags: ['your colour', 'typing'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const k = strongest(ctx, led.x, led.y, (_, age, dist) => {
          const ring = Math.abs(dist - age * 9)
          return Math.max(0, 1 - ring / 1.1) * Math.max(0, 1 - age / 1.2)
        })
        return mix(ambient(ctx), ctx.primary, k)
      }),
  }),
  reactive({
    id: 'keystroke-glow', name: 'Keystroke Glow', swatch: [hex('#FF8A3D')], tags: ['your colour', 'typing'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const k = strongest(ctx, led.x, led.y, (hit, age) => (hit.ledIndex === led.index ? Math.max(0, 1 - age / 1.5) : 0))
        return mix(ambient(ctx), ctx.primary, k)
      }),
  }),
  reactive({
    id: 'rainbow-ripple', name: 'Rainbow Ripple', swatch: [hsv(0), hsv(120), hsv(240)], tags: ['rainbow', 'typing'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        let best = 0, hue = 0
        for (const hit of ctx.hits) {
          const age = ctx.t - hit.at
          const dist = Math.hypot(led.x - hit.x, (led.y - hit.y) * 1.2)
          const v = Math.max(0, 1 - Math.abs(dist - age * 8) / 1.4) * Math.max(0, 1 - age / 1.4)
          if (v > best) { best = v; hue = (dist * 40 + hit.at * 90) % 360 }
        }
        return mix(BLACK, hsv(hue), best)
      }),
  }),
  reactive({
    id: 'crossfire', name: 'Crossfire', swatch: [hex('#00E5FF')], tags: ['your colour', 'typing'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const k = strongest(ctx, led.x, led.y, (hit, age) => {
          const onLine = Math.abs(led.y - hit.y) < 0.3 || Math.abs(led.x - hit.x) < 0.6
          return onLine ? Math.max(0, 1 - age / 0.9) : 0
        })
        return mix(ambient(ctx), ctx.primary, k)
      }),
  }),
  reactive({
    id: 'typing-heat', name: 'Typing Heatmap', swatch: HEAT, tags: ['typing', 'stats'],
    render: (ctx, out) => {
      let max = 1
      for (const n of ctx.counts.values()) if (n > max) max = n
      fill(ctx, out, (led) => {
        const n = ctx.counts.get(led.index) ?? 0
        return n ? ramp(HEAT, 0.15 + 0.85 * Math.sqrt(n / max)) : HEAT[0]
      })
    },
  }),
  reactive({
    id: 'spark', name: 'Spark', swatch: [hsv(30), hsv(200), hsv(300)], tags: ['typing'],
    render: (ctx, out) =>
      fill(ctx, out, (led, i) => {
        let c: Rgb = BLACK
        for (const hit of ctx.hits) {
          const age = ctx.t - hit.at
          const dist = Math.hypot(led.x - hit.x, (led.y - hit.y) * 1.2)
          if (dist > 2.2 || hash(i + Math.floor(hit.at * 1000)) > 0.55) continue
          const k = Math.max(0, 1 - age / 0.8) * (1 - dist / 2.2)
          if (k > 0) c = mix(c, hsv((hash(i + hit.at) * 360) | 0), k)
        }
        return c
      }),
  }),
  reactive({
    id: 'shockwave', name: 'Shockwave', swatch: [hex('#FFFFFF'), hex('#1F4BFF')], tags: ['typing'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const k = strongest(ctx, led.x, led.y, (_, age, dist) =>
          Math.max(0, 1 - Math.abs(dist - age * 18) / 1.6) * Math.max(0, 1 - age / 0.9))
        return mix(hex('#0A1240'), hex('#FFFFFF'), k)
      }),
  }),
  reactive({
    id: 'ink-drop', name: 'Ink Drop', swatch: ['#FF3D6E', '#FFD23D', '#00E5FF', '#7B5CFF'].map(hex), tags: ['typing', 'paint'],
    render: (ctx, out) => {
      const inks = ['#FF3D6E', '#FFD23D', '#00E5FF', '#7B5CFF', '#00FFA3'].map(hex)
      fill(ctx, out, (led) => {
        let c: Rgb = hex('#0D0D0D')
        for (const hit of ctx.hits) {
          const age = ctx.t - hit.at
          const reach = Math.min(2.6, age * 4)
          const dist = Math.hypot(led.x - hit.x, (led.y - hit.y) * 1.2)
          if (dist < reach) c = mix(c, inks[Math.floor(hash(hit.at) * inks.length)], Math.max(0, 1 - age / 6))
        }
        return c
      })
    },
  }),
  reactive({
    id: 'spotlight', name: 'Spotlight', swatch: [hex('#FFFFFF'), hex('#7B5CFF')], tags: ['your colour', 'typing'],
    render: (ctx, out) =>
      fill(ctx, out, (led) => {
        const k = strongest(ctx, led.x, led.y, (_, age, dist) => Math.max(0, 1 - dist / 2.4) * Math.max(0, 1 - age / 2))
        return mix(scale(ctx.secondary, 0.25), ctx.primary, k)
      }),
  }),
]
