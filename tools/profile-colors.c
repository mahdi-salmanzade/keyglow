// Reads and writes the Wooting 80HE's stored key colours, the profile data behind "Static" lighting.
// Decoded from Wootility 5.4.2's own traffic on a real 80HE; see docs/80he-protocol.md.
//
//   read  (feature report 1):  D1 DA 23 <profile>  rows 0-2      D1 DA 24 <profile>  rows 3-5
//                              D1 DA 32 <profile>  RGB effect stack
//   write (output report):     D1 DA 0E 00 <len lo> <len hi> <rows 0-2>   (active profile)
//                              D1 DA 0F 00 <len lo> <len hi> <rows 3-5>
//                              D1 DA 16 00 <len lo> <len hi> <effect stack>
//   rows: repeated { 1 row { 1 packed uint32 rgb565 x 21 } }
//
// usage: profile-colors live                 print what the LEDs show right now
//        profile-colors reset                hand the LEDs back to the profile (ends SDK colours)
//        profile-colors raw CMD [PARAM]      send any read command and print its reply
//        profile-colors bar HEX|empty HEADER  write a light bar setup; header bit 0 = save
//        profile-colors dump                 print every profile's colours and effects (read only)
//        profile-colors save FILE [N]        write profile N's (default: active) colour data to FILE
//        profile-colors commit               store the working colours into the active profile (feature 8)
//        profile-colors load FILE            write FILE to the working colours (commit to keep it)
//        profile-colors test                 write 6 coloured rows + a static effect to the active profile
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hidapi.h"

#define WOOTING_VID 0x31E3
#define CFG_V3_USAGE_PAGE 0xFF55
#define ROWS 6
#define COLS 21

static hid_device *dev;

/* Sends a feature command and returns the reply's payload (after D1 DA cmd 88 len16), or -1. */
static int command(uint8_t cmd, uint32_t param, uint8_t *payload, int cap) {
  uint8_t feat[8] = {1, 0xD1, 0xDA, cmd, param & 0xFF, param >> 8 & 0xFF, param >> 16 & 0xFF, param >> 24};
  if (hid_send_feature_report(dev, feat, 8) != 8) return -1;
  uint8_t buf[2100];
  for (int tries = 0; tries < 50; tries++) {
    int n = hid_read_timeout(dev, buf, sizeof buf, 500);
    if (n <= 0) return -1;
    // [report id] D1 DA cmd 88 len_lo len_hi payload...
    if (n >= 7 && buf[1] == 0xD1 && buf[2] == 0xDA && buf[3] == cmd) {
      int len = buf[5] | buf[6] << 8;
      if (len > n - 7) len = n - 7;
      if (len > cap) len = cap;
      memcpy(payload, buf + 7, len);
      return len;
    }
  }
  return -1;
}

/* Sends D1 DA cmd 00 len16 body in the smallest output report that fits. */
static int write_block(uint8_t cmd, const uint8_t *body, int len) {
  static const int sizes[] = {32, 62, 254, 510, 1022, 2046};
  for (int id = 1; id <= 6; id++) {
    int size = sizes[id - 1];
    if (6 + len > size) continue;
    uint8_t out[2048] = {0};
    out[0] = id;
    out[1] = 0xD1; out[2] = 0xDA; out[3] = cmd; out[4] = 0; out[5] = len & 0xFF; out[6] = len >> 8;
    memcpy(out + 7, body, len);
    if (hid_write(dev, out, size + 1) != size + 1) return -1;
    uint8_t in[2100];  // report anything the keyboard says back
    for (int n; (n = hid_read_timeout(dev, in, sizeof in, 150)) > 0;)
      if (in[1] == 0xD1 && in[2] == 0xDA) { printf("  reply to %02x:", cmd); for (int i = 0; i < 16 && i < n; i++) printf(" %02x", in[i]); printf("\n"); }
    return 0;
  }
  return -1;
}

static int varint(const uint8_t *b, int n, int *i, uint32_t *v) {
  *v = 0;
  for (int s = 0; *i < n; s += 7) {
    uint8_t x = b[(*i)++];
    *v |= (uint32_t)(x & 0x7F) << s;
    if (!(x & 0x80)) return 0;
  }
  return -1;
}

/* Decodes repeated { 1 row { 1 packed rgb565 } } into rows[], returns the row count. */
static int decode_rows(const uint8_t *b, int n, uint16_t rows[][COLS]) {
  int i = 0, r = 0;
  while (i < n && r < 3) {
    uint32_t key, len;
    if (varint(b, n, &i, &key) || key != 0x0A || varint(b, n, &i, &len)) break;
    int end = i + len, j = i;
    uint32_t k2, len2;
    if (varint(b, end, &j, &k2) || k2 != 0x0A || varint(b, end, &j, &len2)) break;
    int c = 0;
    for (int e = j + len2; j < e && c < COLS; c++) { uint32_t v; if (varint(b, e, &j, &v)) break; rows[r][c] = v; }
    for (; c < COLS; c++) rows[r][c] = 0;
    i = end; r++;
  }
  return r;
}

static void print_rows(int base, uint16_t rows[][COLS], int count) {
  for (int r = 0; r < count; r++) {
    printf("    row %d:", base + r);
    for (int c = 0; c < COLS; c++) {
      uint16_t v = rows[r][c];
      printf(" %02x%02x%02x", (v >> 11 & 31) * 255 / 31, (v >> 5 & 63) * 255 / 63, (v & 31) * 255 / 31);
    }
    printf("\n");
  }
}

static void hex(const char *label, const uint8_t *b, int n) {
  printf("  %s (%d):", label, n);
  for (int i = 0; i < n; i++) printf(" %02x", b[i]);
  printf("\n");
}

static int namespace_ = 0;
static int active_profile(void) {  // reply: [index, namespace]
  uint8_t p[64];
  int n = command(0x0B, 0, p, sizeof p);
  if (n >= 2) namespace_ = p[1];
  return n >= 1 ? p[0] : -1;
}

/* rows 0-2 and 3-5 encoded as Wootility does: 0A len { 0A len <packed varints> } x3 */
static int encode_rows(uint16_t rows[][COLS], uint8_t *out) {
  int n = 0;
  for (int r = 0; r < 3; r++) {
    uint8_t packed[COLS * 3]; int p = 0;
    for (int c = 0; c < COLS; c++) { uint32_t v = rows[r][c]; while (v >= 0x80) { packed[p++] = (v & 0x7F) | 0x80; v >>= 7; } packed[p++] = v; }
    out[n++] = 0x0A; out[n++] = p + 2; out[n++] = 0x0A; out[n++] = p;
    memcpy(out + n, packed, p); n += p;
  }
  return n;
}

static int open_device(void) {
  hid_init();
  struct hid_device_info *list = hid_enumerate(WOOTING_VID, 0), *it;
  char path[512] = {0};
  for (it = list; it; it = it->next)
    if (it->usage_page == CFG_V3_USAGE_PAGE) { strncpy(path, it->path, sizeof path - 1); break; }
  hid_free_enumeration(list);
  dev = path[0] ? hid_open_path(path) : NULL;
  if (!dev) { printf("No Wooting 0xFF55 interface found.\n"); return -1; }
  return 0;
}

int main(int argc, char **argv) {
  if (argc < 2) { printf("usage: %s dump | save FILE | load FILE | test\n", argv[0]); return 2; }
  if (open_device()) return 1;
  uint8_t a[2048], b[2048], fx[2048];
  uint16_t rows[3][COLS];

  if (!strcmp(argv[1], "reset")) {  // RESET_ALL: hand the LEDs back to the profile (ends SDK colours)
    int n = command(32, 0, a, sizeof a);
    printf("reset %s\n", n >= 0 ? "acknowledged" : "failed");
    return n >= 0 ? 0 : 1;
  }

  if (!strcmp(argv[1], "live")) {  // what the LEDs show right now: 6x17 keys then 10 light bar LEDs, rgb565 LE
    int n = command(0x4A, 0, a, sizeof a);
    for (int r = 0; r < 7 && n > 0; r++) {
      printf("  %s:", r < 6 ? "row" : "bar");
      for (int c = 0; c < (r < 6 ? 17 : 10); c++) {
        int i = (r * 17 + c) * 2; if (i + 1 >= n) break;
        uint16_t v = a[i] | a[i + 1] << 8;
        printf(" %02x%02x%02x", (v >> 11 & 31) * 255 / 31, (v >> 5 & 63) * 255 / 63, (v & 31) * 255 / 31);
      }
      printf("\n");
    }
    return 0;
  }

  if (!strcmp(argv[1], "bar") && argc > 3) {  // bar HEX|empty HEADER: write a LightbarProfile (command 0x20)
    int n = 0;
    if (strcmp(argv[2], "empty")) for (const char *h = argv[2]; h[0] && h[1]; h += 2) sscanf(h, "%2hhx", &a[n++]);
    uint8_t header = (uint8_t)strtol(argv[3], NULL, 0);
    uint8_t out[256] = {0};
    int size = 6 + n <= 32 ? 32 : 6 + n <= 62 ? 62 : 254, id = size == 32 ? 1 : size == 62 ? 2 : 3;
    out[0] = id; out[1] = 0xD1; out[2] = 0xDA; out[3] = 0x20; out[4] = header; out[5] = n & 0xFF; out[6] = n >> 8;
    memcpy(out + 7, a, n);
    int ok = hid_write(dev, out, size + 1) == size + 1;
    printf("light bar write (%d bytes, header %02x): %s\n", n, header, ok ? "sent" : "failed");
    return ok ? 0 : 1;
  }

  if (!strcmp(argv[1], "raw") && argc > 2) {  // any read command, e.g. raw 0x42 0
    int n = command((uint8_t)strtol(argv[2], NULL, 0), argc > 3 ? (uint32_t)strtoul(argv[3], NULL, 0) : 0, a, sizeof a);
    if (n < 0) { printf("no reply\n"); return 1; }
    hex("payload", a, n);
    return 0;
  }

  if (!strcmp(argv[1], "dump")) {
    printf("active profile: %d\n", active_profile());
    for (int prof = 0; prof < 4; prof++) {
      int na = command(0x23, prof, a, sizeof a), nb = command(0x24, prof, b, sizeof b), nf = command(0x32, prof, fx, sizeof fx);
      printf("profile %d: rows0-2 %d bytes, rows3-5 %d bytes, effects %d bytes\n", prof, na, nb, nf);
      if (na > 0) print_rows(0, rows, decode_rows(a, na, rows));
      if (nb > 0) print_rows(3, rows, decode_rows(b, nb, rows));
      if (nf > 0) hex("effects", fx, nf);
    }
    return 0;
  }

  int prof = active_profile();
  if (prof < 0) { printf("Could not read the active profile.\n"); return 1; }

  if (!strcmp(argv[1], "commit")) {  // saveRgbProfile (feature 8): store the working colours into the active profile
    int n = command(8, prof | namespace_ << 8, a, sizeof a);
    printf("commit to profile %d (namespace %d): %s\n", prof, namespace_, n >= 0 ? "acknowledged" : "no reply");
    return n >= 0 ? 0 : 1;
  }

  if (!strcmp(argv[1], "save") && argc > 2) {
    if (argc > 3) prof = atoi(argv[3]);
    int na = command(0x23, prof, a, sizeof a), nb = command(0x24, prof, b, sizeof b), nf = command(0x32, prof, fx, sizeof fx);
    if (na < 0 || nb < 0 || nf < 0) { printf("Read failed.\n"); return 1; }
    FILE *f = fopen(argv[2], "wb");
    if (!f) { perror(argv[2]); return 1; }
    uint16_t lens[3] = {na, nb, nf};
    fwrite(lens, sizeof lens, 1, f); fwrite(a, 1, na, f); fwrite(b, 1, nb, f); fwrite(fx, 1, nf, f);
    fclose(f);
    printf("Saved profile %d: %d + %d + %d bytes to %s\n", prof, na, nb, nf, argv[2]);
    return 0;
  }

  if (!strcmp(argv[1], "load") && argc > 2) {
    FILE *f = fopen(argv[2], "rb");
    if (!f) { perror(argv[2]); return 1; }
    uint16_t lens[3];
    if (fread(lens, sizeof lens, 1, f) != 1 || fread(a, 1, lens[0], f) != lens[0] || fread(b, 1, lens[1], f) != lens[1] ||
        fread(fx, 1, lens[2], f) != lens[2]) { printf("Bad backup file.\n"); return 1; }
    fclose(f);
    int ok = !write_block(0x0E, a, lens[0]) && !write_block(0x0F, b, lens[1]) && !write_block(0x16, fx, lens[2]);
    printf("%s profile %d from %s\n", ok ? "Restored" : "Write failed for", prof, argv[2]);
    return ok ? 0 : 1;
  }

  if (!strcmp(argv[1], "test")) {
    // Each row its own colour so a wrong row order shows at a glance.
    static const uint16_t ROW_COLOURS[ROWS] = {0xF800, 0xFD20, 0xFFE0, 0x07E0, 0x001F, 0xF81F}; // red orange yellow green blue magenta
    uint16_t top[3][COLS], bottom[3][COLS];
    for (int r = 0; r < 3; r++) for (int c = 0; c < COLS; c++) { top[r][c] = ROW_COLOURS[r]; bottom[r][c] = ROW_COLOURS[r + 3]; }
    int na = encode_rows(top, a), nb = encode_rows(bottom, b);
    // Effect stack: keep the profile's brightness block (field 1), drop every layer (no base effect = Static).
    int nf = command(0x32, prof, fx, sizeof fx);
    if (nf < 2 || fx[0] != 0x0A) { printf("Could not read the effect stack.\n"); return 1; }
    int keep = 2 + fx[1];
    int ok = !write_block(0x0E, a, na) && !write_block(0x0F, b, nb) && !write_block(0x16, fx, keep);
    printf("%s profile %d\n", ok ? "Wrote test rows to" : "Write failed for", prof);
    return ok ? 0 : 1;
  }

  printf("usage: %s dump | save FILE | load FILE | test\n", argv[0]);
  return 2;
}
