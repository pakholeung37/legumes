import fs from 'fs'
import path from 'path'
import {
  parse_midi,
  score_from_midi,
  compile_score,
  create_svg,
  parse_txt,
} from '../src/index'
import { Score } from '../src/type'
import { render_score } from '../src/render'

export function testMidiFile(file: string) {
  const p = path.join(__dirname, 'midi', file)
  const bytes_in = Array.from(new Uint8Array(fs.readFileSync(p)))
  const midi_file = parse_midi(bytes_in)
  const score = score_from_midi(midi_file)
  compile_score(score)
  const drawing = render_score(score as Score)
  return create_svg(drawing)
}

export function testTxtFile(file: string) {
  const p = path.join(__dirname, 'txt', file)
  const txt = fs.readFileSync(p).toString()
  const score = parse_txt(txt)
  compile_score(score)
  const drawing = render_score(score as Score)
  return create_svg(drawing)
}
