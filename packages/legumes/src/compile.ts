import {
  Cresc_itf,
  Measure,
  Note,
  Note_itf,
  Pack,
  Rest,
  Score,
  Score_itf,
  Slot,
  Staff,
} from './type'
import {
  ARTICULATION,
  BARLINE,
  get_median_staff_pos,
  NOTE_LENGTH,
} from './common'
import { FONT, get_text_width } from './hershey'
import { CONFIG, CONTENT_WIDTH, FONT_INHERENT_HEIGHT } from './config'
import { calc_num_flags, interval_overlap, on_staff, slot_pos } from './utils'

function staff_has_cue_lyric(staff: Staff, crescs: Cresc_itf[] = null): void {
  let has_cue = false
  for (let i = 0; i < staff.notes.length; i++) {
    if (staff.notes[i].cue) {
      has_cue = true
      break
    }
  }
  if (!has_cue) {
    for (let i = 0; i < staff.rests.length; i++) {
      if (staff.rests[i].cue) {
        has_cue = true
        break
      }
    }
  }
  if (!has_cue && crescs && crescs.length) {
    for (let i = 0; i < staff.notes.length; i++) {
      if (staff.notes[i].id) {
        for (let j = 0; j < crescs.length; j++) {
          if (
            crescs[j].left == staff.notes[i].id ||
            crescs[j].right == staff.notes[i].id
          ) {
            has_cue = true
            break
          }
        }
        if (has_cue) {
          break
        }
      }
    }
  }

  let has_lyric = false
  for (let i = 0; i < staff.notes.length; i++) {
    if (staff.notes[i].lyric) {
      has_lyric = true
      break
    }
  }
  staff.flags.need_cue = has_cue
  staff.flags.need_lyric = has_lyric
}

function calc_staff_flags(
  score: Score,
  measure_idx: number,
  staff_idx: number,
) {
  let measures = score.measures
  if (measure_idx != 0) {
    let ks0 = measures[measure_idx - 1].staves[staff_idx].key_signature
    let ks1 = measures[measure_idx].staves[staff_idx].key_signature
    if (ks0[0] != ks1[0] || ks0[1] != ks1[1]) {
      let [acc0, num_acc0] = ks0
      let [acc1, num_acc1] = ks1
      if (num_acc0 > 0 && num_acc1 == 0) {
        measures[measure_idx].staves[staff_idx].flags.need_keysig = {
          accidental: ~acc0,
          count: num_acc0,
        }
      } else {
        measures[measure_idx].staves[staff_idx].flags.need_keysig = {
          accidental: acc1,
          count: num_acc1,
        }
      }
    }
    let ts0 = measures[measure_idx - 1].staves[staff_idx].time_signature
    let ts1 = measures[measure_idx].staves[staff_idx].time_signature
    if (ts0[0] != ts1[0] || ts0[1] != ts1[1]) {
      measures[measure_idx].staves[staff_idx].flags.need_timesig = true
    }
    if (
      measures[measure_idx - 1].staves[staff_idx].clef !=
      measures[measure_idx].staves[staff_idx].clef
    ) {
      measures[measure_idx].staves[staff_idx].flags.need_clef = true
    }
  } else {
    let [acc, num_acc] = measures[measure_idx].staves[staff_idx].key_signature
    measures[measure_idx].staves[staff_idx].flags.need_keysig = {
      accidental: acc,
      count: num_acc,
    }
    measures[measure_idx].staves[staff_idx].flags.need_timesig = true
    measures[measure_idx].staves[staff_idx].flags.need_clef = true
  }
  staff_has_cue_lyric(measures[measure_idx].staves[staff_idx], score.crescs)
}

function has_twisted_sibling(notes: Note[], idx: number): boolean {
  let note = notes[idx]
  let does = note.twisted
  if (does) return does
  let head_note: Note = note
  let tail_note: Note = note

  while (head_note.prev_in_chord != null) {
    head_note = notes[head_note.prev_in_chord]
    if (head_note.twisted) does = true
  }
  if (does) return does
  while (tail_note.next_in_chord != null) {
    tail_note = notes[tail_note.next_in_chord]
    if (tail_note.twisted) does = true
  }
  return does
}
function compile_measure(measure: Measure) {
  function get_index_in_chord(notes: Note_itf[], note: Note_itf) {
    let i = 0
    while (note.prev_in_chord !== null) {
      note = notes[note.prev_in_chord]
      i++
    }
    return i
  }

  for (let j = 0; j < measure.staves.length; j++) {
    let staff = measure.staves[j] as Staff
    if (!staff.coords) {
      staff.coords = {
        x: 0,
        y: 0,
        w: 0,
        local_y_min: 0,
        local_y_max: 0,
        col: 0,
        row: 0,
      }
    }
    if (!staff.flags) {
      staff.flags = {
        need_keysig: null,
        need_timesig: false,
        need_clef: false,
        need_cue: false,
        need_lyric: false,
      }
    }
    // calc_staff_flags(score.measures as Measure[],i,j);

    for (let b of staff.beams) {
      for (let k of b) {
        ;(staff.notes[k] as Note).beamed = true
      }
    }

    for (let k = 0; k < staff.notes.length; k++) {
      let note = staff.notes[k] as Note
      let twisted: boolean = false
      let stem_len: number = CONFIG.STEM_LENGTH
      let stem_dir: number = note.stem_dir
      // if (stem_dir == -1){
      //   stem_len = Math.max(
      //     stem_len,
      //     ~~((note.staff_pos-3)/2)
      //   );
      // }else{
      //   stem_len = Math.max(
      //     stem_len,
      //     ~~((7-note.staff_pos)/2)
      //   );
      // }

      let flag_count = 0
      if (note.prev_in_chord !== null) {
        let pd = note.staff_pos - staff.notes[note.prev_in_chord].staff_pos
        if (Math.abs(pd) <= 1) {
          if (get_index_in_chord(staff.notes, note) % 2) {
            twisted = true
          }
        }
      }
      if (note.next_in_chord !== null) {
        let pd = note.staff_pos - staff.notes[note.next_in_chord].staff_pos
        if (!twisted && Math.abs(pd) <= 1) {
          if (get_index_in_chord(staff.notes, note) % 2) {
            twisted = true
          }
        }
        stem_len = Math.abs(pd) / 2
      } else {
        if (note.tuplet) {
          flag_count = calc_num_flags(
            note.tuplet.display_duration,
            note.modifier,
          )
        } else {
          flag_count = calc_num_flags(note.duration, note.modifier)
        }
      }

      stem_len += (flag_count * CONFIG.FLAG_SPACING) / 2

      note.stem_len = stem_len
      note.flag_count = flag_count
      note.twisted = twisted
      note.slot_shift = 0
      note.modifier_shift = 0
    }

    let beams = staff.beams
    for (let b of beams) {
      let notes_spanned = []
      for (let i = 0; i < b.length; i++) {
        notes_spanned.push(staff.notes[b[i]])
      }
      if (!notes_spanned.length) {
        continue
      }
      let flagcnts = []
      for (let i = 0; i < notes_spanned.length; i++) {
        flagcnts.push(notes_spanned[i].flag_count)
      }
      let extra_len =
        Math.max(0, Math.max(...flagcnts) - 1) * CONFIG.FLAG_SPACING
      for (let i = 0; i < notes_spanned.length; i++) {
        notes_spanned[i].stem_len +=
          extra_len - (notes_spanned[i].flag_count * CONFIG.FLAG_SPACING) / 6
      }
    }

    compile_rests(staff)
  }

  for (let j = 0; j < measure.staves.length; j++) {
    let staff = measure.staves[j] as Staff
    for (let i = 0; i < staff.grace.length; i++) {
      if (staff.grace[i]) {
        compile_measure(staff.grace[i])
        let st = staff.grace[i].staves[0]
        for (let j = 0; j < st.notes.length; j++) {
          if (st.notes[j].next_in_chord == null) {
            st.notes[j].stem_len *= 0.6
          }
        }
        // staff.grace[i].pad={left:CONFIG.INTER_NOTE_WIDTH,inter:0,right:CONFIG.INTER_NOTE_WIDTH}
        staff.grace[i].pad = {
          left: 0,
          inter: CONFIG.INTER_NOTE_WIDTH / 2,
          right: 0,
        }
      }
    }
  }
  measure.pad = {
    left: CONFIG.MEASURE_PAD_FRONT,
    inter: CONFIG.INTER_NOTE_WIDTH,
    right: CONFIG.MEASURE_PAD_BACK,
  }
  make_measure_slots(measure)

  if (CONFIG.HEADBUTT_RESOLVE) {
    for (let j = 0; j < measure.staves.length; j++) {
      let staff = measure.staves[j]
      for (let k = 0; k < staff.notes.length; k++) {
        let staff_idx = j
        let note_idx = k
        let note = staff.notes[k]
        let slot = measure.slots[note.begin]
        function try_opt_headbutt() {
          if (
            staff.voices <= 1 ||
            slot.mid_note <= 1 ||
            has_twisted_sibling(staff.notes, k)
          ) {
            return
          }
          let track = slot.mid_pack.intervals[staff_idx]
          let entry = track.find((a) => a.idx == note_idx)
          if (entry.x > 0) {
            return
          }
          let collider: Note = null
          for (let j = 0; j < track.length; j++) {
            if (track[j].idx == entry.idx) continue
            if (
              interval_overlap(
                track[j].top,
                track[j].bottom,
                entry.top,
                entry.bottom,
              )
            ) {
              if (collider) {
                return //giveup
              } else {
                collider = staff.notes[track[j].idx]
              }
            }
          }
          if (collider) {
            return
          }
          if (note.stem_dir < 0) {
            note.slot_shift = -CONFIG.NOTE_WIDTH
            note.modifier_shift = -CONFIG.NOTE_WIDTH
          } else {
            note.modifier_shift = -CONFIG.NOTE_WIDTH
          }
        }
        try_opt_headbutt()
      }
    }
  }
}

function make_space_for_barlines(measures: Measure[]) {
  for (let i = 0; i < measures.length; i++) {
    let measure = measures[i]
    if (measure.barline == BARLINE.DOUBLE) {
      measure.pad.right += 4
    } else if (measure.barline == BARLINE.END) {
      measure.pad.right += 8
    } else if (measure.barline == BARLINE.REPEAT_END) {
      measure.pad.right += 12
    } else if (measure.barline == BARLINE.REPEAT_BEGIN) {
      measures[i + 1].pad.left += 12
    } else if (measure.barline == BARLINE.REPEAT_END_BEGIN) {
      measure.pad.right += 12
      measures[i + 1].pad.left += 12
    }
  }
}

function plan_beams(measure: Measure, staff_idx: number) {
  let staff = measure.staves[staff_idx]
  let beams = staff.beams
  let notes = staff.notes
  let slots = measure.slots

  for (let beam of beams) {
    let notes_spanned = []
    for (let i = 0; i < beam.length; i++) {
      notes_spanned.push(notes[beam[i]])
    }
    if (!notes_spanned.length) {
      continue
    }
    let stem_dir = notes_spanned[0].stem_dir
    let pts: { x: number; y: number }[] = notes_spanned.map((n) => {
      let stem_length = n.stem_len
      let x =
        slot_pos(measure, n.begin) +
        CONFIG.NOTE_WIDTH * (Number(n.stem_dir < 0) * slots[n.begin].mid_note)
      return { x, y: on_staff(2 * stem_dir * stem_length + n.staff_pos) }
    })

    let [m, b]: [number, number] = least_sq_regress(pts)
    if (Math.abs(m) > CONFIG.BEAM_MAX_SLOPE) {
      m = Math.sign(m) * CONFIG.BEAM_MAX_SLOPE
      let anchor: { x: number; y: number }
      if (stem_dir < 0) {
        anchor = pts.reduce(
          (
            acc: { x: number; y: number },
            a: { x: number; y: number },
          ): { x: number; y: number } => (a.y <= acc.y ? a : acc),
          { x: 0, y: Infinity },
        )
      } else {
        anchor = pts.reduce(
          (
            acc: { x: number; y: number },
            a: { x: number; y: number },
          ): { x: number; y: number } => (a.y >= acc.y ? a : acc),
          { x: 0, y: -Infinity },
        )
      }
      // m*x+b=y b=y-m*x
      b = anchor.y - m * anchor.x
    }

    for (let i = 0; i < notes_spanned.length; i++) {
      let d = pts[i].x * m + b - on_staff(notes_spanned[i].staff_pos)
      if (Math.sign(d) != notes_spanned[i].stem_dir) {
        b -= d
        d = pts[i].x * m + b - on_staff(notes_spanned[i].staff_pos)
      }
      if (Math.abs(d) < CONFIG.LINE_HEIGHT * 1.5) {
        b += notes_spanned[i].stem_dir * CONFIG.LINE_HEIGHT * 1.5
      }
    }

    for (let i = 0; i < notes_spanned.length; i++) {
      let d = pts[i].x * m + b - on_staff(notes_spanned[i].staff_pos)
      notes_spanned[i].stem_len = Math.abs(d) / CONFIG.LINE_HEIGHT
    }
    beam.m = m
    beam.b = b
  }
}

function plan_articulations(measure: Measure, staff_idx: number) {
  let staff = measure.staves[staff_idx]
  for (let k = 0; k < staff.notes.length; k++) {
    let note = staff.notes[k] as Note
    if (note.articulation && note.articulation != ARTICULATION.ARPEGGIATED) {
      let head_note: Note = note
      let tail_note: Note = note
      while (head_note.prev_in_chord != null) {
        head_note = staff.notes[head_note.prev_in_chord]
      }
      while (tail_note.next_in_chord != null) {
        tail_note = staff.notes[tail_note.next_in_chord]
      }
      let lh = head_note.staff_pos
      let lt = tail_note.staff_pos
      let ya = (lh % 2 ? lh : lh - note.stem_dir) - note.stem_dir * 2
      let line_b = Math.round(lt + note.stem_len * note.stem_dir * 2)
      let yb =
        (line_b % 2 ? line_b : line_b + note.stem_dir) + note.stem_dir * 2
      let xa = 0
      let xb = 1

      let x: number, y: number
      if (staff.voices <= 1) {
        if (note.articulation == ARTICULATION.TRILL) {
          ;[x, y] = note.stem_dir < 0 ? [xb, yb] : [xa, ya]
        } else {
          ;[x, y] = [xa, ya]
        }
      } else if (note.voice % 2) {
        if (note.stem_dir < 0) {
          ;[x, y] = [xa, ya]
        } else {
          ;[x, y] = [xb, yb]
        }
      } else {
        if (note.stem_dir < 0) {
          ;[x, y] = [xb, yb]
        } else {
          ;[x, y] = [xa, ya]
        }
      }
      note.articulation_pos = [x, y]
    }
  }
}

export function compile_score(score: Score_itf): Score {
  let score_: Score = score as Score
  score_.indent = 0
  let instr_set: Set<string> = new Set()
  for (let i = 0; i < score.instruments.length; i++) {
    for (let j = 0; j < score.instruments[i].names.length; j++) {
      instr_set.add(score.instruments[i].names[j])
    }
  }
  let instrs: string[] = Array.from(instr_set)
  if (instrs.length > 1 || CONFIG.SHOW_SOLO_INSTRUMENT) {
    let w = 0
    for (let i = 0; i < instrs.length; i++) {
      w = Math.max(w, get_text_width(instrs[i], FONT.DUPLEX, -2))
    }
    w *= CONFIG.INSTRUMENT_TEXT_SIZE / FONT_INHERENT_HEIGHT
    score_.indent = w + CONFIG.INSTRUMENT_PAD_RIGHT
  }
  score_.first_col_measure_indices = []
  score_.slurred_ids = {}
  for (let i = 0; i < score_.slurs.length; i++) {
    score_.slurred_ids[score_.slurs[i].left] = true
    score_.slurred_ids[score_.slurs[i].right] = true
  }
  for (let i = 0; i < score_.measures.length; i++) {
    let measure = score_.measures[i] as Measure
    for (let j = 0; j < measure.staves.length; j++) {
      let staff = measure.staves[j] as Staff
      staff.flags = {
        need_keysig: null,
        need_timesig: false,
        need_clef: false,
        need_cue: false,
        need_lyric: false,
      }
      calc_staff_flags(score_, i, j)
    }
    compile_measure(measure)
  }
  make_space_for_barlines(score_.measures)
  plan_measures(score_)

  return score_
}
function least_sq_regress(pts: { x: number; y: number }[]): [number, number] {
  let sum_x = 0
  let sum_y = 0
  let sum_xsq = 0
  let sum_xy = 0
  let n = pts.length
  for (let p of pts) {
    sum_x += p.x
    sum_y += p.y
    sum_xsq += p.x ** 2
    sum_xy += p.x * p.y
  }
  let denom = n * sum_xsq - sum_x ** 2
  if (denom == 0) {
    denom = 0.0001
  }
  let m = (n * sum_xy - sum_x * sum_y) / denom
  let b = (sum_y - m * sum_x) / n
  return [m, b]
}

function pack_add(
  pack: Pack,
  idx: number,
  layer: number,
  top: number,
  bottom: number,
  exemption?: Function,
) {
  if (!exemption) {
    exemption = (_a: number, _b: number) => false
  }
  if (!pack.intervals[layer]) {
    pack.intervals[layer] = []
  }
  let track = pack.intervals[layer]
  for (let i = 0; i < 99; i++) {
    let ok = true
    for (let j = 0; j < track.length; j++) {
      if (track[j].x != i) {
        continue
      }
      if (
        interval_overlap(track[j].top, track[j].bottom, top, bottom) &&
        !(track[j].top == top && track[j].bottom == bottom && exemption(idx, j))
      ) {
        ok = false
        break
      }
    }
    if (ok) {
      track.push({ top, bottom, x: i, idx })
      return
    }
  }
}

function pack_width(pack: Pack): number {
  let x = 0
  for (let i = 0; i < pack.intervals.length; i++) {
    if (!pack.intervals[i]) continue
    for (let j = 0; j < pack.intervals[i].length; j++) {
      x = Math.max(pack.intervals[i][j].x + 1, x)
    }
  }
  return x
}

function make_measure_slots(measure: Measure): void {
  let slots: Slot[] = new Array(Math.max(1, measure.duration))
    .fill(null)
    .map((x) => ({
      mid_note: 0,
      left_grace: 0,
      left_squiggle: 0,
      left_deco: 0,
      right_deco: 0,
      left_note: 0,
      right_note: 0,
      right_spacing: 0,
      acc_pack: {
        intervals: new Array(measure.staves.length).fill(null).map((_) => []),
      },
      mid_pack: {
        intervals: new Array(measure.staves.length).fill(null).map((_) => []),
      },
    }))

  for (let k = 0; k < measure.staves.length; k++) {
    let notes: Note[] = measure.staves[k].notes
    let rests = measure.staves[k].rests

    function merger(a: number, b: number): boolean {
      return (
        (notes[a].duration < NOTE_LENGTH.HALF &&
          notes[b].duration < NOTE_LENGTH.HALF) ||
        (NOTE_LENGTH.HALF <= notes[a].duration &&
          notes[a].duration < NOTE_LENGTH.WHOLE &&
          NOTE_LENGTH.HALF <= notes[b].duration &&
          notes[b].duration < NOTE_LENGTH.WHOLE)
      )
    }

    for (let i = 0; i < notes.length; i++) {
      let slot = slots[notes[i].begin]
      // console.dir(measure,{depth:null});
      if (notes[i].stem_dir < 0) {
        if (notes[i].twisted) {
          slot.right_note = 1
        } else {
          // slot.mid_note = Math.max(slot.mid_note,1);
          slot.mid_note = 1
          pack_add(
            slot.mid_pack,
            i,
            k,
            notes[i].staff_pos - 1,
            notes[i].staff_pos + 1,
            CONFIG.HEADBUTT_MERGE && merger,
          )
        }
      } else {
        if (notes[i].twisted) {
          slot.left_note = 1
        } else {
          // slot.mid_note = Math.max(slot.mid_note,1);
          slot.mid_note = 1
          pack_add(
            slot.mid_pack,
            i,
            k,
            notes[i].staff_pos - 1,
            notes[i].staff_pos + 1,
            CONFIG.HEADBUTT_MERGE && merger,
          )
        }
      }
      if (notes[i].modifier) {
        slot.right_deco = Math.max(1, slot.right_deco)
      }
      if (notes.length > 1) {
        let v = CONFIG.DURATION_BASED_SPACING * notes[i].duration
        if (!slot.right_spacing) {
          slot.right_spacing = v
        } else {
          slot.right_spacing = Math.min(v, slot.right_spacing)
        }
      }
      if (
        notes[i].flag_count &&
        !notes[i].beamed &&
        notes[i].stem_dir < 0 &&
        !notes[i].twisted
      ) {
        slot.right_deco = Math.max(1, slot.right_deco)
      }
      if (notes[i].articulation == ARTICULATION.ARPEGGIATED) {
        slot.left_squiggle = CONFIG.SQUIGGLE_WIDTH_MUL
      }
      if (notes[i].accidental !== null) {
        pack_add(
          slot.acc_pack,
          i,
          k,
          notes[i].staff_pos - 3,
          notes[i].staff_pos + 2,
        )
        // slot.left_deco = Math.max(CONFIG.ACCIDENTAL_WIDTH_MUL,slot.left_deco);
      }
    }

    for (let i = 0; i < rests.length; i++) {
      let slot = slots[rests[i].begin]
      slot.mid_note = Math.max(slot.mid_note, CONFIG.REST_WIDTH_MUL)
    }
    for (let i = 0; i < measure.staves[k].grace.length; i++) {
      if (measure.staves[k].grace[i]) {
        let slot = slots[i]
        let d: [number, number, number] = [0, 0, 0]
        slot_pos(
          measure.staves[k].grace[i],
          measure.staves[k].grace[i].duration,
          d,
        )
        slot.left_grace =
          d[0] * CONFIG.GRACE_WIDTH_MUL +
          (d[1] * measure.staves[k].grace[i].pad.inter) / CONFIG.NOTE_WIDTH
      }
    }

    if (!notes.length) {
      slots[0].mid_note = Math.max(slots[0].mid_note, CONFIG.REST_WIDTH_MUL)
    }
  }
  for (let i = 0; i < slots.length; i++) {
    // console.log(JSON.stringify(slots[i].acc_pack));
    slots[i].left_deco =
      pack_width(slots[i].acc_pack) * CONFIG.ACCIDENTAL_WIDTH_MUL
  }
  for (let i = 0; i < slots.length; i++) {
    // console.log(JSON.stringify(slots[i].mid_pack));
    slots[i].mid_note = Math.max(
      slots[i].mid_note,
      pack_width(slots[i].mid_pack) * 1,
    )
  }

  let lyric_slots: boolean[] = new Array(slots.length).fill(false)
  for (let k = 0; k < measure.staves.length; k++) {
    let notes: Note[] = measure.staves[k].notes
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].lyric) {
        lyric_slots[notes[i].begin] = true
      }
    }
  }

  for (let k = 0; k < measure.staves.length; k++) {
    let notes: Note[] = measure.staves[k].notes
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].lyric) {
        let slot = slots[notes[i].begin]
        let w = get_text_width(notes[i].lyric) * CONFIG.LYRIC_SCALE
        let w0 =
          (slot.mid_note +
            slot.right_note +
            slot.right_deco +
            slot.right_spacing) *
          CONFIG.NOTE_WIDTH
        let n = notes[i].begin + 1
        while (!lyric_slots[n] && n < lyric_slots.length) {
          let ww =
            slots[n].left_deco +
            slots[n].left_grace +
            slots[n].left_note +
            slots[n].left_squiggle +
            slots[n].mid_note +
            slots[n].right_deco +
            slots[n].right_note +
            slots[n].right_spacing
          if (ww) {
            w0 += CONFIG.INTER_NOTE_WIDTH
          }
          w0 += ww * CONFIG.NOTE_WIDTH
          n++
        }
        if (w0 < w) {
          let due = (w - w0) / CONFIG.NOTE_WIDTH
          let spread = due / (n - notes[i].begin)
          for (let m = notes[i].begin; m < n; m++) {
            slots[m].right_spacing += spread
          }
        }
        // console.log(w,slot);
      }
    }
  }
  measure.slots = slots
}

function estimate_staff_ybound(
  staff: Staff,
  slurred_ids: Record<string, boolean>,
): [number, number] {
  let ymin = 0
  let ymax = (CONFIG.LINES_PER_STAFF - 1) * 2
  for (let i = 0; i < staff.notes.length; i++) {
    let note = staff.notes[i]
    let line = note.staff_pos
    let y0 = line
    let y1 = y0
    if (note.stem_dir < 0) {
      y0 -= note.stem_len * 2
    } else {
      y1 += note.stem_len * 2
    }
    if (note.tuplet) {
      if (note.stem_dir < 0) {
        y0 -= 3
      } else {
        y1 += 3
      }
    }
    if (note.articulation_pos) {
      y0 = Math.min(y0, note.articulation_pos[1] - 2)
      y1 = Math.max(y1, note.articulation_pos[1] + 2)
    }
    if (note.id && slurred_ids[note.id]) {
      y0 -= 2
      y1 += 2
    }

    y0 -= 1
    y1 += 1
    ymin = Math.min(ymin, y0)
    ymax = Math.max(ymax, y1)
  }
  for (let i = 0; i < staff.rests.length; i++) {
    let rest = staff.rests[i]
    ymin = Math.min(ymin, rest.staff_pos - 2)
    ymax = Math.max(ymax, rest.staff_pos + 2)
  }
  let ya = on_staff(ymin)
  let yb = on_staff(ymax)

  let { need_cue, need_lyric } = staff.flags

  let yc = need_cue ? CONFIG.CUE_HEIGHT : 0

  let yd = need_lyric
    ? FONT_INHERENT_HEIGHT * CONFIG.LYRIC_SCALE + CONFIG.LYRIC_SPACING * 2
    : 0

  return [ya, yb + yc + yd]
}

function compile_rests(staff: Staff) {
  let voice_median_staff_pos = get_median_staff_pos(staff.notes)
  let notes = staff.notes
  let rests = staff.rests
  function rest_staff_pos(rest: Rest): number {
    let y: number

    if (staff.voices <= 1) {
      y = 4
    } else if (staff.voices == 2) {
      if (voice_median_staff_pos[rest.voice] == undefined) {
        if (rest.voice) {
          y = 8
        } else {
          y = 0
        }
      } else {
        let other_voice = (rest.voice + 1) % staff.voices

        if (
          // (voice_median_staff_pos[other_voice] < voice_median_staff_pos[rest.voice]) ||
          //   (
          //     voice_median_staff_pos[other_voice] == voice_median_staff_pos[rest.voice] &&
          other_voice < rest.voice
          // )
        ) {
          y = voice_median_staff_pos[rest.voice] + 4
          for (let i = 0; i < notes.length; i++) {
            if (notes[i].voice != other_voice) {
              continue
            }
            if (notes[i].begin == rest.begin) {
              y = Math.max(y, 5 + notes[i].staff_pos)
            }
          }
          y = ~~(y / 2) * 2
        } else {
          y = voice_median_staff_pos[rest.voice] - 4

          for (let i = 0; i < notes.length; i++) {
            if (notes[i].voice != other_voice) {
              continue
            }
            if (notes[i].begin == rest.begin) {
              y = Math.min(y, -5 + notes[i].staff_pos)
            }
          }
          y = ~~(y / 2) * 2
        }
        // console.log(rest.channel,other_channel,channel_average_staff,y);
      }
    } else {
      y = voice_median_staff_pos[rest.voice]
    }
    return y
  }

  for (let i = 0; i < rests.length; i++) {
    rests[i].staff_pos = rest_staff_pos(rests[i])
  }
}

export function plan_measures(score: Score) {
  let measures: Measure[] = score.measures

  let measure_widths: [number, number, number][] = []

  for (let i = 0; i < measures.length; i++) {
    let w: [number, number, number] = [0, 0, 0]
    slot_pos(measures[i], measures[i].duration, w)
    w[0] += w[2] / CONFIG.NOTE_WIDTH
    measure_widths.push(w)
  }
  let rows: {
    num_inter: number
    count: number
    width: number
  }[] = [{ count: 0, width: 0, num_inter: 0 }]

  for (let i = 0; i < measures.length; i++) {
    if (!i) {
      measures[i].is_first_col = true
      score.first_col_measure_indices.push(i)
    }

    let row = rows[rows.length - 1]
    if (
      row.width + measure_widths[i][0] <=
      (CONTENT_WIDTH() - (rows.length == 1 ? score.indent : 0)) /
        CONFIG.NOTE_WIDTH
    ) {
      row.count++
      row.width += measure_widths[i][0]
      row.num_inter += measure_widths[i][1]
    } else {
      if (i) measures[i - 1].is_last_col = true
      measures[i].is_first_col = true
      score.first_col_measure_indices.push(i)
      for (let j = 0; j < measures[i].staves.length; j++) {
        measures[i].staves[j].flags.need_clef = true
        let [acc, num_acc] = measures[i].staves[j].key_signature
        measures[i].staves[j].flags.need_keysig = {
          accidental: acc,
          count: num_acc,
        }
      }
      let w: [number, number, number] = [0, 0, 0]
      slot_pos(measures[i], measures[i].duration, w)
      w[0] += w[2] / CONFIG.NOTE_WIDTH
      measure_widths[i] = w
      row = {
        count: 1,
        width: measure_widths[i][0],
        num_inter: measure_widths[i][1],
      }
      rows.push(row)
    }
  }

  // console.log(measures);

  let j0: number = 0
  let row_ybounds: [number, number][][] = []
  let num_staves = measures
    .map((x) => x.staves.length)
    .reduce((acc, x) => Math.max(acc, x), 0)

  for (let i = 0; i < rows.length; i++) {
    for (let k = 0; k < num_staves; k++) {
      let [has_cue, has_lyric] = [false, false]
      for (let j = j0; j < j0 + rows[i].count; j++) {
        if (!measures[j].staves[k]) {
          continue
        }

        has_cue = has_cue || measures[j].staves[k].flags.need_cue
        has_lyric = has_lyric || measures[j].staves[k].flags.need_lyric
      }
      for (let j = j0; j < j0 + rows[i].count; j++) {
        if (!measures[j].staves[k]) {
          continue
        }
        measures[j].staves[k].flags.need_cue = has_cue
        measures[j].staves[k].flags.need_lyric = has_lyric
      }
    }
    j0 += rows[i].count
  }

  j0 = 0
  for (let i = 0; i < rows.length; i++) {
    let extra =
      CONTENT_WIDTH() -
      (i == 0 ? score.indent : 0) -
      rows[i].width * CONFIG.NOTE_WIDTH
    let nw = extra / rows[i].num_inter

    for (let j = j0; j < j0 + rows[i].count; j++) {
      measures[j].pad.inter +=
        i == rows.length - 1 &&
        extra / CONTENT_WIDTH() > 1 - CONFIG.JUSTIFY_ALIGN_MIN
          ? 0
          : nw
    }
    j0 += rows[i].count
  }

  for (let i = 0; i < measures.length; i++) {
    let measure = measures[i] as Measure
    for (let j = 0; j < measure.staves.length; j++) {
      plan_beams(measure, j)
      plan_articulations(measure, j)
    }
  }

  j0 = 0
  for (let i = 0; i < rows.length; i++) {
    row_ybounds[i] = []
    for (let k = 0; k < num_staves; k++) {
      let [ya, yb] = [0, 0, 0, 0]
      for (let j = j0; j < j0 + rows[i].count; j++) {
        if (!measures[j].staves[k]) {
          continue
        }
        let [y0, y1] = estimate_staff_ybound(
          measures[j].staves[k],
          score.slurred_ids,
        )
        ya = Math.min(y0, ya)
        yb = Math.max(y1, yb)
        // console.log(y0,y1,ya,yb)
      }
      let ymin = ya
      let ymax = yb
      row_ybounds[i][k] = [ymin, ymax]
    }
    j0 += rows[i].count
  }

  let xoff = score.indent

  // let yoff = Math.max(CONFIG.INTER_ROW_HEIGHT,-row_ybounds[0][0][0]);
  let yoff = -row_ybounds[0][0][0]
  let row_num = 0
  let col_num = 0

  if (rows[0] && rows[1] && rows[0].count == 0) {
    xoff = 0
    yoff = -row_ybounds[1][0][0]
    row_num++
  }

  for (let i = 0; i < measures.length; i++) {
    let yo = 0
    let staves = measures[i].staves
    let w = slot_pos(measures[i], measures[i].duration)

    for (let j = 0; j < staves.length; j++) {
      let sp =
        CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1) +
        CONFIG.INTER_STAFF_HEIGHT
      let r = row_ybounds[row_num][j][1]
      let staff_xoff = xoff
      let staff_yoff = yoff + yo
      if (j != staves.length - 1) {
        r -= row_ybounds[row_num][j + 1][0]
      }
      sp = Math.max(sp, r)
      if (j != staves.length - 1) {
        yo += sp
      } else {
        yo += CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)
      }
      staves[j].coords.x = staff_xoff
      staves[j].coords.y = staff_yoff
      staves[j].coords.row = row_num
      staves[j].coords.col = col_num
      staves[j].coords.w = w
      staves[j].coords.local_y_min = row_ybounds[row_num][j][0]
      staves[j].coords.local_y_max = row_ybounds[row_num][j][1]

      for (let k = 0; k < staves[j].grace.length; k++) {
        if (!staves[j].grace[k]) {
          continue
        }
        let slot_x = slot_pos(measures[i], k)
        let slot = measures[i].slots[k]
        slot_x -=
          (slot.left_note +
            slot.left_deco +
            slot.left_squiggle +
            slot.left_grace) *
            CONFIG.NOTE_WIDTH +
          measures[i].pad.inter

        staves[j].grace[k].staves[0].coords.x = staff_xoff + slot_x
        staves[j].grace[k].staves[0].coords.y = staff_yoff
        staves[j].grace[k].staves[0].coords.row = row_num
        staves[j].grace[k].staves[0].coords.col = col_num
        staves[j].grace[k].staves[0].coords.w =
          slot_pos(staves[j].grace[k], staves[j].grace[k].duration) *
          CONFIG.GRACE_WIDTH_MUL
        staves[j].grace[k].staves[0].coords.local_y_min =
          row_ybounds[row_num][j][0]
        staves[j].grace[k].staves[0].coords.local_y_max =
          row_ybounds[row_num][j][1]
      }
    }

    xoff += w
    col_num++
    if (measures[i].is_last_col || i == measures.length - 1) {
      xoff = 0

      let sp = row_ybounds[row_num][row_ybounds[row_num].length - 1][1]
      sp -= CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)

      row_num++
      col_num = 0
      if (row_ybounds[row_num]) {
        sp -= row_ybounds[row_num][0][0]
      }
      sp = Math.max(sp + 30, CONFIG.INTER_ROW_HEIGHT)
      yo += sp
      yoff += yo
    }
  }
}
