import fs from 'fs'
import path from 'path'
import {
  parse_midi,
  score_from_midi,
  compile_score,
  export_svg,
  parse_leg,
  parse_musicxml,
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
  const svg = export_svg(drawing)
  return [score, drawing, svg]
}

export function testLegFile(file: string) {
  const p = path.join(__dirname, 'leg', file)
  const txt = fs.readFileSync(p).toString()
  const score = parse_leg(txt)
  compile_score(score)
  const drawing = render_score(score as Score)
  const svg = export_svg(drawing)
  return [score, drawing, svg]
}

export function testMusicXmlFile(file: string) {
  const p = path.join(__dirname, 'musicxml', file)
  const xml = fs.readFileSync(p).toString()
  const score = parse_musicxml(xml)
  compile_score(score)
  const drawing = render_score(score as Score)
  const svg = export_svg(drawing)
  return [score, drawing, svg]
}
