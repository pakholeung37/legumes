import {
  Drawing,
  Element,
  Measure,
  Note,
  Note_register,
  Pack,
  Rest,
  Score,
  Slot,
  Tempo_itf,
} from './type'
import {
  ACCIDENTAL,
  ARTICULATION,
  BARLINE,
  BRACKET,
  CLEF,
  NOTE_LENGTH,
  note_name_to_staff_pos,
  ORDER_OF_ACCIDENTALS,
} from './common'
import { CONFIG, CONTENT_WIDTH, FONT_INHERENT_HEIGHT } from './config'
import { FONT, get_text_width } from './hershey'
import {
  cue_evade_slur,
  hf_drawing_polylines,
  slur_evade_note,
} from './drawing'
import { calc_num_flags, on_staff, slot_pos } from './utils'

let id_registry: Record<string, Note_register> = {}

function draw_staff(
  measure: Measure,
  staff_idx: number,
  no_staff_lines: boolean = false,
): Element[] {
  let staff = measure.staves[staff_idx]
  let notes = staff.notes
  let rests = staff.rests

  let result: Element[] = []

  let slots: Slot[] = measure.slots

  let ledgers: Set<number>[] = new Array(measure.duration)
    .fill(null)
    .map((_) => new Set())

  function put_ledgers_as_necessary(begin: number, line: number) {
    if (line < 0) {
      for (let i = Math.floor((line + 1) / 2) * 2; i < 0; i += 2) {
        ledgers[begin].add(i)
      }
    } else if (line > 9) {
      for (let i = 10; i < ~~(line / 2) * 2 + 1; i += 2) {
        ledgers[begin].add(i)
      }
    }
  }

  function draw_ledgers() {
    for (let i = 0; i < ledgers.length; i++) {
      let slot = slots[i]
      let slot_x = slot_pos(measure, i)

      for (let line of ledgers[i]) {
        result.push({
          tag: 'line',
          type: 'ledger',
          x:
            slot_x -
            slot.left_note * CONFIG.NOTE_WIDTH -
            (CONFIG.LEDGER_WIDTH_MUL / 2) * CONFIG.NOTE_WIDTH,
          y: on_staff(line),
          w:
            CONFIG.NOTE_WIDTH *
            (CONFIG.LEDGER_WIDTH_MUL +
              slot.left_note +
              slot.mid_note +
              slot.right_note),
          h: 0,
        })
      }
    }
  }

  function note_head_center_x(note: Note, slot_x: number) {
    let slot = slots[note.begin]
    let x: number =
      slot_x + CONFIG.NOTE_WIDTH * (Number(note.stem_dir < 0) * slot.mid_note)
    if (note.stem_dir < 0) {
      if (note.twisted) {
        x += CONFIG.NOTE_WIDTH / 2
      } else {
        x -= CONFIG.NOTE_WIDTH / 2
      }
    } else {
      if (note.twisted) {
        x -= CONFIG.NOTE_WIDTH / 2
      } else {
        x += CONFIG.NOTE_WIDTH / 2
      }
    }
    return x
  }

  function draw_note(note: Note, slot_x: number, line: number) {
    let slot = slots[note.begin]
    let head_note: Note = note
    let tail_note: Note = note
    let modifier_x =
      slot_x + CONFIG.NOTE_WIDTH * (slot.mid_note + slot.right_note + 0.5)

    slot_x += note.slot_shift
    modifier_x += note.modifier_shift

    while (head_note.prev_in_chord != null) {
      head_note = notes[head_note.prev_in_chord]
    }
    while (tail_note.next_in_chord != null) {
      tail_note = notes[tail_note.next_in_chord]
    }

    if (note.id) {
      let x: number =
        slot_x + CONFIG.NOTE_WIDTH * (Number(note.stem_dir < 0) * slot.mid_note)
      let reg: Note_register = {
        note,
        staff_idx,
        measure,
        row: null,
        col: null,
        chord_head_x: note_head_center_x(head_note, slot_x),
        chord_head_y: on_staff(head_note.staff_pos),
        head_x: note_head_center_x(note, slot_x),
        tail_x: x,
        head_y: on_staff(note.staff_pos),
        tail_y: null,
      }

      let n = note
      while (n.next_in_chord !== null) {
        n = staff.notes[n.next_in_chord]
      }
      let y1 = on_staff(n.staff_pos)
      y1 += n.stem_len * n.stem_dir * CONFIG.LINE_HEIGHT

      reg.tail_y = y1

      reg.chord_head_x += staff.coords.x
      reg.chord_head_y += staff.coords.y
      reg.head_x += staff.coords.x
      reg.head_y += staff.coords.y
      reg.tail_x += staff.coords.x
      reg.tail_y += staff.coords.y
      reg.row = staff.coords.row
      reg.col = staff.coords.col

      id_registry[note.id] = reg
    }

    if (note.modifier) {
      result.push({
        tag: 'dot',
        type: 'modifier',
        x: modifier_x,
        y: on_staff(line % 2 ? line : line + (note.voice % 2 ? 1 : -1)),
        w: 0,
        h: 0,
      })
    }

    if (note.articulation) {
      if (note.articulation != ARTICULATION.ARPEGGIATED) {
        let [xx, yy] = note.articulation_pos
        let x = xx
          ? slot_x +
            CONFIG.NOTE_WIDTH * (Number(note.stem_dir < 0) * slot.mid_note)
          : note_head_center_x(note, slot_x)
        let y = on_staff(yy)

        result.push({
          tag: 'articulation',
          type: note.articulation,
          dir: (xx ? -1 : 1) * note.stem_dir,
          x: x,
          y: y,
          w: CONFIG.NOTE_WIDTH,
          h: CONFIG.LINE_HEIGHT,
        })
      } else {
        let lh = head_note.staff_pos
        let lt = tail_note.staff_pos
        let ya = on_staff(lh - note.stem_dir)
        // let line_b = Math.round(lt+(note.stem_len*note.stem_dir)*2);
        let line_b = Math.round(lt + note.stem_dir)
        let yb = on_staff(line_b)

        let y0 = Math.min(ya, yb)
        let y1 = Math.max(ya, yb)
        result.push({
          tag: 'squiggle',
          type: 'arpeggiated_chord',
          x:
            slot_x -
            (slot.left_deco + slot.left_note + slot.left_squiggle / 2) *
              CONFIG.NOTE_WIDTH,
          y: y0,
          w: 0,
          h: y1 - y0,
        })
      }
    }

    result.push({
      tag: 'note_head',
      x:
        slot_x +
        CONFIG.NOTE_WIDTH * (Number(note.stem_dir < 0) * slot.mid_note),
      y: on_staff(line),
      w: CONFIG.NOTE_WIDTH,
      h: CONFIG.LINE_HEIGHT,
      twisted: note.twisted,
      stem_dir: note.stem_dir,
      duration: note.duration,
    })

    if (
      !note.beamed &&
      note.stem_len != 0 &&
      note.duration < NOTE_LENGTH.WHOLE
    ) {
      let y0 = note.stem_len * note.stem_dir
      let y1 = 0
      let y = y0
      let h = y1 - y
      result.push({
        tag: 'line',
        type: 'note_stem',
        x:
          slot_x +
          CONFIG.NOTE_WIDTH * (Number(note.stem_dir < 0) * slot.mid_note),
        y: on_staff(line + y * 2),
        w: 0,
        h: CONFIG.LINE_HEIGHT * h,
      })
    }

    if (!note.beamed && note.flag_count) {
      let flagcnt = note.flag_count
      for (let i = 0; i < flagcnt; i++) {
        let y = (note.stem_len - i * CONFIG.FLAG_SPACING) * note.stem_dir * 2
        result.push({
          tag: 'flag',
          x:
            slot_x +
            CONFIG.NOTE_WIDTH * (Number(note.stem_dir < 0) * slot.mid_note),
          y: on_staff(line + y),
          w: CONFIG.NOTE_WIDTH,
          h: CONFIG.LINE_HEIGHT,
          stem_dir: note.stem_dir,
          is_last: i == flagcnt - 1,
        })
      }
    }
  }

  function draw_accidental(acc: number, slot_x: number, line: number) {
    result.push({
      tag: 'accidental',
      type: acc,
      x: slot_x,
      y: on_staff(line),
      w: CONFIG.NOTE_WIDTH,
      h: CONFIG.LINE_HEIGHT,
    })
  }

  function draw_rest(rest: Rest, slot_x: number) {
    let dur = rest.duration
    if (rest.tuplet) {
      dur = rest.tuplet.display_duration
    }
    let y: number = rest.staff_pos

    if (CONFIG.WHOLE_HALF_REST_LEDGERS) {
      if (dur == NOTE_LENGTH.WHOLE) {
        // put_ledgers_as_necessary(rest.begin,y-2);
        let slot = slots[rest.begin]
        let line = y - 2
        result.push({
          tag: 'line',
          type: 'ledger',
          x:
            slot_x -
            slot.left_note * CONFIG.NOTE_WIDTH -
            0.5 * CONFIG.NOTE_WIDTH,
          y: on_staff(line),
          w:
            CONFIG.NOTE_WIDTH *
            (1 + slot.left_note + slot.mid_note + slot.right_note),
          h: 0,
        })
      } else if (dur == NOTE_LENGTH.HALF) {
        // put_ledgers_as_necessary(rest.begin,y);
        let slot = slots[rest.begin]
        let line = y
        result.push({
          tag: 'line',
          type: 'ledger',
          x:
            slot_x -
            slot.left_note * CONFIG.NOTE_WIDTH -
            0.5 * CONFIG.NOTE_WIDTH,
          y: on_staff(line),
          w:
            CONFIG.NOTE_WIDTH *
            (1 + slot.left_note + slot.mid_note + slot.right_note),
          h: 0,
        })
      }
    } else if (dur == NOTE_LENGTH.WHOLE || dur == NOTE_LENGTH.HALF) {
      y = Math.min(Math.max(y, 2), 8)
    }
    let line = on_staff(y)
    result.push({
      tag: 'rest',
      x: slot_x + CONFIG.NOTE_WIDTH / 2,
      y: line,
      w: CONFIG.NOTE_WIDTH,
      h: CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1),
      duration: dur,
    })
  }

  function draw_beam(notes_spanned: Note[]) {
    if (!notes_spanned.length) {
      return
    }

    let beat_length = ~~(NOTE_LENGTH.WHOLE / staff.time_signature[1])

    // let stem_length : number = notes_spanned.reduce((acc:number,x:Note)=>(acc+x.info.stem_len),0)/notes_spanned.length;
    let stem_dir = notes_spanned[0].stem_dir
    let flagcnts = []
    for (let i = 0; i < notes_spanned.length; i++) {
      flagcnts.push(notes_spanned[i].flag_count)
    }

    // let extra_len = Math.max(0,Math.max(...flagcnts)-1)*CONFIG.FLAG_SPACING;

    let pts: { x: number; y: number }[] = notes_spanned.map((n) => {
      let stem_length = n.stem_len //+extra_len;
      let x =
        slot_pos(measure, n.begin) +
        CONFIG.NOTE_WIDTH * (Number(n.stem_dir < 0) * slots[n.begin].mid_note) +
        n.slot_shift
      return { x, y: on_staff(2 * stem_dir * stem_length + n.staff_pos) }
    })

    let lengths = notes_spanned.map((x) => x.flag_count)
    let bins: number[] = new Array(pts.length * 2 - 2).fill(0)

    // let [m,b]:[number,number] = least_sq_regress(pts);
    // if (Math.abs(m) > CONFIG.BEAM_MAX_SLOPE){
    //   m = Math.sign(m)*CONFIG.BEAM_MAX_SLOPE;
    //   let anchor : {x:number,y:number};
    //   if (stem_dir < 0){
    //     anchor = pts.reduce((acc:{x:number,y:number},a:{x:number,y:number}):{x:number,y:number}=>(a.y<=acc.y?a:acc),{x:0,y:Infinity});
    //   }else{
    //     anchor = pts.reduce((acc:{x:number,y:number},a:{x:number,y:number}):{x:number,y:number}=>(a.y>=acc.y?a:acc),{x:0,y:-Infinity});
    //   }
    //   // m*x+b=y b=y-m*x
    //   b = anchor.y-m*anchor.x;
    // }

    for (let i = 0; i < pts.length; i++) {
      let flagcnt = flagcnts[i]

      let last_len: number | undefined = lengths[i - 1]
      let next_len: number | undefined = lengths[i + 1]
      if (i == 0) {
        bins[i * 2] = flagcnt
      } else if (i == pts.length - 1) {
        bins[i * 2 - 1] = flagcnt
      } else {
        if (
          Math.abs(lengths[i] - last_len) <= Math.abs(lengths[i] - next_len)
        ) {
          bins[i * 2 - 1] = flagcnt
        } else {
          bins[i * 2] = flagcnt
        }

        if (CONFIG.BEAM_POLICY == 3) {
          let same_beat_l =
            ~~(notes_spanned[i - 1].begin / beat_length) ==
            ~~(notes_spanned[i].begin / beat_length)
          let same_beat_r =
            ~~(notes_spanned[i].begin / beat_length) ==
            ~~(notes_spanned[i + 1].begin / beat_length)
          if (!same_beat_l && i != 1) {
            bins[i * 2 - 1] = 1
          }
          if (!same_beat_r && i != pts.length - 2) {
            bins[i * 2] = 1
          }
        }
      }
    }
    for (let i = 0; i < bins.length; i++) {
      if (bins[i] == 0) {
        let [i0, i1] = [~~(i / 2), ~~(i / 2) + 1]
        bins[i] = Math.min(lengths[i0], lengths[i1])
      }
    }

    let runs: [number, number, number][] = [[1, 0, bins.length]]

    let on: number = -1
    for (let i = 2; i <= 4; i++) {
      for (let j = 0; j < bins.length; j++) {
        if (bins[j] >= i && on < 0) {
          on = j
        }
        if (bins[j] < i && on >= 0) {
          runs.push([i, on, j])
          on = -1
        }
      }
      if (on >= 0) {
        runs.push([i, on, bins.length])
        on = -1
      }
    }
    // console.log(bins,runs);

    for (let i = 0; i < runs.length; i++) {
      let [t0, t1] = [runs[i][1] / 2, runs[i][2] / 2]
      let [i0, i1] = [~~t0, ~~t1]
      let [f0, f1] = [t0 - i0, t1 - i1]
      if (f0 > 0) {
        f0 += 0.2
      }
      if (f1 > 0) {
        f1 -= 0.2
      }
      let [j0, j1] = [
        Math.min(i0 + 1, pts.length - 1),
        Math.min(i1 + 1, pts.length - 1),
      ]

      let p0 = [pts[i0].x, pts[i0].y]
      let p1 = [pts[j0].x, pts[j0].y]

      let q0 = [pts[i1].x, pts[i1].y]
      let q1 = [pts[j1].x, pts[j1].y]

      let p = [p0[0] * (1 - f0) + p1[0] * f0, p0[1] * (1 - f0) + p1[1] * f0]
      let q = [q0[0] * (1 - f1) + q1[0] * f1, q0[1] * (1 - f1) + q1[1] * f1]
      result.push({
        tag: 'beam',
        x: p[0],
        y:
          p[1] -
          (runs[i][0] - 1) *
            stem_dir *
            CONFIG.LINE_HEIGHT *
            CONFIG.FLAG_SPACING,
        w: q[0] - p[0],
        h: q[1] - p[1],
        stem_dir,
      })
    }
    for (let i = 0; i < bins.length; i++) {
      let [i0, i1] = [~~(i / 2), ~~(i / 2) + 1]
      let [x0, v0, y0] = [pts[i0].x, pts[i0].y, pts[i0].y]
      let [x1, v1, y1] = [pts[i1].x, pts[i1].y, pts[i1].y]
      if (i % 2 == 0) {
        let u0 =
          v0 -
          notes_spanned[i0].stem_len *
            notes_spanned[i0].stem_dir *
            CONFIG.LINE_HEIGHT

        result.push({
          tag: 'line',
          type: 'note_stem',
          x: x0,
          y: y0,
          w: 0,
          h: u0 - y0,
        })
      } else if (i == bins.length - 1) {
        let u1 =
          v1 -
          notes_spanned[i1].stem_len *
            notes_spanned[i1].stem_dir *
            CONFIG.LINE_HEIGHT
        result.push({
          tag: 'line',
          type: 'note_stem',
          x: x1,
          y: y1,
          w: 0,
          h: u1 - y1,
        })
      }
    }
  }

  function draw_clef() {
    result.push({
      tag: 'clef',
      type: staff.clef,
      x: measure.pad.inter + (CONFIG.NOTE_WIDTH * CONFIG.CLEF_WIDTH_MUL) / 2,
      y: on_staff(
        {
          [CLEF.TREBLE]: 6,
          [CLEF.BASS]: 2,
          [CLEF.ALTO]: 4,
          [CLEF.BARITONE]: 0,
          [CLEF.SOPRANO]: 8,
          [CLEF.TENOR]: 2,
          [CLEF.MEZZO_SOPRANO]: 6,
        }[staff.clef],
      ),
      w: CONFIG.CLEF_WIDTH_MUL * CONFIG.NOTE_WIDTH,
      h: CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1),
    })
  }

  function draw_key_signature() {
    let { accidental, count } = staff.flags.need_keysig

    let is_cancel: boolean = false
    if (accidental == ~ACCIDENTAL.SHARP || accidental == ~ACCIDENTAL.FLAT) {
      is_cancel = true
      accidental = ~accidental
    }
    let targ_notes: string[] = Array.from(
      ORDER_OF_ACCIDENTALS[accidental].slice(0, count),
    )
    let octs: number[] =
      accidental == ACCIDENTAL.SHARP
        ? [6, 6, 6, 6, 5, 6, 5]
        : [5, 6, 5, 6, 5, 6, 5]
    let x =
      measure.pad.inter +
      Number(staff.flags.need_clef) *
        (CONFIG.NOTE_WIDTH * CONFIG.CLEF_WIDTH_MUL + measure.pad.inter)

    for (let i = 0; i < targ_notes.length; i++) {
      let n: string
      if (staff.clef == CLEF.TREBLE) {
        n = targ_notes[i] + '_' + octs[i]
      } else if (staff.clef == CLEF.BASS) {
        n = targ_notes[i] + '_' + (octs[i] - 2)
      } else if (staff.clef == CLEF.SOPRANO) {
        n = targ_notes[i] + '_' + (octs[i] - 1)
      } else if (staff.clef == CLEF.ALTO) {
        n = targ_notes[i] + '_' + (octs[i] - 1)
      } else if (staff.clef == CLEF.TENOR) {
        n = targ_notes[i] + '_' + (octs[i] - 1)
      } else if (staff.clef == CLEF.BARITONE) {
        n = targ_notes[i] + '_' + (octs[i] - 1)
      } else if (staff.clef == CLEF.MEZZO_SOPRANO) {
        n = targ_notes[i] + '_' + (octs[i] - 1)
      } else {
        n = targ_notes[i] + '_' + octs[i]
      }
      let line = note_name_to_staff_pos(n, staff.clef)
      result.push({
        tag: 'accidental',
        type: is_cancel ? ACCIDENTAL.NATURAL : accidental,
        x: x + i * CONFIG.NOTE_WIDTH * CONFIG.KEYSIG_WIDTH_MUL + 3,
        y: on_staff(line),
        w: CONFIG.NOTE_WIDTH,
        h: CONFIG.LINE_HEIGHT,
      })
    }
  }

  function draw_time_signature() {
    let x =
      measure.pad.inter +
      Number(staff.flags.need_clef) *
        (CONFIG.NOTE_WIDTH * CONFIG.CLEF_WIDTH_MUL + measure.pad.inter)
    if (staff.flags.need_keysig) {
      x +=
        staff.flags.need_keysig.count *
          CONFIG.NOTE_WIDTH *
          CONFIG.KEYSIG_WIDTH_MUL +
        measure.pad.inter
    }
    x += (CONFIG.TIMESIG_WIDTH_MUL * CONFIG.NOTE_WIDTH) / 2

    function draw_digit(d: number, x: number, line: number) {
      result.push({
        tag: 'timesig_digit',
        value: d,
        x: x,
        y: on_staff(line),
        w: CONFIG.TIMESIG_WIDTH_MUL * CONFIG.NOTE_WIDTH,
        h: (CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)) / 2,
      })
    }

    function draw_num(n: number, x: number, line: number) {
      let digits: number[] = Array.from(n.toString()).map(Number)
      let u = CONFIG.TIMESIG_WIDTH_MUL * CONFIG.NOTE_WIDTH * 0.5

      for (let i = 0; i < digits.length; i++) {
        draw_digit(digits[i], x - (digits.length * u) / 2 + i * u + u / 2, line)
      }
    }

    if (
      CONFIG.TIMESIG_COMMON_TIME_C &&
      ((staff.time_signature[0] == 2 && staff.time_signature[1] == 2) ||
        (staff.time_signature[0] == 4 && staff.time_signature[1] == 4))
    ) {
      result.push({
        tag: 'timesig_c',
        type: staff.time_signature[0] - 2 ? 'common' : 'cut',
        x: x,
        y: on_staff(4),
        w: CONFIG.TIMESIG_WIDTH_MUL * CONFIG.NOTE_WIDTH,
        h: (CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)) / 2,
      })
    } else {
      draw_num(staff.time_signature[0], x, 2)
      draw_num(staff.time_signature[1], x, 6)
    }
  }

  function draw_tuplets() {
    let tuplets: Record<
      string,
      {
        label: number
        stem_dir: number
        xmin: number
        xmax: number
        ymin: number
        ymax: number
      }
    > = {}

    function register_note_or_rest(n: Note | Rest, is_rest: boolean) {
      if (!n.tuplet) {
        return
      }
      let r = tuplets[n.tuplet.id]
      if (!r) {
        r = tuplets[n.tuplet.id] = {
          label: n.tuplet.label,
          stem_dir: -1,
          xmin: Infinity,
          xmax: -Infinity,
          ymin: Infinity,
          ymax: -Infinity,
        }
      }

      let slot = slots[n.begin]
      let slot_x = slot_pos(measure, n.begin)

      if (is_rest) {
        let rest: Rest = n as Rest
        let y0 = on_staff(rest.staff_pos)
        r.xmin = Math.min(r.xmin, slot_x)
        r.xmax = Math.max(r.xmax, slot_x + slot.mid_note * CONFIG.NOTE_WIDTH)
        r.ymin = Math.min(r.ymin, y0 - CONFIG.LINE_HEIGHT * 2)
        r.ymax = Math.max(r.ymax, y0 + CONFIG.LINE_HEIGHT * 2)
      } else {
        let note: Note = n as Note
        r.stem_dir = note.stem_dir
        let y = on_staff(note.staff_pos)
        let y0 = y + CONFIG.LINE_HEIGHT / 2
        let y1 =
          y +
          note.stem_len * note.stem_dir * CONFIG.LINE_HEIGHT +
          Math.max(0, note.flag_count - 1) *
            CONFIG.FLAG_SPACING *
            note.stem_dir *
            CONFIG.LINE_HEIGHT
        if (note.stem_dir < 0) {
          r.xmin = Math.min(
            r.xmin,
            slot_x - (slot.left_note - 0.5) * CONFIG.NOTE_WIDTH,
          )
          r.xmax = Math.max(r.xmax, slot_x + slot.mid_note * CONFIG.NOTE_WIDTH)
        } else {
          r.xmin = Math.min(r.xmin, slot_x)
          r.xmax = Math.max(
            r.xmax,
            slot_x +
              (slot.mid_note + slot.right_note - 0.5) * CONFIG.NOTE_WIDTH,
          )
        }
        r.ymin = Math.min(r.ymin, y0, y1)
        r.ymax = Math.max(r.ymax, y0, y1)
      }
    }

    for (let i = 0; i < staff.notes.length; i++) {
      register_note_or_rest(staff.notes[i], false)
    }
    for (let i = 0; i < staff.rests.length; i++) {
      register_note_or_rest(staff.rests[i], true)
    }

    for (let k in tuplets) {
      let { label, stem_dir, ymin, ymax, xmin, xmax } = tuplets[k]
      let y = stem_dir < 0 ? ymin : ymax
      result.push({
        tag: 'tuplet_label',
        label,
        x: xmin,
        y: y + stem_dir * CONFIG.LINE_HEIGHT * CONFIG.TUPLET_LABEL_SPACING,
        w: xmax - xmin,
        h: (stem_dir * CONFIG.LINE_HEIGHT) / 2,
      })
    }
  }

  function draw_lyric(note: Note, slot_x: number) {
    let ymax_sans_lyric: number
    ymax_sans_lyric =
      staff.coords.local_y_max -
      CONFIG.LYRIC_SPACING -
      CONFIG.LYRIC_SCALE * FONT_INHERENT_HEIGHT

    // console.log(y_bound,ymax_sans_lyric);
    result.push({
      tag: 'lyric',
      text: note.lyric,
      x: slot_x,
      y: ymax_sans_lyric,
      w: get_text_width(note.lyric) * CONFIG.LYRIC_SCALE,
      h: FONT_INHERENT_HEIGHT * CONFIG.LYRIC_SCALE,
    })
  }

  function draw_cue(nr: Note | Rest, slot_x: number) {
    let slot = slots[nr.begin]
    let ymax_sans_cue: number
    ymax_sans_cue =
      staff.coords.local_y_max -
      (staff.flags.need_lyric
        ? CONFIG.LYRIC_SPACING * 2 + CONFIG.LYRIC_SCALE * FONT_INHERENT_HEIGHT
        : 0) -
      CONFIG.CUE_HEIGHT

    let x = slot_x
    if (nr.cue.position == 0) {
      x += (CONFIG.NOTE_WIDTH * slot.mid_note) / 2
    } else if (nr.cue.position == -1) {
      x -=
        CONFIG.NOTE_WIDTH *
          (slot.left_note +
            slot.left_deco +
            slot.left_squiggle +
            slot.left_grace) +
        measure.pad.inter / 2
    } else if (nr.cue.position == 1) {
      x +=
        CONFIG.NOTE_WIDTH *
          (slot.mid_note + slot.right_deco + slot.right_note) +
        measure.pad.inter / 2
    }
    // console.log(y_bound,ymax_sans_cue);
    result.push({
      tag: 'cue',
      text: nr.cue.data,
      x: x,
      y: ymax_sans_cue - (CONFIG.CUE_TEXT_SIZE - CONFIG.CUE_HEIGHT) / 2,
      w: CONFIG.NOTE_WIDTH,
      h: CONFIG.CUE_TEXT_SIZE,
    })
  }

  if (CONFIG.DEBUG_BLOCKS) {
    ;(function draw_dbg() {
      // for (let i = 0; i < slots.length; i++){
      //   let slot_x = slot_pos(measure,i);
      //   result.push({
      //     tag:'dbg', color:'red',
      //     x:slot_x,
      //     y:on_staff(0),
      //     w: slots[i].mid_note*CONFIG.NOTE_WIDTH,
      //     h: CONFIG.LINE_HEIGHT*(CONFIG.LINES_PER_STAFF-1),
      //   })
      // }
      for (let i = 0; i < slots.length; i++) {
        let slot_x = slot_pos(measure, i)
        result.push({
          tag: 'dbg',
          color: ['red', 'blue', 'green'][~~(Math.random() * 3)],
          x: slot_x,
          y: staff.coords.local_y_min,
          w: slots[i].mid_note * CONFIG.NOTE_WIDTH,
          h: staff.coords.local_y_max - staff.coords.local_y_min,
        })
      }
    })()
  }

  if (!no_staff_lines) {
    let measure_render_width: number = slot_pos(measure, measure.duration)
    for (let i = 0; i < CONFIG.LINES_PER_STAFF; i++) {
      result.push({
        tag: 'line',
        type: 'staff_line',
        x: 0,
        y: i * CONFIG.LINE_HEIGHT,
        w: measure_render_width,
        h: 0,
      })
    }
  }

  if (staff.flags.need_clef) {
    draw_clef()
  }
  if (staff.flags.need_keysig) {
    draw_key_signature()
  }
  if (staff.flags.need_timesig) {
    draw_time_signature()
  }

  for (let i = 0; i < notes.length; i++) {
    let note = notes[i]

    let line = note.staff_pos
    let slot_x = slot_pos(measure, note.begin)
    let slot = slots[note.begin]

    put_ledgers_as_necessary(note.begin, line)
    draw_note(note, slot_x, line)
    if (note.lyric) {
      draw_lyric(note, slot_x)
    }
    if (note.cue) {
      draw_cue(note, slot_x)
    }
    if (note.accidental !== null) {
      let x = slot.acc_pack.intervals[staff_idx].find((a) => a.idx == i).x
      draw_accidental(
        note.accidental,
        slot_x -
          CONFIG.NOTE_WIDTH * slot.left_note -
          CONFIG.NOTE_WIDTH * CONFIG.ACCIDENTAL_WIDTH_MUL * 0.6 -
          CONFIG.NOTE_WIDTH * CONFIG.ACCIDENTAL_WIDTH_MUL * x * 0.8,
        line,
      )
    }
  }

  let beams = staff.beams
  for (let b of beams) {
    let notes_spanned = []
    for (let i = 0; i < b.length; i++) {
      notes_spanned.push(notes[b[i]])
    }
    if (!notes_spanned.length) {
      continue
    }
    draw_beam(notes_spanned)
  }

  for (let i = 0; i < rests.length; i++) {
    let rest = rests[i]
    let slot_x = slot_pos(measure, rest.begin)
    draw_rest(rest, slot_x)
    if (rest.cue) {
      draw_cue(rest, slot_x)
    }
  }

  draw_tuplets()

  draw_ledgers()

  translate_elements(result, staff.coords.x, staff.coords.y)

  for (let i = 0; i < staff.grace.length; i++) {
    if (!staff.grace[i]) {
      continue
    }

    let nw0 = CONFIG.NOTE_WIDTH
    CONFIG.NOTE_WIDTH *= CONFIG.GRACE_WIDTH_MUL
    let ret = draw_staff(staff.grace[i], 0, true)
    CONFIG.NOTE_WIDTH = nw0

    ret.forEach((x) => {
      x.mini = true
      result.push(x)
    })
  }

  return result
}

function translate_elements(elts: Element[], x: number, y: number) {
  for (let i = 0; i < elts.length; i++) {
    elts[i].x += x
    elts[i].y += y
    if (elts[i].x1) {
      elts[i].x1 += x
    }
    if (elts[i].y1) {
      elts[i].y1 += y
    }
  }
}

function draw_measures(score: Score): Element[] {
  let measures: Measure[] = score.measures
  let result: Element[] = []
  let human_measure_count = 0

  for (let i = 0; i < measures.length; i++) {
    let staves = measures[i].staves

    if (CONFIG.SHOW_MEASURE_NUMBER) {
      // console.log(measures[i].duration , staves[0].time_signature[0] * (64/staves[0].time_signature[1]))
      if (
        staves[0] &&
        measures[i].duration >=
          staves[0].time_signature[0] * (64 / staves[0].time_signature[1])
      ) {
        human_measure_count++
      } else if (
        staves[0] &&
        measures[i + 1] &&
        measures[i + 1].staves[0] &&
        measures[i + 1].staves[0].key_signature[0] ==
          staves[0].key_signature[0] &&
        measures[i + 1].staves[0].key_signature[1] ==
          staves[0].key_signature[1] &&
        measures[i].duration + measures[i + 1].duration ==
          staves[0].time_signature[0] * (64 / staves[0].time_signature[1])
      ) {
        human_measure_count++
      }
    }

    if (measures[i].is_first_col) {
      let staff_count = 0

      for (let j = 0; j < score.instruments.length; j++) {
        if (!staves[staff_count]) {
          break
        }
        let y0 = staves[staff_count].coords.y
        let y1 =
          staves[staff_count + score.instruments[j].names.length - 1].coords.y +
          CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)

        if (!j && i && CONFIG.SHOW_MEASURE_NUMBER) {
          let t = human_measure_count.toString()
          let w =
            (get_text_width(t, FONT.DUPLEX, -2) *
              CONFIG.MEASURE_NUMBER_TEXT_SIZE) /
            FONT_INHERENT_HEIGHT
          result.push({
            tag: 'regular_text',
            type: 'measure_number',
            text: t,
            x: staves[0].coords.x - w / 2,
            y: y0 - CONFIG.MEASURE_NUMBER_TEXT_SIZE - 14,
            w,
            h: CONFIG.MEASURE_NUMBER_TEXT_SIZE,
          })
        }

        if (!i && score.indent) {
          if (new Set(score.instruments[j].names).size == 1) {
            let w =
              (get_text_width(score.instruments[j].names[0], FONT.DUPLEX, -2) *
                CONFIG.INSTRUMENT_TEXT_SIZE) /
              FONT_INHERENT_HEIGHT
            result.push({
              tag: 'regular_text',
              type: 'instrument',
              text: score.instruments[j].names[0],
              x: staves[0].coords.x - w - CONFIG.INSTRUMENT_PAD_RIGHT,
              y: (y0 + y1) / 2 - CONFIG.INSTRUMENT_TEXT_SIZE / 2,
              w: w,
              h: CONFIG.INSTRUMENT_TEXT_SIZE,
            })
          } else {
            for (let k = 0; k < score.instruments[j].names.length; k++) {
              let z0 = staves[staff_count + k].coords.y
              let z1 =
                staves[staff_count + k].coords.y +
                CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)
              let w =
                (get_text_width(
                  score.instruments[j].names[k],
                  FONT.DUPLEX,
                  -2,
                ) *
                  CONFIG.INSTRUMENT_TEXT_SIZE) /
                FONT_INHERENT_HEIGHT
              result.push({
                tag: 'regular_text',
                type: 'instrument',
                text: score.instruments[j].names[k],
                x: staves[0].coords.x - w - CONFIG.INSTRUMENT_PAD_RIGHT,
                y: (z0 + z1) / 2 - CONFIG.INSTRUMENT_TEXT_SIZE / 2,
                w: w,
                h: CONFIG.INSTRUMENT_TEXT_SIZE,
              })
            }
          }
        }

        if (score.instruments[j].bracket != BRACKET.NONE) {
          result.push({
            tag: 'bracket',
            type: score.instruments[j].bracket,
            x: staves[0].coords.x,
            y: y0,
            w: 0,
            h: y1 - y0,
          })
        }
        staff_count += score.instruments[j].names.length
      }

      if (staves.length > 1) {
        result.push({
          tag: 'line',
          type: 'barline',
          x: staves[0].coords.x,
          y: staves[0].coords.y,
          w: 0,
          h:
            staves[staves.length - 1].coords.y +
            CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1) -
            staves[0].coords.y,
        })
      }

      if (CONFIG.JOIN_STAFF_LINES) {
        let last_measure_of_row =
          (score.first_col_measure_indices[staves[0].coords.row + 1] ??
            measures.length) - 1
        let x1 =
          measures[last_measure_of_row].staves[0].coords.x +
          measures[last_measure_of_row].staves[0].coords.w
        for (let j = 0; j < staves.length; j++) {
          let y0 = staves[j].coords.y
          for (let k = 0; k < CONFIG.LINES_PER_STAFF; k++) {
            result.push({
              tag: 'line',
              type: 'staff_line',
              x: staves[0].coords.x,
              y: y0 + k * CONFIG.LINE_HEIGHT,
              w: x1 - staves[0].coords.x,
              h: 0,
            })
          }
        }
      }
    }

    for (let j = 0; j < staves.length; j++) {
      let ret = draw_staff(measures[i], j, CONFIG.JOIN_STAFF_LINES)
      ret.forEach((x) => result.push(x))
    }
    if (!score.instruments.length) {
      result.push({
        tag: 'line',
        type: 'barline',
        x: staves[0].coords.x + staves[0].coords.w,
        y: staves[0].coords.y,
        w: 0,
        h:
          staves[staves.length - 1].coords.y +
          CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1) -
          staves[0].coords.y,
      })
    }
    let staff_count = 0
    for (let j = 0; j < score.instruments.length; j++) {
      for (let k = 0; k < score.instruments[j].names.length; k++) {
        let z0 = staves[staff_count + k].coords.y
        let z1 =
          staves[staff_count + k].coords.y +
          CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1)
        let z2 = staves[staff_count + k + 1]
          ? staves[staff_count + k + 1].coords.y
          : z1
        if (
          measures[i].barline == BARLINE.SINGLE ||
          measures[i].barline == BARLINE.REPEAT_BEGIN
        ) {
          result.push({
            tag: 'line',
            type: 'barline',
            x:
              staves[staff_count + k].coords.x +
              staves[staff_count + k].coords.w,
            y: z0,
            w: 0,
            h: (score.instruments[j].connect_barlines[k] ? z2 : z1) - z0,
          })
        }
        if (measures[i].barline == BARLINE.DOUBLE) {
          result.push({
            tag: 'line',
            type: 'barline',
            x:
              staves[staff_count + k].coords.x +
              staves[staff_count + k].coords.w,
            y: z0,
            w: 0,
            h: (score.instruments[j].connect_barlines[k] ? z2 : z1) - z0,
          })
          result.push({
            tag: 'line',
            type: 'barline',
            x:
              staves[staff_count + k].coords.x +
              staves[staff_count + k].coords.w -
              4,
            y: z0,
            w: 0,
            h: (score.instruments[j].connect_barlines[k] ? z2 : z1) - z0,
          })
        }
        if (
          measures[i].barline == BARLINE.END ||
          measures[i].barline == BARLINE.REPEAT_END ||
          measures[i].barline == BARLINE.REPEAT_END_BEGIN
        ) {
          for (let l = 0; l < 4; l++) {
            result.push({
              tag: 'line',
              type: 'barline',
              x:
                staves[staff_count + k].coords.x +
                staves[staff_count + k].coords.w -
                l,
              y: z0,
              w: 0,
              h: (score.instruments[j].connect_barlines[k] ? z2 : z1) - z0,
            })
          }
          result.push({
            tag: 'line',
            type: 'barline',
            x:
              staves[staff_count + k].coords.x +
              staves[staff_count + k].coords.w -
              8,
            y: z0,
            w: 0,
            h: (score.instruments[j].connect_barlines[k] ? z2 : z1) - z0,
          })
          if (measures[i].barline != BARLINE.END) {
            result.push({
              tag: 'dot',
              type: 'barline_repeat',
              x:
                staves[staff_count + k].coords.x +
                staves[staff_count + k].coords.w -
                12,
              y: z0 + CONFIG.LINE_HEIGHT * 1.5,
              w: 0,
              h: 0,
            })
            result.push({
              tag: 'dot',
              type: 'barline_repeat',
              x:
                staves[staff_count + k].coords.x +
                staves[staff_count + k].coords.w -
                12,
              y: z0 + CONFIG.LINE_HEIGHT * 2.5,
              w: 0,
              h: 0,
            })
          }
        }
        if (
          measures[i].barline == BARLINE.REPEAT_BEGIN ||
          measures[i].barline == BARLINE.REPEAT_END_BEGIN
        ) {
          // console.log('!');
          let x0 =
            measures[i + 1].staves[staff_count + k].coords.x +
            slot_pos(measures[i + 1], -1)
          let y0 = measures[i + 1].staves[staff_count + k].coords.y
          let xl =
            staves[staff_count + k].coords.x + staves[staff_count + k].coords.w
          let adj =
            measures[i].barline == BARLINE.REPEAT_END_BEGIN &&
            Math.abs(x0 - xl) < 0.01
          if (!adj) {
            for (let l = 1; l < 4; l++) {
              result.push({
                tag: 'line',
                type: 'barline',
                x: x0 + l,
                y: y0,
                w: 0,
                h: (score.instruments[j].connect_barlines[k] ? z2 : z1) - z0,
              })
            }
          }
          result.push({
            tag: 'line',
            type: 'barline',
            x: x0 + 8 - 3 * Number(adj),
            y: y0,
            w: 0,
            h: (score.instruments[j].connect_barlines[k] ? z2 : z1) - z0,
          })
          result.push({
            tag: 'dot',
            type: 'barline_repeat',
            x: x0 + 12 - 3 * Number(adj),
            y: y0 + CONFIG.LINE_HEIGHT * 1.5,
            w: 0,
            h: 0,
          })
          result.push({
            tag: 'dot',
            type: 'barline_repeat',
            x: x0 + 12 - 3 * Number(adj),
            y: y0 + CONFIG.LINE_HEIGHT * 2.5,
            w: 0,
            h: 0,
          })
        }
      }
      staff_count += score.instruments[j].names.length
    }
  }
  return result
}

function draw_slurs(score: Score): Element[] {
  // console.log(id_registry);
  let result: Element[] = []
  let row_yoffsets = score.measures
    .filter((x) => x.is_first_col)
    .map((x) => x.staves[0].coords.y)

  // let been_left : Record<string,number> = {};

  for (let i = 0; i < score.slurs.length; i++) {
    let { left, right, is_tie } = score.slurs[i]
    // console.log(score.slurs[i]);
    let lreg = id_registry[left]
    let rreg = id_registry[right]
    let x0: number, y0: number, x1: number, y1: number, dir: number
    let sh_lh = lreg.note.articulation ? 4 : 7
    let sh_lt = lreg.note.articulation ? 2 : 5
    let sh_rh = rreg.note.articulation ? 4 : 7
    let sh_rt = rreg.note.articulation ? 2 : 5

    let l_is_grace =
      score.measures[score.first_col_measure_indices[lreg.row] + lreg.col] !=
      lreg.measure

    if (is_tie) {
      if (
        lreg.note.voice == 0 &&
        rreg.note.voice == 0 &&
        lreg.measure.staves[lreg.staff_idx].voices == 1 &&
        rreg.measure.staves[rreg.staff_idx].voices == 1 &&
        lreg.note.stem_dir == rreg.note.stem_dir
      ) {
        if (
          lreg.note.next_in_chord == null &&
          lreg.note.prev_in_chord != null &&
          rreg.note.next_in_chord == null &&
          rreg.note.prev_in_chord != null
        ) {
          dir = lreg.note.stem_dir
        } else {
          dir = -lreg.note.stem_dir
        }
        ;[x0, y0] = [lreg.head_x, lreg.head_y + sh_lh * dir]
        ;[x1, y1] = [rreg.head_x, rreg.head_y + sh_rh * dir]
      } else {
        if (Math.max(lreg.note.voice, rreg.note.voice) % 2) {
          dir = 1
          ;[x0, y0] = [lreg.head_x, lreg.head_y + sh_lh]
          ;[x1, y1] = [rreg.head_x, rreg.head_y + sh_rh]
        } else {
          dir = -1
          ;[x0, y0] = [lreg.head_x, lreg.head_y - sh_lh]
          ;[x1, y1] = [rreg.head_x, rreg.head_y - sh_rh]
        }
      }
    } else {
      sh_lh = lreg.note.articulation
        ? lreg.note.articulation == ARTICULATION.STACCATO
          ? Math.abs(
              (lreg.note.articulation_pos[1] * CONFIG.LINE_HEIGHT) / 2 -
                (lreg.chord_head_y -
                  lreg.measure.staves[lreg.staff_idx].coords.y),
            ) + 5
          : 4
        : 7
      sh_rh = rreg.note.articulation
        ? rreg.note.articulation == ARTICULATION.STACCATO
          ? Math.abs(
              (rreg.note.articulation_pos[1] * CONFIG.LINE_HEIGHT) / 2 -
                (rreg.chord_head_y -
                  rreg.measure.staves[rreg.staff_idx].coords.y),
            ) + 5
          : 4
        : 7

      if (
        (lreg.measure.staves[lreg.staff_idx].voices > 1 ||
          rreg.measure.staves[rreg.staff_idx].voices > 1) &&
        lreg.note.stem_dir == rreg.note.stem_dir
      ) {
        if (lreg.note.stem_dir == 1) {
          dir = 1
          ;[x0, y0] = [lreg.tail_x, lreg.tail_y + sh_lt]
          ;[x1, y1] = [rreg.tail_x, rreg.tail_y + sh_rt]
        } else {
          dir = -1
          ;[x0, y0] = [lreg.tail_x, lreg.tail_y - sh_lt]
          ;[x1, y1] = [rreg.tail_x, rreg.tail_y - sh_rt]
        }
      } else {
        let head_to_tail_better =
          Math.abs(lreg.chord_head_y - rreg.tail_y) <
          Math.abs(lreg.tail_y - rreg.chord_head_y) + 5
        let tail_to_tail_better =
          Math.abs(lreg.tail_y - rreg.tail_y) <
          Math.abs(lreg.chord_head_y - rreg.chord_head_y) - 40

        if (lreg.note.stem_dir < 0 && rreg.note.stem_dir < 0) {
          if (tail_to_tail_better) {
            dir = -1
            ;[x0, y0] = [lreg.tail_x, lreg.tail_y - sh_lt]
            ;[x1, y1] = [rreg.tail_x, rreg.tail_y - sh_rt]
          } else {
            dir = 1
            ;[x0, y0] = [lreg.chord_head_x, lreg.chord_head_y + sh_lh]
            ;[x1, y1] = [rreg.chord_head_x, rreg.chord_head_y + sh_rh]
          }
        } else if (lreg.note.stem_dir < 0 && rreg.note.stem_dir > 0) {
          if (head_to_tail_better) {
            dir = 1
            ;[x0, y0] = [lreg.chord_head_x, lreg.chord_head_y + sh_lh]
            ;[x1, y1] = [rreg.tail_x, rreg.tail_y + sh_rt]
          } else {
            dir = -1
            ;[x0, y0] = [lreg.tail_x, lreg.tail_y - sh_lt]
            ;[x1, y1] = [rreg.chord_head_x, rreg.chord_head_y - sh_rh]
          }
        } else if (lreg.note.stem_dir > 0 && rreg.note.stem_dir > 0) {
          if (tail_to_tail_better) {
            dir = 1
            ;[x0, y0] = [lreg.tail_x, lreg.tail_y + sh_lt]
            ;[x1, y1] = [rreg.tail_x, rreg.tail_y + sh_rt]
          } else {
            dir = -1
            ;[x0, y0] = [lreg.chord_head_x, lreg.chord_head_y - sh_lh]
            ;[x1, y1] = [rreg.chord_head_x, rreg.chord_head_y - sh_rh]
          }
        } else {
          if (head_to_tail_better) {
            dir = -1
            ;[x0, y0] = [lreg.chord_head_x, lreg.chord_head_y - sh_lh]
            ;[x1, y1] = [rreg.tail_x, rreg.tail_y - sh_rt]
          } else {
            dir = 1
            ;[x0, y0] = [lreg.tail_x, lreg.tail_y + sh_lt]
            ;[x1, y1] = [rreg.chord_head_x, rreg.chord_head_y + sh_rh]
          }
        }
      }
    }
    // if (been_left[left]){
    // dir = - been_left[left];
    // y0 += (CONFIG.LINE_HEIGHT+10) * dir;
    // y1 += (CONFIG.LINE_HEIGHT+10) * dir;
    // }
    // been_left[left] = dir;

    if (is_tie) {
      x0 += 3
      x1 -= 3
    } else {
      x0 += 2
      x1 -= 2
    }

    function notes_ybounds(notes: Note[]): [number, number] {
      if (!notes.length) {
        return null
      }
      let ymin = Infinity
      let ymax = -Infinity
      for (let i = 0; i < notes.length; i++) {
        let y0 = on_staff(notes[i].staff_pos)
        let y1 = y0 + notes[i].stem_dir * notes[i].stem_len * CONFIG.LINE_HEIGHT
        if (notes[i].accidental != null) {
          y0 -= CONFIG.LINE_HEIGHT
          y1 += CONFIG.LINE_HEIGHT
        }
        ymin = Math.min(y0, y1, ymin)
        ymax = Math.max(y0, y1, ymax)
      }
      return [ymin, ymax]
    }

    function share_measure_ybound_in_slur(): [number, number] {
      let m0 = score.first_col_measure_indices[lreg.row] + lreg.col
      let m1 = score.first_col_measure_indices[rreg.row] + rreg.col
      if (m0 != m1) {
        return null
      }
      let b0 = get_begin(lreg)
      let b1 = get_begin(rreg)
      let notes = score.measures[m0].staves[lreg.staff_idx].notes.filter(
        (x) => b0 < x.begin && x.begin < b1,
      )
      return notes_ybounds(notes)
    }

    function get_begin(reg: Note_register) {
      let m = score.first_col_measure_indices[reg.row] + reg.col
      if (score.measures[m] != reg.measure) {
        for (
          let i = 0;
          i < score.measures[m].staves[reg.staff_idx].grace.length;
          i++
        ) {
          if (score.measures[m].staves[reg.staff_idx].grace[i] == reg.measure) {
            return i
          }
        }
      }
      return reg.note.begin
    }

    function self_measure_ybound_in_slur(
      reg: Note_register,
      sign: number,
    ): [number, number] {
      let m = score.first_col_measure_indices[reg.row] + reg.col

      let begin = reg.note.begin
      if (score.measures[m] != reg.measure) {
        for (
          let i = 0;
          i < score.measures[m].staves[reg.staff_idx].grace.length;
          i++
        ) {
          if (score.measures[m].staves[reg.staff_idx].grace[i] == reg.measure) {
            begin = i
            break
          }
        }
      }
      let notes = score.measures[m].staves[reg.staff_idx].notes.filter(
        (x) => Math.sign(x.begin - begin) == sign,
      )
      return notes_ybounds(notes)
    }

    function inter_ybound_in_slur(situation: number): [number, number] {
      let m0 = score.first_col_measure_indices[lreg.row] + lreg.col
      let m1 = score.first_col_measure_indices[rreg.row] + rreg.col
      if (situation == 1) {
        if (
          score.first_col_measure_indices[lreg.row + 1] &&
          score.first_col_measure_indices[lreg.row + 1] < m1
        ) {
          m1 = score.first_col_measure_indices[lreg.row + 1]
        }
      } else if (situation == 2) {
        if (
          score.first_col_measure_indices[rreg.row] &&
          score.first_col_measure_indices[rreg.row] > m0
        ) {
          m0 = score.first_col_measure_indices[rreg.row] - 1
        }
      }
      // if (situation == 0)console.log(m0,m1);
      if (m0 + 1 >= m1) {
        return null
      }
      let ymin = Infinity
      let ymax = -Infinity
      for (let i = m0 + 1; i < m1; i++) {
        // console.log(score.measures[i].staves[lreg.staff_idx].coords)
        // let ya = score.measures[i].staves[lreg.staff_idx].coords.local_y_min;
        // let yb = score.measures[i].staves[rreg.staff_idx].coords.local_y_max;

        // let [ya,yb] = estimate_staff_ybound(score.measures[i].staves[lreg.staff_idx]);
        let [ya, yb] = notes_ybounds(
          score.measures[i].staves[lreg.staff_idx].notes,
        )
        if (ya == null) {
          ya = 0
          yb = CONFIG.LINE_HEIGHT * 4
        }

        ymin = Math.min(ymin, ya)
        ymax = Math.max(ymax, yb)
      }
      return [ymin, ymax]
    }

    let dy: number = null
    let ymin: number = null
    let ymax: number = null

    function compute_slur(situation: number) {
      dy = null
      ymin = ymax = null
      if (!is_tie && lreg.staff_idx == rreg.staff_idx) {
        let m0 = score.first_col_measure_indices[lreg.row] + lreg.col
        let m1 = score.first_col_measure_indices[rreg.row] + rreg.col

        if (m0 <= m1) {
          if (m0 == m1) {
            let ret = share_measure_ybound_in_slur()
            if (ret) [ymin, ymax] = ret
          } else {
            let rets: [number, number][]

            if (situation == 0) {
              rets = [
                self_measure_ybound_in_slur(lreg, 1),
                inter_ybound_in_slur(0),
                self_measure_ybound_in_slur(rreg, -1),
              ]
              if (rreg.measure.staves[rreg.staff_idx].flags.need_clef) {
                rets.push([
                  CONFIG.LINE_HEIGHT,
                  CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF - 1),
                ])
                // console.log(rets);
              }
              // console.log(rets);
            } else if (situation == 1) {
              rets = [
                self_measure_ybound_in_slur(lreg, 1),
                inter_ybound_in_slur(1),
              ]
            } else if (situation == 2) {
              rets = [
                inter_ybound_in_slur(2),
                self_measure_ybound_in_slur(rreg, -1),
              ]
              // console.log(rets);
            }
            // console.log(m0,m1,lreg.staff_idx,rets);
            for (let i = 0; i < rets.length; i++) {
              if (rets[i] == null) {
                continue
              }
              if (ymin === null) {
                ;[ymin, ymax] = rets[i]
              } else {
                ymin = Math.min(rets[i][0], ymin)
                ymax = Math.max(rets[i][1], ymax)
              }
            }
          }
          if (ymin !== null) {
            let yl = y0 - lreg.measure.staves[lreg.staff_idx].coords.y
            let yr = y1 - rreg.measure.staves[rreg.staff_idx].coords.y

            let ya: number
            let yb: number
            if (situation == 0) {
              ya = yl
              yb = yr
            } else if (situation == 1) {
              ya = yb = yl
            } else if (situation == 2) {
              ya = yb = yr
            }
            if (dir == -1) {
              // dy = Math.min(ya,yb)-ymin+CONFIG.LINE_HEIGHT/2;
              dy = (Math.max(ya, yb) + (ya + yb) / 2) / 2 - ymin
              // if (situation == 1){
              //   console.log(ya,yb,ymin,dy)
              // }
            } else {
              // dy = ymax-Math.max(ya,yb)+CONFIG.LINE_HEIGHT/2;
              dy = ymax - (Math.min(ya, yb) + (ya + yb) / 2) / 2
            }
            dy *= 1.2
            dy = Math.max(dy, 0)
            // if (dy){
            dy += CONFIG.LINE_HEIGHT * 2
            // }
          }
        }
      }
    }

    if (lreg.row == rreg.row) {
      compute_slur(0)
      let h = Math.min(
        CONFIG.LINE_HEIGHT * (lreg.measure == rreg.measure ? 4.5 : 6.5),
        Math.max(
          CONFIG.LINE_HEIGHT * 1.5,
          dy != null ? 0 : Math.abs(x1 - x0) * 0.05,
          dy != null ? 0 : Math.abs(y1 - y0) * 0.5,
          dy == null ? 0 : dy,
        ),
      )
      if (is_tie) {
        h *= 0.6
      }
      result.push({
        tag: 'slur',
        x: x0,
        y: y0,
        w: x1 - x0,
        h: h * CONFIG.SLUR_ARC_MUL,
        y1,
        dir,
        adjacent: dy == null,
      })
    } else {
      compute_slur(1)

      // let h = Math.min(CONFIG.LINE_HEIGHT*4.5,Math.max(CONFIG.LINE_HEIGHT*1.5,Math.abs(CONTENT_WIDTH()-x0)*0.16));

      let h = Math.min(
        CONFIG.LINE_HEIGHT * 6.5,
        Math.max(
          CONFIG.LINE_HEIGHT * 1.5,
          dy != null ? 0 : Math.abs(CONTENT_WIDTH() - x0) * 0.16,
          dy == null ? 0 : dy,
        ),
      )

      if (is_tie) {
        h *= 0.6
      }
      let y_1 = y0 + (dir * h) / 4
      if (ymin != null) {
        y_1 =
          y_1 * 0.5 +
          (lreg.measure.staves[lreg.staff_idx].coords.y +
            (dir < 0
              ? ymin - CONFIG.LINE_HEIGHT / 2
              : ymax + CONFIG.LINE_HEIGHT / 2)) *
            0.5
      }
      result.push({
        tag: 'slur',
        x: x0,
        y: y0,
        w: CONTENT_WIDTH() - x0,
        h: h * CONFIG.SLUR_ARC_MUL,
        y1: y_1,
        dir,
      })

      function get_row_left(row: number): number {
        let k = score.first_col_measure_indices[row]
        let slot = score.measures[k].slots[0]
        // let xz = slot_pos(score.measures[k],0)-(slot.left_deco+slot.left_grace+slot.left_note+slot.left_squiggle)*CONFIG.NOTE_WIDTH-score.measures[k].pad.inter;
        let xz = slot_pos(score.measures[k], -1)
        return Math.max(xz, 0)
      }

      for (let j = lreg.row + 1; j < rreg.row; j++) {
        let h = Math.min(
          CONFIG.LINE_HEIGHT * 7,
          Math.max(CONFIG.LINE_HEIGHT * 1.5, CONTENT_WIDTH() * 0.16),
        )
        let xz = get_row_left(j)

        // let dy = y0-row_yoffsets[lreg.row];
        let notes = score.measures
          .slice(
            score.first_col_measure_indices[j],
            score.first_col_measure_indices[j + 1] || Infinity,
          )
          .map((x) => x.staves[lreg.staff_idx])
          .map((x) => x.notes)
          .flat()
        let bd = notes_ybounds(notes)

        result.push({
          tag: 'slur',
          x: xz,
          y: row_yoffsets[j] + (dir < 0 ? bd[0] : bd[1]),
          w: CONTENT_WIDTH() - xz,
          h: (h * CONFIG.SLUR_ARC_MUL * 3) / 4,
          y1: row_yoffsets[j] + (dir < 0 ? bd[0] : bd[1]),
          dir,
        })
      }

      let xz = get_row_left(rreg.row)

      compute_slur(2)

      // h = Math.min(CONFIG.LINE_HEIGHT*4.5,Math.max(CONFIG.LINE_HEIGHT*1.5,Math.abs(x1)*0.16));
      h = Math.min(
        CONFIG.LINE_HEIGHT * 6.5,
        Math.max(
          CONFIG.LINE_HEIGHT * 1.5,
          dy != null ? 0 : x1 * 0.16,
          dy == null ? 0 : dy,
        ),
      )

      y_1 = y1 + (dir * h) / 4
      if (ymin != null) {
        y_1 =
          y_1 * 0.5 +
          (rreg.measure.staves[rreg.staff_idx].coords.y +
            (dir < 0
              ? ymin - CONFIG.LINE_HEIGHT / 2
              : ymax + CONFIG.LINE_HEIGHT / 2)) *
            0.5
      }
      result.push({
        tag: 'slur',
        x: xz,
        y: y_1,
        w: x1 - xz,
        h: h * CONFIG.SLUR_ARC_MUL,
        y1: y1,
        dir,
      })
    }
  }
  return result
}

function draw_crescs(score: Score): Element[] {
  let result: Element[] = []
  for (let i = 0; i < score.crescs.length; i++) {
    let { left, right, val_left, val_right } = score.crescs[i]
    let lreg = id_registry[left]
    let rreg = id_registry[right]

    let x0 = lreg.head_x + 3
    let x1 = rreg.head_x - 3
    let staff0 = lreg.measure.staves[lreg.staff_idx]
    let staff1 = rreg.measure.staves[rreg.staff_idx]

    let ch = CONFIG.CUE_TEXT_SIZE

    let y0 =
      staff0.coords.y +
      staff0.coords.local_y_max -
      (staff0.flags.need_lyric
        ? 2 * CONFIG.LYRIC_SPACING + CONFIG.LYRIC_SCALE * FONT_INHERENT_HEIGHT
        : 0) -
      CONFIG.CUE_HEIGHT / 2
    let y1 =
      staff1.coords.y +
      staff1.coords.local_y_max -
      (staff1.flags.need_lyric
        ? 2 * CONFIG.LYRIC_SPACING + CONFIG.LYRIC_SCALE * FONT_INHERENT_HEIGHT
        : 0) -
      CONFIG.CUE_HEIGHT / 2

    if (lreg.row == rreg.row) {
      let u0 = y0 - (ch / 2) * val_left
      let u1 = y0 + (ch / 2) * val_left
      let v0 = y1 - (ch / 2) * val_right
      let v1 = y1 + (ch / 2) * val_right

      result.push({
        tag: 'cresc',
        x: x0,
        y: u0,
        w: x1 - x0,
        h: v0 - u0,
        x1: x0,
        y1: u1,
        w1: x1 - x0,
        h1: v1 - u1,
      })
    } else {
      let wa = CONTENT_WIDTH() - x0
      let ws: number[] = [0, wa]
      for (let j = lreg.row + 1; j < rreg.row; j++) {
        ws.push((wa += CONTENT_WIDTH()))
      }
      ws.push((wa += x1))

      for (let j = 0; j < rreg.row - lreg.row + 1; j++) {
        let is_first = j == 0
        let is_last = j == rreg.row - lreg.row
        let t0 = ws[j] / wa
        let t1 = ws[j + 1] / wa

        let xl = is_first ? x0 : 0
        let xr = is_last ? x1 : CONTENT_WIDTH()

        let y: number
        if (is_first) {
          y = y0
        } else if (is_last) {
          y = y1
        } else {
          for (let k = 0; k < score.measures.length; k++) {
            if (
              score.measures[k].staves[lreg.staff_idx].coords.row ==
              lreg.row + j
            ) {
              let staff = score.measures[k].staves[lreg.staff_idx]
              y =
                staff.coords.y +
                staff.coords.local_y_max -
                (staff.flags.need_lyric
                  ? 2 * CONFIG.LYRIC_SPACING +
                    CONFIG.LYRIC_SCALE * FONT_INHERENT_HEIGHT
                  : 0) -
                CONFIG.CUE_HEIGHT / 2
              break
            }
          }
        }
        let l = val_left * (1 - t0) + val_right * t0
        let r = val_left * (1 - t1) + val_right * t1
        let u0 = y - (ch / 2) * l
        let u1 = y + (ch / 2) * l
        let v0 = y - (ch / 2) * r
        let v1 = y + (ch / 2) * r
        result.push({
          tag: 'line',
          type: 'cresc_top',
          x: xl,
          y: u0,
          w: xr - xl,
          h: v0 - u0,
        })
        result.push({
          tag: 'line',
          type: 'cresc_bottom',
          x: xl,
          y: u1,
          w: xr - xl,
          h: v1 - u1,
        })
      }
    }
  }
  return result
}

function draw_tempo(tempo: Tempo_itf): Element[] {
  let result: Element[] = []
  let dx = 0
  if (tempo.duration != null && tempo.bpm != null) {
    if (tempo.duration < NOTE_LENGTH.WHOLE) {
      let num_flags = calc_num_flags(tempo.duration, tempo.modifier)

      result.push({
        tag: 'note_head',
        x: CONFIG.NOTE_WIDTH,
        y: CONFIG.TEMPO_COMPOSER_TEXT_SIZE,
        w: CONFIG.NOTE_WIDTH,
        h: CONFIG.LINE_HEIGHT,
        twisted: false,
        stem_dir: -1,
        duration: tempo.duration,
      })
      dx += CONFIG.NOTE_WIDTH

      let eh = (num_flags + 1) * CONFIG.FLAG_SPACING * CONFIG.LINE_HEIGHT
      result.push({
        tag: 'line',
        type: 'note_stem',
        x: CONFIG.NOTE_WIDTH,
        y: -eh,
        w: 0,
        h: CONFIG.TEMPO_COMPOSER_TEXT_SIZE + eh,
      })

      if (tempo.modifier) {
        result.push({
          tag: 'dot',
          type: 'modifier',
          x: CONFIG.NOTE_WIDTH * 1.5,
          y: CONFIG.TEMPO_COMPOSER_TEXT_SIZE - CONFIG.LINE_HEIGHT / 2,
          w: 0,
          h: 0,
        })
      }

      if (tempo.modifier || num_flags) {
        dx += CONFIG.NOTE_WIDTH
      }

      for (let i = 0; i < num_flags; i++) {
        result.push({
          tag: 'flag',
          x: CONFIG.NOTE_WIDTH,
          y: -eh + i * CONFIG.FLAG_SPACING * CONFIG.LINE_HEIGHT,
          w: CONFIG.NOTE_WIDTH,
          h: CONFIG.LINE_HEIGHT,
          stem_dir: -1,
          is_last: i == num_flags - 1,
        })
      }
    } else {
      result.push({
        tag: 'note_head',
        x: CONFIG.NOTE_WIDTH,
        y: CONFIG.TEMPO_COMPOSER_TEXT_SIZE / 2,
        w: CONFIG.NOTE_WIDTH,
        h: CONFIG.LINE_HEIGHT,
        twisted: false,
        stem_dir: -1,
        duration: tempo.duration,
      })
      dx += CONFIG.NOTE_WIDTH
    }
    let t = ' = ' + tempo.bpm
    let tw =
      (get_text_width(t, FONT.DUPLEX, -2) * CONFIG.TEMPO_COMPOSER_TEXT_SIZE) /
      FONT_INHERENT_HEIGHT
    result.push({
      tag: 'regular_text',
      type: 'tempo',
      text: t,
      x: dx,
      y: 0,
      w: tw,
      h: CONFIG.TEMPO_COMPOSER_TEXT_SIZE,
    })
    dx += tw + CONFIG.TEMPO_COMPOSER_TEXT_SIZE
  }
  if (tempo.text != null) {
    let tw =
      (get_text_width(tempo.text, FONT.TRIPLEX, -2) *
        CONFIG.TEMPO_COMPOSER_TEXT_SIZE) /
      FONT_INHERENT_HEIGHT
    result.push({
      tag: 'bold_text',
      type: 'tempo',
      text: tempo.text,
      x: dx,
      y: 0,
      w: tw,
      h: CONFIG.TEMPO_COMPOSER_TEXT_SIZE,
    })
  }
  return result
}

function draw_score(score: Score): [Element[], number] {
  id_registry = {}
  let ret = draw_measures(score)

  ret.push(...draw_slurs(score))
  ret.push(...draw_crescs(score))
  let last_staff =
    score.measures[score.measures.length - 1].staves[
      score.measures[score.measures.length - 1].staves.length - 1
    ]
  let H =
    last_staff.coords.y +
    Math.max(
      last_staff.coords.local_y_max,
      CONFIG.LINE_HEIGHT * (CONFIG.LINES_PER_STAFF + 1),
    )

  let result: Element[] = []

  let dy = CONFIG.PAGE_MARGIN_Y
  for (let i = 0; i < score.title.length; i++) {
    let h = i ? CONFIG.SUBTITLE_TEXT_SIZE : CONFIG.TITLE_TEXT_SIZE
    let w =
      (get_text_width(score.title[i], i ? FONT.DUPLEX : FONT.TRIPLEX, -2) * h) /
      FONT_INHERENT_HEIGHT

    result.push({
      ...(i
        ? { tag: 'regular_text', type: 'subtitle' }
        : { tag: 'bold_text', type: 'title' }),
      text: score.title[i],
      x: CONFIG.PAGE_WIDTH / 2 - w / 2,
      y: dy,
      w: w,
      h: h,
    })
    dy += h + CONFIG.TITLE_LINE_SPACING
  }
  if (score.tempo || score.composer.length) {
    dy += CONFIG.TITLE_LINE_SPACING
    if (score.composer.length) {
      let h = CONFIG.TEMPO_COMPOSER_TEXT_SIZE
      for (let i = 0; i < score.composer.length; i++) {
        let w =
          (get_text_width(score.composer[i], FONT.DUPLEX, -2) * h) /
          FONT_INHERENT_HEIGHT

        result.push({
          tag: 'regular_text',
          type: 'composer',
          text: score.composer[i],
          x: CONFIG.PAGE_WIDTH - CONFIG.PAGE_MARGIN_X - w,
          y: dy,
          w: w,
          h: h,
        })
        dy += CONFIG.TEMPO_COMPOSER_TEXT_SIZE + 4
      }
      dy -= CONFIG.TEMPO_COMPOSER_TEXT_SIZE + 4
    }

    if (score.tempo) {
      let r = draw_tempo(score.tempo)
      translate_elements(r, CONFIG.PAGE_MARGIN_X + score.indent, dy)
      r.forEach((x) => result.push(x))
    }

    dy += CONFIG.TEMPO_COMPOSER_TEXT_SIZE
  }
  dy += CONFIG.TITLE_LINE_SPACING * 1.2

  translate_elements(ret, CONFIG.PAGE_MARGIN_X, dy)

  ret.forEach((x) => result.push(x))
  return [result, H + CONFIG.PAGE_MARGIN_Y + dy]
}

export function render_score(
  score: Score,
  { compute_polylines = true }: { compute_polylines?: boolean } = {},
): Drawing {
  let [elements, h] = draw_score(score)

  let ret = {
    w: CONFIG.PAGE_WIDTH,
    h,
    elements: elements,
    polylines: null,
  }
  if (CONFIG.SLUR_EVADE) {
    slur_evade_note(elements)
  }
  if (CONFIG.CUE_EVADE) {
    cue_evade_slur(elements)
  }
  if (compute_polylines) {
    ret.polylines = hf_drawing_polylines(elements, ret.w, ret.h)
  }
  return ret
}
