import { useSyncExternalStore } from 'react'
import { runtime } from '../engine/runtime'
import { webHidSupported, WootingDevice, type DeviceInfo } from '../hid/device'
import { LIGHTBAR_LEDS } from '../hid/lightbar'
import { CONFIG_USAGE_PAGE, WOOTING_VID, type Rgb } from '../hid/protocol'
import { syncLightbar } from './lightbar'
import { getState } from './store'

export type DeviceStatus =
  | { kind: 'unsupported' }
  | { kind: 'idle'; notice?: string }
  | { kind: 'connecting' }
  | { kind: 'connected'; info: DeviceInfo }
  | { kind: 'error'; message: string }

let status: DeviceStatus = webHidSupported() ? { kind: 'idle' } : { kind: 'unsupported' }
let device: WootingDevice | null = null
const listeners = new Set<() => void>()

function set(next: DeviceStatus) {
  status = next
  for (const l of listeners) l()
}

export function useDevice() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => status,
  )
}

let stopLightbar: (() => void) | null = null

// What the physical light bar is showing, read back from the keyboard a few times a second.
let liveBar: Rgb[] | null = null
const liveListeners = new Set<() => void>()
let livePoll: ReturnType<typeof setInterval> | undefined
const LIVE_POLL_MS = 250

export function useLiveBar() {
  return useSyncExternalStore(
    (l) => {
      liveListeners.add(l)
      return () => void liveListeners.delete(l)
    },
    () => liveBar,
  )
}

function pollLiveBar(d: WootingDevice | null) {
  clearInterval(livePoll)
  liveBar = null
  liveListeners.forEach((l) => l())
  if (!d) return
  livePoll = setInterval(async () => {
    if (document.visibilityState !== 'visible') return
    const leds = await d.readLeds()
    if (!leds || leds.length < LIGHTBAR_LEDS) return
    const bar = leds.slice(-LIGHTBAR_LEDS)
    if (liveBar && bar.every((c, i) => c.join() === liveBar![i].join())) return
    liveBar = bar
    liveListeners.forEach((l) => l())
  }, LIVE_POLL_MS)
}

function adopt(d: WootingDevice | null) {
  device = d
  runtime.attach(d)
  stopLightbar?.()
  stopLightbar = d ? syncLightbar((config) => d.writeLightbar(config)) : null
  pollLiveBar(d)
  set(d ? { kind: 'connected', info: d.info } : { kind: 'idle' })
}

function explain(err: unknown): string | null {
  if (err instanceof DOMException && err.name === 'NotFoundError') return null // chooser dismissed
  if (err instanceof DOMException && (err.name === 'InvalidStateError' || err.name === 'NetworkError')) {
    return 'The keyboard is busy. Close Wootility (desktop or web) and the Wootility background service, then connect again.'
  }
  if (err instanceof DOMException && err.name === 'SecurityError') {
    return 'This page is not allowed to use WebHID. Open keyglow over https or from localhost.'
  }
  return 'Could not open the keyboard. Unplug it, plug it back in, and connect again.'
}

export async function connect() {
  set({ kind: 'connecting' })
  try {
    const d = await WootingDevice.request()
    adopt(d)
    if (!d) set({ kind: 'idle', notice: 'No Wooting keyboard was chosen.' })
  } catch (err) {
    const message = explain(err)
    set(message ? { kind: 'error', message } : { kind: 'idle' })
  }
}

export async function disconnect() {
  const d = device
  adopt(null)
  await d?.close(false)
}

export async function restoreProfileLighting() {
  if (!device) return
  runtime.release()
  await device.restoreProfile()
}

async function reconnectQuietly() {
  try {
    const d = await WootingDevice.restore()
    if (d) adopt(d)
  } catch {
    // Not fatal: the Connect button still works.
  }
}

if (webHidSupported()) {
  void reconnectQuietly()
  navigator.hid.addEventListener('connect', (e) => {
    const { device: d } = e
    const isWooting = d.vendorId === WOOTING_VID && d.collections.some((c) => c.usagePage === CONFIG_USAGE_PAGE)
    if (isWooting && !device) void reconnectQuietly()
  })
  navigator.hid.addEventListener('disconnect', (e) => {
    if (device?.isSame(e.device)) {
      device = null
      runtime.attach(null)
      stopLightbar?.()
      stopLightbar = null
      pollLiveBar(null)
      set({ kind: 'idle', notice: 'Keyboard disconnected. Plug it back in to keep going.' })
    }
  })
  addEventListener('pagehide', () => {
    if (device && getState().restoreOnClose) void device.close(true)
  })
}
