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
    if (e.reportId !== COMMAND_REPORT_ID || !this.replyWaiter) return
    const waiter = this.replyWaiter
    this.replyWaiter = null
    waiter(e.data)
  }

  /** Sends one command and resolves with its reply (or null if none arrives in time). */
  async command(cmd: number, p0 = 0, p1 = 0, p2 = 0, p3 = 0): Promise<DataView | null> {
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
