// Just enough protobuf for the keyboard's profile messages: varints and length-delimited fields.

export class Writer {
  private bytes: number[] = []
  varint(v: number) {
    let x = v >>> 0
    while (x >= 0x80) {
      this.bytes.push((x & 0x7f) | 0x80)
      x >>>= 7
    }
    this.bytes.push(x)
    return this
  }
  uint(field: number, v: number) {
    return this.varint((field << 3) | 0).varint(v)
  }
  message(field: number, body: Writer | ArrayLike<number>) {
    const b = body instanceof Writer ? body.bytes : Array.from(body)
    this.varint((field << 3) | 2).varint(b.length)
    this.bytes.push(...b)
    return this
  }
  done() {
    return Uint8Array.from(this.bytes)
  }
}

export type Field = { field: number; value: number } | { field: number; bytes: Uint8Array }

/** Top-level fields of a message, in order. Throws on wire types the keyboard doesn't use. */
export function readFields(buf: Uint8Array): Field[] {
  const out: Field[] = []
  let i = 0
  const varint = () => {
    let v = 0
    for (let shift = 0; ; shift += 7) {
      if (i >= buf.length) throw new Error('Truncated protobuf')
      const b = buf[i++]
      v += (b & 0x7f) * 2 ** shift
      if (!(b & 0x80)) return v
    }
  }
  while (i < buf.length) {
    const key = varint()
    const field = Math.floor(key / 8)
    const wire = key & 7
    if (wire === 0) out.push({ field, value: varint() })
    else if (wire === 2) {
      const n = varint()
      if (i + n > buf.length) throw new Error('Truncated protobuf')
      out.push({ field, bytes: buf.slice(i, i + n) })
      i += n
    } else throw new Error(`Unsupported protobuf wire type ${wire}`)
  }
  return out
}

/** Packed repeated uint32: the bytes are back-to-back varints. */
export function readPacked(buf: Uint8Array): number[] {
  const out: number[] = []
  let v = 0
  let shift = 0
  for (const b of buf) {
    v += (b & 0x7f) * 2 ** shift
    shift += 7
    if (!(b & 0x80)) {
      out.push(v)
      v = 0
      shift = 0
    }
  }
  return out
}
