import { useEffect, useMemo, useRef, useState } from 'react'
import * as legumes from '@chihiro/legumes'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/editor/app-sidebar'
import { EditorInstanceProvider } from './use-editor-instance'
import { LegumesEditor } from '@/legumes-editor'
import type { IEditorInstance } from './types'
import { loadSample, SAMPLES } from '@/sample-loader'
import { Header } from './header'

export default function Editor() {
  const outRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const [editorInstance, setEditorInstance] = useState<IEditorInstance>(
    // @ts-ignore
    useMemo(() => new LegumesEditor(legumes), []),
  )
  useEffect(() => {
    // Find required elements
    const outputElement = outRef.current
    const playheadElement = playheadRef.current
    if (!outputElement || !playheadElement) {
      console.error('Required DOM elements not found')
      return
    }

    // Create and return editor instance
    const editor = new LegumesEditor(legumes, outputElement, playheadElement)
    setEditorInstance(editor)
    // load first sample
    const initEditor = async () => {
      try {
        if (editor) {
          const firstFile = SAMPLES[0]
          editor.setSourcePath(firstFile)
          const sample = await loadSample(firstFile)
          if (sample) {
            editor.setSource(sample)
            editor.compile()
          }
        } else {
          console.error('Failed to initialize editor')
        }
      } catch (err) {
        console.error(err)
      }
    }

    initEditor()
  }, [])

  return (
    <EditorInstanceProvider value={editorInstance ?? ({} as any)}>
      <SidebarProvider>
        {editorInstance ? <AppSidebar /> : null}
        <SidebarInset className="flex h-dvh flex-col">
          <Header></Header>
          <div className="flex-1 overflow-auto">
            <div ref={outRef} className="w-full rounded-xl overflow-auto"></div>
            <div ref={playheadRef}></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </EditorInstanceProvider>
  )
}
