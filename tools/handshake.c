// Connection check: find the keyboard through the official RGB SDK, print what
// it reports, then hand the LEDs back to the active profile. Changes no colors.
#include <stdio.h>
#include "wooting-rgb-sdk.h"

static const char *layouts[] = {"ANSI", "ISO", "JIS", "ANSI_SPLIT", "ISO_SPLIT"};

int main(void) {
  if (!wooting_rgb_kbd_connected()) {
    printf("RESULT: no Wooting keyboard found\n");
    return 1;
  }

  const WOOTING_USB_META *m = wooting_rgb_device_info();
  WOOTING_DEVICE_LAYOUT l = wooting_rgb_device_layout();
  printf("devices:      %d\n", wooting_usb_device_count());
  printf("model:        %s (type %d)\n", m->model, m->device_type);
  printf("matrix:       %d rows x %d cols\n", m->max_rows, m->max_columns);
  printf("protocol:     %s\n", m->uses_multi_report ? "v3 multi-report (0xFF55)"
                               : m->v2_interface    ? "v2 (0x1337)" : "v1");
  printf("layout:       %s\n", (l >= 0 && l <= LAYOUT_MAX) ? layouts[l] : "UNKNOWN");

  bool closed = wooting_rgb_close();
  printf("reset+close:  %s\n", closed ? "ok" : "failed");
  printf("RESULT: %s\n", closed ? "OK" : "FAILED");
  return closed ? 0 : 1;
}
