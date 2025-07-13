import { type StoreApi, type UseBoundStore } from 'zustand'
export interface IEditorProps {
  source: string
  sourcePath: string
  isPlaying: boolean
}

export interface IWithStore<T> {
  store: UseBoundStore<StoreApi<T>>
  // just alias of store in zustand
  useState: UseBoundStore<StoreApi<T>>
  setState: UseBoundStore<StoreApi<T>>['setState']

  getState: UseBoundStore<StoreApi<T>>['getState']
}

export interface IEditorInstance<T = IEditorProps> extends IWithStore<T> {
  compile: () => void
  tooglePlay: () => void
  play: () => void
  pause: () => void
  gotoBeginning: () => void
  getIsPlaying: () => boolean
  setIsPlaying: (isPlaying: boolean) => void
  useIsPlaying: () => boolean
  setSource: (source: string) => void
  getSource: () => string
  useSource: () => string
}
