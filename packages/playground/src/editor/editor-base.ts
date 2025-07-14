import type { IEditor, IEditorProps } from '@/editor/types'
import { create } from 'zustand'

export abstract class EditorBase implements IEditor {
  public store
  public getState
  public setState
  public useState

  constructor() {
    this.store = create<IEditorProps>(() => ({
      source: '',
      sourcePath: '',
      isPlaying: false,
    }))
    this.getState = this.store.getState
    this.setState = this.store.setState
    this.useState = this.store
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

  public getIsPlaying(state = this.getState()): boolean {
    return state.isPlaying
  }

  public setIsPlaying(isPlaying: boolean) {
    this.setState({ isPlaying })
  }

  public useIsPlaying() {
    return this.useState(this.getIsPlaying)
  }

  public abstract compile(): void

  public abstract play(): void

  public abstract pause(): void

  public tooglePlay() {
    if (this.getIsPlaying()) {
      this.pause()
    } else {
      this.play()
    }
  }

  public gotoBeginning() {
    this.setIsPlaying(false)
  }
}
