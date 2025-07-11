import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testMidiFile } from './test-utils'

const midiDir = path.resolve(__dirname, './midi')
const midiFiles = fs.readdirSync(midiDir).filter((f) => f.endsWith('.mid'))

describe('MIDI snapshots', async () => {
  for (const file of midiFiles) {
    it(`should match snapshot for ${file}`, async () => {
      const [_score, _drawing, svg] = testMidiFile(file)
      // remove "id":"xxxx", from score
      const score = JSON.parse(
        JSON.stringify(_score).replaceAll(/"(_.*?)"/g, '"mock"'),
      )

      const drawing = JSON.parse(
        JSON.stringify(_drawing).replaceAll(/"(_.*?)",/g, ''),
      )

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
