import {
  COMMAND_REPORT_ID,
  CONFIG_USAGE_PAGE,
  Command,
  DEVICE_MODELS,
  FRAME_REPORT_ID,
  WOOTING_VID,
  commandPayload,
  framePayload,
  parseLayout,
  type Layout,
  type Rgb,
} from './protocol'
import { ACTIVE_PROFILE_COMMAND, encodeLightbar, lightbarReport, LIVE_LEDS_COMMAND, type LightbarConfig } from './lightbar'

export type DeviceInfo = {
  model: string
  productId: number
  layout: Layout
}

const REPLY_TIMEOUT_MS = 800

export const webHidSupported = () => typeof navigator !== 'undefined' && 'hid' in navigator

const isWootingConfig = (d: HIDDevice) =>
  d.vendorId === WOOTING_VID && d.collections.some((c) => c.usagePage === CONFIG_USAGE_PAGE)

/**
 * One open Wooting keyboard. Frames are "latest wins": while a write is in flight,
 * newer frames replace the queued one instead of piling up behind it.
 */
export class WootingDevice {
  readonly info: DeviceInfo
  private pendingFrame: Uint8Array<ArrayBuffer> | null = null
  private writing = false
  private replyWaiter: ((data: DataView) => void) | null = null
  private pendingCommand = -1
  /** Commands share one reply channel, so they run strictly one at a time. */
  private queue: Promise<unknown> = Promise.resolve()
  private readonly dev: HIDDevice

  private constructor(dev: HIDDevice, info: DeviceInfo) {
    this.dev = dev
    this.info = info
    dev.addEventListener('inputreport', this.onInput)
  }

  /** Shows the browser's device chooser. Must run from a user gesture. */
  static async request(): Promise<WootingDevice | null> {
    const picked = await navigator.hid.requestDevice({
      filters: [{ vendorId: WOOTING_VID, usagePage: CONFIG_USAGE_PAGE }],
    })
    const dev = picked.find(isWootingConfig)
    return dev ? WootingDevice.open(dev) : null
  }

  /** Reconnects to a keyboard this site was already granted, without a prompt. */
  static async restore(): Promise<WootingDevice | null> {
    const granted = await navigator.hid.getDevices()
    const dev = granted.find(isWootingConfig)
    return dev ? WootingDevice.open(dev) : null
  }

  private static async open(dev: HIDDevice): Promise<WootingDevice> {
    if (!dev.opened) await dev.open()
    const placeholder: DeviceInfo = {
      model: DEVICE_MODELS[dev.productId] ?? dev.productName ?? 'Wooting keyboard',
      productId: dev.productId,
      layout: 'unknown',
    }
    const device = new WootingDevice(dev, placeholder)
    await device.command(Command.ColorInit)
    const config = await device.command(Command.DeviceConfig)
    device.info.layout = config ? parseLayout(config) : 'unknown'
    return device
  }

  isSame(dev: HIDDevice) {
    return dev === this.dev
  }

  private onInput = (e: HIDInputReportEvent) => {
    // Replies echo the command byte; long ones (live LED colours) arrive on bigger input reports.
    if (!this.replyWaiter || e.data.byteLength < 3 || e.data.getUint8(2) !== this.pendingCommand) return
    const waiter = this.replyWaiter
    this.replyWaiter = null
    waiter(e.data)
  }

  /** Sends one command and resolves with its reply (or null if none arrives in time). */
  command(cmd: number, p0 = 0, p1 = 0, p2 = 0, p3 = 0): Promise<DataView | null> {
    const run = this.queue.then(() => this.exchange(cmd, p0, p1, p2, p3))
    this.queue = run.catch(() => null)
    return run
  }

  private async exchange(cmd: number, p0: number, p1: number, p2: number, p3: number): Promise<DataView | null> {
    this.pendingCommand = cmd
    const reply = new Promise<DataView | null>((resolve) => {
      const timer = setTimeout(() => {
        this.replyWaiter = null
        resolve(null)
      }, REPLY_TIMEOUT_MS)
      this.replyWaiter = (data) => {
        clearTimeout(timer)
        resolve(data)
      }
    })
    await this.dev.sendFeatureReport(COMMAND_REPORT_ID, commandPayload(cmd, p0, p1, p2, p3))
    return reply
  }

  sendFrame(colors: ArrayLike<Rgb | undefined>) {
    this.pendingFrame = framePayload(colors)
    if (!this.writing) void this.flush()
  }

  private async flush() {
    this.writing = true
    try {
      while (this.pendingFrame) {
        const frame = this.pendingFrame
        this.pendingFrame = null
        await this.dev.sendReport(FRAME_REPORT_ID, frame)
      }
    } finally {
      this.writing = false
    }
  }

  /** What every LED is showing right now: 6x17 keys then the 10 light bar LEDs (RGB565 expanded). */
  async readLeds(): Promise<Rgb[] | null> {
    const reply = await this.command(LIVE_LEDS_COMMAND)
    if (!reply || reply.byteLength < 6) return null
    const len = reply.getUint8(4) | (reply.getUint8(5) << 8)
    const out: Rgb[] = []
    for (let i = 6; i + 1 < 6 + len && i + 1 < reply.byteLength; i += 2) {
      const v = reply.getUint8(i) | (reply.getUint8(i + 1) << 8)
      const r = v >> 11, g = (v >> 5) & 63, b = v & 31
      out.push([(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)])
    }
    return out
  }

  /** Slot of the profile the keyboard is using right now (Mode key switches it). */
  async activeProfile(): Promise<number> {
    const reply = await this.command(ACTIVE_PROFILE_COMMAND)
    return reply && reply.byteLength > 6 ? reply.getUint8(6) : 0
  }

  /** Writes the light bar's Light Indicator setup into the active profile. */
  async writeLightbar(config: LightbarConfig) {
    const { reportId, data } = lightbarReport(await this.activeProfile(), encodeLightbar(config))
    await this.dev.sendReport(reportId, data)
  }

  /** Hands the LEDs back to the keyboard's active profile. */
  async restoreProfile() {
    this.pendingFrame = null
    await this.command(Command.ResetAll)
  }

  async close(restore: boolean) {
    this.dev.removeEventListener('inputreport', this.onInput)
    try {
      if (restore) await this.restoreProfile()
    } finally {
      if (this.dev.opened) await this.dev.close()
    }
  }
}
