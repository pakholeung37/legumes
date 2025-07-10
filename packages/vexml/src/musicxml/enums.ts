import { EnumValues, Enum } from '@/util'

/**
 * Stem represents the notated stem direction.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/stem-value/
 */
export type Stem = EnumValues<typeof STEMS>
export const STEMS = new Enum(['up', 'down', 'double', 'none'] as const)

/**
 * NoteType represents the graphic note type.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/note-type-value/
 */
export type NoteType = EnumValues<typeof NOTE_TYPES>
export const NOTE_TYPES = new Enum([
  '1024th',
  '512th',
  '256th',
  '128th',
  '64th',
  '32nd',
  '16th',
  'eighth',
  'quarter',
  'half',
  'whole',
  'breve',
  'long',
  'maxima',
] as const)

/**
 * Notated accidentals supported by MusicXML.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/accidental-value/
 */
export type AccidentalType = EnumValues<typeof ACCIDENTAL_TYPES>
export const ACCIDENTAL_TYPES = new Enum([
  'sharp',
  'natural',
  'flat',
  'double-sharp',
  'sharp-sharp',
  'flat-flat',
  'natural-sharp',
  'natural-flat',
  'quarter-flat',
  'quarter-sharp',
  'three-quarters-flat',
  'three-quarters-sharp',
  'sharp-down',
  'sharp-up',
  'natural-down',
  'natural-up',
  'flat-down',
  'flat-up',
  'double-sharp-down',
  'double-sharp-up',
  'flat-flat-down',
  'flat-flat-up',
  'arrow-down',
  'arrow-up',
  'triple-sharp',
  'triple-flat',
  'slash-quarter-sharp',
  'slash-sharp',
  'slash-flat',
  'double-slash-flat',
  'flat-1',
  'flat-2',
  'flat-3',
  'flat-4',
  'sori',
  'koron',
  'other',
] as const)

/**
 * Notehead shapes other than the open and closed ovals associated with note durations.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/notehead-value/
 */
export type Notehead = EnumValues<typeof NOTEHEADS>
export const NOTEHEADS = new Enum([
  'arrow down',
  'arrow up',
  'back slashed',
  'circle dot',
  'circle-x',
  'circled',
  'cluster',
  'cross',
  'diamond',
  'do',
  'fa',
  'fa up',
  'inverted triangle',
  'la',
  'left triangle',
  'mi',
  'none',
  'normal',
  're',
  'rectangle',
  'slash',
  'slashed',
  'so',
  'square',
  'ti',
  'triangle',
  'x',
  'other',
] as const)

/**
 * The bar style of a measure.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/bar-style/
 */
export type BarStyle = EnumValues<typeof BAR_STYLES>
export const BAR_STYLES = new Enum([
  'dashed',
  'dotted',
  'heavy',
  'heavy-heavy',
  'heavy-light',
  'light-heavy',
  'light-light',
  'none',
  'regular',
  'short',
  'tick',
] as const)

export type VerticalDirection = EnumValues<typeof VERTICAL_DIRECTIONS>
export const VERTICAL_DIRECTIONS = new Enum(['up', 'down'] as const)

/**
 * The direction of a repeat.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/backward-forward/
 */
export type RepeatDirection = EnumValues<typeof REPEAT_DIRECTIONS>
export const REPEAT_DIRECTIONS = new Enum(['backward', 'forward'] as const)

/**
 * The location of a barline.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/right-left-middle/
 */
export type BarlineLocation = EnumValues<typeof BARLINE_LOCATIONS>
export const BARLINE_LOCATIONS = new Enum(['right', 'left', 'middle'] as const)

/**
 * The ending type.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/start-stop-discontinue/
 */
export type StartStopDiscontinue = EnumValues<typeof START_STOP_DISCONTINUE>
export const START_STOP_DISCONTINUE = new Enum([
  'start',
  'stop',
  'discontinue',
] as const)

/**
 * Different types of clef symbols.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/clef-sign/
 */
export type ClefSign = EnumValues<typeof CLEF_SIGNS>
export const CLEF_SIGNS = new Enum([
  'G',
  'F',
  'C',
  'percussion',
  'TAB',
  'jianpu',
  'none',
] as const)

/**
 * Describes beaming for a single note.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/beam-value/
 */
export type BeamValue = EnumValues<typeof BEAM_VALUES>
export const BEAM_VALUES = new Enum([
  'backward hook',
  'begin',
  'continue',
  'end',
  'forward hook',
] as const)

/**
 * The stave-type value specifies different uses for the stave.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/staff-type/
 */
export type StaveType = EnumValues<typeof STAVE_TYPES>
export const STAVE_TYPES = new Enum([
  'alternate',
  'cue',
  'editorial',
  'ossia',
  'regular',
] as const)

/**
 * Lyric hyphenation is indicated by the syllabic type.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/syllabic/
 */
export type SyllabicType = EnumValues<typeof SYLLABIC_TYPES>
export const SYLLABIC_TYPES = new Enum([
  'begin',
  'end',
  'middle',
  'single',
] as const)

/**
 * Indicates how to display a time signature.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/time-symbol/
 */
export type TimeSymbol = EnumValues<typeof TIME_SYMBOLS>
export const TIME_SYMBOLS = new Enum([
  'common',
  'cut',
  'dotted-note',
  'normal',
  'note',
  'single-number',
  'hidden',
] as const)

/**
 * The <mode> element is used to specify major/minor and other mode distinctions.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/mode/
 */
export type KeyMode = EnumValues<typeof KEY_MODES>
export const KEY_MODES = new Enum([
  'none',
  'major',
  'minor',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'ionian',
  'locrian',
] as const)

/**
 * The start-stop type is used for an attribute of musical elements that can either start or stop, such as tuplets.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/start-stop/
 */
export type StartStop = EnumValues<typeof START_STOP>
export const START_STOP = new Enum(['start', 'stop'] as const)

/**
 * The above-below type is used to indicate whether one element appears above or below another element.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/above-below/
 */
export type AboveBelow = EnumValues<typeof ABOVE_BELOW>
export const ABOVE_BELOW = new Enum(['above', 'below'] as const)

/**
 * The over-under type is used to indicate whether the tips of curved lines such as slurs and ties are overhand (tips
 * down) or underhand (tips up).
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/over-under/
 */
export type OverUnder = EnumValues<typeof OVER_UNDER>
export const OVER_UNDER = new Enum(['over', 'under'] as const)

/**
 * The start-stop-continue type is used for an attribute of musical elements that can either start or stop, but also
 * need to refer to an intermediate point in the symbol, as for complex slurs or for formatting of symbols across system
 * breaks.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/start-stop-continue/
 */
export type StartStopContinue = EnumValues<typeof START_STOP_CONTINUE>
export const START_STOP_CONTINUE = new Enum([
  'start',
  'stop',
  'continue',
] as const)

/**
 * The line-type type distinguishes between solid, dashed, dotted, and wavy lines.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/line-type/
 */
export type LineType = EnumValues<typeof LINE_TYPES>
export const LINE_TYPES = new Enum([
  'dashed',
  'dotted',
  'solid',
  'wavy',
] as const)

/**
 * The wedge-type type is used to specify <wedge> types.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/wedge-type/
 */
export type WedgeType = EnumValues<typeof WEDGE_TYPES>
export const WEDGE_TYPES = new Enum([
  'crescendo',
  'diminuendo',
  'stop',
  'continue',
] as const)

/**
 * The up-down-stop-continue type is used for octave-shift elements, indicating the direction of the shift from their
 * true pitched values because of printing difficulty.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/up-down-stop-continue/
 */
export type UpDownStopContinue = EnumValues<typeof UP_DOWN_STOP_CONTINUE>
export const UP_DOWN_STOP_CONTINUE = new Enum([
  'up',
  'down',
  'stop',
  'continue',
] as const)

/**
 * The pedal-type distinguishes types of pedal directions.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/pedal-type/
 */
export type PedalType = EnumValues<typeof PEDAL_TYPES>
export const PEDAL_TYPES = new Enum([
  'start',
  'stop',
  'sostenuto',
  'change',
  'continue',
  'discontinue',
  'resume',
] as const)

/**
 * The show-tuplet type indicates whether to show a part of a tuplet relating to the tuplet-actual element.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/show-tuplet/
 */
export type ShowTuplet = EnumValues<typeof SHOW_TUPLET>
export const SHOW_TUPLET = new Enum(['actual', 'both', 'none'] as const)

/**
 * The tied-type type is used as an attribute of the tied element to specify where the visual representation of a tie
 * begins and ends.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/tied-type/
 */
export type TiedType = EnumValues<typeof TIED_TYPES>
export const TIED_TYPES = new Enum([
  'start',
  'stop',
  'continue',
  'let-ring',
] as const)

/**
 * The fermata-shape type represents the shape of the fermata sign.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/fermata-shape/
 */
export type FermataShape = EnumValues<typeof FERMATA_SHAPES>
export const FERMATA_SHAPES = new Enum([
  'normal',
  'angled',
  'square',
  'double-angled',
  'double-square',
  'double-dot',
  'half-curve',
  'curlew',
] as const)

/**
 * The upright-inverted type describes the appearance of a fermata element.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/upright-inverted/
 */
export type FermataType = EnumValues<typeof FERMATA_TYPES>
export const FERMATA_TYPES = new Enum(['upright', 'inverted'] as const)

/**
 * The type of the harmonic.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/harmonic/
 */
export type HarmonicType = EnumValues<typeof HARMONIC_TYPES>
export const HARMONIC_TYPES = new Enum([
  'unspecified',
  'natural',
  'artificial',
] as const)

/**
 * The type of the harmonic pitch.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/harmonic/
 */
export type HarmonicPitchType = EnumValues<typeof HARMONIC_PITCH_TYPES>
export const HARMONIC_PITCH_TYPES = new Enum([
  'unspecified',
  'base',
  'touching',
  'sounding',
] as const)

/**
 * The type of bend.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/bend/
 */
export type BendType = EnumValues<typeof BEND_TYPES>
export const BEND_TYPES = new Enum(['normal', 'pre-bend', 'release'] as const)

/**
 * The different kinds of dynamics.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/dynamics/
 */
export type DynamicType = EnumValues<typeof DYNAMIC_TYPES>
export const DYNAMIC_TYPES = new Enum([
  'p',
  'pp',
  'ppp',
  'pppp',
  'ppppp',
  'pppppp',
  'f',
  'ff',
  'fff',
  'ffff',
  'fffff',
  'ffffff',
  'mp',
  'mf',
  'sf',
  'sfp',
  'sfpp',
  'fp',
  'rf',
  'rfz',
  'sfz',
  'sffz',
  'fz',
  'n',
  'pf',
  'sfzp',
] as const)
