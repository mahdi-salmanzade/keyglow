#!/usr/bin/env bash
# Download every upstream file this project builds on, pinned to exact commits,
# into ./reference (gitignored). Re-run any time; bump the SHAs to update.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="$ROOT/reference"

SDK_SHA=451f40dc056e0edefccdaba7807a72b694520e92      # WootingKb/wooting-rgb-sdk (MPL-2.0)
HIDAPI_SHA=852cc68b8e0e4c7eba0815ef992951cd8b75c55b   # libusb/hidapi (BSD / GPL-3 / original, pick one)
OPENRGB_SHA=72262b8386df7d2a4742d27990bc3a6c0274d0b2  # CalcProgrammer1/OpenRGB (GPL-2.0-or-later)
LIGHTBAR_SHA=7c611b865fd7024419439c334d45c92c1c2d41ee # funnyferrell/Wooting-80HE-Lightbar-Undocumented-USB-Control (no license)

fetch() { # fetch <base-url> <dest-dir> <path>...
  local base="$1" dest="$2"; shift 2
  for p in "$@"; do
    mkdir -p "$dest/$(dirname "$p")"
    curl -fsSL "$base/$p" -o "$dest/$p"
    echo "  $p"
  done
}

echo "wooting-rgb-sdk @ ${SDK_SHA:0:7}"
fetch "https://raw.githubusercontent.com/WootingKb/wooting-rgb-sdk/$SDK_SHA" "$REF/wooting-rgb-sdk" \
  src/wooting-usb.c src/wooting-usb.h src/wooting-rgb-sdk.c src/wooting-rgb-sdk.h \
  mac/Makefile resources/keyboard-matrix-rows-columns.png README.md LICENSE

echo "hidapi @ ${HIDAPI_SHA:0:7}"
fetch "https://raw.githubusercontent.com/libusb/hidapi/$HIDAPI_SHA" "$REF/hidapi" \
  hidapi/hidapi.h mac/hid.c mac/hidapi_darwin.h LICENSE.txt LICENSE-bsd.txt

echo "OpenRGB Wooting controller @ ${OPENRGB_SHA:0:7}"
fetch "https://gitlab.com/CalcProgrammer1/OpenRGB/-/raw/$OPENRGB_SHA/Controllers/WootingKeyboardController" "$REF/openrgb-wooting" \
  RGBController_WootingKeyboard.cpp WootingKeyboardControllerDetect.cpp \
  WootingKeyboardController.cpp WootingKeyboardController.h \
  WootingV3KeyboardController/WootingV3KeyboardController.cpp \
  WootingV3KeyboardController/WootingV3KeyboardController.h

echo "80HE lightbar notes @ ${LIGHTBAR_SHA:0:7}"
fetch "https://raw.githubusercontent.com/funnyferrell/Wooting-80HE-Lightbar-Undocumented-USB-Control/$LIGHTBAR_SHA" "$REF/80he-lightbar" \
  WOOTING_LIGHTBAR.md wooting_lightbar.py

echo "done -> $REF"
