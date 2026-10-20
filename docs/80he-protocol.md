# Wooting 80HE RGB protocol notes

Captured from the actual keyboard on 2026-10-21 (macOS, arm64) and cross-checked against
the official SDK and OpenRGB. Items marked **verified** were run against the device.

## Device

| | |
| --- | --- |
| Model | Wooting 80HE, ANSI (**verified** via device-config reply) |
| VID / PID | `0x31E3` / `0x1402` (`0x1400` XInput, `0x1401` DInput, `0x1402` no gamepad) |
| Protocol | V3 "multi-report", config usage page `0xFF55` (**verified**) |
| RGB matrix | 6 rows × 17 columns used, inside the SDK's 6×21 buffer |

HID interfaces:

| Usage page / usage | In / Out / Feature (bytes) | Purpose |
| --- | --- | --- |
| `0x0001` / 6 | 28 / 1 / 0 | Keyboard (OS-owned; blocked from WebHID) |
| `0x0001` / 128 | 7 / 1 / 1 | System control |
| `0xFF00` / 1 | 8 / 0 / 0 | Vendor |
| `0xFF53` / 1 | 64 / 0 / 0 | Vendor (analog/telemetry stream) |
| **`0xFF55` / 1** | 2047 / 2047 / 8 | **Config + RGB**: the one to open |

## `0xFF55` report descriptor

```
0655ff0901a1018501090c150026ff0075089620008102090e910209109507b10285020916963e00
8102091891028503092096fe008102092291028504092a96fe018102092c91028505093496fe0381
02093691028506093e96fe07810209409102c0
```

| Report ID | Input / Output payload | Feature |
| --- | --- | --- |
| 1 | 32 / 32 | 7 (+1 ID = the 8-byte command) |
| 2 | 62 / 62 | |
| 3 | 254 / 254 | |
| **4** | **510 / 510** | |
| 5 | 1022 / 1022 | |
| 6 | 2046 / 2046 | |

A full color frame is 3 header bytes + 6×21×2 = **255 bytes**, so report 4 is the smallest
that fits. The SDK sends report 5 with a 2047-byte buffer (its comment calls report 4 "254
bytes", off by one against this descriptor). Both are accepted on macOS (**verified**), but
report 4 at exactly its declared 510 bytes is the clean choice, and the one a WebHID port should send.

## Commands (feature report 1)

```
[0x01, 0xD1, 0xDA, cmd, p3, p2, p1, p0]      8 bytes with hidapi
sendFeatureReport(1, [0xD1, 0xDA, cmd, p3, p2, p1, p0])   WebHID
```

Every command is answered on **input report 1** (32-byte payload; hidapi returns 33 with the
ID at `[0]`). Read or drain it before the next command.

| cmd | Name | Params |
| --- | --- | --- |
| 33 | COLOR_INIT | none. Send once after opening |
| 19 | DEVICE_CONFIG | none. Reply byte `[10]` (hidapi) / `data[9]` (WebHID) = layout: 0 ANSI, 1 ISO, 2 JIS, 3 ANSI split, 4 ISO split |
| 30 | SINGLE_COLOR | p0 = `(row << 5) \| col`, p1 = R, p2 = G, p3 = B, i.e. bytes `[.., B, G, R, id]` |
| 31 | SINGLE_RESET | p3 = `(row << 5) \| col`, i.e. byte after cmd |
| 32 | RESET_ALL | none. Returns LEDs to the active profile. **Send on exit** |

Verified reply to cmd 19: `01 d1 da 13 88 07 00 00 00 00 00 11 00 0c 00 …` (`[3]` echoes the command).

## Full frame (output report 4)

```
data (510 bytes): 0xD1 0xDA 0x0B, then 126 × uint16 RGB565 little-endian, index = row*21 + col, zero-padded
RGB565 = (r & 0xF8) << 8 | (g & 0xFC) << 3 | b >> 3
```

The keyboard only has 5/6/5-bit color depth: pick colors in 24-bit, but nearby shades collapse.
**Verified**: `tools/bin/colortest` writes 511/511 bytes and the reset is acknowledged.

## 80HE key matrix (row, col → key)

Cells from OpenRGB's `matrix_map_80HE`; `·` means no LED. Legends follow the physical board, which has
PgUp/PgDn and a right Ctrl where OpenRGB lists Home/End and right Win.

| r\c | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Esc | F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | · | F9 | F10 | F11 | F12 | Mode | PrtSc | Pause |
| 1 | ` | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 | - | = | JIS | Bksp | Ins | PgUp |
| 2 | Tab | Q | W | E | R | T | Y | U | I | O | P | [ | ] | · | \ | Del | PgDn |
| 3 | Caps | A | S | D | F | G | H | J | K | L | ; | ' | ISO # | · | Enter | · | · |
| 4 | LShift | ISO \ | Z | X | C | V | B | N | M | , | . | / | · | JIS | RShift | ↑ | · |
| 5 | LCtrl | LWin | LAlt | JIS | Space LED 1 | Space LED 2 | Space | Space LED 3 | Space LED 4 | JIS | RAlt | RCtrl | Fn | · | ← | ↓ | → |

Note that the OpenRGB index table marks `(3,15)`, `(3,16)` and `(4,16)` as unused, while
the SDK's 17-column buffer still sends them. Harmless, but the visual editor should hide them.

## Gotchas

- **Close Wootility, Wootility web and the Wootility Background Service** while testing. They
  write the same LEDs and will overwrite your colors.
- Colors persist until RESET_ALL, a profile switch, or a replug. Always reset on exit/unload.
- macOS needed no Input Monitoring permission for `0xFF55` (**verified**).
- WebHID: `navigator.hid.requestDevice({ filters: [{ vendorId: 0x31E3, usagePage: 0xFF55 }] })`
  needs a user click; `event.data` / `sendReport` data **exclude** the report-ID byte.
- The light bar (10 LEDs, right of Enter) is not in the RGB matrix. **Verified** with `tools/lightbar-probe`:
  lighting all 38 cells no key uses (including 3,15 and 3,16 directly beneath the bar) left it unchanged
  while the keys responded. Firmware 2.10.1 keeps the bar on its own Wootility effect while an SDK app runs;
  Wooting has promised SDK control "in the future" (not shipped as of Wootility 5.4.2, Sep 2026).
- The undocumented Light Indicator push (output report 1, command `0x1F`, see `reference/80he-lightbar/`)
  is accepted by the 80HE but never acknowledged, and only renders when a Light Indicator effect is set up
  in Wootility. Untested end to end here (no Wootility desktop or background service on the test Mac).
