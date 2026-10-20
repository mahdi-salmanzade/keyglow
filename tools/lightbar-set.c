// Sets the Wooting 80HE light bar through the Light Indicator profile write (command 0x20),
// the same message Wootility sends when you edit Light Indicator effects:
//   output report: D1 DA 20 <profile> <len lo> <len hi> <LightbarProfile protobuf>
//   LightbarProfile { 1 isEnabled, 2 repeated Layer, 3 inheritGlobal, 4 brightness }
//   Layer.solid (6) { 1 rgb565, 2 range } / Layer.perLed (7) { 1 rgb bytes, 2 range }
//
// usage: lightbar-set solid RRGGBB [brightness]   one colour on all 10 LEDs
//        lightbar-set rainbow [brightness]        a different colour on each LED
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hidapi.h"

#define WOOTING_VID 0x31E3
#define CFG_V3_USAGE_PAGE 0xFF55
#define LEDS 10

typedef struct { uint8_t b[256]; int n; } buf_t;
static void put(buf_t *o, uint8_t v) { o->b[o->n++] = v; }
static void varint(buf_t *o, uint32_t v) { while (v >= 0x80) { put(o, (v & 0x7F) | 0x80); v >>= 7; } put(o, v); }
static void bytes(buf_t *o, int field, const buf_t *m) { put(o, field << 3 | 2); varint(o, m->n); memcpy(o->b + o->n, m->b, m->n); o->n += m->n; }

static void range(buf_t *layer) { // { start: 0, end: 9 }, written explicitly like Wootility does
  buf_t r = {.n = 0};
  put(&r, 0x08); varint(&r, 0); put(&r, 0x10); varint(&r, LEDS - 1);
  bytes(layer, 2, &r);
}

static int command(hid_device *d, uint8_t cmd, uint8_t *reply, int size) {
  uint8_t feat[8] = {1, 0xD1, 0xDA, cmd, 0, 0, 0, 0};
  if (hid_send_feature_report(d, feat, 8) != 8) return -1;
  return hid_read_timeout(d, reply, size, 500);
}

int main(int argc, char **argv) {
  if (argc < 2 || (strcmp(argv[1], "solid") && strcmp(argv[1], "rainbow")) || (!strcmp(argv[1], "solid") && argc < 3)) {
    printf("usage: %s solid RRGGBB [brightness] | rainbow [brightness]\n", argv[0]);
    return 2;
  }
  int solid = !strcmp(argv[1], "solid");
  const char *bri_arg = solid ? (argc > 3 ? argv[3] : NULL) : (argc > 2 ? argv[2] : NULL);
  int brightness = bri_arg ? atoi(bri_arg) : 255;

  buf_t layer = {.n = 0}, wrapper = {.n = 0}, msg = {.n = 0};
  if (solid) {
    unsigned rgb = (unsigned)strtoul(argv[2], NULL, 16);
    uint8_t r = rgb >> 16, g = rgb >> 8, b = rgb;
    put(&layer, 0x08); varint(&layer, (r & 0xF8) << 8 | (g & 0xFC) << 3 | b >> 3);
    range(&layer);
    bytes(&wrapper, 6, &layer);
  } else {
    static const uint8_t RAINBOW[LEDS][3] = {
      {255, 0, 0}, {255, 96, 0}, {255, 200, 0}, {160, 255, 0}, {0, 255, 60},
      {0, 255, 200}, {0, 140, 255}, {40, 0, 255}, {170, 0, 255}, {255, 0, 160}};
    buf_t colours = {.n = 0};
    for (int i = 0; i < LEDS; i++) for (int c = 0; c < 3; c++) put(&colours, RAINBOW[i][c]);
    bytes(&layer, 1, &colours);
    range(&layer);
    bytes(&wrapper, 7, &layer);
  }
  put(&msg, 0x08); varint(&msg, 1);            // isEnabled
  bytes(&msg, 2, &wrapper);                    // layers[0]
  put(&msg, 0x18); varint(&msg, 1);            // inheritGlobal (keeps the profile-switch indicator)
  put(&msg, 0x20); varint(&msg, brightness);   // brightness 0-255

  hid_init();
  struct hid_device_info *list = hid_enumerate(WOOTING_VID, 0), *it;
  char path[512] = {0};
  for (it = list; it; it = it->next)
    if (it->usage_page == CFG_V3_USAGE_PAGE) { strncpy(path, it->path, sizeof path - 1); break; }
  hid_free_enumeration(list);
  hid_device *d = path[0] ? hid_open_path(path) : NULL;
  if (!d) { printf("No Wooting 0xFF55 interface found.\n"); return 1; }

  uint8_t reply[64];
  int n = command(d, 0x0B, reply, sizeof reply); // active profile slot is the first payload byte
  if (n < 8) { printf("Could not read the active profile.\n"); return 1; }
  uint8_t profile = reply[7];

  // Smallest output report that fits: 1 = 32, 2 = 62, 3 = 254 bytes of data.
  int total = 6 + msg.n;
  int report = total <= 32 ? 1 : total <= 62 ? 2 : 3;
  int size = report == 1 ? 32 : report == 2 ? 62 : 254;
  uint8_t out[255] = {report, 0xD1, 0xDA, 0x20, profile, msg.n & 0xFF, msg.n >> 8};
  memcpy(out + 7, msg.b, msg.n);
  int written = hid_write(d, out, size + 1);

  printf("profile slot %d · %s · brightness %d · report %d · wrote %d of %d bytes\n",
         profile, solid ? argv[2] : "rainbow", brightness, report, written, size + 1);
  hid_close(d);
  hid_exit();
  return written == size + 1 ? 0 : 1;
}
