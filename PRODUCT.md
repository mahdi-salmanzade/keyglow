# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite (user's choice). Static build, deployable to GitHub Pages (HTTPS is required for WebHID). Public, open-source repo `keyglow` on the owner's GitHub.

## Users

Owners of Wooting analog keyboards, starting with the Wooting 80HE: gamers and keyboard enthusiasts who want more control over per-key lighting than the stock tools give, at their desk, keyboard plugged in, editor open in a Chromium browser beside it. Also open-source contributors who will add other Wooting boards and presets.

## Product Purpose

keyglow is a browser-based, open-source per-key lighting editor for Wooting keyboards. Connect over WebHID, paint keys on a visual keyboard, pick from a large library of presets (static looks and animated effects), and see the result on the physical keyboard live. Success: a new 80HE owner opens the page, connects, and has their keyboard wearing a look they like within a minute, with no install.

## Positioning

Zero-install and fully open: it talks to the keyboard directly from the browser using the documented RGB protocol, with no vendor app, no account, and no native driver, and anyone can add presets or boards.

## Operating Context

- Runs in Chrome, Edge, Arc or Opera (WebHID). Safari and Firefox can preview but cannot connect.
- Wootility, Wootility web and the Wootility Background Service drive the same LEDs and will overwrite keyglow's colors while they run.
- Colors set this way are live overrides, not saved into the keyboard's profiles. They persist until the board is reset, a profile is switched, or it is unplugged. Animated effects only run while the tab is open.
- The keyboard renders 16-bit color (RGB565), so close shades collapse.

## Capabilities and Constraints

- v1 supports the Wooting 80HE (VID `0x31E3`, PID `0x1400`–`0x1402`, config usage page `0xFF55`), verified on real hardware. Other boards come later; the code keeps layouts pluggable.
- Per-key matrix: 6 rows × 17 columns of the 6×21 buffer; protocol in `docs/80he-protocol.md`.
- The 80HE light bar is not addressable through this protocol; out of scope for v1.
- Must work without a keyboard attached (preview mode) so anyone can browse presets and contributors can develop.
- Undecided: whether to offer writing to keyboard profiles (requires undocumented Wootility protocol).

## Brand Commitments

- Name: keyglow. Not affiliated with Wooting; the name and copy must not read as an official Wooting product. "for Wooting keyboards" is the descriptive phrasing.

## Evidence on Hand

- Real hardware verification on a Wooting 80HE (ANSI): handshake, full-frame color write, reset. Tools in `tools/`.
- No users, testimonials, or download numbers exist; do not invent any.

## Product Principles

1. The physical keyboard is the real canvas; the screen is its mirror, never the other way round.
2. Presets first: a great look should be one click away, editing is the second step.
3. Never leave the keyboard in a broken state: always offer a one-click return to the profile's lighting.
4. Open by construction: presets and layouts are plain data files anyone can contribute.

## Accessibility & Inclusion

Full keyboard operation of the editor itself, and color choices that never rely on hue alone to convey state in the UI chrome.
