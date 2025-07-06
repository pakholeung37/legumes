import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testLegFile } from './test-utils'

const legDir = path.resolve(__dirname, './leg')
const legFiles = fs.readdirSync(legDir).filter((f) => f.endsWith('.leg'))

describe('leg snapshots', () => {
  for (const file of legFiles) {
    it(`should match snapshot for ${file}`, () => {
      const svg = testLegFile(file)
      expect(svg).toMatchFileSnapshot(
        path.join(__dirname,'./__snapshots__/leg/', file.replace('.leg', '.svg')),
      )
    })
  }
})
