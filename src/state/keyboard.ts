import { runtime } from '../engine/runtime'
import { encodeRows, staticCore, type ProfileId } from '../hid/profile'
import { MATRIX_COLS, MATRIX_ROWS, rgb565 } from '../hid/protocol'
import { PRESET_BY_ID } from '../presets'
import { currentDevice, restoreProfileLighting } from './device'
import { toConfig } from './lightbar'
import { getState, setState, useEditor } from './store'
import { toast } from './toast'

/** LightbarProfile { isEnabled: false, inheritGlobal: true }: the bar follows the keys' own effect. */
const FOLLOW_KEYS_LIGHTBAR = Uint8Array.of(0x08, 0x00, 0x18, 0x01)

const backupKey = (id: ProfileId) => `${id.namespace}:${id.index}`
const toHex = (b: Uint8Array) => Array.from(b, (v) => v.toString(16).padStart(2, '0')).join('')
const fromHex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (v) => parseInt(v, 16))
const label = (name: string | undefined, id: ProfileId) => (name ? `“${name}”` : `profile ${id.index + 1}`)

/**
 * Stores what keyglow shows right now in the keyboard's active profile, so the keyboard keeps it without
 * keyglow, after unplugging, on any computer. The first save on a profile keeps a copy of what it had.
 */
export async function saveToKeyboard() {
  const d = currentDevice()
  if (!d) return toast('Connect the keyboard first.')
  try {
    const id = await d.activeProfile()
    const before = await d.readStoredLighting(id)
    if (!before) throw new Error('Could not read the profile')
    const name = await d.profileName(id)
    if (!getState().keyboardBackups[backupKey(id)]) {
      const backup = { profileName: name, top: toHex(before.top), bottom: toHex(before.bottom), core: toHex(before.core), lightbar: toHex(before.lightbar), savedAt: Date.now() }
      setState((s) => ({ keyboardBackups: { ...s.keyboardBackups, [backupKey(id)]: backup } }))
    }

    const matrix = runtime.deviceMatrix()
    const rows = Array.from({ length: MATRIX_ROWS }, (_, r) =>
      Array.from({ length: MATRIX_COLS }, (_, c) => {
        const q = matrix[r * MATRIX_COLS + c]
        return q ? rgb565(q[0], q[1], q[2]) : 0
      }),
    )
    const stored = await d.storeLighting(id, { top: encodeRows(rows.slice(0, 3)), bottom: encodeRows(rows.slice(3)), core: staticCore(before.core) })
    if (!stored) return toast('The keyboard did not keep the colours. Try again, or unplug it and plug it back in first.')

    const lightbar = getState().lightbar
    if (lightbar.mode !== 'keyboard') await d.writeLightbar(toConfig(lightbar), true)
    const still = PRESET_BY_ID.get(getState().presetId)?.animated ? ' as a still frame' : ''
    toast(`Saved to ${label(name, id)}${still}. It stays after unplugging, on any computer.`)
  } catch {
    toast('Could not save to the keyboard. Reconnect it and try again.')
  }
}

/** Puts back the lighting the active profile had before keyglow first saved over it, and shows it. */
export async function restoreKeyboardLighting() {
  const d = currentDevice()
  if (!d) return toast('Connect the keyboard first.')
  try {
    const id = await d.activeProfile()
    const backup = getState().keyboardBackups[backupKey(id)]
    if (!backup) return toast('keyglow has not saved over this profile, so there is nothing to put back.')
    const stored = await d.storeLighting(id, { top: fromHex(backup.top), bottom: fromHex(backup.bottom), core: fromHex(backup.core) })
    if (!stored) return toast('The keyboard did not take the old lighting back. Try again.')
    await d.storeLightbar(id, backup.lightbar ? fromHex(backup.lightbar) : FOLLOW_KEYS_LIGHTBAR)
    setState((s) => {
      const { [backupKey(id)]: _done, ...rest } = s.keyboardBackups
      return { keyboardBackups: rest }
    })
    await restoreProfileLighting()
    toast(`Put back ${label(backup.profileName, id)} the way it was before keyglow.`)
  } catch {
    toast('Could not reach the keyboard. Reconnect it and try again.')
  }
}

/** Whether any profile has a keyglow backup to put back. */
export const useHasKeyboardBackup = () => useEditor((s) => Object.keys(s.keyboardBackups).length > 0)
