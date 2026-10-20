// Sweeps a 0-100 level into the 80HE light bar's Light Indicator slot 0, using the
// undocumented data-source command (0x1F) that Wooting's background service sends.
// The bar only reacts if a Light Indicator effect is set up for it in Wootility.
// Command layout from github.com/funnyferrell/Wooting-80HE-Lightbar-Undocumented-USB-Control.
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "hidapi.h"

#define WOOTING_VID 0x31E3
#define CFG_V3_USAGE_PAGE 0xFF55
#define SWEEP_SECONDS 4
#define STEPS_PER_SECOND 30

static int send_level(hid_device *d, uint8_t slot, float value) {
  uint8_t buf[33] = {1, 0xD1, 0xDA, 0x1F, 0x09, 0x00, 0x0A, 0x07, 0x08, slot, 0x15};
  memcpy(&buf[11], &value, sizeof value); // little-endian f32 on Apple Silicon and x86
  return hid_write(d, buf, sizeof buf);
}

int main(int argc, char **argv) {
  uint8_t slot = argc > 1 ? (uint8_t)atoi(argv[1]) : 0;
  hid_init();
  struct hid_device_info *list = hid_enumerate(WOOTING_VID, 0), *it;
  char path[512] = {0};
  for (it = list; it; it = it->next)
    if (it->usage_page == CFG_V3_USAGE_PAGE) { strncpy(path, it->path, sizeof path - 1); break; }
  hid_free_enumeration(list);
  hid_device *d = path[0] ? hid_open_path(path) : NULL;
  if (!d) { printf("No Wooting 0xFF55 interface found.\n"); return 1; }

  int total = SWEEP_SECONDS * STEPS_PER_SECOND, failed = 0;
  printf("Sweeping Light Indicator slot %d: 0 -> 100 -> 0 over %d s. Watch the light bar.\n", slot, SWEEP_SECONDS * 2);
  for (int pass = 0; pass < 2; pass++)
    for (int i = 0; i <= total; i++) {
      float v = 100.0f * i / total;
      if (send_level(d, slot, pass ? 100.0f - v : v) != 33) failed++;
      usleep(1000000 / STEPS_PER_SECOND);
    }
  hid_close(d);
  hid_exit();
  printf("Done (%d writes failed). Did the bar fill up and drain back?\n", failed);
  return failed ? 1 : 0;
}
