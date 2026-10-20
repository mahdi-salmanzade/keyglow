/** One addressable LED: a cell of the 6x21 matrix at a physical position (key units, centre). */
export type Led = {
  index: number
  row: number
  col: number
  x: number
  y: number
  keyId: string
}

/** One physical key cap. Most keys own one LED; the 80HE spacebar owns five. */
export type Key = {
  id: string
  label: string
  /** Secondary legend, e.g. the shifted symbol. */
  shift?: string
  /** KeyboardEvent.code, for mirroring real key presses. */
  code?: string
  x: number
  y: number
  w: number
  h: number
  leds: number[]
}

export type KeyboardLayout = {
  id: string
  name: string
  width: number
  height: number
  keys: Key[]
  leds: Led[]
}
