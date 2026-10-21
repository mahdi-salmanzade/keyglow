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
import { encodeLightbar, LIGHTBAR_COMMAND, LIVE_LEDS_COMMAND, type LightbarConfig } from './lightbar'
import { ProfileCommand, profileHeader, profileName, profileReport, type ProfileId, type StoredLighting } from './profile'

export type DeviceInfo = {
  model: string
  productId: number
  layout: Layout
}

const REPLY_TIMEOUT_MS = 800

/** A reply's payload: data is D1 DA cmd 88 <len16> payload. */
function payload(reply: DataView | null): Uint8Array | null {
  if (!reply || reply.byteLength < 6) return null
  const len = Math.min(reply.getUint8(4) | (reply.getUint8(5) << 8), reply.byteLength - 6)
  return new Uint8Array(reply.buffer, reply.byteOffset + 6, len).slice()
}

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i])

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

  /** Commands that name a profile carry its index and namespace in the first two parameter bytes. */
  private profileCommand(cmd: number, id: ProfileId) {
    return this.command(cmd, 0, 0, id.namespace, id.index)
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
    const body = payload(await this.command(LIVE_LEDS_COMMAND))
    if (!body) return null
    const out: Rgb[] = []
    for (let i = 0; i + 1 < body.length; i += 2) {
      const v = body[i] | (body[i + 1] << 8)
      const r = v >> 11, g = (v >> 5) & 63, b = v & 31
      out.push([(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)])
    }
    return out
  }

  /** The profile the keyboard is using right now (the Mode key switches it). */
  async activeProfile(): Promise<ProfileId> {
    const body = payload(await this.command(ProfileCommand.ActiveProfile))
    return { index: body?.[0] ?? 0, namespace: body?.[1] ?? 0 }
  }

  /** Sets the light bar's Light Indicator setup. With `save` the active profile keeps it after unplugging. */
  async writeLightbar(config: LightbarConfig, save = false) {
    const header = profileHeader(save, await this.activeProfile())
    const { reportId, data } = profileReport(LIGHTBAR_COMMAND, header, encodeLightbar(config))
    await this.dev.sendReport(reportId, data)
  }

  async profileName(id: ProfileId): Promise<string | undefined> {
    const meta = payload(await this.profileCommand(ProfileCommand.ReadMeta, id))
    return meta ? profileName(meta) : undefined
  }

  /** The lighting a profile has stored, as the keyboard returns it. */
  async readStoredLighting(id: ProfileId): Promise<StoredLighting | null> {
    const top = payload(await this.profileCommand(ProfileCommand.ReadColorsTop, id))
    const bottom = payload(await this.profileCommand(ProfileCommand.ReadColorsBottom, id))
    const core = payload(await this.profileCommand(ProfileCommand.ReadCore, id))
    const lightbar = payload(await this.profileCommand(ProfileCommand.ReadLightbar, id))
    return top && bottom && core && lightbar ? { top, bottom, core, lightbar } : null
  }

  /**
   * Stores key colours and effects in a profile, the way Wootility's Save to Keyboard does: write them to
   * what the keys show, then have the keyboard keep that. Resolves true once the stored copy reads back the same.
   */
  async storeLighting(id: ProfileId, lighting: Omit<StoredLighting, 'lightbar'>): Promise<boolean> {
    const writes: [number, Uint8Array][] = [
      [ProfileCommand.Core, lighting.core],
      [ProfileCommand.ColorsTop, lighting.top],
      [ProfileCommand.ColorsBottom, lighting.bottom],
    ]
    for (const [cmd, body] of writes) {
      const { reportId, data } = profileReport(cmd, profileHeader(false), body)
      await this.dev.sendReport(reportId, data)
    }
    if (!(await this.profileCommand(ProfileCommand.Save, id))) return false
    const stored = await this.readStoredLighting(id)
    return !!stored && sameBytes(stored.top, lighting.top) && sameBytes(stored.bottom, lighting.bottom) && sameBytes(stored.core, lighting.core)
  }

  /** Stores a light bar setup (raw LightbarProfile) in a profile. */
  async storeLightbar(id: ProfileId, message: Uint8Array) {
    const { reportId, data } = profileReport(LIGHTBAR_COMMAND, profileHeader(true, id), message)
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
