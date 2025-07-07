import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testMidiFile } from './test-utils'

const midiDir = path.resolve(__dirname, './midi')
const midiFiles = fs.readdirSync(midiDir).filter((f) => f.endsWith('.mid'))

describe('MIDI snapshots', async () => {
  for (const file of midiFiles) {
    it(`should match snapshot for ${file}`, async () => {
      const [score, drawing, svg] = testMidiFile(file)
      await expect(score).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/midi/',
          file.replace('.mid', '_score.json'),
        ),
      )
      await expect(drawing).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/midi/',
          file.replace('.mid', '_drawing.json'),
        ),
      )
      await expect(svg).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/midi/',
          file.replace('.mid', '.svg'),
        ),
      )
    })
  }
})
