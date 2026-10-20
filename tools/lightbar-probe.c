// Light bar probe for the Wooting 80HE: does the light bar answer to any of the 38 matrix
// cells the keys don't use? Lights candidate cells step by step (keys dark) while you watch
// the bar, then restores profile lighting. Uses only the documented colour frame.
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include "hidapi.h"

#define WOOTING_VID 0x31E3
#define CFG_V3_USAGE_PAGE 0xFF55
#define ROWS 6
#define COLS 21
#define STEP_SECONDS 6

// Matrix cells the 80HE's keys use (row-major, 1 = key LED), from src/layout/wooting-80he.ts.
static const char *KEY_CELLS[ROWS] = {
  "111111111011111110000",
  "111111111111101110000",
  "111111111111101110000",
  "111111111111001000000",
  "101111111111001100000",
  "111011111011101110000",
};

static uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
  return (r & 0xF8) << 8 | (g & 0xFC) << 3 | (b >> 3);
}

static int command(hid_device *d, uint8_t cmd) {
  uint8_t feat[8] = {1, 0xD1, 0xDA, cmd, 0, 0, 0, 0};
  uint8_t rsp[64];
  if (hid_send_feature_report(d, feat, sizeof feat) != sizeof feat) return -1;
  return hid_read_timeout(d, rsp, sizeof rsp, 500);
}

typedef int (*cell_filter)(int row, int col);
static int is_key(int r, int c) { return KEY_CELLS[r][c] == '1'; }
static int is_spare(int r, int c) { return !is_key(r, c); }
static int is_spare_outer(int r, int c) { return is_spare(r, c) && c >= 17; }
static int is_spare_inner(int r, int c) { return is_spare(r, c) && c < 17; }

static int frame(hid_device *d, cell_filter lit, uint8_t r, uint8_t g, uint8_t b) {
  uint8_t buf[511] = {4, 0xD1, 0xDA, 11};
  uint16_t v = rgb565(r, g, b);
  int count = 0;
  for (int row = 0; row < ROWS; row++)
    for (int col = 0; col < COLS; col++)
      if (lit(row, col)) {
        int i = 4 + (row * COLS + col) * 2;
        buf[i] = v & 0xFF;
        buf[i + 1] = v >> 8;
        count++;
      }
  return hid_write(d, buf, sizeof buf) == (int)sizeof buf ? count : -1;
}

static void step(hid_device *d, int n, const char *what, cell_filter lit, uint8_t r, uint8_t g, uint8_t b) {
  int cells = frame(d, lit, r, g, b);
  printf("STEP %d  %-48s (%d cells)  watch the light bar...\n", n, what, cells);
  fflush(stdout);
  sleep(STEP_SECONDS);
}

int main(void) {
  hid_init();
  struct hid_device_info *list = hid_enumerate(WOOTING_VID, 0), *it;
  char path[512] = {0};
  for (it = list; it; it = it->next)
    if (it->usage_page == CFG_V3_USAGE_PAGE) { strncpy(path, it->path, sizeof path - 1); break; }
  hid_free_enumeration(list);
  hid_device *d = path[0] ? hid_open_path(path) : NULL;
  if (!d) { printf("No Wooting 0xFF55 interface found.\n"); return 1; }

  command(d, 33); // COLOR_INIT
  printf("Each step lasts %d s. Keys go dark from step 2 on, so the bar is easy to see.\n\n", STEP_SECONDS);
  step(d, 1, "control: every KEY green (proves frames land)", is_key, 0, 255, 0);
  step(d, 2, "all 38 spare cells WHITE, keys off", is_spare, 255, 255, 255);
  step(d, 3, "spare cells in columns 17-20 RED, keys off", is_spare_outer, 255, 0, 0);
  step(d, 4, "spare cells inside columns 0-16 BLUE, keys off", is_spare_inner, 0, 0, 255);
  command(d, 32); // RESET_ALL: back to profile lighting
  hid_close(d);
  hid_exit();
  printf("\nDone, profile lighting restored. Which steps changed the light bar, and to what colour?\n");
  return 0;
}
