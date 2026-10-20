import type { KeyboardLayout, Led } from '../layout/types'
import type { Rgb } from './color'

/** A key press the reactive presets can respond to. */
export type Hit = { x: number; y: number; ledIndex: number; at: number }

export type Direction = 'right' | 'left' | 'down' | 'up' | 'out' | 'in'

export type RenderContext = {
  /** Seconds since the preset started, already scaled by the speed control. */
  t: number
  layout: KeyboardLayout
  leds: Led[]
  hits: readonly Hit[]
  direction: Direction
  /** Spatial scale for waves and gradients; 1 spans the board once. */
  spread: number
  /** The picker's primary and secondary colours; "your colour" presets use them. */
  primary: Rgb
  secondary: Rgb
  /** Per-LED press counts, for heatmaps. */
  counts: ReadonlyMap<number, number>
}

export type PresetCategory =
  | 'Solid'
  | 'Gradients'
  | 'Themes'
  | 'Colorways'
  | 'Games'
  | 'Flags'
  | 'Animated'
  | 'Reactive'

export type Preset = {
  id: string
  /** Short catalogue code, e.g. G-07. Assigned by the registry. */
  code: string
  name: string
  category: PresetCategory
  tags?: string[]
  animated?: boolean
  reactive?: boolean
  /** Loop length in seconds at 1x speed, for looping animations. */
  period?: number
  /** Default direction for directional effects. */
  direction?: Direction
  /** Colours that describe the preset, for swatch strips and search. */
  swatch: Rgb[]
  render: (ctx: RenderContext, out: Rgb[]) => void
}

export type PresetDraft = Omit<Preset, 'code'>
