---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

## Scope
Surface: the keyglow editor (single-page app, `src/App.tsx`). Mode: Operate.
Audience: Wooting 80HE owners at their desk, keyboard plugged in. Task: pick a look from a large preset library or paint keys, see it live on the board, leave it lit. Constraints: WebHID in Chromium only; preview mode must work without a keyboard; colours are live overrides, not saved to profiles.

## Direction contract
THESIS: The 80HE is shown like a live type specimen: the keyboard is the giant glyph, and axis sliders remap every key in real time with a monospace readout. Refuses the category default of a charcoal vendor app with a nav rail, a render and an effect list under a neon accent.
OWN-WORLD: Paper #F4F3EF ground, ink #111 one-pixel rules, grey #8A8984 secondary, line #D9D8D2, one foundry accent #FF3D00 reserved for the active axis and the primary action. JetBrains Mono for UI, labels, data and preset codes; Unbounded only for the wordmark and the single display readout. Flat surfaces, no shadows, 2px control radii, 5px key radii, selection as an ink outline. An Ink theme inverts paper and ink for dim rooms.
STORY: The visitor sees their 80HE already wearing a look, understands they can pick from 177 presets or drag an axis and watch every key change on screen and on the board, connects once, and leaves the keyboard lit.
FIRST VIEWPORT: 44px status bar (wordmark, device state with a square dot, live rate, Restore profile lighting, Connect keyboard as the primary action). Left 280px preset index: search, category tabs, dense coded rows with colour strips, active row inverted to ink with an accent tick. Centre: the active axis value in Unbounded at display size beside the instance name, then the 80HE at specimen scale across the centre column, a readout strip, four axis sliders with large values (Hue shift, Speed, Brightness, Spread), and a named-instance stop rail. Right 264px tools: tool switch, colour field with hue strip and hex input, secondary colour, direction, selection actions, recent colours.
FORM: Live Specimen, the user-chosen challenger card (catalog variable-font-specimen), fused with the product; not on my grounded list. seed:bdf116e5aea5ecce
SIGNATURE: Dragging any axis remaps every key on screen and on the physical board live while the display readout swaps to that axis. Motion grammar: preset changes crossfade key colours over about 280ms with exponential ease-out; reduced motion snaps.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
