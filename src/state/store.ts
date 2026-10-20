import { useSyncExternalStore } from 'react'
import { hex, type Rgb } from '../engine/color'
import type { Direction, PresetCategory } from '../engine/types'
import { DEFAULT_FAVOURITES, DEFAULT_PRESET_ID, PRESET_BY_ID } from '../presets'
import { load, save } from './storage'

export type Tool = 'paint' | 'fill' | 'gradient' | 'eyedropper' | 'select'
export type Axis = 'hue' | 'speed' | 'brightness' | 'spread'
export type Theme = 'paper' | 'ink'
export type Filter = PresetCategory | 'All' | 'Starred' | 'Mine'

/** Paint layer: LED index -> colour, drawn over the preset. */
export type Paint = Record<number, Rgb>

/** Everything needed to reproduce a look; what Save, Share and Export carry. */
export type Look = {
  presetId: string
  hueShift: number
  speed: number
  brightness: number
  spread: number
  direction: Direction
  primary: Rgb
  secondary: Rgb
  paint: Paint
}

export type SavedLook = Look & { id: string; name: string; savedAt: number }

export type EditorState = Look & {
  activeAxis: Axis
  tool: Tool
  selection: string[]
  recent: Rgb[]
  favourites: string[]
  myLooks: SavedLook[]
  theme: Theme
  restoreOnClose: boolean
  filter: Filter
  search: string
}

const PERSIST_KEY = 'keyglow:v1'

export const DEFAULT_LOOK: Look = {
  presetId: DEFAULT_PRESET_ID,
  hueShift: 0,
  speed: 1,
  brightness: 1,
  spread: 1,
  direction: 'right',
  primary: hex('#FF8A3D'),
  secondary: hex('#7B5CFF'),
  paint: {},
}

const initial: EditorState = {
  ...DEFAULT_LOOK,
  activeAxis: 'hue',
  tool: 'paint',
  selection: [],
  recent: ['#FF3D6E', '#FF8A3D', '#FFD23D', '#7B5CFF', '#00FFA3', '#00E5FF', '#FFFFFF'].map(hex),
  favourites: DEFAULT_FAVOURITES,
  myLooks: [],
  theme: 'paper',
  restoreOnClose: false,
  filter: 'All',
  search: '',
}

type Persisted = Omit<EditorState, 'selection' | 'search' | 'activeAxis'>

function hydrate(): EditorState {
  const saved = load<Partial<Persisted>>(PERSIST_KEY, {})
  const state = { ...initial, ...saved }
  if (!PRESET_BY_ID.has(state.presetId)) state.presetId = DEFAULT_PRESET_ID
  return state
}

let state = hydrate()
const listeners = new Set<() => void>()

// Undo history covers the paint layer, the part of a look you can't get back by clicking a preset.
const undoStack: Paint[] = []
const redoStack: Paint[] = []
const HISTORY_LIMIT = 100

let persistTimer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const { selection: _s, search: _q, activeAxis: _a, ...rest } = state
    save(PERSIST_KEY, rest)
  }, 250)
}

export function getState() {
  return state
}

export function setState(patch: Partial<EditorState> | ((s: EditorState) => Partial<EditorState>)) {
  const next = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...next }
  persist()
  for (const l of listeners) l()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useEditor<T>(select: (s: EditorState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state))
}

/** Call before a paint gesture so the whole stroke undoes in one step. */
export function checkpoint() {
  undoStack.push(state.paint)
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift()
  redoStack.length = 0
}

export function undo() {
  const prev = undoStack.pop()
  if (!prev) return
  redoStack.push(state.paint)
  setState({ paint: prev })
}

export function redo() {
  const next = redoStack.pop()
  if (!next) return
  undoStack.push(state.paint)
  setState({ paint: next })
}

export function pushRecent(color: Rgb) {
  setState((s) => ({
    recent: [color, ...s.recent.filter((c) => c.join() !== color.join())].slice(0, 10),
  }))
}

export function currentLook(s: EditorState = state): Look {
  const { presetId, hueShift, speed, brightness, spread, direction, primary, secondary, paint } = s
  return { presetId, hueShift, speed, brightness, spread, direction, primary, secondary, paint }
}

export function applyLook(look: Look) {
  checkpoint()
  setState({ ...look, presetId: PRESET_BY_ID.has(look.presetId) ? look.presetId : DEFAULT_PRESET_ID })
}

export function choosePreset(id: string) {
  const preset = PRESET_BY_ID.get(id)
  if (!preset) return
  setState({ presetId: id, direction: preset.direction ?? 'right' })
}
