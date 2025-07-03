import { CONFIG, NOTE_LENGTH_MODIFIER } from './config'
import { Measure } from './type'

export function on_staff(line: number): number {
  return (line * CONFIG.LINE_HEIGHT) / 2
}

export function calc_num_flags(length: number, has_modifier: boolean): number {
  return Math.max(
    0,
    ~~(4 - Math.log2(!has_modifier ? length : length / NOTE_LENGTH_MODIFIER)),
  )
}

export function interval_overlap(
  x1: number,
  x2: number,
  y1: number,
  y2: number,
): boolean {
  return x1 < y2 && y1 < x2
}

export function slot_pos(
  measure: Measure,
  begin: number,
  out?: [number, number, number],
): number {
  let slots = measure.slots

  let r: number = 0
  let s: number = measure.pad.left
  let t: number = 0

  if (measure.staves.some((x) => x.flags.need_clef)) {
    s += CONFIG.CLEF_WIDTH_MUL * CONFIG.NOTE_WIDTH
    t++
    s += measure.pad.inter
  }
  if (measure.staves.some((x) => x.flags.need_timesig)) {
    s += CONFIG.TIMESIG_WIDTH_MUL * CONFIG.NOTE_WIDTH
    t++
    s += measure.pad.inter
  }
  if (measure.staves.some((x) => x.flags.need_keysig)) {
    let num_acc = 0
    for (let i = 0; i < measure.staves.length; i++) {
      num_acc = Math.max(num_acc, measure.staves[i].key_signature[1])
    }
    s += num_acc * CONFIG.KEYSIG_WIDTH_MUL * CONFIG.NOTE_WIDTH
    t++
    s += measure.pad.inter
  }

  for (let i = 0; i < begin; i++) {
    if (slots[i].left_grace) {
      s += measure.pad.inter * 2
      r += slots[i].left_grace
      t += 2
    }
    let w_real =
      slots[i].left_note +
      slots[i].right_note +
      slots[i].mid_note +
      slots[i].left_deco +
      slots[i].right_deco +
      slots[i].left_squiggle
    let w = w_real + slots[i].right_spacing
    r += w
    if (w_real) {
      s += measure.pad.inter
      t++
    }
  }
  if (slots[begin]) {
    if (slots[begin].left_grace) {
      s += measure.pad.inter * 2
      r += slots[begin].left_grace
      t += 2
    }
    r +=
      slots[begin].left_note +
      slots[begin].left_deco +
      slots[begin].left_squiggle
  } else if (begin >= slots.length) {
    s += measure.pad.right - measure.pad.inter
    t--
  } else if (begin < 0) {
    s -= measure.pad.left
  }
  if (out) {
    out[0] = r
    out[1] = t
    out[2] = s
  }
  return r * CONFIG.NOTE_WIDTH + s
}
