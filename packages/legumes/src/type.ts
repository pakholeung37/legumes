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

export interface Pack_interval {
  x: number
  top: number
  bottom: number
  idx: number
}
export interface Pack {
  intervals: Pack_interval[][]
}
export interface Note extends Note_itf {
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

export interface Staff extends Staff_itf {
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

export interface Measure extends Measure_itf {
  staves: Staff[]
  slots: Slot[]
  is_first_col: boolean
  is_last_col: boolean
  pad: { left: number; right: number; inter: number }
}

export interface Rest extends Rest_itf {
  staff_pos: number
}

export interface Score extends Score_itf {
  indent: number
  first_col_measure_indices: number[]
  measures: Measure[]
  slurred_ids: Record<string, boolean>
}

export interface Note_register {
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

export interface Tuplet_itf {
  id: string
  display_duration: number
  label: number
}

export interface Note_itf {
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
  tuplet: Tuplet_itf | null
  lyric?: string
  articulation?: number
  cue?: Cue_itf
}

export interface Cue_itf {
  position: number
  data: string
}

export interface Rest_itf {
  begin: number
  duration: number
  voice: number
  tuplet: Tuplet_itf | null
  cue?: Cue_itf
}

export interface Measure_itf {
  duration: number
  barline: number
  staves: Staff_itf[]
}

export type Key_signature = [number, number]
export type Time_signature = [number, number]

export interface Staff_itf {
  time_signature: Time_signature
  key_signature: Key_signature
  clef: number
  voices: number
  rests: Rest_itf[]
  notes: Note_itf[]
  grace: Measure_itf[]
  beams: number[][]
}

export interface Slur_itf {
  left: string
  right: string
  is_tie: boolean
}

export interface Cresc_itf {
  left: string
  right: string
  val_left: number
  val_right: number
}

export interface Tempo_itf {
  text?: string
  duration?: number
  modifier?: boolean
  bpm?: number
}

export interface Instrument_group_itf {
  bracket: number
  names: string[]
  connect_barlines: boolean[]
}

export interface Score_itf {
  title: string[]
  composer: string[]
  tempo?: Tempo_itf
  instruments: Instrument_group_itf[]
  slurs: Slur_itf[]
  measures: Measure_itf[]
  crescs: Cresc_itf[]
}

export interface Element {
  tag: string
  x: number
  y: number
  w: number
  h: number
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
