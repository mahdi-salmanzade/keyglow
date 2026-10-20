import { PRESET_BY_ID } from '../presets'
import { DEFAULT_LOOK, type Look } from './store'

const HASH_KEY = 'look='

const toBase64Url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))

const isRgb = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)

/** Validates untrusted look data (from a link or a file), falling back to defaults field by field. */
export function sanitizeLook(raw: unknown): Look | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const num = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
  const paint: Look['paint'] = {}
  if (r.paint && typeof r.paint === 'object') {
    for (const [k, v] of Object.entries(r.paint as Record<string, unknown>)) {
      const i = Number(k)
      if (Number.isInteger(i) && i >= 0 && i < 200 && isRgb(v)) paint[i] = v
    }
  }
  const directions = ['right', 'left', 'down', 'up', 'out', 'in'] as const
  return {
    presetId: typeof r.presetId === 'string' && PRESET_BY_ID.has(r.presetId) ? r.presetId : DEFAULT_LOOK.presetId,
    hueShift: num(r.hueShift, -180, 180, 0),
    speed: num(r.speed, 0, 4, 1),
    brightness: num(r.brightness, 0, 1, 1),
    spread: num(r.spread, 0.25, 3, 1),
    direction: directions.includes(r.direction as Look['direction']) ? (r.direction as Look['direction']) : 'right',
    primary: isRgb(r.primary) ? r.primary : DEFAULT_LOOK.primary,
    secondary: isRgb(r.secondary) ? r.secondary : DEFAULT_LOOK.secondary,
    paint,
  }
}

export function shareUrl(look: Look): string {
  const url = new URL(location.href)
  url.hash = HASH_KEY + toBase64Url(JSON.stringify(look))
  return url.toString()
}

export function lookFromHash(): Look | null {
  const h = location.hash.slice(1)
  if (!h.startsWith(HASH_KEY)) return null
  try {
    return sanitizeLook(JSON.parse(fromBase64Url(h.slice(HASH_KEY.length))))
  } catch {
    return null
  }
}

export function downloadLook(look: Look, name: string) {
  const blob = new Blob([JSON.stringify({ keyglow: 1, name, ...look }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${name.replace(/[^\w-]+/g, '-').toLowerCase() || 'look'}.keyglow.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
