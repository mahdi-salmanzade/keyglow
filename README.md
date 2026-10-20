# Wooting 80HE color editor (groundwork)

Groundwork for an open-source, visual per-key color editor for the Wooting 80HE.

- `docs/online-files.md`: every upstream file needed, pinned, with licenses and what to port
- `docs/80he-protocol.md`: HID interfaces, report sizes, commands, key matrix, gotchas
- `scripts/fetch-references.sh`: downloads those files into `reference/` (gitignored)
- `tools/`: connection and color-path checks

## Check the keyboard

```sh
./scripts/fetch-references.sh
make -C tools
tools/bin/handshake          # read-only: model, layout, protocol; changes no colors
tools/bin/colortest 0 255 0  # tints all keys green for 2 s, then restores the profile
```

Close Wootility first, since it drives the same LEDs.
