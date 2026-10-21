import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Blend, Download, Link, Maximize2, Minimize2, PaintBucket,
  Paintbrush, Pipette, Redo2, SquareDashedMousePointer, Undo2, Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toHex } from '../engine/color'
import type { Direction } from '../engine/types'
import { WOOTING_80HE } from '../layout/wooting-80he'
import { PRESET_BY_ID } from '../presets'
import { downloadLook, sanitizeLook, shareUrl } from '../state/share'
import { applyLook, checkpoint, currentLook, redo, setState, undo, useEditor, type Tool } from '../state/store'
import { ColorField } from './ColorField'
import { KeyboardSave } from './KeyboardSave'
import { LightbarPanel } from './LightbarPanel'
import { paintKeys, targetKeys } from '../state/paint'
import { toast } from '../state/toast'

const TOOLS: { id: Tool; name: string; key: string; icon: typeof Paintbrush; hint: React.ReactNode }[] = [
  { id: 'paint', name: 'Paint', key: 'P', icon: Paintbrush, hint: <><strong>Paint:</strong> click or drag across keys. Alt or right-click erases.</> },
  { id: 'fill', name: 'Fill', key: 'F', icon: PaintBucket, hint: <><strong>Fill:</strong> click the board to fill the selection, or every key.</> },
  { id: 'gradient', name: 'Gradient', key: 'G', icon: Blend, hint: <><strong>Gradient:</strong> drag from primary to secondary across the board.</> },
  { id: 'eyedropper', name: 'Eyedropper', key: 'I', icon: Pipette, hint: <><strong>Eyedropper:</strong> click a key to pick up its colour.</> },
  { id: 'select', name: 'Select', key: 'S', icon: SquareDashedMousePointer, hint: <><strong>Select:</strong> click keys or drag a box. Shift adds, Esc clears.</> },
]

const DIRECTIONS: { id: Direction; name: string; icon: typeof ArrowLeft }[] = [
  { id: 'left', name: 'Leftward', icon: ArrowLeft },
  { id: 'right', name: 'Rightward', icon: ArrowRight },
  { id: 'up', name: 'Upward', icon: ArrowUp },
  { id: 'down', name: 'Downward', icon: ArrowDown },
  { id: 'out', name: 'Outward from the centre', icon: Maximize2 },
  { id: 'in', name: 'Inward to the centre', icon: Minimize2 },
]

export function ToolPanel() {
  const tool = useEditor((s) => s.tool)
  const direction = useEditor((s) => s.direction)
  const selection = useEditor((s) => s.selection)
  const recent = useEditor((s) => s.recent)
  const painted = useEditor((s) => Object.keys(s.paint).length)
  const presetId = useEditor((s) => s.presetId)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const active = TOOLS.find((t) => t.id === tool)!
  const presetName = PRESET_BY_ID.get(presetId)?.name ?? 'Look'

  const saveLook = () => {
    const finalName = name.trim() || `${presetName} remix`
    setState((s) => ({
      myLooks: [{ ...currentLook(s), id: crypto.randomUUID(), name: finalName, savedAt: Date.now() }, ...s.myLooks],
    }))
    setSaving(false)
    setName('')
    toast(`Saved “${finalName}” to My looks.`)
  }

  return (
    <aside className="tools" aria-label="Tools">
      <section className="tool-section">
        <span className="label">Tool</span>
        <div className="seg" role="group" aria-label="Tool">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              aria-pressed={tool === t.id}
              aria-label={`${t.name} (${t.key})`}
              title={`${t.name} (${t.key})`}
              onClick={() => setState({ tool: t.id })}
            >
              <t.icon />
            </button>
          ))}
        </div>
        <p className="tool-hint" style={{ margin: 0 }}>{active.hint}</p>
      </section>

      <section className="tool-section">
        <span className="label">Colour</span>
        <ColorField />
        <div className="swatches" aria-label="Recent colours">
          {recent.map((c) => (
            <button
              key={c.join()}
              style={{ background: toHex(c) }}
              title={toHex(c)}
              aria-label={`Use ${toHex(c)}`}
              onClick={() => setState({ primary: c })}
            />
          ))}
        </div>
      </section>

      <LightbarPanel />

      <section className="tool-section">
        <span className="label">Direction</span>
        <div className="seg" role="group" aria-label="Effect direction">
          {DIRECTIONS.map((d) => (
            <button key={d.id} aria-pressed={direction === d.id} aria-label={d.name} title={d.name} onClick={() => setState({ direction: d.id })}>
              <d.icon />
            </button>
          ))}
        </div>
      </section>

      <section className="tool-section">
        <span className="label">
          Selection · <span className="selection-count">{selection.length ? `${selection.length} keys` : 'none'}</span>
        </span>
        <div className="row-actions">
          <button className="btn quiet" onClick={() => setState({ selection: WOOTING_80HE.keys.map((k) => k.id) })}>All</button>
          <button
            className="btn quiet"
            onClick={() => setState((s) => ({ selection: WOOTING_80HE.keys.map((k) => k.id).filter((id) => !s.selection.includes(id)) }))}
          >
            Invert
          </button>
          <button className="btn quiet" disabled={!selection.length} onClick={() => setState({ selection: [] })}>Clear</button>
        </div>
        <div className="row-actions">
          <button
            className="btn"
            onClick={() => {
              checkpoint()
              paintKeys(targetKeys(), currentLook().primary)
            }}
          >
            Paint {selection.length ? 'selection' : 'all'}
          </button>
          <button
            className="btn"
            disabled={!painted}
            onClick={() => {
              checkpoint()
              paintKeys(targetKeys(), null)
            }}
          >
            Erase {selection.length ? 'selection' : 'all paint'}
          </button>
        </div>
      </section>

      <section className="tool-section">
        <span className="label">This look</span>
        <div className="row-actions">
          <button className="icon-btn" onClick={undo} aria-label="Undo paint" title="Undo (⌘Z)"><Undo2 /></button>
          <button className="icon-btn" onClick={redo} aria-label="Redo paint" title="Redo (⇧⌘Z)"><Redo2 /></button>
          <button className="btn solid" onClick={() => setSaving((v) => !v)} aria-expanded={saving}>Save look</button>
        </div>
        {saving && (
          <form
            className="save-form"
            onSubmit={(e) => {
              e.preventDefault()
              saveLook()
            }}
          >
            <input autoFocus value={name} placeholder={`${presetName} remix`} aria-label="Look name" onChange={(e) => setName(e.target.value)} />
            <button className="btn primary" type="submit">Save</button>
          </form>
        )}
        <div className="row-actions">
          <button
            className="btn quiet"
            onClick={async () => {
              const url = shareUrl(currentLook())
              try {
                await navigator.clipboard.writeText(url)
                toast('Share link copied. Anyone with a Wooting 80HE can open it.')
              } catch {
                history.replaceState(null, '', url)
                toast('Copy blocked by the browser; the link is now in the address bar.')
              }
            }}
          >
            <Link /> Share link
          </button>
          <button className="btn quiet" onClick={() => downloadLook(currentLook(), presetName)}>
            <Download /> Export
          </button>
          <button className="btn quiet" onClick={() => fileRef.current?.click()}>
            <Upload /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                const look = sanitizeLook(JSON.parse(await file.text()))
                if (!look) throw new Error('not a look')
                applyLook(look)
                toast(`Imported ${file.name}.`)
              } catch {
                toast(`${file.name} is not a keyglow look file.`)
              }
            }}
          />
        </div>
      </section>

      <KeyboardSave />
    </aside>
  )
}
