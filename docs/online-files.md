# Online files for an open-source 80HE color editor

Every upstream file this project needs, where it lives, what it gives you, and what you
would port or change. `scripts/fetch-references.sh` downloads all of the fetchable ones,
pinned to the commits below, into `reference/` (gitignored, so third-party code never
lands in this repo's history).

## 1. Protocol: the official Wooting RGB SDK (must have)

Repo: https://github.com/WootingKb/wooting-rgb-sdk @ `451f40d` (2026-09-28), **MPL-2.0**.
Latest release v1.8.0 (2025-12-09) ships a macOS binary for **x64 only**, so on Apple
Silicon you build from source (`tools/Makefile` does this).

| File | What it gives you | What you change / port |
| --- | --- | --- |
| [`src/wooting-usb.c`](https://github.com/WootingKb/wooting-rgb-sdk/blob/451f40dc056e0edefccdaba7807a72b694520e92/src/wooting-usb.c) | Device discovery (VID `0x31E3`, PID `0x1400`, usage page `0xFF55`), feature-command framing, full-frame color write (`wooting_usb_send_buffer_v3`), reply reading | **Port to JS** for a web app: `send_feature_buff`, `send_buffer_v3`, and the usage-page check in `walk_hid_devices`. Use report **4** (510 B) rather than the SDK's report 5 (see protocol notes) |
| [`src/wooting-usb.h`](https://github.com/WootingKb/wooting-rgb-sdk/blob/451f40dc056e0edefccdaba7807a72b694520e92/src/wooting-usb.h) | Command IDs (11 raw colors, 19 device config, 30 set key, 31 reset key, 32 reset all, 33 color init), device types, layout enum, matrix size 6×21 | Copy the constants |
| [`src/wooting-rgb-sdk.c`](https://github.com/WootingKb/wooting-rgb-sdk/blob/451f40dc056e0edefccdaba7807a72b694520e92/src/wooting-rgb-sdk.c) | RGB565 encoding (`encodeColor`), per-key direct set/reset, frame buffer, `wooting_rgb_close` (hand the LEDs back to the profile) | **Port** `encodeColor`, `direct_set_key`, `direct_reset_key`, `array_update_keyboard` |
| [`src/wooting-rgb-sdk.h`](https://github.com/WootingKb/wooting-rgb-sdk/blob/451f40dc056e0edefccdaba7807a72b694520e92/src/wooting-rgb-sdk.h) | Public C API | Only needed if you link the native SDK (FFI from Python/Rust/Node/Tauri) |
| [`resources/keyboard-matrix-rows-columns.png`](https://github.com/WootingKb/wooting-rgb-sdk/blob/451f40dc056e0edefccdaba7807a72b694520e92/resources/keyboard-matrix-rows-columns.png) | Row/column picture for the One/Two | Reference only: **the 80HE's map is different** (section 2) |
| [`mac/Makefile`](https://github.com/WootingKb/wooting-rgb-sdk/blob/451f40dc056e0edefccdaba7807a72b694520e92/mac/Makefile) | Official macOS build (needs `brew install hidapi pkg-config`) | Not needed: `tools/Makefile` compiles hidapi from source |

## 2. Key layout for the visual keyboard

| File | What it gives you | Use |
| --- | --- | --- |
| [OpenRGB `RGBController_WootingKeyboard.cpp`](https://gitlab.com/CalcProgrammer1/OpenRGB/-/blob/72262b8386df7d2a4742d27990bc3a6c0274d0b2/Controllers/WootingKeyboardController/RGBController_WootingKeyboard.cpp) | `matrix_map_80HE[6][17]` + `led_names_80HE`, the **only public 80HE key map** (also spacebar LEDs 1–4) | Transcribed as facts into `docs/80he-protocol.md`. **GPL-2.0+**, so don't copy code into a non-GPL project |
| [OpenRGB `WootingV3KeyboardController.cpp`](https://gitlab.com/CalcProgrammer1/OpenRGB/-/blob/72262b8386df7d2a4742d27990bc3a6c0274d0b2/Controllers/WootingKeyboardController/WootingV3KeyboardController/WootingV3KeyboardController.cpp) | A second, independent V3 implementation (uses report 4) | Cross-check against the SDK |
| [OpenRGB `WootingKeyboardControllerDetect.cpp`](https://gitlab.com/CalcProgrammer1/OpenRGB/-/blob/72262b8386df7d2a4742d27990bc3a6c0274d0b2/Controllers/WootingKeyboardController/WootingKeyboardControllerDetect.cpp) | PID variants: `…0` XInput, `…1` DInput, `…2` no gamepad (yours: `0x1402`) | Device filter |
| [wooting-design `wooting-80he/*.stp`](https://github.com/WootingKb/wooting-design/tree/main/wooting-80he) | Official 3D assemblies (ANSI/ISO/JIS, ~21 MB each) | Optional: exact key geometry for a faithful render. Not fetched by the script |

## 3. Native USB transport (only if you don't go browser-only)

Repo: https://github.com/libusb/hidapi @ `852cc68`, BSD / GPL-3 / original HIDAPI license (your pick).
Files: `hidapi/hidapi.h`, `mac/hid.c`, `mac/hidapi_darwin.h`. Used by `tools/` and by the SDK.
For Node use [`node-hid`](https://github.com/node-hid/node-hid); for Python use the `hidapi` pip package; for Rust use the `hidapi` crate.

## 4. Extras

| Source | Notes |
| --- | --- |
| [80HE lightbar protocol](https://github.com/funnyferrell/Wooting-80HE-Lightbar-Undocumented-USB-Control) (`WOOTING_LIGHTBAR.md`, `wooting_lightbar.py`) @ `7c611b8` | The 10-LED light bar is **not** addressable through the SDK. This repo shows command `0x1F` on the same `0xFF55` interface, but it only pushes a 0–100 value into a Wootility "Light Indicator" slot. **No license**: read it, then reimplement from the facts |
| [Wootility web browser support](https://help.wooting.io/article/92-wootility-doesnt-detect-my-wooting-keyboard) | Wooting's own web app uses WebHID, which proves a browser can reach `0xFF55`. Chromium only (Chrome, Edge, Arc, Opera), no Safari or Firefox |
| [awesome-wooting](https://github.com/WootingKb/awesome-wooting) | Where `dev.wooting.io` now redirects. Lists wrappers: [Python](https://github.com/xiamaz/python-wooting-rgb), [Rust](https://github.com/ShayBox/Wooting-RGB), [.NET](https://github.com/simon-wh/Wooting.NET), and [OpenRGB](https://gitlab.com/CalcProgrammer1/OpenRGB) / [Artemis](https://artemis-rgb.com/) as full apps |

## Checked and not useful

- `WootingKb/wooting-rgb-example`: Node examples bound to a Windows-only `.dll`.
- `larsgk/webhid-wootspace`, `colecrouter/wooting-js`: WebHID, but **analog input only** (usage page `0xFF54`), not RGB.
- There is no existing open-source WebHID RGB editor for Wooting, so this project would be the first.

## Recommended shape for the project

Browser-only WebHID app: no install, no native code, and the same transport Wootility web uses.
New files you'd write (nothing upstream needs modifying):

```
web/index.html        page + visual keyboard
web/wooting-hid.js    ~120 lines ported from wooting-usb.c + encodeColor (report 4 frame, feature commands)
web/layout-80he.js    6×17 matrix → key labels/positions (from docs/80he-protocol.md)
web/app.js            color picker, paint/fill/gradient tools, presets, live send
```

The native alternative is Tauri or Electron plus hidapi/node-hid. That works offline in any
browser, but you lose zero-install.
