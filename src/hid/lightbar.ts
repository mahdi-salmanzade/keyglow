// Wooting 80HE light bar, set through the keyboard's Light Indicator profile (command 0x20).
// Reverse-engineered from Wootility 5.4.2's own writes on a real 80HE; see docs/80he-protocol.md.
//
//   output report: D1 DA 20 <header> <len lo> <len hi> <LightbarProfile>   (header: see profile.ts)
//   LightbarProfile { 1 isEnabled, 2 repeated Layer, 3 inheritGlobal, 4 brightness 0-255 }
//   Layer (oneof):  4 sync { 1 range, 2 samples }   5 pulse { 1 rgb565, 3 period ms, 4 ?, 5 range }
//                   6 solid { 1 rgb565, 2 range }    7 perLed { 1 rgb bytes, 2 range }
//   range { 1 start, 2 end } over LEDs 0-9

import { Writer } from './protobuf'
import { rgb565, type Rgb } from './protocol'

export const LIGHTBAR_LEDS = 10
export const LIGHTBAR_COMMAND = 0x20
/** Command whose reply carries every LED's live colour; the last 10 are the light bar. */
export const LIVE_LEDS_COMMAND = 0x4a

export type LightbarLayer =
  | { kind: 'solid'; color: Rgb }
  | { kind: 'perLed'; colors: Rgb[] }
  | { kind: 'pulse'; color: Rgb; periodMs: number }
  | { kind: 'sync' }

export type LightbarConfig = {
  /** false hands the bar back to the keyboard's own RGB effect. */
  enabled: boolean
  layers: LightbarLayer[]
  /** 0-255 */
  brightness: number
}

const fullRange = () => new Writer().uint(1, 0).uint(2, LIGHTBAR_LEDS - 1)
const color565 = ([r, g, b]: Rgb) => rgb565(r, g, b)

function encodeLayer(layer: LightbarLayer): Writer {
  switch (layer.kind) {
    case 'solid':
      return new Writer().message(6, new Writer().uint(1, color565(layer.color)).message(2, fullRange()))
    case 'perLed': {
      const rgb = layer.colors.slice(0, LIGHTBAR_LEDS).flatMap(([r, g, b]) => [r, g, b])
      return new Writer().message(7, new Writer().message(1, rgb).message(2, fullRange()))
    }
    case 'pulse':
      return new Writer().message(
        5,
        new Writer().uint(1, color565(layer.color)).uint(3, Math.round(layer.periodMs)).uint(4, 1).message(5, fullRange()),
      )
    case 'sync': {
      // Wootility's default: mirror the number row (row 1, columns 1-10) onto the 10 LEDs.
      const at = (row: number, col: number) => new Writer().uint(1, row).uint(2, col)
      return new Writer().message(4, new Writer().message(1, fullRange()).message(2, new Writer().message(1, at(1, 1)).message(2, at(1, 10))))
    }
  }
}

export function encodeLightbar(config: LightbarConfig): Uint8Array {
  const w = new Writer().uint(1, config.enabled ? 1 : 0)
  for (const layer of config.layers) w.message(2, encodeLayer(layer))
  return w.uint(3, 1).uint(4, Math.max(0, Math.min(255, Math.round(config.brightness)))).done()
}
