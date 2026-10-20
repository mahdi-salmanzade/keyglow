import { useEffect } from 'react'
import { PresetIndex } from './components/PresetIndex'
import { Stage } from './components/Stage'
import { StatusBar } from './components/StatusBar'
import { ToolPanel } from './components/ToolPanel'
import { Toasts } from './components/Toasts'
import { toast } from './state/toast'
import { WOOTING_80HE } from './layout/wooting-80he'
import { PRESET_BY_ID } from './presets'
import { connect, useDevice } from './state/device'
import { lookFromHash } from './state/share'
import { applyLook, getState, redo, setState, undo, useEditor, type Tool } from './state/store'

const TOOL_KEYS: Record<string, Tool> = { p: 'paint', f: 'fill', g: 'gradient', i: 'eyedropper', s: 'select' }

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (mod && key === 'a') {
        e.preventDefault()
        setState({ selection: WOOTING_80HE.keys.map((k) => k.id) })
        return
      }
      if (mod || e.altKey) return
      if (e.key === 'Escape') {
        setState({ selection: [] })
        return
      }
      // While a reactive preset runs, typing is the point: letters drive the lighting, not the tools.
      if (PRESET_BY_ID.get(getState().presetId)?.reactive) return
      if (key === '/') {
        e.preventDefault()
        document.getElementById('preset-search')?.focus()
      } else if (key === 'x') {
        setState((s) => ({ primary: s.secondary, secondary: s.primary }))
      } else if (TOOL_KEYS[key]) {
        setState({ tool: TOOL_KEYS[key] })
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])
}

function useSharedLook() {
  useEffect(() => {
    const open = () => {
      const look = lookFromHash()
      if (!look) return
      applyLook(look)
      history.replaceState(null, '', location.pathname + location.search)
      toast(`Opened a shared look: ${PRESET_BY_ID.get(look.presetId)?.name ?? 'custom'}.`)
    }
    open()
    addEventListener('hashchange', open)
    return () => removeEventListener('hashchange', open)
  }, [])
}

function Notice() {
  const device = useDevice()
  const reactive = useEditor((s) => PRESET_BY_ID.get(s.presetId)?.reactive)
  if (device.kind === 'unsupported') {
    return (
      <div className="note" role="note">
        This browser can’t talk to keyboards. Open keyglow in Chrome, Edge, Arc or Opera to connect your Wooting; every preset still
        previews here.
      </div>
    )
  }
  if (device.kind === 'error') {
    return (
      <div className="note" role="alert">
        {device.message}
        <button className="btn" onClick={() => void connect()}>Try again</button>
      </div>
    )
  }
  if (device.kind === 'idle' && device.notice) {
    return (
      <div className="note" role="status">
        {device.notice}
        <button className="btn" onClick={() => void connect()}>Connect keyboard</button>
      </div>
    )
  }
  if (reactive) {
    return (
      <div className="note" role="note">
        Reactive preset: type on your keyboard while this tab is focused. Tool shortcuts are paused so every key you press feeds the
        lighting.
      </div>
    )
  }
  return <div className="note" hidden />
}

export default function App() {
  const theme = useEditor((s) => s.theme)
  useShortcuts()
  useSharedLook()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="app">
      <StatusBar />
      <Notice />
      <PresetIndex />
      <Stage />
      <ToolPanel />
      <footer className="foot">
        <span>
          <kbd>P</kbd> paint · <kbd>F</kbd> fill · <kbd>G</kbd> gradient · <kbd>I</kbd> pick · <kbd>S</kbd> select · <kbd>X</kbd> swap ·{' '}
          <kbd>/</kbd> search
        </span>
        <span className="spacer" />
        <span>Not affiliated with Wooting</span>
        <a href="https://github.com/mahdi-salmanzade/keyglow" target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
      <Toasts />
    </div>
  )
}
