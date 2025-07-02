import fs from 'fs'
import path from 'path'
import {
  parse_midi,
  score_from_midi,
  compile_score,
  render_score,
  export_svg,
  parse_txt,
} from '../src/main'
import { Score } from '../src/type'

export function testMidiFile(file: string) {
  const p = path.join(__dirname, 'midi', file)
  const bytes_in = Array.from(new Uint8Array(fs.readFileSync(p)))
  const midi_file = parse_midi(bytes_in)
  const score = score_from_midi(midi_file)
  compile_score(score)
  const drawing = render_score(score as Score)
  return export_svg(drawing)
}

export function testTxtFile(file: string) {
  const p = path.join(__dirname, 'txt', file)
  const txt = fs.readFileSync(p).toString()
  const score = parse_txt(txt)
  compile_score(score)
  const drawing = render_score(score as Score)
  return export_svg(drawing)
}
