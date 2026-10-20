import { hex, kelvin } from '../engine/color'
import { bands, fill, gradient, highlight, stripes, zoned } from '../engine/helpers'
import type { PresetDraft } from '../engine/types'

const solid = (id: string, name: string, color: string, tags?: string[]): PresetDraft => {
  const c = hex(color)
  return { id, name, category: 'Solid', tags, swatch: [c], render: (ctx, out) => fill(ctx, out, () => c) }
}

const white = (id: string, name: string, k: number): PresetDraft => {
  const c = kelvin(k)
  return { id, name, category: 'Solid', tags: ['white', 'warm', `${k}K`], swatch: [c], render: (ctx, out) => fill(ctx, out, () => c) }
}

export const SOLIDS: PresetDraft[] = [
  {
    id: 'your-colour', name: 'Your colour', category: 'Solid', tags: ['picker', 'custom'], swatch: [hex('#FF8A3D')],
    render: (ctx, out) => fill(ctx, out, () => ctx.primary),
  },
  white('candle-2700', 'Warm white 2700K', 2700),
  white('soft-3500', 'Soft white 3500K', 3500),
  white('neutral-4500', 'Neutral white 4500K', 4500),
  white('daylight-6500', 'Daylight 6500K', 6500),
  solid('red', 'Signal red', '#FF1A1A'),
  solid('vermilion', 'Vermilion', '#FF3D00'),
  solid('orange', 'Orange', '#FF7A00'),
  solid('amber', 'Amber', '#FFB000'),
  solid('yellow', 'Lemon', '#FFE600'),
  solid('lime', 'Lime', '#A6FF00'),
  solid('green', 'Green', '#00E640'),
  solid('mint', 'Mint', '#00FFA3'),
  solid('cyan', 'Cyan', '#00E5FF'),
  solid('sky', 'Sky', '#2EA8FF'),
  solid('blue', 'Blue', '#1F4BFF'),
  solid('indigo', 'Indigo', '#5B2BFF'),
  solid('violet', 'Violet', '#9D2BFF'),
  solid('magenta', 'Magenta', '#FF1AD9'),
  solid('pink', 'Hot pink', '#FF2E88'),
  solid('rose', 'Rose', '#FF6F91'),
  solid('off', 'Lights out', '#000000', ['dark', 'off', 'black']),
]

export const GRADIENTS: PresetDraft[] = [
  gradient('sunset-strip', 'Sunset Strip', ['#FF3D6E', '#FF8A3D', '#FFD23D', '#7B5CFF']),
  gradient('vaporwave', 'Vaporwave', ['#FF71CE', '#B967FF', '#01CDFE', '#05FFA1']),
  gradient('ocean-depth', 'Ocean Depth', ['#90E0EF', '#00B4D8', '#0077B6', '#03045E'], 'down'),
  gradient('aurora', 'Aurora', ['#00FFA3', '#03E1FF', '#A855F7']),
  gradient('fire', 'Fire', ['#FFD23D', '#FF7A00', '#FF1A1A', '#7F0000'], 'up'),
  gradient('monochrome-ice', 'Monochrome Ice', ['#E8F4F8', '#9CCBE0', '#4A7C96']),
  gradient('peach-fuzz', 'Peach Fuzz', ['#FFBE98', '#FF8A65', '#FFD1B8']),
  gradient('lime-soda', 'Lime Soda', ['#D4FF3D', '#3DFF8A', '#3DD5FF']),
  gradient('cotton-candy', 'Cotton Candy', ['#FFB3E6', '#C3B1FF', '#9DE7FF']),
  gradient('deep-sea', 'Deep Sea', ['#00F5D4', '#00BBF9', '#0A1AFF'], 'down'),
  gradient('forest-floor', 'Forest Floor', ['#B5E48C', '#52B69A', '#1A759F'], 'up'),
  gradient('golden-hour', 'Golden Hour', ['#FFE29A', '#FFA45B', '#FF5E5B']),
  gradient('neon-tokyo', 'Neon Tokyo', ['#FF006E', '#8338EC', '#3A86FF']),
  gradient('miami', 'Miami', ['#FF4FA3', '#FF9E7A', '#2DE1FC']),
  gradient('lavender-fields', 'Lavender Fields', ['#E0C3FC', '#8EC5FC', '#B39DFF']),
  gradient('cherry-blossom', 'Cherry Blossom', ['#FFFFFF', '#FFC4D6', '#FF6F91'], 'out'),
  gradient('toxic', 'Toxic', ['#39FF14', '#CCFF00', '#00FF9C']),
  gradient('blood-moon', 'Blood Moon', ['#FF2A00', '#B30000', '#3D0000'], 'out'),
  gradient('arctic', 'Arctic', ['#FFFFFF', '#B8F2FF', '#3D8BFF'], 'down'),
  gradient('sahara', 'Sahara', ['#FFE0A3', '#F4A259', '#BC4B51']),
  gradient('mojito', 'Mojito', ['#E9FFDB', '#7DFF6B', '#00B37A']),
  gradient('grape-soda', 'Grape Soda', ['#C77DFF', '#7B2CBF', '#FF5DA2']),
  gradient('tropical', 'Tropical', ['#FFDD00', '#FF7A00', '#00D4B4', '#007CF0']),
  gradient('ember', 'Ember', ['#FFB347', '#FF5F1F', '#B3001B'], 'in'),
  gradient('glacier', 'Glacier', ['#D6FFF6', '#4DCCBD', '#2374AB'], 'in'),
  gradient('rose-gold', 'Rose Gold', ['#FFD1C1', '#F7A399', '#E8C07D']),
  gradient('twilight', 'Twilight', ['#FF9A8B', '#A770EF', '#2B3A8F'], 'down'),
  gradient('citrus', 'Citrus', ['#FFF200', '#FF9F00', '#FF4D00']),
  gradient('bubblegum', 'Bubblegum', ['#FF77E9', '#FFB5E8', '#7AFCFF']),
  gradient('northern-lights', 'Northern Lights', ['#11FF9A', '#00C2FF', '#7A00FF', '#FF2EC4']),
  gradient('spectrum', 'Spectrum', ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'], 'right', ['rainbow']),
  gradient('dusk-to-dawn', 'Dusk to Dawn', ['#1A1AFF', '#B800FF', '#FF4D6D', '#FFC24D'], 'up'),
]

const theme = (id: string, name: string, z: Parameters<typeof zoned>[0]): PresetDraft => ({
  id, name, category: 'Themes', tags: ['editor', 'terminal'], ...zoned(z),
})

// Accent colours from each theme's published palette, mapped to zones that read well as light.
export const THEMES: PresetDraft[] = [
  theme('nord', 'Nord', { alpha: '#88C0D0', mods: '#5E81AC', accent: '#BF616A', frow: '#81A1C1', arrows: '#A3BE8C', space: '#8FBCBB' }),
  theme('dracula', 'Dracula', { alpha: '#BD93F9', mods: '#FF79C6', accent: '#FF5555', frow: '#8BE9FD', arrows: '#50FA7B', space: '#F1FA8C' }),
  theme('gruvbox-dark', 'Gruvbox Dark', { alpha: '#FABD2F', mods: '#FE8019', accent: '#FB4934', frow: '#B8BB26', arrows: '#83A598', space: '#D3869B' }),
  theme('gruvbox-light', 'Gruvbox Light', { alpha: '#FBF1C7', mods: '#D65D0E', accent: '#CC241D', frow: '#98971A', arrows: '#458588', space: '#B16286' }),
  theme('solarized-dark', 'Solarized Dark', { alpha: '#268BD2', mods: '#2AA198', accent: '#DC322F', frow: '#B58900', arrows: '#859900', space: '#6C71C4' }),
  theme('solarized-light', 'Solarized Light', { alpha: '#FDF6E3', mods: '#268BD2', accent: '#DC322F', frow: '#B58900', arrows: '#2AA198', space: '#D33682' }),
  theme('catppuccin-latte', 'Catppuccin Latte', { alpha: '#EFF1F5', mods: '#8839EF', accent: '#D20F39', frow: '#1E66F5', arrows: '#40A02B', space: '#EA76CB' }),
  theme('catppuccin-frappe', 'Catppuccin Frappé', { alpha: '#CA9EE6', mods: '#8CAAEE', accent: '#E78284', frow: '#A6D189', arrows: '#E5C890', space: '#F4B8E4' }),
  theme('catppuccin-macchiato', 'Catppuccin Macchiato', { alpha: '#C6A0F6', mods: '#8AADF4', accent: '#ED8796', frow: '#A6DA95', arrows: '#EED49F', space: '#F5BDE6' }),
  theme('catppuccin-mocha', 'Catppuccin Mocha', { alpha: '#CBA6F7', mods: '#89B4FA', accent: '#F38BA8', frow: '#A6E3A1', arrows: '#F9E2AF', space: '#F5C2E7' }),
  theme('tokyo-night', 'Tokyo Night', { alpha: '#7AA2F7', mods: '#BB9AF7', accent: '#F7768E', frow: '#7DCFFF', arrows: '#9ECE6A', space: '#E0AF68' }),
  theme('tokyo-night-storm', 'Tokyo Night Storm', { alpha: '#2AC3DE', mods: '#7AA2F7', accent: '#FF9E64', frow: '#BB9AF7', arrows: '#73DACA', space: '#F7768E' }),
  theme('one-dark', 'One Dark', { alpha: '#61AFEF', mods: '#C678DD', accent: '#E06C75', frow: '#56B6C2', arrows: '#98C379', space: '#E5C07B' }),
  theme('monokai', 'Monokai', { alpha: '#A6E22E', mods: '#F92672', accent: '#FD971F', frow: '#66D9EF', arrows: '#E6DB74', space: '#AE81FF' }),
  theme('rose-pine', 'Rosé Pine', { alpha: '#EBBCBA', mods: '#C4A7E7', accent: '#EB6F92', frow: '#9CCFD8', arrows: '#F6C177', space: '#31748F' }),
  theme('rose-pine-moon', 'Rosé Pine Moon', { alpha: '#C4A7E7', mods: '#3E8FB0', accent: '#EB6F92', frow: '#9CCFD8', arrows: '#F6C177', space: '#EA9A97' }),
  theme('everforest', 'Everforest', { alpha: '#A7C080', mods: '#83C092', accent: '#E67E80', frow: '#7FBBB3', arrows: '#DBBC7F', space: '#D699B6' }),
  theme('kanagawa', 'Kanagawa', { alpha: '#7E9CD8', mods: '#957FB8', accent: '#C34043', frow: '#7FB4CA', arrows: '#98BB6C', space: '#FFA066' }),
  theme('ayu-dark', 'Ayu Dark', { alpha: '#E6B450', mods: '#39BAE6', accent: '#F07178', frow: '#AAD94C', arrows: '#FF8F40', space: '#D2A6FF' }),
  theme('ayu-mirage', 'Ayu Mirage', { alpha: '#FFCC66', mods: '#5CCFE6', accent: '#F28779', frow: '#D5FF80', arrows: '#FFA659', space: '#DFBFFF' }),
  theme('night-owl', 'Night Owl', { alpha: '#82AAFF', mods: '#C792EA', accent: '#EF5350', frow: '#7FDBCA', arrows: '#ADDB67', space: '#F78C6C' }),
  theme('cobalt2', 'Cobalt2', { alpha: '#FFC600', mods: '#0088FF', accent: '#FF628C', frow: '#3AD900', arrows: '#9EFFFF', space: '#FF9D00' }),
  theme('synthwave-84', "Synthwave '84", { alpha: '#FF7EDB', mods: '#36F9F6', accent: '#FE4450', frow: '#FEDE5D', arrows: '#72F1B8', space: '#F97E72' }),
  theme('palenight', 'Palenight', { alpha: '#C792EA', mods: '#82AAFF', accent: '#F07178', frow: '#89DDFF', arrows: '#C3E88D', space: '#FFCB6B' }),
  theme('github-dark', 'GitHub Dark', { alpha: '#79C0FF', mods: '#D2A8FF', accent: '#FF7B72', frow: '#A5D6FF', arrows: '#7EE787', space: '#FFA657' }),
  theme('horizon', 'Horizon', { alpha: '#E95678', mods: '#26BBD9', accent: '#FAB795', frow: '#29D398', arrows: '#EE64AC', space: '#FAC29A' }),
  theme('oceanic-next', 'Oceanic Next', { alpha: '#6699CC', mods: '#5FB3B3', accent: '#EC5F67', frow: '#99C794', arrows: '#FAC863', space: '#C594C5' }),
  theme('tomorrow-night', 'Tomorrow Night', { alpha: '#81A2BE', mods: '#B294BB', accent: '#CC6666', frow: '#8ABEB7', arrows: '#B5BD68', space: '#F0C674' }),
  theme('iceberg', 'Iceberg', { alpha: '#84A0C6', mods: '#89B8C2', accent: '#E27878', frow: '#A093C7', arrows: '#B4BE82', space: '#E2A478' }),
  theme('material-ocean', 'Material Ocean', { alpha: '#82AAFF', mods: '#89DDFF', accent: '#FF5370', frow: '#C792EA', arrows: '#C3E88D', space: '#FFCB6B' }),
]

const colorway = (id: string, name: string, z: Parameters<typeof zoned>[0]): PresetDraft => ({
  id, name, category: 'Colorways', tags: ['keycaps', 'two-tone'], ...zoned(z),
})

export const COLORWAYS: PresetDraft[] = [
  colorway('sage-cream', 'Sage & Cream', { alpha: '#FFF4D6', mods: '#7FB069', accent: '#FF6F59' }),
  colorway('rose-charcoal', 'Rose & Charcoal', { alpha: '#FF9EB5', mods: '#3A3A3A', accent: '#FFFFFF' }),
  colorway('navy-gold', 'Navy & Gold', { alpha: '#FFC93C', mods: '#1C3FAA', accent: '#FF5E5B' }),
  colorway('orange-slate', 'Orange & Slate', { alpha: '#E6EEF2', mods: '#FF7A00', accent: '#FF7A00', space: '#FF7A00' }),
  colorway('mint-ink', 'Mint & Ink', { alpha: '#7DFFCB', mods: '#1D3BFF', accent: '#FFFFFF' }),
  colorway('lilac-smoke', 'Lilac & Smoke', { alpha: '#D7BFFF', mods: '#8C8CA6', accent: '#FFE66D' }),
  colorway('peach-plum', 'Peach & Plum', { alpha: '#FFB997', mods: '#843B62', accent: '#F67E7D' }),
  colorway('teal-coral', 'Teal & Coral', { alpha: '#2EC4B6', mods: '#FF6B6B', accent: '#FFE66D' }),
  colorway('cherry-bone', 'Cherry & Bone', { alpha: '#FFF1E0', mods: '#C1121F', accent: '#C1121F' }),
  colorway('lemon-graphite', 'Lemon & Graphite', { alpha: '#FFF35C', mods: '#4A4A4A', accent: '#FF3D00' }),
  colorway('sky-steel', 'Sky & Steel', { alpha: '#8ED1FC', mods: '#5C6B7A', accent: '#FFFFFF' }),
  colorway('moss-rust', 'Moss & Rust', { alpha: '#A3B18A', mods: '#B5541C', accent: '#FFD166' }),
  colorway('ivory-ink', 'Ivory & Ink', { alpha: '#FFF8E7', mods: '#1B1BFF', accent: '#FF1B1B' }),
  colorway('copper-teal', 'Copper & Teal', { alpha: '#E08E45', mods: '#127475', accent: '#F2E3BC' }),
  colorway('berry-cream', 'Berry & Cream', { alpha: '#FFF5E1', mods: '#9B2C66', accent: '#FF8FAB' }),
  colorway('arctic-fjord', 'Arctic & Fjord', { alpha: '#E3F6FF', mods: '#2B59C3', accent: '#00D1FF' }),
  colorway('ember-ash', 'Ember & Ash', { alpha: '#B8B8B8', mods: '#FF4500', accent: '#FFB000' }),
  colorway('jade-gold', 'Jade & Gold', { alpha: '#00A86B', mods: '#E2B33C', accent: '#FFFFFF' }),
  colorway('coral-navy', 'Coral & Navy', { alpha: '#FF7F6B', mods: '#14213D', accent: '#FCA311' }),
  colorway('office-beige', 'Office Beige', { alpha: '#F3E5C0', mods: '#9C9A8E', accent: '#E03C31', frow: '#9C9A8E' }),
]

const game = (id: string, name: string, base: string, sets: [string[], string][], tags: string[]): PresetDraft => ({
  id, name, category: 'Games', tags, ...highlight(base, sets),
})

const WASD = ['w', 'a', 's', 'd']
export const GAMES: PresetDraft[] = [
  game('wasd-focus', 'WASD Focus', '#140A08', [[WASD, '#FF3D00']], ['fps', 'movement']),
  game('arrow-focus', 'Arrow Focus', '#08100F', [[['up', 'down', 'left', 'right'], '#00FFA3']], ['movement']),
  game('tactical-fps', 'Tactical FPS', '#0B0B12', [
    [WASD, '#FF2E4D'], [['q', 'e', 'c', 'x'], '#FFC21A'], [['1', '2', '3', '4', '5'], '#29B6FF'],
    [['r'], '#3DFF7A'], [['space', 'lctrl', 'lshift'], '#FF8A1A'], [['g', 'f'], '#B26BFF'],
  ], ['fps', 'abilities']),
  game('battle-royale', 'Battle Royale Build', '#0A0A14', [
    [WASD, '#FF4D8D'], [['q', 'z', 'x', 'c', 'v'], '#2BD9FF'], [['f', 'g', 'e'], '#FFD23D'],
    [['1', '2', '3', '4', '5', '6'], '#7BFF5C'], [['space', 'lshift', 'lctrl'], '#B07CFF'],
  ], ['build', 'shooter']),
  game('moba', 'MOBA Abilities', '#0D0A06', [
    [['q', 'w', 'e', 'r'], '#00C2FF'], [['d', 'f'], '#FFB000'], [['1', '2', '3', '4', '5', '6'], '#A6FF00'],
    [['b'], '#FF3D6E'], [['space', 'tab'], '#FFFFFF'],
  ], ['moba', 'abilities']),
  game('mmo-hotbar', 'MMO Hotbar', '#0A0612', [
    [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'minus', 'equal'], '#FFC21A'],
    [['f1', 'f2', 'f3', 'f4'], '#5CE1FF'], [WASD, '#FF5C8A'], [['tab', 'm', 'i', 'c'], '#9B7BFF'],
  ], ['mmo', 'hotbar']),
  game('rhythm-4k', 'Rhythm 4K', '#05050A', [[['d', 'f'], '#FF3DA5'], [['j', 'k'], '#3DD8FF'], [['space'], '#FFFFFF']], ['rhythm']),
  game('rhythm-2k', 'Rhythm 2K', '#0A0508', [[['z'], '#FF66C4'], [['x'], '#66E3FF'], [['grave', 'esc'], '#FFE066']], ['rhythm']),
  game('racing', 'Racing', '#0A0A0A', [[WASD, '#FFE600'], [['space'], '#FF1A1A'], [['lshift'], '#00E5FF'], [['c', 'r'], '#FFFFFF']], ['racing', 'driving']),
  game('sandbox-builder', 'Sandbox Builder', '#0B0F07', [
    [WASD, '#7CFF4D'], [['1', '2', '3', '4', '5', '6', '7', '8', '9'], '#FFC94D'], [['e', 'q'], '#4DD2FF'],
    [['space', 'lshift', 'lctrl'], '#C38BFF'],
  ], ['sandbox', 'survival']),
  game('fighting', 'Fighting Pad', '#09090D', [
    [WASD, '#FFFFFF'], [['u', 'i', 'o'], '#FF3D3D'], [['j', 'k', 'l'], '#3D8BFF'],
  ], ['fighting']),
  game('home-row', 'Home Row', '#0D0D0D', [
    [['a', 's', 'd', 'g', 'h', 'k', 'l', 'semicolon'], '#4D7CFF'], [['f', 'j'], '#FFD23D'],
  ], ['typing', 'touch typing']),
  game('stream-deck', 'Stream Scenes', '#100A10', [
    [['f1', 'f2', 'f3', 'f4'], '#FF3D6E'], [['f5', 'f6', 'f7', 'f8'], '#FFB000'], [['f9', 'f10', 'f11', 'f12'], '#00D1A0'],
  ], ['streaming', 'obs']),
  game('stealth', 'Stealth', '#000000', [[WASD, '#102A3A'], [['esc'], '#2A0A0A']], ['dark', 'night']),
]

const flag = (id: string, name: string, parts: { swatch: PresetDraft['swatch']; render: PresetDraft['render'] }, tags: string[]): PresetDraft => ({
  id, name, category: 'Flags', tags, ...parts,
})

export const FLAGS: PresetDraft[] = [
  flag('pride', 'Pride', stripes(['#E40303', '#FF8C00', '#FFED00', '#008026', '#004CFF', '#732982']), ['pride', 'lgbtq', 'rainbow']),
  flag('trans', 'Trans', stripes(['#5BCEFA', '#F5A9B8', '#FFFFFF', '#F5A9B8', '#5BCEFA']), ['pride', 'transgender']),
  flag('bi', 'Bi', stripes(['#D60270', '#9B4F96', '#0038A8'], [2, 1, 2]), ['pride', 'bisexual']),
  flag('pan', 'Pan', stripes(['#FF218C', '#FFD800', '#21B1FF']), ['pride', 'pansexual']),
  flag('nonbinary', 'Nonbinary', stripes(['#FCF434', '#FFFFFF', '#9C59D1', '#2C2C2C']), ['pride', 'enby']),
  flag('lesbian', 'Lesbian', stripes(['#D52D00', '#FF9A56', '#FFFFFF', '#D362A4', '#A30262']), ['pride']),
  flag('ace', 'Ace', stripes(['#1A1A1A', '#A3A3A3', '#FFFFFF', '#800080']), ['pride', 'asexual']),
  flag('aro', 'Aro', stripes(['#3DA542', '#A7D379', '#FFFFFF', '#A9A9A9', '#1A1A1A']), ['pride', 'aromantic']),
  flag('genderfluid', 'Genderfluid', stripes(['#FF76A4', '#FFFFFF', '#C011D7', '#1A1A1A', '#2F3CBE']), ['pride']),
  flag('netherlands', 'Netherlands', stripes(['#AE1C28', '#FFFFFF', '#21468B']), ['country', 'dutch']),
  flag('germany', 'Germany', stripes(['#1A1A1A', '#DD0000', '#FFCE00']), ['country']),
  flag('ukraine', 'Ukraine', stripes(['#0057B7', '#FFD700']), ['country']),
  flag('austria', 'Austria', stripes(['#ED2939', '#FFFFFF', '#ED2939']), ['country']),
  flag('hungary', 'Hungary', stripes(['#CD2A3E', '#FFFFFF', '#436F4D']), ['country']),
  flag('estonia', 'Estonia', stripes(['#0072CE', '#1A1A1A', '#FFFFFF']), ['country']),
  flag('france', 'France', bands(['#0055A4', '#FFFFFF', '#EF4135']), ['country']),
  flag('italy', 'Italy', bands(['#009246', '#FFFFFF', '#CE2B37']), ['country']),
  flag('ireland', 'Ireland', bands(['#169B62', '#FFFFFF', '#FF883E']), ['country']),
  flag('belgium', 'Belgium', bands(['#1A1A1A', '#FDDA24', '#EF3340']), ['country']),
  flag('nigeria', 'Nigeria', bands(['#008751', '#FFFFFF', '#008751']), ['country']),
  flag('mexico', 'Mexico', bands(['#006847', '#FFFFFF', '#CE1126']), ['country']),
  {
    id: 'japan', name: 'Japan', category: 'Flags', tags: ['country'], swatch: [hex('#FFFFFF'), hex('#BC002D')],
    render: (ctx, out) => {
      const red = hex('#BC002D'), white = hex('#FFFFFF')
      fill(ctx, out, (led) => (Math.hypot(led.x - 8.6, (led.y - 3.1) * 1.15) < 2.1 ? red : white))
    },
  },
]
