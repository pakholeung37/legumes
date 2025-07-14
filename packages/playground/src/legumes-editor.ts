// ES Module version of legumes editor for Vite playground
import * as Legumes from '@chihiro/legumes'
import { create } from 'zustand'
import { loadSample } from './sample-loader'
import { render_score } from '@chihiro/legumes'
import type { ScoreItf } from '@chihiro/legumes'
import type { IEditorInstance, IEditorProps } from './editor/types'

// Configuration
const CONFIG = {
  INCLUDE_CH_FONT: true,
  NO_DEP: false, // Set to false for Vite environment
}

// Global state
let globalState = {
  MIDI_SPD: 0.0064,
  OUT_FUNC: null as any,
}

// MIDI key mapping
const nameMidiKey: Record<number, string> = {
  12: 'C0',
  13: 'Db0',
  14: 'D0',
  15: 'Eb0',
  16: 'E0',
  17: 'F0',
  18: 'Gb0',
  19: 'G0',
  20: 'G#0',
  21: 'A0',
  22: 'Bb0',
  23: 'B0',
  24: 'C1',
  25: 'Db1',
  26: 'D1',
  27: 'D#1',
  28: 'E1',
  29: 'F1',
  30: 'Gb1',
  31: 'G1',
  32: 'G#1',
  33: 'A1',
  34: 'Bb1',
  35: 'B1',
  36: 'C2',
  37: 'Db2',
  38: 'D2',
  39: 'D#2',
  40: 'E2',
  41: 'F2',
  42: 'Gb2',
  43: 'G2',
  44: 'G#2',
  45: 'A2',
  46: 'Bb2',
  47: 'B2',
  48: 'C3',
  49: 'Db3',
  50: 'D3',
  51: 'Eb3',
  52: 'E3',
  53: 'F3',
  54: 'Gb3',
  55: 'G3',
  56: 'G#3',
  57: 'A3',
  58: 'Bb3',
  59: 'B3',
  60: 'C4',
  61: 'Db4',
  62: 'D4',
  63: 'Eb4',
  64: 'E4',
  65: 'F4',
  66: 'Gb4',
  67: 'G4',
  68: 'G#4',
  69: 'A4',
  70: 'Bb4',
  71: 'B4',
  72: 'C5',
  73: 'Db5',
  74: 'D5',
  75: 'Eb5',
  76: 'E5',
  77: 'F5',
  78: 'F#5',
  79: 'G5',
  80: 'G#5',
  81: 'A5',
  82: 'Bb5',
  83: 'B5',
  84: 'C6',
  85: 'Db6',
  86: 'D6',
  87: 'Eb6',
  88: 'E6',
  89: 'F6',
  90: 'Gb6',
  91: 'G6',
  92: 'G#6',
  93: 'A6',
  94: 'Bb6',
  95: 'B6',
  96: 'C7',
  97: 'Db7',
  98: 'D7',
  99: 'Eb7',
  100: 'E7',
  101: 'F7',
  102: 'Gb7',
  103: 'G7',
  104: 'G#7',
  105: 'A7',
  106: 'Bb7',
  107: 'B7',
  108: 'C8',
  109: 'Db8',
  110: 'D8',
  111: 'Eb8',
  112: 'E8',
  113: 'F8',
  114: 'Gb8',
  115: 'G8',
  116: 'G#8',
  117: 'A8',
  118: 'Bb8',
  119: 'B8',
  120: 'C9',
  122: 'D9',
  124: 'E9',
  125: 'F9',
  127: 'G9',
}

// Utility functions

// Main editor class
export class LegumesEditor implements IEditorInstance {
  store
  getState
  setState
  useState
  public legumes: typeof Legumes
  private outputElement: HTMLElement
  private playheadElement: HTMLElement
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private synths: Record<string, any> = {}

  constructor(
    legumes: typeof Legumes,
    outputElement: HTMLElement,
    playheadElement: HTMLElement,
  ) {
    this.legumes = legumes
    this.outputElement = outputElement
    this.playheadElement = playheadElement
    this.store = create<IEditorProps>(() => ({
      source: '',
      sourcePath: '',
      isPlaying: false,
    }))
    this.getState = this.store.getState
    this.setState = this.store.setState
    this.useState = this.store
    this.setOutputFunction(this.legumes.export_svg)
  }

  public setSource(value: string) {
    this.setState({ source: value })
  }

  public getSource(state = this.getState()): string {
    return state.source
  }

  public useSource(): string {
    return this.useState(this.getSource)
  }

  public setSourcePath(value: string) {
    this.setState({ sourcePath: value })
  }

  public getSourcePath(state = this.getState()): string {
    return state.sourcePath
  }

  public useSourcePath(): string {
    return this.useState(this.getSourcePath)
  }

  private getExtName(): string {
    return this.getSourcePath().split('.').pop() || 'leg'
  }

  public compile() {
    if (!this.legumes) return

    // Set configuration
    this.legumes.CONFIG.PAGE_WIDTH = this.outputElement.clientWidth
    this.legumes.CONFIG.INTER_NOTE_WIDTH = 0

    try {
      let score: ScoreItf
      const extName = this.getExtName()
      if (extName === 'leg') {
        score = this.legumes.parse_leg(this.getSource())
      } else if (extName === 'musicxml') {
        score = this.legumes.parse_musicxml(this.getSource())
        console.log('score', score)
      } else {
        throw new Error(`Unsupported file type: ${extName}`)
      }

      this.legumes.compile_score(score)
      ;(window as any).score = score
      const drawing = render_score(score as any)

      this.legumes.round_polylines(drawing.polylines, 2)

      const outFunc = globalState.OUT_FUNC || this.legumes.export_svg
      const svg = outFunc(drawing, { background: null })
      this.outputElement.innerHTML = svg
    } catch (e) {
      console.error(e)
    }
  }

  public tooglePlay() {
    if (this.getIsPlaying()) {
      this.pause()
    } else {
      this.play()
    }
  }

  public play() {
    this.pause()
    this.compile()

    this.setState({ isPlaying: true })

    this.synths = {}
    const offset = 1
    const now =
      (window as any).Tone?.now() + offset || Date.now() / 1000 + offset
    const spd = globalState.MIDI_SPD

    const score = this.legumes.parse_leg(this.getSource())
    this.legumes.compile_score(score)
    const midiFile = this.legumes.score_to_midi(score)

    const cont = this.outputElement
    const elt = this.playheadElement
    elt.style.position = 'absolute'
    elt.style.zIndex = '10000'

    let TT = 0
    let epsilon = 0
    const dEpsilon = 0.00001

    for (let i = 0; i < midiFile.tracks.length; i++) {
      let T = 0
      for (let j = 0; j < midiFile.tracks[i].events.length; j++) {
        const e = midiFile.tracks[i].events[j]
        T += e.delta_time
        // @ts-expect-error
        const id = `${i}-${e.data.key}`
        if (e.type === 'NOTE_ON') {
          if (!this.synths[id] && (window as any).Tone) {
            this.synths[id] = new (window as any).Tone.Synth().toDestination()
            // @ts-expect-error
            this.synths[id].volume.value = (64 - e.data.key) / 3
          }
          if (this.synths[id]) {
            this.synths[id].triggerAttack(
              // @ts-expect-error
              nameMidiKey[e.data.key],
              now + T * spd + (epsilon += dEpsilon),
            )
          }
        } else if (e.type === 'NOTE_OFF' && this.synths[id]) {
          this.synths[id].triggerRelease(now + T * spd + (epsilon += dEpsilon))
        }
      }
      TT = Math.max(T, TT)
    }

    // Playhead animation
    for (let i = 0; i < TT; i++) {
      const mul64 = i / (midiFile.ticks_per_quarter_note! / 16)
      const [x0, y0, _, y1] = this.legumes.playhead_coords(score as any, mul64)
      const timeoutId = setTimeout(
        () => {
          if (this.getIsPlaying()) {
            // 只有在播放状态才更新 playhead
            elt.style.left = x0 - cont.scrollLeft + 'px'
            elt.style.top = y0 + 20 - cont.scrollTop + 'px'
            elt.style.height = y1 - y0 + 'px'
          }
        },
        1000 * (offset + i * spd),
      )
      this.timeouts.push(timeoutId)
    }

    const finalTimeoutId = setTimeout(
      () => {
        if (this.getIsPlaying()) {
          // 只有在播放状态才重置 playhead
          this.resetPlayhead()
          this.setIsPlaying(false)
        }
      },
      1000 * (offset + (TT + 1) * spd),
    )
    this.timeouts.push(finalTimeoutId)
  }

  public pause() {
    this.setIsPlaying(false)

    if (this.synths) {
      for (const key in this.synths) {
        if (this.synths[key]) {
          this.synths[key].volume.value = 0
          this.synths[key].disconnect()
          this.synths[key].dispose()
        }
      }
    }
    for (let i = 0; i < this.timeouts.length; i++) {
      clearTimeout(this.timeouts[i])
    }
    this.timeouts = []
  }

  private resetPlayhead() {
    if (this.playheadElement) {
      this.playheadElement.style.left = '0px'
      this.playheadElement.style.top = '0px'
      this.playheadElement.style.height = '0px'
    }
  }

  public exportSvg() {
    downloadPlain('score.svg', this.outputElement.innerHTML)
  }

  public exportAnimatedSvg() {
    // this.legumes.export_animated_svg(this.outputElement.innerHTML)
  }

  public exportPdf() {
    const score = this.legumes.parse_leg(this.getSource())
    this.legumes.compile_score(score)
    const drawing = render_score(score as any)
    const pdf = this.legumes.export_pdf(drawing)
    downloadPlain('score.pdf', pdf)
  }

  public exportMidi() {
    const score = this.legumes.parse_leg(this.getSource())
    const midiFile = this.legumes.score_to_midi(score)
    const bytes = this.legumes.export_midi(midiFile)
    downloadBin('score.mid', new Uint8Array(bytes))
  }

  public importTxt() {
    uploadFile('Text', (txt) => {
      this.setSource(txt as string)
      this.compile()
    })
  }

  public importMidi() {
    uploadFile('ArrayBuffer', (bytes) => {
      const bytesIn = Array.from(new Uint8Array(bytes as ArrayBuffer))
      const midiFile = this.legumes.parse_midi(bytesIn)
      const score = this.legumes.score_from_midi(midiFile)
      this.legumes.compile_score(score)
      const txto = this.legumes.export_txt(score)
      this.setSource(txto)
      this.compile()
    })
  }

  public setOutputFunction(func: any) {
    globalState.OUT_FUNC = func
  }

  public setMidiSpeed(speed: number) {
    globalState.MIDI_SPD = speed
  }

  public getMidiSpeed(): number {
    return globalState.MIDI_SPD
  }

  public getIsPlaying(state = this.getState()): boolean {
    return state.isPlaying
  }

  public setIsPlaying(isPlaying: boolean) {
    this.setState({ isPlaying })
  }
  public gotoBeginning() {
    this.resetPlayhead()
    this.setIsPlaying(false)
  }
  public useIsPlaying() {
    return this.useState(this.getIsPlaying)
  }
}

const uploadFile = (
  type: 'Text' | 'ArrayBuffer',
  callback: (result: string | ArrayBuffer) => void,
) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.click()
  input.addEventListener(
    'change',
    (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (evt) => {
          callback(evt.target?.result as string | ArrayBuffer)
        }
        reader[`readAs${type}`](file)
      }
    },
    false,
  )
}

// Download utilities
const downloadPlain = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.hidden = true
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const downloadBin = (filename: string, content: Uint8Array) => {
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.hidden = true
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
