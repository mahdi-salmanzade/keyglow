// Wooting V3 ("multi-report") RGB protocol, as spoken by the 80HE on usage page 0xFF55.
// Ported from WootingKb/wooting-rgb-sdk (MPL-2.0) and checked against a real 80HE;
// see docs/80he-protocol.md for the captured descriptor and replies.

export const WOOTING_VID = 0x31e3
export const CONFIG_USAGE_PAGE = 0xff55

export const MATRIX_ROWS = 6
export const MATRIX_COLS = 21

/** Feature report 1 carries every command; its reply arrives as input report 1. */
export const COMMAND_REPORT_ID = 1
/** Output report 4 (510-byte payload) is the smallest that fits a full 6x21 frame. */
export const FRAME_REPORT_ID = 4
export const FRAME_REPORT_SIZE = 510

const MAGIC_V3 = [0xd1, 0xda] as const

export const Command = {
  RawColors: 11,
  DeviceConfig: 19,
  SingleColor: 30,
  SingleReset: 31,
  ResetAll: 32,
  ColorInit: 33,
} as const

export type Layout = 'ANSI' | 'ISO' | 'JIS' | 'ANSI split' | 'ISO split' | 'unknown'
const LAYOUTS: Layout[] = ['ANSI', 'ISO', 'JIS', 'ANSI split', 'ISO split']

export type Rgb = readonly [number, number, number]

export function rgb565(r: number, g: number, b: number): number {
  return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3)
}

/** What the keyboard will actually show for a 24-bit colour. */
export function quantize([r, g, b]: Rgb): Rgb {
  return [r & 0xf8, g & 0xfc, b & 0xf8]
}

/** Feature-report payload (without the report-ID byte, as WebHID wants it). */
export function commandPayload(cmd: number, p0 = 0, p1 = 0, p2 = 0, p3 = 0): Uint8Array<ArrayBuffer> {
  return new Uint8Array([...MAGIC_V3, cmd, p3, p2, p1, p0])
}

export const matrixIndex = (row: number, col: number) => row * MATRIX_COLS + col

/** Full-frame payload for output report 4. `colors[row * 21 + col]` may be undefined (LED off). */
export function framePayload(colors: ArrayLike<Rgb | undefined>): Uint8Array<ArrayBuffer> {
  const data = new Uint8Array(FRAME_REPORT_SIZE)
  data[0] = MAGIC_V3[0]
  data[1] = MAGIC_V3[1]
  data[2] = Command.RawColors
  for (let i = 0; i < MATRIX_ROWS * MATRIX_COLS; i++) {
    const c = colors[i]
    if (!c) continue
    const v = rgb565(c[0], c[1], c[2])
    data[3 + i * 2] = v & 0xff
    data[4 + i * 2] = v >> 8
  }
  return data
}

/** Layout byte sits at data[9] of the DeviceConfig reply (index 10 once hidapi prepends the report ID). */
export function parseLayout(reply: DataView): Layout {
  if (reply.byteLength < 10) return 'unknown'
  return LAYOUTS[reply.getUint8(9)] ?? 'unknown'
}

export const DEVICE_MODELS: Record<number, string> = {
  0x1400: 'Wooting 80HE',
  0x1401: 'Wooting 80HE',
  0x1402: 'Wooting 80HE',
}
