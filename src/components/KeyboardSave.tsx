import { HardDriveDownload, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { PRESET_BY_ID } from '../presets'
import { useDevice } from '../state/device'
import { restoreKeyboardLighting, saveToKeyboard, useHasKeyboardBackup } from '../state/keyboard'
import { useEditor } from '../state/store'

/** Stores the current look in the keyboard's own profile, so it shows without keyglow. */
export function KeyboardSave() {
  const connected = useDevice().kind === 'connected'
  const animated = useEditor((s) => PRESET_BY_ID.get(s.presetId)?.animated ?? false)
  const keepsBar = useEditor((s) => s.lightbar.mode !== 'keyboard')
  const hasBackup = useHasKeyboardBackup()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <section className="tool-section" aria-label="On the keyboard">
      <span className="label">On the keyboard · {connected ? 'active profile' : 'connect to save'}</span>
      <div className="row-actions">
        <button className="btn solid" disabled={!connected || busy} aria-expanded={confirming} onClick={() => setConfirming((v) => !v)}>
          <HardDriveDownload /> Save to keyboard
        </button>
        {hasBackup && (
          <button
            className="btn quiet"
            disabled={!connected || busy}
            title="Put back the lighting this profile had before keyglow first saved to it"
            onClick={() => run(restoreKeyboardLighting)}
          >
            <RotateCcw /> Put back original
          </button>
        )}
      </div>
      {confirming && (
        <div className="confirm">
          <p className="tool-hint">
            Stores this look in the keyboard’s active profile, so it shows without keyglow, after unplugging, on any computer.
            {animated && ' Animated looks are saved as a still frame: the keyboard can’t run keyglow’s effects by itself.'}
            {keepsBar && ' The light bar setting is saved with it.'}
            {!hasBackup && ' keyglow keeps a copy of the profile’s current lighting so you can put it back.'}
          </p>
          <button className="btn primary" disabled={busy} onClick={() => run(saveToKeyboard)}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </section>
  )
}
