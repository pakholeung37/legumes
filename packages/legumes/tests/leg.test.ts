import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testLegFile } from './test-utils'

const legDir = path.resolve(__dirname, './leg')
const legFiles = fs.readdirSync(legDir).filter((f) => f.endsWith('.leg'))

describe('leg snapshots', () => {
  for (const file of legFiles) {
    it(`should match snapshot for ${file}`, async () => {
      const [_score, _drawing, svg] = testLegFile(file)
      // remove "id":"xxxx", from score
      const score = JSON.parse(
        JSON.stringify(_score).replaceAll(/"id":".*?",/g, ''),
      )

      const drawing = JSON.parse(
        JSON.stringify(_drawing).replaceAll(/"id":".*?",/g, ''),
      )

      await expect(score).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/leg/',
          file.replace('.leg', '_score.json'),
        ),
      )
      await expect(drawing).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/leg/',
          file.replace('.leg', '_drawing.json'),
        ),
      )
      await expect(svg).toMatchFileSnapshot(
        path.join(
          __dirname,
          './__snapshots__/leg/',
          file.replace('.leg', '.svg'),
        ),
      )
    })
  }
})
