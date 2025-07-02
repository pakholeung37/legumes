import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { testTxtFile } from './test-utils'

const txtDir = path.resolve(__dirname, './txt')
const txtFiles = fs.readdirSync(txtDir).filter((f) => f.endsWith('.txt'))

describe('TXT snapshots', () => {
  for (const file of txtFiles) {
    it(`should match snapshot for ${file}`, () => {
      const svg = testTxtFile(file)
      expect(svg).toMatchSnapshot()
    })
  }
})
