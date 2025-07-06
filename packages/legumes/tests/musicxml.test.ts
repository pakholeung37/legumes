import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testMusicXmlFile } from './test-utils'

const musicXmlDir = path.resolve(__dirname, './musicxml')
const musicXmlFiles = fs
  .readdirSync(musicXmlDir)
  .filter((f) => f.endsWith('.musicxml'))

describe('leg snapshots', () => {
  for (const file of musicXmlFiles) {
    it(`should match snapshot for ${file}`, () => {
      const [, , svg] = testMusicXmlFile(file)
      expect(svg).toMatchSnapshot()
    })
  }
})
