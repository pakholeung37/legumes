import * as util from '@/util'
import { Attributes } from './attributes'
import { Barline } from './barline'
import { NamedElement, max } from '@/util'
import { Note } from './note'
import { Print } from './print'
import { Backup } from './backup'
import { Forward } from './forward'
import { Direction } from './direction'

export type MeasureEntry = Attributes | Note | Backup | Forward | Direction

/**
 * Measure is a basic musical data container that has notes and rests.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/measure-partwise/
 */
export class Measure {
  constructor(private element: NamedElement<'measure'>) {}

  // Wether the measure number should appear or not.
  isImplicit(): boolean {
    return this.element.attr('implicit').withDefault('no').str() === 'yes'
  }

  /** Returns the measure number or an empty string if missing. */
  getNumber(): string {
    return this.element.attr('number').withDefault('').str()
  }

  /** Returns the specified measured width in tenths. Defaults to null. */
  getWidth(): number | null {
    return this.element.attr('width').int()
  }

  /** Returns the <attributes> element of the measure. */
  getAttributes(): Attributes[] {
    return this.element
      .all('attributes')
      .map((element) => new Attributes(element))
  }

  /** Returns the entries of the measure. */
  getEntries(): MeasureEntry[] {
    return this.element
      .children('attributes', 'note', 'backup', 'forward', 'direction')
      .map((element) => {
        if (element.isNamed('attributes')) {
          return new Attributes(element)
        }
        if (element.isNamed('note')) {
          return new Note(element)
        }
        if (element.isNamed('backup')) {
          return new Backup(element)
        }
        if (element.isNamed('forward')) {
          return new Forward(element)
        }
        if (element.isNamed('direction')) {
          return new Direction(element)
        }
        throw new Error(`unexpected element: <${element.name}>`)
      })
  }

  /** Returns the barlines of the measure. */
  getBarlines(): Barline[] {
    return this.element.all('barline').map((element) => new Barline(element))
  }

  /** Returns the prints of the measure. */
  getPrints(): Print[] {
    return this.element.all('print').map((element) => new Print(element))
  }

  /** Returns the ending measure for multi rest measures, or itself otherwise. */
  getEndingMeasure(): Measure {
    const multipleRestCount = max(
      this.getAttributes()
        .flatMap((attributes) => attributes.getMeasureStyles())
        .map((measureStyle) => measureStyle.getMultipleRestCount()),
    )

    let measure = this.element
    for (let index = 1; index < multipleRestCount; index++) {
      // We don't expect the next measure to be null. However, if we do come across a null measure, we fallback to the
      // last non-null measure we came across.
      measure = measure.next('measure') ?? measure
    }

    return new Measure(measure)
  }

  /**
   * Returns the first sound[tempo] specification in the measure.
   *
   * Technically, this can be specified multiple times per measure, but this is a simplification that covers most music.
   * This is independent of the <metronome> element, which describes how to signal metronome engravings.
   */
  getFirstTempo(): number | null {
    return util.first(
      this.element
        .children('sound')
        .map((sound) => sound.attr('tempo').int())
        .filter((tempo) => typeof tempo === 'number'),
    )
  }
}
