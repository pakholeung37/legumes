import {
  DefaultFormatter,
  MusicXMLParser,
  Renderer,
  type Config,
  type Formatter,
} from '@chihiro/vexml'
import { EditorBase } from './editor-base'

export class VexmlEditor extends EditorBase {
  public musicxmlParser: MusicXMLParser
  public formatter: Formatter
  public renderer: Renderer

  private outputElement: HTMLDivElement
  constructor(config: Partial<Config>, outputElement: HTMLDivElement) {
    super()
    this.musicxmlParser = new MusicXMLParser({ config })
    this.formatter = new DefaultFormatter({ config })
    this.renderer = new Renderer({ config })
    this.outputElement = outputElement
  }
  public compile(): void {
    const sourcePath = this.getSourcePath()
    if (!sourcePath || !sourcePath.endsWith('musicxml')) {
      console.error('Only MusicXML files can be compiled')
      return
    }
    const source = this.getSource()
    if (!source) {
      console.error('No source provided for compilation')
      return
    }
    try {
      const document = this.musicxmlParser.parse(source)
      const formatted = this.formatter.format(document)
      this.renderer.render(this.outputElement, formatted)
    } catch (error) {
      console.error('Compilation error:', error)
    }
  }
  public play(): void {
    throw new Error('Method not implemented.')
  }
  public pause(): void {
    throw new Error('Method not implemented.')
  }
}
