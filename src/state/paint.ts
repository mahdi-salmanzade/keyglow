import type { Rgb } from '../engine/color'
import { WOOTING_80HE } from '../layout/wooting-80he'
import type { Key } from '../layout/types'
import { getState, setState, type Paint } from './store'

export const KEY_BY_ID = new Map(WOOTING_80HE.keys.map((k) => [k.id, k]))

/** Keys an operation should touch: the selection if there is one, else the whole board. */
export function targetKeys(): Key[] {
  const sel = getState().selection
  return sel.length ? sel.map((id) => KEY_BY_ID.get(id)).filter((k): k is Key => !!k) : WOOTING_80HE.keys
}

/** Paints (or with `null`, erases) every LED of the given keys. */
export function paintKeys(keys: Key[], color: Rgb | null) {
  setState((s) => {
    const paint: Paint = { ...s.paint }
    for (const k of keys)
      for (const i of k.leds) {
        if (color) paint[i] = color
        else delete paint[i]
      }
    return { paint }
  })
}
