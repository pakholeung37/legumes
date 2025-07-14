import { MusicXMLParser, MXLParser, Renderer } from '@chihiro/vexml'
import { EditorBase } from './editor-base'

export class VexmlEditor extends EditorBase {
  public musicxmlParser: MusicXMLParser
  public mxlParser: MXLParser
  public renderer: Renderer
  constructor() {
    super()
    this.musicxmlParser = new MusicXMLParser()
    this.mxlParser = new MXLParser()
    this.renderer = new Renderer()
  }
  public compile(): void {
    throw new Error('Method not implemented.')
  }
  public play(): void {
    throw new Error('Method not implemented.')
  }
  public pause(): void {
    throw new Error('Method not implemented.')
  }
}
