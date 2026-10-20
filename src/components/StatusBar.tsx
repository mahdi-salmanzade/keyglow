import { Moon, Plug, RotateCcw, Sun, Unplug } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { runtime } from '../engine/runtime'
import { connect, disconnect, restoreProfileLighting, useDevice } from '../state/device'
import { setState, useEditor } from '../state/store'
import { toast } from '../state/toast'

const useReleased = () => useSyncExternalStore((l) => runtime.onRelease(l), () => runtime.released)

export function StatusBar() {
  const device = useDevice()
  const released = useReleased()
  const theme = useEditor((s) => s.theme)
  const restoreOnClose = useEditor((s) => s.restoreOnClose)
  const connected = device.kind === 'connected'

  return (
    <header className="top">
      <h1 className="wordmark">keyglow</h1>
      <div className="device" aria-live="polite">
        <i className={`device-dot${connected ? ' on' : ''}`} aria-hidden="true" />
        {connected ? (
          <>
            <span className="device-name">{device.info.model}</span>
            <span className="device-meta">{device.info.layout} · {released ? 'profile lighting' : 'live'}</span>
          </>
        ) : (
          <span className="device-meta">
            {device.kind === 'connecting' ? 'Waiting for the browser chooser…' : 'Preview · no keyboard connected'}
          </span>
        )}
      </div>
      <span className="spacer" />
      <div className="actions">
        {connected && (
          <label className="toggle" title="When you close this tab, hand the LEDs back to the keyboard's own profile">
            <input
              type="checkbox"
              checked={restoreOnClose}
              onChange={(e) => setState({ restoreOnClose: e.target.checked })}
            />
            Restore on close
          </label>
        )}
        <button
          className="icon-btn"
          onClick={() => setState({ theme: theme === 'paper' ? 'ink' : 'paper' })}
          aria-label={theme === 'paper' ? 'Switch to Ink theme for dim rooms' : 'Switch to Paper theme'}
          title={theme === 'paper' ? 'Ink theme' : 'Paper theme'}
        >
          {theme === 'paper' ? <Moon /> : <Sun />}
        </button>
        {connected && (
          <button
            className="btn"
            onClick={async () => {
              await restoreProfileLighting()
              toast('Profile lighting restored. Pick any preset to take over again.')
            }}
          >
            <RotateCcw /> Restore profile lighting
          </button>
        )}
        {connected ? (
          <button className="btn solid" onClick={() => void disconnect()}>
            <Unplug /> Disconnect
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={() => void connect()}
            disabled={device.kind === 'unsupported' || device.kind === 'connecting'}
          >
            <Plug /> Connect keyboard
          </button>
        )}
      </div>
    </header>
  )
}
