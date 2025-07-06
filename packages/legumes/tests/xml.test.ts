import { describe, it, expect } from 'vitest'
import { parse_musicxml, export_musicxml } from '../src/xmlfmt'

describe('MusicXML Parser', () => {
  it('should parse basic MusicXML with notes and rests', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work>
    <work-title>Test Piece</work-title>
  </work>
  <identification>
    <creator type="composer">Test Composer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <rest/>
        <duration>1920</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    
    expect(score.title).toEqual(['Test Piece'])
    expect(score.composer).toEqual(['Test Composer'])
    expect(score.instruments).toHaveLength(1)
    expect(score.instruments[0].names).toEqual(['Piano'])
    expect(score.measures).toHaveLength(2)
    
    // 检查第一个小节
    const measure1 = score.measures[0]
    expect(measure1.staves).toHaveLength(1)
    expect(measure1.staves[0].notes).toHaveLength(4)
    expect(measure1.staves[0].notes[0].name).toBe('C_4')
    expect(measure1.staves[0].notes[1].name).toBe('D_4')
    expect(measure1.staves[0].notes[2].name).toBe('E_4')
    expect(measure1.staves[0].notes[3].name).toBe('F_4')
    
    // 检查第二个小节（休止符）
    const measure2 = score.measures[1]
    expect(measure2.staves[0].rests).toHaveLength(1)
    expect(measure2.staves[0].rests[0].duration).toBe(16) // 全音符
  })

  it('should parse MusicXML with accidentals', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Test</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
          <alter>1</alter>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
          <alter>-1</alter>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    const notes = score.measures[0].staves[0].notes
    
    expect(notes[0].accidental).toBe(1) // C#
    expect(notes[1].accidental).toBe(-1) // Fb
  })

  it('should parse MusicXML with time signatures', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Test</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>3</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    const timeSignature = score.measures[0].staves[0].time_signature
    
    expect(timeSignature).toEqual([3, 4])
  })

  it('should parse MusicXML with key signatures', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Test</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>2</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    const keySignature = score.measures[0].staves[0].key_signature
    
    expect(keySignature).toEqual([1, 2]) // 2 sharps
  })

  it('should parse MusicXML with dots', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Test</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>720</duration>
        <voice>1</voice>
        <type>quarter</type>
        <dot/>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    const note = score.measures[0].staves[0].notes[0]
    
    expect(note.modifier).toBe(true)
  })

  it('should parse MusicXML with tuplets', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Test</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>320</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>320</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>320</duration>
        <voice>1</voice>
        <type>eighth</type>
        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    const notes = score.measures[0].staves[0].notes
    
    expect(notes[0].tuplet).toBeTruthy()
    expect(notes[1].tuplet).toBeTruthy()
    expect(notes[2].tuplet).toBeTruthy()
    expect(notes[0].tuplet?.label).toBe(3)
  })

  it('should parse MusicXML with lyrics', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Test</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>480</duration>
        <voice>1</voice>
        <type>quarter</type>
        <lyric>
          <text>Hello</text>
        </lyric>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    const note = score.measures[0].staves[0].notes[0]
    
    expect(note.lyric).toBe('Hello')
  })

  it('should export MusicXML correctly', () => {
    const score = {
      title: ['Test Export'],
      composer: ['Test Composer'],
      instruments: [{
        bracket: 0,
        names: ['Piano'],
        connect_barlines: [false]
      }],
      slurs: [],
      measures: [{
        duration: 16,
        barline: 1,
        staves: [{
          clef: 0,
          time_signature: [4, 4],
          key_signature: [0, 0],
          notes: [{
            begin: 0,
            duration: 16,
            accidental: null,
            modifier: false,
            octave: 4,
            name: 'C_4',
            voice: 0,
            staff_pos: 0,
            stem_dir: 1,
            prev_in_chord: null,
            next_in_chord: null,
            tuplet: null
          }],
          grace: [],
          rests: [],
          voices: 1,
          beams: []
        }]
      }],
      crescs: []
    }

    const xml = export_musicxml(score)
    
    expect(xml).toContain('Test Export')
    expect(xml).toContain('Test Composer')
    expect(xml).toContain('Piano')
    expect(xml).toContain('<note>')
    expect(xml).toContain('<pitch>')
    expect(xml).toContain('<step>C</step>')
    expect(xml).toContain('<octave>4</octave>')
  })

  it('should handle empty or invalid XML gracefully', () => {
    expect(() => parse_musicxml('')).toThrow()
    expect(() => parse_musicxml('<invalid>')).toThrow()
  })

  it('should parse complex MusicXML with multiple measures', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work>
    <work-title>Complex Piece</work-title>
  </work>
  <identification>
    <creator type="composer">Complex Composer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
    <score-part id="P2">
      <part-name>Cello</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>480</divisions>
        <time>
          <beats>6</beats>
          <beat-type>8</beat-type>
        </time>
        <key>
          <fifths>-2</fifths>
        </key>
        <clef>
          <sign>G</sign>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>240</duration>
        <voice>1</voice>
        <type>eighth</type>
      </note>
      <note>
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>240</duration>
        <voice>1</voice>
        <type>eighth</type>
      </note>
    </measure>
    <measure number="2">
      <barline>
        <bar-style>double</bar-style>
      </barline>
      <note>
        <rest/>
        <duration>1440</duration>
        <voice>1</voice>
        <type>dotted-half</type>
      </note>
    </measure>
  </part>
</score-partwise>`

    const score = parse_musicxml(xml)
    
    expect(score.title).toEqual(['Complex Piece'])
    expect(score.composer).toEqual(['Complex Composer'])
    expect(score.instruments).toHaveLength(2)
    expect(score.instruments[0].names).toEqual(['Violin'])
    expect(score.instruments[1].names).toEqual(['Cello'])
    expect(score.measures).toHaveLength(2)
    
    // 检查第一个小节
    const measure1 = score.measures[0]
    expect(measure1.staves[0].time_signature).toEqual([6, 8])
    expect(measure1.staves[0].key_signature).toEqual([-1, 2]) // 2 flats
    expect(measure1.staves[0].notes).toHaveLength(2)
    
    // 检查第二个小节
    const measure2 = score.measures[1]
    expect(measure2.barline).toBe(2) // double barline
    expect(measure2.staves[0].rests).toHaveLength(1)
  })
}) 