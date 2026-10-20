import type { Preset, PresetCategory, PresetDraft } from '../engine/types'
import { ANIMATED } from './animated'
import { REACTIVE } from './reactive'
import { COLORWAYS, FLAGS, GAMES, GRADIENTS, SOLIDS, THEMES } from './static'

export const CATEGORY_ORDER: PresetCategory[] = ['Gradients', 'Animated', 'Reactive', 'Themes', 'Colorways', 'Games', 'Flags', 'Solid']

const PREFIX: Record<PresetCategory, string> = {
  Solid: 'S', Gradients: 'G', Themes: 'T', Colorways: 'C', Games: 'P', Flags: 'F', Animated: 'A', Reactive: 'R',
}

function register(drafts: PresetDraft[]): Preset[] {
  const counters = new Map<PresetCategory, number>()
  return drafts.map((d) => {
    const n = (counters.get(d.category) ?? 0) + 1
    counters.set(d.category, n)
    return { ...d, code: `${PREFIX[d.category]}-${String(n).padStart(2, '0')}` }
  })
}

export const PRESETS: Preset[] = register([
  ...GRADIENTS, ...ANIMATED, ...REACTIVE, ...THEMES, ...COLORWAYS, ...GAMES, ...FLAGS, ...SOLIDS,
])

export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]))

export const DEFAULT_PRESET_ID = 'sunset-strip'

/** Presets shown on the instance rail until the user stars their own. */
export const DEFAULT_FAVOURITES = ['sunset-strip', 'vaporwave', 'rainbow-wave', 'aurora-drift', 'ripple', 'catppuccin-mocha', 'wasd-focus']
