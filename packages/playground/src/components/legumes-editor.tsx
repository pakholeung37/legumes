import React, { useEffect, useState } from 'react'
import { initializeEditor, LegumesEditor } from '../legumes-editor'
import { SAMPLES } from '../sample-loader'
import * as Legumes from '@chihiro/legumes'
import { Menu } from './menu'

export const LegumesEditorComponent: React.FC = () => {
  const [editor, setEditor] = useState<LegumesEditor | null>(null)

  useEffect(() => {
    const initEditor = async () => {
      try {
        const editor = await initializeEditor(Legumes)
        if (editor) {
          setEditor(editor)
          const firstFile = SAMPLES[0]
          await editor.loadSample(firstFile)
        } else {
          console.error('Failed to initialize editor')
        }
      } catch (err) {
        console.error(err)
      }
    }

    initEditor()

    return () => {
      if (editor) {
        editor.abortPlay()
      }
    }
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {editor && <Menu editor={editor} />}
      <div className="flex-1 flex overflow-hidden">
        <div id="playhead" className="w-0.5 bg-red-500 absolute z-10" />
        <div id="out" className="w-2/3 h-full overflow-auto" />
        <div id="code" className="w-1/3 h-full leading-none" />
      </div>
    </div>
  )
}
