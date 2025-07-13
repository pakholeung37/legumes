import { createContext, useContext } from 'react'
import type { IEditorInstance } from './types'

const EditorInstanceContext = createContext<IEditorInstance>(
  {} as IEditorInstance,
)

export const useEditorInstance = () => {
  const context = useContext(EditorInstanceContext)
  if (!context) {
    // throw new Error(
    //   'useEditorInstance must be used within an EditorInstanceProvider',
    // )
  }
  return context
}

export const EditorInstanceProvider = EditorInstanceContext.Provider
