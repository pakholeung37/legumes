import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testMidiFile } from './test-utils'

const midiDir = path.resolve(__dirname, './midi')
const midiFiles = fs.readdirSync(midiDir).filter((f) => f.endsWith('.mid'))

describe('MIDI snapshots', () => {
  for (const file of midiFiles) {
    it(`should match snapshot for ${file}`, () => {
      const svg = testMidiFile(file)
      expect(svg).toMatchFileSnapshot(
        path.join(__dirname, './__snapshots__/midi/', file.replace('.mid', '.svg')),
      )
    })
  }
})
