import { NamedElement } from '@/util'
import { TIME_SYMBOLS, TimeSymbol } from './enums'

/**
 * Time represents a time signature element.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/time/
 */
export class Time {
  constructor(private element: NamedElement<'time'>) {}

  /** Returns the stave number this time belongs to. Defaults to null. */
  getStaveNumber(): number | null {
    return this.element.attr('number').int()
  }

  /** Returns the beats of the time. */
  getBeats(): string[] {
    return this.element
      .all('beats')
      .map((beats) => beats.content().str())
      .filter((content): content is string => typeof content === 'string')
  }

  /** Returns the beat types of the time. */
  getBeatTypes(): string[] {
    return this.element
      .all('beat-type')
      .map((beatType) => beatType.content().str())
      .filter((content): content is string => typeof content === 'string')
  }

  /** Returns whether the time signature is hidden. */
  isHidden(): boolean {
    return !!this.element.first('senza-misura')
  }

  /** Returns the symbol of the time. */
  getSymbol(): TimeSymbol | null {
    return this.element.attr('symbol').enum(TIME_SYMBOLS) ?? null
  }
}
