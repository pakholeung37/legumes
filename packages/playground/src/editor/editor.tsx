import { useEffect, useRef, useState } from 'react'
import * as legumes from '@chihiro/legumes'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/editor/app-sidebar'
import { NavActions } from '@/editor/nav-actions'
import { EditorInstanceProvider } from './use-editor-instance'
import { LegumesEditor } from '@/legumes-editor'
import type { IEditorInstance } from './types'
import { SAMPLES } from '@/sample-loader'

export default function Editor() {
  const outRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const [editorInstance, setEditorInstance] = useState<IEditorInstance | null>(
    null,
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
          await editor.loadSample(firstFile)
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
          <header className="flex h-12 shrink-0 items-center gap-2 border-b">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <div className="text-sm">Project Management & Task Tracking</div>
            </div>
            <div className="ml-auto px-3">
              <NavActions />
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <div ref={outRef} className="w-full rounded-xl overflow-auto"></div>
            <div ref={playheadRef}></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </EditorInstanceProvider>
  )
}
