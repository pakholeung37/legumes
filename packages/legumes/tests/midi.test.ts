import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testMidiFile } from './test-utils'

const midiDir = path.resolve(__dirname, './midi')
const midiFiles = fs.readdirSync(midiDir).filter((f) => f.endsWith('.mid'))

describe('MIDI snapshots', () => {
  for (const file of midiFiles) {
    it(`should match snapshot for ${file}`, () => {
      const [score, drawing, svg] = testMidiFile(file)
      expect(score).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/midi/',
          file.replace('.mid', '_score.json'),
        ),
      )
      expect(drawing).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/midi/',
          file.replace('.mid', '_drawing.json'),
        ),
      )
      expect(svg).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/midi/',
          file.replace('.mid', '.svg'),
        ),
      )
    })
  }
})
