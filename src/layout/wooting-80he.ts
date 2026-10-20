import type { Key, KeyboardLayout, Led } from './types'

// Wooting 80HE, ANSI. Matrix cells follow OpenRGB's matrix_map_80HE (verified against the
// keyboard's 6x17 RGB area); physical positions are in key units (u).
// [id, label, shift, code, matrix row, matrix col, x, width]
type Spec = [string, string, string | undefined, string | undefined, number, number, number, number]

const U = undefined
const ROW_Y = [0, 1.25, 2.25, 3.25, 4.25, 5.25]

const SPECS: Spec[] = [
  ['esc', 'Esc', U, 'Escape', 0, 0, 0, 1],
  ['f1', 'F1', U, 'F1', 0, 1, 1.25, 1],
  ['f2', 'F2', U, 'F2', 0, 2, 2.25, 1],
  ['f3', 'F3', U, 'F3', 0, 3, 3.25, 1],
  ['f4', 'F4', U, 'F4', 0, 4, 4.25, 1],
  ['f5', 'F5', U, 'F5', 0, 5, 5.5, 1],
  ['f6', 'F6', U, 'F6', 0, 6, 6.5, 1],
  ['f7', 'F7', U, 'F7', 0, 7, 7.5, 1],
  ['f8', 'F8', U, 'F8', 0, 8, 8.5, 1],
  ['f9', 'F9', U, 'F9', 0, 10, 9.75, 1],
  ['f10', 'F10', U, 'F10', 0, 11, 10.75, 1],
  ['f11', 'F11', U, 'F11', 0, 12, 11.75, 1],
  ['f12', 'F12', U, 'F12', 0, 13, 12.75, 1],
  ['mode', 'Mode', U, U, 0, 14, 14, 1],
  ['prtsc', 'PrtSc', U, 'PrintScreen', 0, 15, 15.25, 1],
  ['pause', 'Pause', U, 'Pause', 0, 16, 16.25, 1],

  ['grave', '`', '~', 'Backquote', 1, 0, 0, 1],
  ['1', '1', '!', 'Digit1', 1, 1, 1, 1],
  ['2', '2', '@', 'Digit2', 1, 2, 2, 1],
  ['3', '3', '#', 'Digit3', 1, 3, 3, 1],
  ['4', '4', '$', 'Digit4', 1, 4, 4, 1],
  ['5', '5', '%', 'Digit5', 1, 5, 5, 1],
  ['6', '6', '^', 'Digit6', 1, 6, 6, 1],
  ['7', '7', '&', 'Digit7', 1, 7, 7, 1],
  ['8', '8', '*', 'Digit8', 1, 8, 8, 1],
  ['9', '9', '(', 'Digit9', 1, 9, 9, 1],
  ['0', '0', ')', 'Digit0', 1, 10, 10, 1],
  ['minus', '-', '_', 'Minus', 1, 11, 11, 1],
  ['equal', '=', '+', 'Equal', 1, 12, 12, 1],
  ['backspace', 'Backspace', U, 'Backspace', 1, 14, 13, 2],
  ['ins', 'Ins', U, 'Insert', 1, 15, 15.25, 1],
  ['home', 'Home', U, 'Home', 1, 16, 16.25, 1],

  ['tab', 'Tab', U, 'Tab', 2, 0, 0, 1.5],
  ['q', 'Q', U, 'KeyQ', 2, 1, 1.5, 1],
  ['w', 'W', U, 'KeyW', 2, 2, 2.5, 1],
  ['e', 'E', U, 'KeyE', 2, 3, 3.5, 1],
  ['r', 'R', U, 'KeyR', 2, 4, 4.5, 1],
  ['t', 'T', U, 'KeyT', 2, 5, 5.5, 1],
  ['y', 'Y', U, 'KeyY', 2, 6, 6.5, 1],
  ['u', 'U', U, 'KeyU', 2, 7, 7.5, 1],
  ['i', 'I', U, 'KeyI', 2, 8, 8.5, 1],
  ['o', 'O', U, 'KeyO', 2, 9, 9.5, 1],
  ['p', 'P', U, 'KeyP', 2, 10, 10.5, 1],
  ['lbracket', '[', '{', 'BracketLeft', 2, 11, 11.5, 1],
  ['rbracket', ']', '}', 'BracketRight', 2, 12, 12.5, 1],
  ['backslash', '\\', '|', 'Backslash', 2, 14, 13.5, 1.5],
  ['del', 'Del', U, 'Delete', 2, 15, 15.25, 1],
  ['end', 'End', U, 'End', 2, 16, 16.25, 1],

  ['caps', 'Caps', U, 'CapsLock', 3, 0, 0, 1.75],
  ['a', 'A', U, 'KeyA', 3, 1, 1.75, 1],
  ['s', 'S', U, 'KeyS', 3, 2, 2.75, 1],
  ['d', 'D', U, 'KeyD', 3, 3, 3.75, 1],
  ['f', 'F', U, 'KeyF', 3, 4, 4.75, 1],
  ['g', 'G', U, 'KeyG', 3, 5, 5.75, 1],
  ['h', 'H', U, 'KeyH', 3, 6, 6.75, 1],
  ['j', 'J', U, 'KeyJ', 3, 7, 7.75, 1],
  ['k', 'K', U, 'KeyK', 3, 8, 8.75, 1],
  ['l', 'L', U, 'KeyL', 3, 9, 9.75, 1],
  ['semicolon', ';', ':', 'Semicolon', 3, 10, 10.75, 1],
  ['quote', "'", '"', 'Quote', 3, 11, 11.75, 1],
  ['enter', 'Enter', U, 'Enter', 3, 14, 12.75, 2.25],

  ['lshift', 'Shift', U, 'ShiftLeft', 4, 0, 0, 2.25],
  ['z', 'Z', U, 'KeyZ', 4, 2, 2.25, 1],
  ['x', 'X', U, 'KeyX', 4, 3, 3.25, 1],
  ['c', 'C', U, 'KeyC', 4, 4, 4.25, 1],
  ['v', 'V', U, 'KeyV', 4, 5, 5.25, 1],
  ['b', 'B', U, 'KeyB', 4, 6, 6.25, 1],
  ['n', 'N', U, 'KeyN', 4, 7, 7.25, 1],
  ['m', 'M', U, 'KeyM', 4, 8, 8.25, 1],
  ['comma', ',', '<', 'Comma', 4, 9, 9.25, 1],
  ['period', '.', '>', 'Period', 4, 10, 10.25, 1],
  ['slash', '/', '?', 'Slash', 4, 11, 11.25, 1],
  ['rshift', 'Shift', U, 'ShiftRight', 4, 14, 12.25, 1.75],
  ['up', '↑', U, 'ArrowUp', 4, 15, 15.25, 1],

  ['lctrl', 'Ctrl', U, 'ControlLeft', 5, 0, 0, 1.25],
  ['lwin', 'Win', U, 'MetaLeft', 5, 1, 1.25, 1.25],
  ['lalt', 'Alt', U, 'AltLeft', 5, 2, 2.5, 1.25],
  ['ralt', 'Alt', U, 'AltRight', 5, 10, 10, 1.25],
  ['rwin', 'Win', U, 'MetaRight', 5, 11, 11.25, 1.25],
  ['fn', 'Fn', U, U, 5, 12, 12.5, 1.25],
  ['left', '←', U, 'ArrowLeft', 5, 14, 14.25, 1],
  ['down', '↓', U, 'ArrowDown', 5, 15, 15.25, 1],
  ['right', '→', U, 'ArrowRight', 5, 16, 16.25, 1],
]

const SPACE = { x: 3.75, w: 6.25, cols: [4, 5, 6, 7, 8] }

function build(): KeyboardLayout {
  const keys: Key[] = []
  const leds: Led[] = []
  const addLed = (keyId: string, row: number, col: number, x: number, y: number) => {
    leds.push({ index: row * 21 + col, row, col, x, y, keyId })
    return leds.length - 1
  }

  for (const [id, label, shift, code, row, col, x, w] of SPECS) {
    const y = ROW_Y[row]
    keys.push({ id, label, shift, code, x, y, w, h: 1, leds: [addLed(id, row, col, x + w / 2, y + 0.5)] })
  }

  const y = ROW_Y[5]
  const step = SPACE.w / SPACE.cols.length
  keys.push({
    id: 'space',
    label: '',
    code: 'Space',
    x: SPACE.x,
    y,
    w: SPACE.w,
    h: 1,
    leds: SPACE.cols.map((col, i) => addLed('space', 5, col, SPACE.x + step * (i + 0.5), y + 0.5)),
  })

  keys.sort((a, b) => a.y - b.y || a.x - b.x)
  return { id: 'wooting-80he-ansi', name: 'Wooting 80HE (ANSI)', width: 17.25, height: 6.25, keys, leds }
}

export const WOOTING_80HE = build()
