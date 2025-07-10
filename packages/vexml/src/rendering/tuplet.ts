import * as vexflow from 'vexflow'
import * as util from '@/util'
import { Config } from '@/config'
import { Logger } from '@/debug'
import { Rect } from '@/spatial'
import { Document } from './document'
import { NoteRender, RestRender, TupletKey, TupletRender } from './types'

export type TupletableRender = NoteRender | RestRender

interface TupletableRenderRegistry {
  get(beamId: string): TupletableRender[] | undefined
}

export class Tuplet {
  constructor(
    private config: Config,
    private log: Logger,
    private document: Document,
    private key: TupletKey,
    private registry: TupletableRenderRegistry,
  ) {}

  render(): TupletRender {
    const tuplet = this.document.getTuplet(this.key)
    const voiceEntryRenders = this.registry.get(tuplet.id)
    util.assertDefined(voiceEntryRenders)
    util.assert(
      voiceEntryRenders.length > 1,
      'Tuplet must have more than one voice entry',
    )

    let vexflowTupletLocation: vexflow.TupletLocation | undefined
    switch (tuplet.placement) {
      case 'above':
        vexflowTupletLocation = vexflow.Tuplet.LOCATION_TOP
        break
      case 'below':
        vexflowTupletLocation = vexflow.Tuplet.LOCATION_BOTTOM
        break
    }

    const vexflowStaveNotes = voiceEntryRenders.map(
      (entry) => entry.vexflowNote,
    )
    const vexflowTuplet = new vexflow.Tuplet(vexflowStaveNotes, {
      location: vexflowTupletLocation,
      ratioed: tuplet.showNumber,
    })

    return {
      type: 'tuplet',
      key: this.key,
      rect: Rect.empty(),
      vexflowTuplet,
    }
  }
}
