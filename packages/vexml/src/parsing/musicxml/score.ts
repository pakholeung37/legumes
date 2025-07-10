import * as data from '@/data'
import * as musicxml from '@/musicxml'
import { System } from './system'
import { IdProvider } from './idprovider'
import { ScoreContext } from './contexts'
import { Config } from '@/config'
import { Logger } from '@/debug'

export class Score {
  private constructor(
    private config: Config,
    private log: Logger,
    private idProvider: IdProvider,
    private title: string,
    private partLabels: string[],
    private systems: System[],
  ) {}

  static create(
    config: Config,
    log: Logger,
    musicXML: { scorePartwise: musicxml.ScorePartwise },
  ): Score {
    const idProvider = new IdProvider()
    const title = musicXML.scorePartwise.getTitle()
    const partLabels = musicXML.scorePartwise
      .getPartDetails()
      .map((p) => p.name)

    // When parsing, we'll assume that there is only one system. Pre-rendering determines the minimum needed widths for
    // each element. We can then use this information to determine the number of systems needed to fit a constrained
    // width if needed.
    const systems = [
      System.create(config, log, { scorePartwise: musicXML.scorePartwise }),
    ]

    return new Score(config, log, idProvider, title, partLabels, systems)
  }

  parse(): data.Score {
    const scoreCtx = new ScoreContext(this.idProvider)

    return {
      type: 'score',
      title: this.title,
      partLabels: this.partLabels,
      systems: this.systems.map((s) => s.parse(scoreCtx)),
      curves: scoreCtx.getCurves(),
      wedges: scoreCtx.getWedges(),
      pedals: scoreCtx.getPedals(),
      octaveShifts: scoreCtx.getOctaveShifts(),
      vibratos: scoreCtx.getVibratos(),
    }
  }
}
