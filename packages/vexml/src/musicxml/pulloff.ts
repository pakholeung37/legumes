import { NamedElement } from '@/util'
import { START_STOP, StartStop } from './enums'

/**
 * The `<pull-off>` element is used in guitar and fretted instrument notation.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/pull-off/
 */
export class PullOff {
  constructor(private element: NamedElement<'pull-off'>) {}

  /** Returns the number of the pull-off. Defaults to null;. */
  getNumber(): number | null {
    return this.element.attr('number').int()
  }

  /** Returns the type of pull-off. */
  getType(): StartStop | null {
    return this.element.attr('type').enum(START_STOP)
  }
}
