# Builds the connection checks against ../reference (run scripts/fetch-references.sh first).
# Compiles hidapi from source, so no Homebrew packages are needed (works on arm64).

REF    = ../reference
SDK    = $(REF)/wooting-rgb-sdk/src
HIDAPI = $(REF)/hidapi
CFLAGS = -O1 -I$(HIDAPI)/hidapi -I$(SDK)
FRAMEWORKS = -framework IOKit -framework CoreFoundation -framework AppKit

all: bin/handshake bin/colortest

bin/handshake: handshake.c $(SDK)/wooting-rgb-sdk.c $(SDK)/wooting-usb.c $(HIDAPI)/mac/hid.c
	@mkdir -p bin
	clang $(CFLAGS) -w $^ $(FRAMEWORKS) -o $@

bin/colortest: colortest.c $(HIDAPI)/mac/hid.c
	@mkdir -p bin
	clang $(CFLAGS) -w $^ $(FRAMEWORKS) -o $@

clean:
	rm -rf bin

.PHONY: all clean
