// The lighting a keyboard profile keeps for itself: one colour per key, plus the effect stack
// drawn over it. Decoded from Wootility 5.4.2 on a real 80HE; see docs/80he-protocol.md.
//
//   working copy (output report): D1 DA 0E <header> <len16> <rows 0-2>     what the keys show now
//                                 D1 DA 0F <header> <len16> <rows 3-5>
//                                 D1 DA 16 <header> <len16> <RgbProfileCore>
//   keep it (feature 8):          D1 DA 08 <profile index> <namespace> 00 00
//   stored copy (feature):        23 rows 0-2 · 24 rows 3-5 · 32 RgbProfileCore · 37 name · 42 light bar
//
//   header byte    bit 0 save, bits 1-5 profile index, bits 6-7 namespace
//   rows           repeated Row { 1 packed uint32 rgb565 x 21 }
//   RgbProfileCore { 1 base { 1 brightness, 2-5 lock-key colours }, 4 effect layers }; no layers = Static

import { readFields, readPacked, Writer } from './protobuf'
import { MATRIX_COLS } from './protocol'

export const ProfileCommand = {
  Save: 0x08,
  ActiveProfile: 0x0b,
  ColorsTop: 0x0e,
  ColorsBottom: 0x0f,
  Core: 0x16,
  ReadColorsTop: 0x23,
  ReadColorsBottom: 0x24,
  ReadCore: 0x32,
  ReadMeta: 0x37,
  ReadLightbar: 0x42,
} as const

export type ProfileId = { index: number; namespace: number }

/** A profile's stored lighting as raw protobuf, exactly as the keyboard returns it. */
export type StoredLighting = { top: Uint8Array; bottom: Uint8Array; core: Uint8Array; lightbar: Uint8Array }

/** First byte after the command in profile writes. Without `save` a write only changes what the keys show. */
export function profileHeader(save: boolean, id: ProfileId = { index: 0, namespace: 0 }) {
  return (save ? 1 : 0) | ((id.index & 31) << 1) | ((id.namespace & 3) << 6)
}

const REPORT_SIZES = [32, 62, 254, 510, 1022, 2046]

/** Wraps a profile message into the smallest output report that fits. */
export function profileReport(command: number, header: number, body: Uint8Array): { reportId: number; data: Uint8Array<ArrayBuffer> } {
  const index = REPORT_SIZES.findIndex((size) => 6 + body.length <= size)
  if (index < 0) throw new Error('Profile message too large')
  const data = new Uint8Array(REPORT_SIZES[index])
  data.set([0xd1, 0xda, command, header, body.length & 0xff, body.length >> 8])
  data.set(body, 6)
  return { reportId: index + 1, data }
}

/** Three matrix rows of RGB565 values, as the ColorsTop / ColorsBottom messages carry them. */
export function encodeRows(rows: readonly (readonly number[])[]): Uint8Array {
  const w = new Writer()
  for (const row of rows) {
    const packed = new Writer()
    for (let c = 0; c < MATRIX_COLS; c++) packed.varint(row[c] ?? 0)
    w.message(1, new Writer().message(1, packed))
  }
  return w.done()
}

export function decodeRows(buf: Uint8Array): number[][] {
  return readFields(buf).flatMap((row) => {
    if (!('bytes' in row)) return []
    const values = readFields(row.bytes).find((f) => f.field === 1)
    return values && 'bytes' in values ? [readPacked(values.bytes)] : []
  })
}

/**
 * The effect stack for plain stored colours: the profile's own base settings (lock-key colours)
 * at full brightness, with every effect layer removed. No base effect is what Wootility calls Static.
 */
export function staticCore(core: Uint8Array): Uint8Array {
  const base = readFields(core).find((f) => f.field === 1)
  const w = new Writer().uint(1, 255)
  if (base && 'bytes' in base) {
    for (const f of readFields(base.bytes)) {
      if (f.field === 1) continue
      if ('value' in f) w.uint(f.field, f.value)
      else w.message(f.field, f.bytes)
    }
  }
  return new Writer().message(1, w).done()
}

/** Profile name from the ReadMeta reply ({ 1 name, 2 colour, 3 icon }). */
export function profileName(meta: Uint8Array): string | undefined {
  try {
    const name = readFields(meta).find((f) => f.field === 1)
    return name && 'bytes' in name ? new TextDecoder().decode(name.bytes) : undefined
  } catch {
    return undefined
  }
}
