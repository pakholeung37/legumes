import { CONFIG, NOTE_LENGTH_MODIFIER } from './config'
import { CLEF, ACCIDENTAL, NOTE_LENGTH } from './const'
import { Measure, Note_itf, Rest_itf, Staff_itf } from './type'

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
export function note_name_to_staff_pos(name: string, clef: number) {
  let base_name = name[0]
  let octave = Number(name.split('_')[1])
  let i0 = {
    [CLEF.TREBLE]: 6 * 7 + 3,
    [CLEF.BASS]: 5 * 7 - 2,
    [CLEF.ALTO]: 6 * 7 - 3,
    [CLEF.TENOR]: 6 * 7 - 5,
    [CLEF.MEZZO_SOPRANO]: 6 * 7 - 1,
    [CLEF.SOPRANO]: 6 * 7 + 1,
    [CLEF.BARITONE]: 5 * 7,
  }[clef]
  let idx = i0 - ('CDEFGAB'.indexOf(base_name) + octave * 7)
  return idx
}

export function get_note_name_accidental(name: string): number {
  return [ACCIDENTAL.FLAT, ACCIDENTAL.NATURAL, ACCIDENTAL.SHARP]['b_s'.indexOf(name[1])]
}

export function get_existing_voices(
  staff_notes: (Note_itf | Rest_itf)[],
  filt: number[]
): number[] {
  return Array.from(new Set(staff_notes.map((x) => x.voice))).filter(
    (x) => filt.includes(x) || !filt.length
  )
}

export function short_id() {
  return (
    '_' +
    String.fromCharCode(
      ...new Array(6).fill(0).map((x) => ~~(Math.random() * 26) + 0x41)
    )
  )
}

export function get_median_staff_pos(
  notes: Note_itf[]
): Record<number, number> {
  let c2p: Record<number, number[]> = {}

  for (let n of notes) {
    if (!c2p[n.voice]) {
      c2p[n.voice] = []
    }
    c2p[n.voice].push(n.staff_pos)
  }
  let c2p2: Record<number, number> = {}
  for (let k in c2p) {
    c2p[k].sort((a, b) => a - b)
    let m = ~~(c2p[k].length / 2.0)
    if (c2p[k].length % 2) {
      c2p2[k] = c2p[k][m]
    } else {
      c2p2[k] = (c2p[k][m - 1] + c2p[k][m]) / 2
    }
  }
  return c2p2
}

export function chord_and_beam_staff(staff: Staff_itf, beat_length: number) {
  let beam_cnt = 1

  let notes_beam: number[] = new Array(staff.notes.length)
  let beam_info: Record<number, Record<number, number[]>> = {}

  for (let i = 0; i < staff.notes.length; i++) {
    // console.log('----',i);
    let note = staff.notes[i]
    let beam = 0
    let chord: [number, Note_itf][] = []
    let stem_dir = note.stem_dir
    let disp_dur = note.duration
    if (note.tuplet) {
      disp_dur = note.tuplet.display_duration
    }

    for (let j = 0; j < staff.notes.length; j++) {
      let own = note
      let other = staff.notes[j]
      if (own.voice == other.voice &&
        own.begin == other.begin &&
        own.duration == other.duration) {
        chord.push([j, other])
      }
    }
    // console.log(chord);
    chord.sort((a, b) => stem_dir * (a[1].staff_pos - b[1].staff_pos))
    // console.log(chord);
    let my_idx = chord.findIndex((x) => x[0] == i)
    // console.log(i,my_idx);
    if (chord[my_idx - 1]) {
      note.prev_in_chord = chord[my_idx - 1][0]
    }
    if (chord[my_idx + 1]) {
      note.next_in_chord = chord[my_idx + 1][0]
    } else if (disp_dur < NOTE_LENGTH.QUARTER) {
      let linked: boolean = false
      for (let j = 0; j < i; j++) {
        let own = staff.notes[i]
        let other = staff.notes[j]
        let other_beam = notes_beam[j]

        let consecutive: boolean = true

        if (other.voice != own.voice) {
          continue
        }
        if (other.next_in_chord != null) {
          continue
        }

        function calc_consecutive() {
          for (let k = 0; k < i; k++) {
            if (staff.notes[k].voice != staff.notes[i].voice) {
              continue
            }
            if (staff.notes[j].begin < staff.notes[k].begin &&
              staff.notes[k].begin < staff.notes[i].begin) {
              consecutive = false

              break
            }
          }
          if (consecutive) {
            for (let k = 0; k < staff.rests.length; k++) {
              if (staff.rests[k].voice != staff.notes[i].voice) {
                continue
              }
              if (staff.notes[j].begin < staff.rests[k].begin &&
                staff.rests[k].begin < staff.notes[i].begin) {
                consecutive = false
                break
              }
            }
          }
          if (consecutive) {
            for (let k = staff.notes[j].begin + staff.notes[j].duration; k <= staff.notes[i].begin; k++) {
              if (staff.grace[k]) {
                consecutive = false
                break
              }
            }
          }
        }

        if (own.tuplet && other.tuplet && own.tuplet.id == other.tuplet.id) {
          // console.log(j,i);
          calc_consecutive()
          if (consecutive) {
            beam = notes_beam[j]
            linked = true
            break
          }
        } else if (own.tuplet || other.tuplet) {
          continue
        } else {
          calc_consecutive()
          let same_stem_dir = stem_dir == staff.notes[j].stem_dir
          let same_beat = ~~(other.begin / beat_length) == ~~(own.begin / beat_length)

          if (other_beam != 0 && consecutive && same_stem_dir && same_beat) {
            beam = notes_beam[j]
            linked = true
            break
          }
        }
      }
      if (!linked) {
        beam = beam_cnt
        beam_cnt++
      }
    }
    // if (staff.notes[i].tuplet) console.log(i,beam);
    notes_beam[i] = beam
  }

  for (let i = 0; i < staff.voices; i++) {
    beam_info[i] = {}
  }

  for (let b = 1; b < beam_cnt; b++) {
    let children: number[] = notes_beam
      .map((x, i) => [x, i])
      .filter((x) => x[0] == b)
      .map((x) => x[1])
    if (children.length > 1) {
      beam_info[staff.notes[children[0]].voice][b] = []
    }
  }

  for (let i = 0; i < staff.notes.length; i++) {
    let on_record = beam_info[staff.notes[i].voice][notes_beam[i]]
    let can_beam = notes_beam[i] > 0
    if (can_beam && !on_record) {
    } else if (on_record) {
      beam_info[staff.notes[i].voice][notes_beam[i]].push(i)
    }
  }

  for (let a in beam_info) {
    for (let b in beam_info[a]) {
      staff.beams.push(beam_info[a][b])
    }
  }
}
