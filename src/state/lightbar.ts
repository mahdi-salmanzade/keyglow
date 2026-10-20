import { LIGHTBAR_LEDS, type LightbarConfig } from '../hid/lightbar'
import { BLACK } from '../engine/color'
import { getState, subscribe, type LightbarState } from './store'
import { toast } from './toast'

/** What keyglow's light bar settings mean to the keyboard. */
export function toConfig(lb: LightbarState): LightbarConfig {
  const brightness = lb.brightness * 255
  switch (lb.mode) {
    case 'keyboard':
      return { enabled: false, layers: [], brightness }
    case 'colours':
      return { enabled: true, layers: [{ kind: 'perLed', colors: lb.colors }], brightness }
    case 'pulse':
      return { enabled: true, layers: [{ kind: 'pulse', color: lb.pulseColor, periodMs: lb.pulseSeconds * 1000 }], brightness }
    case 'mirror':
      return { enabled: true, layers: [{ kind: 'sync' }], brightness }
    case 'off':
      return { enabled: true, layers: [{ kind: 'perLed', colors: Array.from({ length: LIGHTBAR_LEDS }, () => BLACK) }], brightness }
  }
}

type Writer = (config: LightbarConfig) => Promise<void>

const WRITE_DELAY_MS = 250

/**
 * Pushes light bar changes to the keyboard, debounced so a slider drag becomes one write.
 * In "keyboard" mode nothing is written on connect, so Wootility's own setup is left alone.
 */
export function syncLightbar(write: Writer) {
  let last = ''
  let timer: ReturnType<typeof setTimeout> | undefined
  const push = (force: boolean) => {
    const lb = getState().lightbar
    const key = JSON.stringify(lb)
    if (!force && key === last) return
    const first = last === ''
    last = key
    if (first && lb.mode === 'keyboard') return
    clearTimeout(timer)
    timer = setTimeout(() => {
      write(toConfig(getState().lightbar)).catch(() => toast('Could not update the light bar. Reconnect the keyboard and try again.'))
    }, first ? 0 : WRITE_DELAY_MS)
  }
  push(true)
  const unsubscribe = subscribe(() => push(false))
  return () => {
    clearTimeout(timer)
    unsubscribe()
  }
}

/** Brings the Light bar section into view and flashes it, for clicks on the on-screen bar. */
export function focusLightbarPanel() {
  const el = document.getElementById('lightbar-panel')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('flash')
  void el.offsetWidth
  el.classList.add('flash')
}
