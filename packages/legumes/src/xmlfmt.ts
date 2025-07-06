import {
  Score_itf,
  Staff_itf,
  Measure_itf,
  Note_itf,
  Rest_itf,
  Slur_itf,
  Cresc_itf,
  Tempo_itf,
  Instrument_group_itf,
  Tuplet_itf,
} from './type'
import {
  CLEF,
  ACCIDENTAL,
  NOTE_LENGTH,
  ARTICULATION,
  BARLINE,
  BRACKET,
} from './const'
import { note_name_to_staff_pos, short_id } from './utils'

// MusicXML 常量映射
const MUSICXML_CLEF_MAP: Record<string, number> = {
  G: CLEF.TREBLE,
  F: CLEF.BASS,
  C: CLEF.ALTO,
  TAB: CLEF.TENOR,
  'mezzo-soprano': CLEF.MEZZO_SOPRANO,
  soprano: CLEF.SOPRANO,
  baritone: CLEF.BARITONE,
}

const MUSICXML_ACCIDENTAL_MAP: Record<string, number> = {
  sharp: ACCIDENTAL.SHARP,
  natural: ACCIDENTAL.NATURAL,
  flat: ACCIDENTAL.FLAT,
  'double-sharp': 2,
  'double-flat': -2,
}

const MUSICXML_ARTICULATION_MAP: Record<string, number> = {
  staccato: ARTICULATION.STACCATO,
  spiccato: ARTICULATION.SPICCATO,
  tenuto: ARTICULATION.TENUTO,
  fermata: ARTICULATION.FERMATA,
  accent: ARTICULATION.ACCENT,
  marcato: ARTICULATION.MARCATO,
  trill: ARTICULATION.TRILL,
  mordent: ARTICULATION.MORDENT,
  turn: ARTICULATION.TURN,
  'up-bow': ARTICULATION.UP_BOW,
  flageolet: ARTICULATION.FLAGEOLET,
  arpeggiate: ARTICULATION.ARPEGGIATED,
}

const MUSICXML_BARLINE_MAP: Record<string, number> = {
  regular: BARLINE.SINGLE,
  double: BARLINE.DOUBLE,
  final: BARLINE.END,
  repeat: BARLINE.REPEAT_END,
  dashed: BARLINE.SINGLE,
  dotted: BARLINE.SINGLE,
}

const MUSICXML_BRACKET_MAP: Record<string, number> = {
  brace: BRACKET.BRACE,
  bracket: BRACKET.BRACKET,
  line: BRACKET.NONE,
}

// 音符时值映射 (MusicXML divisions 到内部时值)
function divisions_to_duration(divisions: number, duration: number): number {
  // MusicXML 中 divisions 表示每四分音符的 ticks
  // 我们的系统以 64 ticks 为全音符
  return (duration * 64) / (divisions * 4)
}

// 解析音符时值
function parse_duration(duration: string, divisions: number): number {
  const dur = parseInt(duration)
  return divisions_to_duration(divisions, dur)
}

// 解析音符修饰符
function parse_modifier(
  dot: boolean,
  timeModification?: { actualNotes?: number; normalNotes?: number },
): boolean {
  return (
    dot ||
    (timeModification &&
      timeModification.actualNotes !== timeModification.normalNotes)
  )
}

// 解析音符名称和八度
function parse_pitch(pitch: {
  step?: string
  octave?: number
  alter?: number
}): { name: string; octave: number; accidental: number | null } {
  const name = pitch.step || 'C'
  const octave = pitch.octave || 4
  const accidental = pitch.alter !== undefined ? pitch.alter : null
  return { name, octave, accidental }
}

// 解析连音
function parse_tuplet(tuplet: {
  type?: string
  number?: number
  actual?: number
  normal?: number
}): Tuplet_itf | null {
  if (!tuplet || tuplet.type !== 'start') return null

  return {
    id: short_id(),
    display_duration: null,
    label: tuplet.number || 3,
  }
}

// 解析表情记号
function parse_articulation(notations: any): number | undefined {
  if (!notations) return undefined

  for (const [key, value] of Object.entries(notations)) {
    if (MUSICXML_ARTICULATION_MAP[key]) {
      return MUSICXML_ARTICULATION_MAP[key]
    }
  }
  return undefined
}

// 解析歌词
function parse_lyric(lyric: any): string | undefined {
  if (!lyric || !lyric.text) return undefined
  return lyric.text
}

// 解析提示音
function parse_cue(cue: any): { position: number; data: string } | undefined {
  if (!cue) return undefined
  return {
    position: 0,
    data: cue.text || '',
  }
}

// 解析拍号
function parse_time_signature(time: any): [number, number] {
  if (!time) return [4, 4]

  const beats = time.beats || 4
  const beatType = time['beat-type'] || 4
  return [parseInt(beats), parseInt(beatType)]
}

// 解析调号
function parse_key_signature(key: any): [number, number] {
  if (!key) return [0, 0]

  const fifths = parseInt(key.fifths || '0')
  if (fifths > 0) {
    return [ACCIDENTAL.SHARP, fifths]
  } else if (fifths < 0) {
    return [ACCIDENTAL.FLAT, -fifths]
  }
  return [0, 0]
}

// 解析谱号
function parse_clef(clef: any): number {
  if (!clef) return CLEF.TREBLE

  const sign = clef.sign || 'G'
  return MUSICXML_CLEF_MAP[sign] || CLEF.TREBLE
}

// 解析小节线
function parse_barline(barline: any): number {
  if (!barline) return BARLINE.SINGLE

  const barStyle = barline['bar-style']
  if (barStyle && MUSICXML_BARLINE_MAP[barStyle]) {
    return MUSICXML_BARLINE_MAP[barStyle]
  }

  // 检查重复记号
  if (barline.repeat) {
    const direction = barline.repeat.direction
    if (direction === 'forward') return BARLINE.REPEAT_BEGIN
    if (direction === 'backward') return BARLINE.REPEAT_END
  }

  return BARLINE.SINGLE
}

// 解析速度
function parse_tempo(tempo: any): Tempo_itf | undefined {
  if (!tempo) return undefined

  const result: Tempo_itf = {}

  if (tempo.text) {
    result.text = tempo.text
  }

  if (tempo.beats && tempo['beat-type']) {
    const beatType = parseInt(tempo['beat-type'])
    result.duration = NOTE_LENGTH.WHOLE / beatType
    result.modifier = false
  }

  if (tempo.perMinute) {
    result.bpm = parseInt(tempo.perMinute)
  }

  return Object.keys(result).length > 0 ? result : undefined
}

// 解析乐器组
function parse_instruments(partList: any): Instrument_group_itf[] {
  if (!partList || !partList.scorePart) return []

  const instruments: Instrument_group_itf[] = []

  for (const scorePart of Array.isArray(partList.scorePart)
    ? partList.scorePart
    : [partList.scorePart]) {
    const group: Instrument_group_itf = {
      bracket: BRACKET.NONE,
      names: [],
      connect_barlines: [],
    }

    if (scorePart.partName) {
      group.names.push(scorePart.partName)
      group.connect_barlines.push(false)
    }

    if (scorePart.partAbbreviation) {
      group.names.push(scorePart.partAbbreviation)
      group.connect_barlines.push(false)
    }

    if (group.names.length > 0) {
      instruments.push(group)
    }
  }

  return instruments
}

// 解析连音线
function parse_slurs(notations: any, noteId: string): Slur_itf[] {
  const slurs: Slur_itf[] = []

  if (!notations || !notations.slur) return slurs

  for (const slur of Array.isArray(notations.slur)
    ? notations.slur
    : [notations.slur]) {
    if (slur.type === 'start') {
      slurs.push({
        left: noteId,
        right: null,
        is_tie: false,
      })
    } else if (slur.type === 'stop') {
      // 需要与开始标记配对
      slurs.push({
        left: null,
        right: noteId,
        is_tie: false,
      })
    }
  }

  return slurs
}

// 解析渐强渐弱
function parse_dynamics(dynamics: any, noteId: string): Cresc_itf[] {
  const crescs: Cresc_itf[] = []

  if (!dynamics) return crescs

  const dynamicTypes = [
    'p',
    'pp',
    'ppp',
    'f',
    'ff',
    'fff',
    'mp',
    'mf',
    'sf',
    'sfz',
  ]

  for (const type of dynamicTypes) {
    if (dynamics[type]) {
      crescs.push({
        left: noteId,
        right: null,
        val_left: 0,
        val_right: 0,
      })
      break
    }
  }

  return crescs
}

// 主解析函数
export function parse_musicxml(xml: string): Score_itf {
  // 使用 DOMParser 解析 XML
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')

  if (
    doc.documentElement.nodeName !== 'score-partwise' &&
    doc.documentElement.nodeName !== 'score-timewise'
  ) {
    throw new Error('Invalid MusicXML document')
  }

  const score: Score_itf = {
    title: [],
    composer: [],
    instruments: [],
    slurs: [],
    measures: [],
    crescs: [],
  }

  // 解析标题和作曲家信息
  const identification = doc.querySelector('identification')
  if (identification) {
    const creator = identification.querySelector('creator[type="composer"]')
    if (creator) {
      score.composer = [creator.textContent || '']
    }
  }

  const work = doc.querySelector('work')
  if (work) {
    const workTitle = work.querySelector('work-title')
    if (workTitle) {
      score.title = [workTitle.textContent || '']
    }
  }

  // 解析乐器列表
  const partList = doc.querySelector('part-list')
  if (partList) {
    score.instruments = parse_instruments(partList)
  }

  // 解析速度
  const tempo = doc.querySelector('sound')
  if (tempo) {
    score.tempo = parse_tempo(tempo)
  }

  // 解析小节
  const measures = doc.querySelectorAll('measure')
  let divisions = 480 // 默认 divisions 值
  let currentTimeSignature: [number, number] = [4, 4]
  let currentKeySignature: [number, number] = [0, 0]
  let currentClef: number = CLEF.TREBLE

  for (const measureElement of Array.from(measures)) {
    const measure: Measure_itf = {
      duration: 0,
      barline: BARLINE.SINGLE,
      staves: [],
    }

    // 解析小节线
    const barline = measureElement.querySelector('barline')
    if (barline) {
      measure.barline = parse_barline(barline)
    }

    // 解析 divisions
    const attributes = measureElement.querySelector('attributes')
    if (attributes) {
      const divisionsElement = attributes.querySelector('divisions')
      if (divisionsElement) {
        divisions = parseInt(divisionsElement.textContent || '480')
      }

      // 解析拍号
      const time = attributes.querySelector('time')
      if (time) {
        currentTimeSignature = parse_time_signature(time)
      }

      // 解析调号
      const key = attributes.querySelector('key')
      if (key) {
        currentKeySignature = parse_key_signature(key)
      }

      // 解析谱号
      const clef = attributes.querySelector('clef')
      if (clef) {
        currentClef = parse_clef(clef)
      }
    }

    // 创建声部
    const staff: Staff_itf = {
      clef: currentClef,
      time_signature: currentTimeSignature,
      key_signature: currentKeySignature,
      notes: [],
      grace: [],
      rests: [],
      voices: 1,
      beams: [],
    }

    // 解析音符和休止符
    const notes = measureElement.querySelectorAll('note')
    let begin = 0

    for (const noteElement of Array.from(notes)) {
      const isRest = noteElement.querySelector('rest') !== null

      if (isRest) {
        // 解析休止符
        const rest: Rest_itf = {
          begin: begin,
          duration: 0,
          voice: 0,
          tuplet: null,
        }

        const duration = noteElement.querySelector('duration')
        if (duration) {
          rest.duration = parse_duration(duration.textContent || '0', divisions)
        }

        const voice = noteElement.querySelector('voice')
        if (voice) {
          rest.voice = parseInt(voice.textContent || '1') - 1
        }

        // 解析连音
        const timeModification = noteElement.querySelector('time-modification')
        if (timeModification) {
          rest.tuplet = parse_tuplet({
            type: 'start',
            number: 3,
            actual: parseInt(
              timeModification.querySelector('actual-notes')?.textContent ||
                '3',
            ),
            normal: parseInt(
              timeModification.querySelector('normal-notes')?.textContent ||
                '2',
            ),
          })
        }

        staff.rests.push(rest)
        begin += rest.duration
        measure.duration = Math.max(measure.duration, begin)
      } else {
        // 解析音符
        const note: Note_itf = {
          begin: begin,
          duration: 0,
          accidental: null,
          modifier: false,
          octave: 4,
          name: 'C',
          voice: 0,
          staff_pos: 0,
          stem_dir: 1,
          prev_in_chord: null,
          next_in_chord: null,
          tuplet: null,
        }

        // 解析音高
        const pitch = noteElement.querySelector('pitch')
        if (pitch) {
          const pitchData = parse_pitch({
            step: pitch.querySelector('step')?.textContent,
            octave: parseInt(pitch.querySelector('octave')?.textContent || '4'),
            alter: parseInt(pitch.querySelector('alter')?.textContent || '0'),
          })

          note.name = pitchData.name
          note.octave = pitchData.octave
          note.accidental = pitchData.accidental
        }

        // 解析时值
        const duration = noteElement.querySelector('duration')
        if (duration) {
          note.duration = parse_duration(duration.textContent || '0', divisions)
        }

        // 解析修饰符
        const dot = noteElement.querySelector('dot') !== null
        const timeModification = noteElement.querySelector('time-modification')
        note.modifier = parse_modifier(
          dot,
          timeModification
            ? {
                actualNotes: parseInt(
                  timeModification.querySelector('actual-notes')?.textContent ||
                    '0',
                ),
                normalNotes: parseInt(
                  timeModification.querySelector('normal-notes')?.textContent ||
                    '0',
                ),
              }
            : undefined,
        )

        // 解析连音
        if (timeModification) {
          note.tuplet = parse_tuplet({
            type: 'start',
            number: 3,
            actual: parseInt(
              timeModification.querySelector('actual-notes')?.textContent ||
                '3',
            ),
            normal: parseInt(
              timeModification.querySelector('normal-notes')?.textContent ||
                '2',
            ),
          })
        }

        // 解析声部
        const voice = noteElement.querySelector('voice')
        if (voice) {
          note.voice = parseInt(voice.textContent || '1') - 1
        }

        // 解析表情记号
        const notations = noteElement.querySelector('notations')
        if (notations) {
          note.articulation = parse_articulation(notations)
        }

        // 解析歌词
        const lyric = noteElement.querySelector('lyric')
        if (lyric) {
          note.lyric = parse_lyric(lyric)
        }

        // 解析提示音
        const cue = noteElement.querySelector('cue')
        if (cue) {
          note.cue = parse_cue(cue)
        }

        // 计算谱表位置
        note.name += '_' + note.octave
        note.staff_pos = note_name_to_staff_pos(note.name, staff.clef)

        // 生成唯一ID
        note.id = short_id()

        staff.notes.push(note)
        begin += note.duration
        measure.duration = Math.max(measure.duration, begin)
      }
    }

    measure.staves.push(staff)
    score.measures.push(measure)
  }

  // 解析连音线和渐强渐弱
  for (const measure of score.measures) {
    for (const staff of measure.staves) {
      for (const note of staff.notes) {
        if (note.id) {
          // 这里需要根据实际的 MusicXML 结构来解析连音线和渐强渐弱
          // 由于 MusicXML 的连音线和渐强渐弱通常跨越多个音符，
          // 需要更复杂的解析逻辑来匹配开始和结束标记
        }
      }
    }
  }

  return score
}

// 导出 MusicXML 函数（反向转换）
export function export_musicxml(score: Score_itf): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml +=
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n'
  xml += '<score-partwise version="4.0">\n'

  // 添加工作信息
  if (score.title.length > 0) {
    xml += '  <work>\n'
    xml += `    <work-title>${score.title[0]}</work-title>\n`
    xml += '  </work>\n'
  }

  // 添加作曲家信息
  if (score.composer.length > 0) {
    xml += '  <identification>\n'
    xml += '    <creator type="composer">\n'
    xml += `      ${score.composer[0]}\n`
    xml += '    </creator>\n'
    xml += '  </identification>\n'
  }

  // 添加乐器列表
  xml += '  <part-list>\n'
  for (let i = 0; i < score.instruments.length; i++) {
    const instrument = score.instruments[i]
    xml += `    <score-part id="P${i + 1}">\n`
    if (instrument.names.length > 0) {
      xml += `      <part-name>${instrument.names[0]}</part-name>\n`
    }
    xml += '    </score-part>\n'
  }
  xml += '  </part-list>\n'

  // 添加声部
  xml += '  <part id="P1">\n'

  for (let i = 0; i < score.measures.length; i++) {
    const measure = score.measures[i]
    xml += `    <measure number="${i + 1}">\n`

    // 添加属性
    if (
      i === 0 ||
      measure.staves[0].time_signature !==
        score.measures[Math.max(0, i - 1)].staves[0].time_signature
    ) {
      xml += '      <attributes>\n'
      xml += '        <divisions>480</divisions>\n'
      xml += `        <time>\n`
      xml += `          <beats>${measure.staves[0].time_signature[0]}</beats>\n`
      xml += `          <beat-type>${measure.staves[0].time_signature[1]}</beat-type>\n`
      xml += `        </time>\n`
      xml += `        <key>\n`
      xml += `          <fifths>${
        measure.staves[0].key_signature[0] === ACCIDENTAL.SHARP
          ? measure.staves[0].key_signature[1]
          : measure.staves[0].key_signature[0] === ACCIDENTAL.FLAT
            ? -measure.staves[0].key_signature[1]
            : 0
      }</fifths>\n`
      xml += `        </key>\n`
      xml += `        <clef>\n`
      xml += `          <sign>${
        measure.staves[0].clef === CLEF.TREBLE
          ? 'G'
          : measure.staves[0].clef === CLEF.BASS
            ? 'F'
            : 'C'
      }</sign>\n`
      xml += `        </clef>\n`
      xml += '      </attributes>\n'
    }

    // 添加音符
    for (const staff of measure.staves) {
      for (const note of staff.notes) {
        xml += '      <note>\n'

        // 音高
        const noteName = note.name.split('_')[0]
        const octave = note.octave
        xml += `        <pitch>\n`
        xml += `          <step>${noteName}</step>\n`
        xml += `          <octave>${octave}</octave>\n`
        if (note.accidental !== null) {
          xml += `          <alter>${note.accidental}</alter>\n`
        }
        xml += `        </pitch>\n`

        // 时值
        xml += `        <duration>${Math.round((note.duration * 480) / 64)}</duration>\n`
        xml += `        <voice>${note.voice + 1}</voice>\n`
        xml += `        <type>${
          note.duration >= 32
            ? 'whole'
            : note.duration >= 16
              ? 'half'
              : note.duration >= 8
                ? 'quarter'
                : note.duration >= 4
                  ? 'eighth'
                  : note.duration >= 2
                    ? '16th'
                    : '32nd'
        }</type>\n`

        if (note.modifier) {
          xml += '        <dot/>\n'
        }

        xml += '      </note>\n'
      }

      // 添加休止符
      for (const rest of staff.rests) {
        xml += '      <note>\n'
        xml += '        <rest/>\n'
        xml += `        <duration>${Math.round((rest.duration * 480) / 64)}</duration>\n`
        xml += `        <voice>${rest.voice + 1}</voice>\n`
        xml += '      </note>\n'
      }
    }

    xml += '    </measure>\n'
  }

  xml += '  </part>\n'
  xml += '</score-partwise>\n'

  return xml
}
