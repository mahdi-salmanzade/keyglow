# keyglow

An open-source, browser-based per-key lighting editor for Wooting keyboards. Pick from 177 presets
(gradients, editor themes, keycap-style colourways, game layouts, flags, animated and reactive effects),
paint keys yourself, and watch the result on your keyboard live. No install, no account, no vendor app:
it talks to the keyboard straight from the browser over WebHID.

> keyglow is a community project and is not affiliated with or endorsed by Wooting.

**Supported today:** Wooting 80HE (ANSI), verified on real hardware. Other boards are welcome as contributions.

## Use it

1. Open keyglow in Chrome, Edge, Arc or Opera (WebHID is Chromium-only; other browsers can still preview presets).
2. Quit Wootility, Wootility web and the Wootility background service: they drive the same LEDs and will overwrite keyglow.
3. Click **Connect keyboard** and choose your Wooting in the browser's chooser.

While keyglow is open, colours are live overrides. They stay until you click **Restore profile lighting**, switch
profiles on the keyboard, or unplug it. Animated presets keep running while the keyglow tab is open, even in the
background; reactive presets respond to typing while the tab is focused.

**Save to keyboard** stores the current look, and the light bar setting, in the keyboard's active profile, the same way
Wootility's Save to Keyboard does. The keyboard then shows it on its own: after unplugging, on any computer, with no app
running. Animated looks are stored as a still frame. The first save on a profile keeps a copy of the lighting it had, and
**Put back original** restores it.

| Shortcut | Action |
| --- | --- |
| `P` `F` `G` `I` `S` | Paint, Fill, Gradient, Eyedropper, Select |
| `X` | Swap primary and secondary colour |
| `/` | Search presets |
| `Esc` | Clear selection |
| `⌘/Ctrl Z`, `⇧⌘/Ctrl Z` | Undo / redo paint |
| `⌘/Ctrl A` | Select every key |

Looks can be saved in the browser, shared as a link, or exported and imported as `.keyglow.json` files.

## Develop

```sh
npm install
npm run dev      # http://localhost:5173 (WebHID works on localhost)
npm run build    # type-check + production build into dist/
npm run lint
```

| Path | What lives there |
| --- | --- |
| `src/hid/` | WebHID driver and the Wooting V3 RGB protocol |
| `src/layout/` | Keyboard layouts: every LED's matrix cell and physical position |
| `src/presets/` | All presets, as plain data plus small render functions |
| `src/engine/` | Colour maths, the render loop, the background ticker |
| `src/components/` | The editor UI |
| `docs/` | Protocol notes captured from a real 80HE, and the upstream sources they come from |
| `tools/` | Native C tools that talk to the keyboard without a browser: handshake, colour and light bar checks, profile backup and restore |

### Add a preset

Presets live in `src/presets/`. Most are one line, for example a gradient:

```ts
gradient('my-preset', 'My Preset', ['#FF3D6E', '#FFD23D', '#7B5CFF'], 'right'),
```

Animated presets get `render(ctx, out)`, called every frame with the scaled time `ctx.t`, every LED's position, and the
user's primary and secondary colours. Keep effects below roughly 3 Hz: no strobes.

### Add a keyboard

Add a layout in `src/layout/` (matrix row/column and physical position per LED), its product IDs in `src/hid/protocol.ts`,
and check the mapping on real hardware with `tools/` before opening a pull request.

## Credits

- The RGB protocol follows Wooting's [wooting-rgb-sdk](https://github.com/WootingKb/wooting-rgb-sdk) (MPL-2.0).
- The 80HE matrix map was cross-checked against [OpenRGB](https://gitlab.com/CalcProgrammer1/OpenRGB).
- Editor theme presets use the published palettes of their respective open-source themes.

## License

MIT. See [LICENSE](LICENSE).
