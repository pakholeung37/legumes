import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as vexml from '@/index'
import * as path from 'path'
import * as fs from 'fs'
import { vi } from 'vitest'

const MUSICXML_PATH = path.resolve(
  __dirname,
  '..',
  '__data__',
  'vexml',
  'events.musicxml',
)

describe('events', () => {
  const div = document.createElement('div')
  let musicXML = ''
  let score: vexml.Score

  beforeAll(() => {
    musicXML = fs.readFileSync(MUSICXML_PATH, 'utf-8')
  })

  beforeEach(() => {
    const parser = new vexml.MusicXMLParser()
    const document = parser.parse(musicXML)
    const renderer = new vexml.Renderer({
      config: { INPUT_TYPE: 'hybrid', WIDTH: 900 },
    })
    score = renderer.render(div, document)
    vi.useFakeTimers()
  })

  afterEach(() => {
    score.destroy()
    vi.useRealTimers()
  })

  it('emits click events from mouse events', async () => {
    const callback = vi.fn()

    score.addEventListener('click', callback)
    score.dispatchNativeEvent(new MouseEvent('mousedown'))
    score.dispatchNativeEvent(new MouseEvent('mouseup'))

    expect(callback).toHaveBeenCalled()
  })

  it('emits longpress events from mouse events', async () => {
    const callback = vi.fn()

    score.addEventListener('longpress', callback)
    score.dispatchNativeEvent(new MouseEvent('mousedown'))
    vi.advanceTimersByTime(500)

    expect(callback).toHaveBeenCalled()
  })

  // TODO: Add tests for the rest of the events when there's a mechanism to query where the bounding shapes are and the
  // events are finalized.
})
