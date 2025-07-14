import { useEffect, useRef } from 'react'
import * as legumes from '@chihiro/legumes'
import { shallow } from 'zustand/shallow'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/editor/app-sidebar'
import { LegumesEditor } from '@/editor/legumes-editor'
import { loadSample, SAMPLES } from '@/editor/sample-loader'
import { Header } from './header'
import { useGlobalStore } from './use-global-store'

export default function Editor() {
  const outRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const setLegumes = useGlobalStore((state) => state.setLegumes)

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
    // load first sample
    const initEditor = async () => {
      try {
        if (leg) {
          const firstFile = SAMPLES[0]
          leg.setSourcePath(firstFile)
          const sample = await loadSample(firstFile)
          if (sample) {
            leg.setSource(sample)
            leg.compile()
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
        <div className="flex-1 overflow-auto">
          <div ref={outRef} className="w-full rounded-xl overflow-auto"></div>
          <div ref={playheadRef}></div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
