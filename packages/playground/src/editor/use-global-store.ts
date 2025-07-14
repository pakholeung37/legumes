import { create } from 'zustand'
import * as legumes from '@chihiro/legumes'
import { LegumesEditor } from './legumes-editor'
import { VexmlEditor } from './vexml-edtior'

export const useGlobalStore = create<{
  lib: 'legumes' | 'vexml'
  setLib: (lib: 'legumes' | 'vexml') => void
  legumes: LegumesEditor
  vexml: VexmlEditor
  setLegumes: (instance: LegumesEditor) => void
  setVexml: (instance: VexmlEditor) => void
}>((set) => ({
  lib: 'legumes',
  setLib: (lib) => set({ lib }),
  // @ts-ignore
  legumes: new LegumesEditor(legumes),
  setLegumes: (instance) => set({ legumes: instance }),
  vexml: new VexmlEditor(),
  setVexml: (instance) => set({ vexml: instance }),
}))
