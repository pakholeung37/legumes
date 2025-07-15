import { useEffect, useRef } from 'react'
import * as legumes from '@chihiro/legumes'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/editor/app-sidebar'
import { LegumesEditor } from '@/editor/legumes-editor'
import { loadSample, SAMPLES } from '@/editor/sample-loader'
import { Header } from './header'
import { useGlobalStore } from './use-global-store'
import { VexmlEditor } from './vexml-edtior'

export default function Editor() {
  const outRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const setLegumes = useGlobalStore((state) => state.setLegumes)
  const setVexml = useGlobalStore((state) => state.setVexml)

  useEffect(() => {
    // Find required elements
    const outputElement = outRef.current
    const playheadElement = playheadRef.current
    if (!outputElement || !playheadElement) {
      console.error('Required DOM elements not found')
      return
    }

    // Create and return editor instance
    const leg = new LegumesEditor(legumes, outputElement, playheadElement)
    setLegumes(leg)
    const vexml = new VexmlEditor(
      { WIDTH: outputElement.clientWidth - 80 },
      outputElement,
    )
    setVexml(vexml)
    // load first sample
    const initEditor = async () => {
      const _lib = useGlobalStore.getState().lib
      const lib = _lib === 'legumes' ? leg : vexml
      try {
        if (lib) {
          const firstFile = SAMPLES[0]
          lib.setSourcePath(firstFile)
          const sample = await loadSample(firstFile)
          if (sample) {
            lib.setSource(sample)
            lib.compile()
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-dvh flex-col">
        <Header></Header>
        <div className="flex-1 overflow-auto ">
          <div
            ref={outRef}
            className="w-full rounded-xl overflow-auto flex justify-center"
          ></div>
          <div ref={playheadRef}></div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
