// Color path check, bypassing the SDK: the same bytes a WebHID page would send.
// Tints every key for 2 s using output report 4, then restores profile colors.
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "hidapi.h"

#define WOOTING_VID 0x31E3
#define CFG_V3_USAGE_PAGE 0xFF55

#define COLOR_INIT 33
#define RESET_ALL 32
#define RAW_COLORS_REPORT 11

static uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
  return (r & 0xF8) << 8 | (g & 0xFC) << 3 | (b >> 3);
}

// 8-byte feature report 1: [id, magic, magic, cmd, p3, p2, p1, p0]; the reply
// arrives as input report 1.
static int command(hid_device *d, uint8_t cmd) {
  uint8_t feat[8] = {1, 0xD1, 0xDA, cmd, 0, 0, 0, 0};
  uint8_t rsp[64];
  if (hid_send_feature_report(d, feat, sizeof feat) != sizeof feat) return -1;
  return hid_read_timeout(d, rsp, sizeof rsp, 500);
}

int main(int argc, char **argv) {
  uint8_t r = 255, g = 0, b = 160;
  if (argc == 4) { r = atoi(argv[1]); g = atoi(argv[2]); b = atoi(argv[3]); }

  hid_init();
  struct hid_device_info *list = hid_enumerate(WOOTING_VID, 0), *it;
  char path[512] = {0};
  for (it = list; it; it = it->next)
    if (it->usage_page == CFG_V3_USAGE_PAGE) { strncpy(path, it->path, sizeof path - 1); break; }
  hid_free_enumeration(list);

  hid_device *d = path[0] ? hid_open_path(path) : NULL;
  if (!d) { printf("RESULT: no 0xFF55 interface found\n"); return 1; }

  printf("init reply:   %d bytes\n", command(d, COLOR_INIT));

  // Output report 4 = 510-byte payload: magic, cmd, then 6x21 RGB565 little-endian.
  uint8_t frame[511] = {4, 0xD1, 0xDA, RAW_COLORS_REPORT};
  for (int i = 0; i < 6 * 21; i++) {
    uint16_t c = rgb565(r, g, b);
    frame[4 + i * 2] = c & 0xFF;
    frame[5 + i * 2] = c >> 8;
  }
  int written = hid_write(d, frame, sizeof frame);
  printf("frame write:  %d of %zu bytes (rgb %d,%d,%d)\n", written, sizeof frame, r, g, b);
  sleep(2);

  printf("reset reply:  %d bytes\n", command(d, RESET_ALL));
  hid_close(d);
  hid_exit();
  printf("RESULT: %s\n", written == (int)sizeof frame ? "OK" : "FAILED");
  return written == (int)sizeof frame ? 0 : 1;
}
