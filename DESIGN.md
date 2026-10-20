---
name: keyglow
description: Open-source, browser-based per-key lighting editor for Wooting keyboards, shown as a live type specimen.
colors:
  paper: "#f4f3ef"
  ink: "#111111"
  muted: "#64635e"
  rule: "#8a8984"
  line: "#d9d8d2"
  raise: "#ebeae4"
  accent: "#ff3d00"
  on-accent: "#111111"
  ink-theme-paper: "#121211"
  ink-theme-ink: "#f1f0ea"
  ink-theme-muted: "#a6a59f"
  ink-theme-rule: "#6c6b66"
  ink-theme-line: "#2b2b29"
  ink-theme-raise: "#1c1c1b"
  ink-theme-accent: "#ff5a26"
  ink-theme-on-accent: "#121211"
typography:
  display:
    fontFamily: "Unbounded Variable, JetBrains Mono Variable, sans-serif"
    fontSize: "clamp(56px, 6.4vw, 96px)"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "-0.04em"
  wordmark:
    fontFamily: "Unbounded Variable, JetBrains Mono Variable, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  value:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  readout:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
    fontFeature: "tnum"
  body:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  control: "2px"
  key: "5px"
  key-compact: "3px"
  stop: "50%"
spacing:
  hair: "4px"
  tight: "6px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  gutter: "20px"
  xl: "28px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "30px"
  button-hover:
    backgroundColor: "{colors.raise}"
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "30px"
  button-solid-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "30px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    size: "30px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 7px"
    height: "22px"
  chip-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  segment-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "32px"
  preset-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0 6px 0 14px"
    height: "34px"
  preset-row-hover:
    backgroundColor: "{colors.raise}"
  preset-row-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  hex-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "32px"
  key-cap:
    backgroundColor: "{colors.raise}"
    rounded: "{rounded.key}"
    padding: "7% 9%"
  status-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "0 20px"
    height: "48px"
  notice-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "9px 20px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
---

# Design System: keyglow

## Overview

**Creative North Star: "The Live Specimen"**

keyglow presents the keyboard the way a foundry presents a variable typeface: the 80HE is the giant glyph, the axis sliders remap it, and a monospace readout prints every number. The ground is warm paper, structure is drawn in one-pixel ink rules, and colour belongs to the keys. The chrome stays achromatic so a preset reads truthfully against it. One foundry orange marks whatever is live: the active axis, the primary action, the current stop.

The density is that of an instrument, not a marketing page. Everything is set in JetBrains Mono at 10 to 13px with tabular figures, in three columns (preset index, stage, tools) separated by full-height ink rules. Unbounded appears exactly twice: the wordmark and the single display readout that names the active axis value. Surfaces are flat. Selection and focus are outlines, not glows; active states invert to ink.

Two themes share one structure. **Paper** is the default. **Ink** swaps ground and ink for dim rooms and warms the accent slightly so it holds contrast on near-black. Both themes are switched through `data-theme` on the root and every component reads only the role variables, never a theme-specific value.

**Key Characteristics:**
- Warm paper ground, ink one-pixel rules, achromatic chrome; the keys carry all the colour.
- One accent for "live": active axis, primary action, current stop, focus ring, caret.
- Monospace everywhere with tabular figures; Unbounded only for wordmark and display readout.
- Flat; active state is ink inversion, selection is an outline.
- Two themes, Paper and Ink, from the same role variables.

## Colors

An achromatic warm-grey instrument with a single saturated orange-red that means "live".

### Primary
- **Foundry Orange** (`accent`; Ink theme `ink-theme-accent`): the active axis (value, slider track and thumb; its small label stays ink for contrast), the primary action (Connect keyboard, Save), the current stop on the instance rail, the connected device dot, starred presets, the active row's code, the focus ring, the text caret, and the invalid hex border. In Ink it shifts warmer and lighter so it clears 6:1 on the dark ground; text on it becomes the dark ground.
- **On Accent** (`on-accent`; Ink theme `ink-theme-on-accent`): text and icons sitting on Foundry Orange. Ink on orange in both themes (5.9:1 on Paper); white on orange is too weak at 11px.

### Neutral
- **Paper** (`paper`; Ink `ink-theme-paper`): the ground for the whole app, sticky list headers, stop dots at rest, and text on inverted ink surfaces.
- **Ink** (`ink`; Ink `ink-theme-ink`): body text, the structural one-pixel rules between regions, outline buttons, field strokes, slider tracks and thumbs, and the inverted fill of active rows, pressed chips, pressed segments, the notice band and toasts.
- **Muted** (`muted`; Ink `ink-theme-muted`): secondary text such as labels, preset codes, device meta, hints, slider end values and the footer.
- **Rule Grey** (`rule`; Ink `ink-theme-rule`): disabled axis values, resting star icons, the scrollbar thumb on hover. Not for readable text.
- **Line** (`line`; Ink `ink-theme-line`): quiet dividers inside a region (between rows and tool sections), quiet button and chip borders, swatch borders.
- **Raise** (`raise`; Ink `ink-theme-raise`): hover fill for rows and buttons, and the fallback fill of an unlit key cap.

### Named Rules
**The Keys Own the Colour Rule.** Chrome is achromatic. Hue enters the UI only as data: key caps, preset colour strips, swatches, the colour field and hue strip.

**The One Live Thing Rule.** Foundry Orange marks what is live or primary right now. If two things on a screen are orange, both must be live (for example the active axis and the Connect action); it is never decoration.

**The Ink and Line Rule.** Ink rules (1px) divide regions: status bar, index, stage, tools. Line rules (1px) divide items inside a region. No third divider weight.

## Typography

**Display Font:** Unbounded Variable (falls back to JetBrains Mono Variable, then sans-serif)
**Body Font:** JetBrains Mono Variable (with ui-monospace, monospace)

**Character:** A wide, round geometric display face standing over a disciplined monospace, like a specimen sheet's showing size above its spec table. Tabular figures are on globally so values never jitter while scrubbing.

### Hierarchy
- **Display** (`display`): the active axis value on the stage, and nothing else. 60px fixed below 861px.
- **Wordmark** (`wordmark`): "keyglow" in the status bar.
- **Value** (`value`): the four axis values above their sliders.
- **Headline** (`headline`): the current preset's name on the stage.
- **Readout** (`readout`): the board readout strip under the keyboard (direction, painted LEDs, selection, LED count, live rate, file name). Uppercase content.
- **Body** (`body`): rows, fields, meta, hints; buttons step down to 11px weight 500, chips and codes to 10px.
- **Label** (`label`, uppercase): section and group labels such as tool sections, axis names, sticky list headers, "Starred instances".

### Named Rules
**The Two Unbounded Rule.** Unbounded is used for the wordmark and the single display readout. Every other string, including headings and large values, is JetBrains Mono.

**The Tabular Rule.** All figures are tabular; numeric formats are padded where they scrub (hue as `±000°`, speed as `0.00×`).

## Layout

A full-viewport instrument at 1280px and up: a three-column grid (preset index 280px, stage fluid, tools 264px) under a 48px status bar and an optional full-width ink notice band, with a 28px footer for shortcuts and attribution. The index and tools scroll independently; the page itself does not.

From 861px to 1279px the page scrolls as a document. The index narrows to 260px and stays sticky at full viewport height; the tools move under the stage and wrap into an auto-fill grid of sections at least 250px wide, ruled with line borders on the right and bottom.

At 860px and below everything stacks in one column in this order: status bar, notice, stage, preset index, tools, footer. Presets come before tools. The status-bar actions take a full row with equal-width buttons, the stage head stacks, axes go two-up, and the list caps at 70vh. At 600px and below key legends are hidden and keys read as pure colour.

Spacing is small-step and dense: 4px inside clusters (chips, swatches, segments), 6 to 10px between related controls, 14 to 16px panel padding, 18 to 20px between stage blocks and at the outer edge, 28px between the four axes and as the stage's side padding.

**The Specimen Scale Rule.** The keyboard spans the full stage width at its true 17.25:6.25 aspect; nothing sits beside it.

## Elevation & Depth

Flat. There are no elevation shadows anywhere; depth is conveyed by ink rules, ink inversion and hover fills of `raise`. The only box-shadows are hairline rings: a 1px inset ring defining each key cap and preset strip edge (`inset 0 0 0 1px rgb(17 17 17 / 0.14)` on caps), and 1px outer rings on the colour-field and hue thumbs so they read on any hue. Toasts float by position, not shadow.

**The Outline, Not Glow Rule.** Focus is a 2px accent outline offset 2px. Key selection is a 2px ink outline offset 2px. Neither uses blur.

## Shapes

Nearly square. Controls (buttons, chips, segments, fields, swatches, toasts, colour-pair squares) take a 2px radius. Key caps take 5px, tightening to 3px at 860px and 2px at 600px. Slider thumbs are tall 12x24px bars with a 1px radius on a 2px track. The only round shapes are the instance-rail stops and the colour-field thumb. The device dot is a square.

## Components

### Buttons
Thin-stroked and typographic, like spec-sheet tabs.
- **Shape:** 30px tall, 2px radius, 1px ink border, 11px weight 500, 14px icon with a 7px gap.
- **Outline (default):** transparent; hover fills `raise`.
- **Solid:** ink fill, paper text; hover turns Foundry Orange.
- **Primary:** Foundry Orange fill; hover turns ink. Reserved for Connect keyboard and Save.
- **Quiet:** border drops to `line`; used for secondary selection and file actions (28px tall, 10.5px text inside tool sections).
- **Icon button:** 30px square, `line` border, ink border on hover.
- **Disabled:** 0.35 to 0.4 opacity, no hover fill.

### Chips
- **Style:** 22px tall, 10px text, `line` border, a muted count after the name.
- **State:** pressed chips invert to ink with paper text; the count softens to `line`. Used as category filters.

### Segmented switch
- Equal columns 4px apart, 32px tall, `line` borders, 15px icons. Pressed segment inverts to ink. Used for the tool switch and effect direction.

### Inputs / Fields
- **Style:** 32px tall, 1px ink stroke, 2px radius, transparent fill; the search field leads with a muted 14px icon.
- **Focus:** 2px Foundry Orange outline (offset 2px on search, 1px on hex).
- **Error:** the hex field's border turns Foundry Orange when invalid.

### Navigation: Preset index
- Search, a wrapping row of filter chips, then a list under an ink rule with sticky uppercase group labels on a `line` rule.
- **Rows:** 34px, a 56px colour strip (40px at tablet), name in weight 500, muted 10px code, a star that appears on hover. Hover fills `raise`.
- **Active row:** inverts to ink; the code turns Foundry Orange at weight 600. No side stripe.

### Status bar
- 48px, ink rule below. Wordmark, a square 8px device dot (`line` at rest, accent when connected), device meta in muted, then theme toggle and actions at the right.

### Notice band and toasts
- Notice: full-width ink band under the status bar with paper text and paper-outlined 24px buttons; hidden when empty.
- Toast: ink block, paper 11.5px text, 2px radius, rises 8px and fades in over 320ms on the expo ease-out.

### Axis slider (signature)
- Uppercase label (doubles as a reset button), a 28px tabular value, a 2px ink track with a 12x24px bar thumb, and printed min/max ends in muted 10px. The active axis turns label, value, track and thumb Foundry Orange. A disabled axis greys its value to `rule` and prints a muted note.

### Display readout (signature)
- The active axis value in Unbounded at display size; drag sideways or use arrow keys to scrub, double-click to reset. Hover turns it Foundry Orange. A muted label and hint sit beside it.

### Board and key caps (signature)
- Absolutely positioned keys from the layout data; each cap fills with its live colour, a 1px inset ring, 5px radius, legends in dark or light at 78 to 86% opacity by tone. Pressed keys sink 2px and scale to 0.97 over 90ms. Selection is a 2px ink outline. Tool-specific cursors: crosshair for paint and fill, copy for eyedropper, cell for gradient. Box selection draws a 1px ink marquee.

### Readout strip and instance rail
- Readout strip: ink rule above, line rule below, uppercase 13px facts spaced 26px apart, the file name muted and pushed right.
- Instance rail: a 1px ink line with 12px round stops and their names; the current stop fills Foundry Orange and scales 1.5x over 160ms.

### Motion
- Preset changes crossfade key colours over 280ms with an exponential ease-out; state transitions on controls run 120ms; reduced motion zeroes all transitions and animations.

## Do's and Don'ts

### Do:
- **Do** read every colour through the role variables (`--paper`, `--ink`, `--muted`, `--rule`, `--line`, `--raise`, `--accent`, `--on-accent`) so Paper and Ink both work without per-theme overrides.
- **Do** draw region boundaries with 1px ink rules and in-region dividers with 1px line rules.
- **Do** show an active or pressed state by inverting to ink with paper text.
- **Do** keep Foundry Orange for what is live or primary: the active axis, the primary action, the current stop, focus.
- **Do** set every number in JetBrains Mono with tabular figures, and print slider ends.
- **Do** keep controls at 2px radius and key caps at 5px.

### Don't:
- **Don't** use Unbounded for anything beyond the wordmark and the single display readout.
- **Don't** add elevation shadows or glows; hairline 1px rings on caps and thumbs are the only box-shadows.
- **Don't** mark the active preset row with a coloured side stripe; it is ink inversion plus an accent code.
- **Don't** put hue into the chrome; colour in the UI is data (keys, strips, swatches, the colour field).
- **Don't** use Rule Grey for readable text; it is for disabled values and resting icons.
