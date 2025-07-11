import React, { useEffect, useState } from 'react'
import { initializeEditor, LegumesEditor } from '../legumes-editor'
import { samples } from '../sample-loader'
import * as Legumes from '@chihiro/legumes'
import { Menu } from './menu'

const SAMPLE_FILE = Object.keys(samples)[0]
export const LegumesEditorComponent: React.FC = () => {
  const [editor, setEditor] = useState<LegumesEditor | null>(null)

  useEffect(() => {
    const initEditor = async () => {
      try {
        const editor = await initializeEditor(Legumes)
        if (editor) {
          setEditor(editor)
          editor.setValue(samples[SAMPLE_FILE])
          editor.compile()
        } else {
          console.error('Failed to initialize editor')
        }
      } catch (err) {
        console.error(err)
      }
    }

    initEditor()

    // Cleanup function
    return () => {
      if (editor) {
        editor.abortPlay()
      }
    }
  }, [])

  return (
    <>
      {editor && <Menu editor={editor} />}
      <div
        style={{
          background: 'floralwhite',
          overflow: 'hidden',
          height: 'calc(100vh - 32px)',
          position: 'relative',
          display: 'flex',
        }}
      >
        {/* Playhead element */}
        <div
          id="playhead"
          style={{
            zIndex: 10000,
            position: 'absolute',
            left: '0px',
            top: '0px',
            width: '2px',
            height: '0px',
            background: 'red',
          }}
        />

        {/* Output area */}
        <div
          id="out"
          style={{
            width: '70%',
            height: '100%',
            overflow: 'scroll',
          }}
        />

        {/* Code editor area */}
        <div
          id="code"
          style={{
            width: '30%',
            height: '100%',
          }}
        />
      </div>
    </>
  )
}
