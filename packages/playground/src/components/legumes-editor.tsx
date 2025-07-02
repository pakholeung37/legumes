import React, { useEffect, useState } from 'react'
import { initializeEditor, LegumesEditor } from '../legumes-editor'
import { samples } from '../sample-loader'
import * as Legumes from 'legumes'
import { Menu } from './menu'

const SAMPLE_FILE = 'mozart_turkish_march.txt'
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
          height: '100vh',
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

        {/* Compile button */}
        <button
          id="compile"
          style={{
            position: 'absolute',
            left: 'calc(70% - 60px)',
            top: '30px',
            width: '50px',
            height: '50px',
            fontSize: '32px',
            textAlign: 'center',
            border: 'none',
            background: '#f0f0f0',
            cursor: 'pointer',
            borderRadius: '5px',
          }}
          title="Compile"
        >
          🔨
        </button>

        {/* MIDI play button */}
        <button
          id="midiplay"
          style={{
            position: 'absolute',
            left: 'calc(70% - 60px)',
            top: '90px',
            width: '50px',
            height: '50px',
            fontSize: '32px',
            textAlign: 'center',
            border: 'none',
            background: '#f0f0f0',
            cursor: 'pointer',
            borderRadius: '5px',
          }}
          title="Play MIDI"
        >
          🔊
        </button>
      </div>
    </>
  )
}
