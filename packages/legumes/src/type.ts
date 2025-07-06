export interface Slot {
  acc_pack: Pack
  mid_pack: Pack
  mid_note: number
  left_grace: number
  left_squiggle: number
  left_deco: number
  left_note: number
  right_note: number
  right_deco: number
  right_spacing: number
}

export interface PackInterval {
  x: number
  top: number
  bottom: number
  idx: number
}
export interface Pack {
  intervals: PackInterval[][]
}
export interface Note extends NoteItf {
  stem_len: number
  flag_count: number
  twisted: boolean
  beamed: boolean
  articulation_pos?: [number, number]
  slot_shift: number
  modifier_shift: number
}
export interface Beam extends Array<number> {
  m: number
  b: number
}

export interface Staff extends StaffItf {
  notes: Note[]
  rests: Rest[]
  grace: Measure[]
  beams: Beam[]
  coords: {
    x: number
    y: number
    w: number
    local_y_min: number
    local_y_max: number
    col: number
    row: number
  }
  flags: {
    need_keysig: { accidental: number; count: number } | null
    need_timesig: boolean
    need_clef: boolean
    need_lyric: boolean
    need_cue: boolean
  }
}

export interface Measure extends MeasureItf {
  staves: Staff[]
  slots: Slot[]
  is_first_col: boolean
  is_last_col: boolean
  pad: { left: number; right: number; inter: number }
}

export interface Rest extends RestItf {
  staff_pos: number
}

export interface Score extends ScoreItf {
  indent: number
  first_col_measure_indices: number[]
  measures: Measure[]
  slurred_ids: Record<string, boolean>
}

export interface NoteRegister {
  note: Note
  staff_idx: number
  measure: Measure
  row: number
  col: number
  chord_head_x: number
  chord_head_y: number
  head_x: number
  head_y: number
  tail_x: number
  tail_y: number
}

export interface TupletItf {
  id: string
  display_duration: number
  label: number
}

export interface NoteItf {
  id?: string
  begin: number
  duration: number
  modifier: boolean
  accidental: number | null
  name: string
  octave: number
  voice: number
  staff_pos: number
  prev_in_chord: number | null
  next_in_chord: number | null
  stem_dir: number
  tuplet: TupletItf | null
  lyric?: string
  articulation?: number
  cue?: CueItf
}

export interface CueItf {
  position: number
  data: string
}

export interface RestItf {
  begin: number
  duration: number
  voice: number
  tuplet: TupletItf | null
  cue?: CueItf
}

export interface MeasureItf {
  duration: number
  barline: number
  staves: StaffItf[]
}

export type KeySignature = [number, number]
export type TimeSignature = [number, number]

export interface StaffItf {
  time_signature: TimeSignature
  key_signature: KeySignature
  clef: number
  voices: number
  rests: RestItf[]
  notes: NoteItf[]
  grace: MeasureItf[]
  beams: number[][]
}

export interface SlurItf {
  left: string
  right: string
  is_tie: boolean
}

export interface CrescItf {
  left: string
  right: string
  val_left: number
  val_right: number
}

export interface TempoItf {
  text?: string
  duration?: number
  modifier?: boolean
  bpm?: number
}

export interface InstrumentGroupItf {
  bracket: number
  names: string[]
  connect_barlines: boolean[]
}

export interface ScoreItf {
  title: string[]
  composer: string[]
  tempo?: TempoItf
  instruments: InstrumentGroupItf[]
  slurs: SlurItf[]
  measures: MeasureItf[]
  crescs: CrescItf[]
}

export interface Element {
  tag:
    | 'note_head'
    | 'rest'
    | 'accidental'
    | 'clef'
    | 'timesig_digit'
    | 'beam'
    | 'line'
    | 'dbg'
    | 'slur'
    | 'cresc'
    | 'dot'
    | 'flag'
    | 'timesig_c'
    | 'tuplet_label'
    | 'lyric'
    | 'bold_text'
    | 'regular_text'
    | 'bracket'
    | 'articulation'
    | 'squiggle'
    | 'cue'

  x: number
  y: number
  w: number
  h: number

  type?:
    | number
    | 'measure_number'
    | 'instrument'
    | 'barline'
    | 'barline_repeat'
    | 'staff_line'
    | 'modifier'
    | 'note_stem'
    | 'ledger'
    | 'arpeggiated_chord'
    | 'cut'
    | 'common'
    | 'composer'
    | 'tempo'
    | 'title'
    | 'subtitle'
    | 'cresc_top'
    | 'cresc_bottom'
  [other_options: string]: any
}

export interface Drawing {
  w: number
  h: number
  elements: Element[]
  polylines: [number, number][][]
}

export interface Hershey_entry {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
  polylines: Array<Array<[number, number]>>
}
