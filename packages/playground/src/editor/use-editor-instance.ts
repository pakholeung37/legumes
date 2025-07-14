import type { IEditor } from './types'
import { useGlobalStore } from './use-global-store'

export const useEditorInstance = (): IEditor => {
  const state = useGlobalStore((state) => {
    return state[state.lib]
  })
  return state
}
