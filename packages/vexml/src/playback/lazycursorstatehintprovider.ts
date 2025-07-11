import * as elements from '@/elements'
import * as util from '@/util'
import {
  CursorFrame,
  CursorStateHint,
  CursorStateHintProvider,
  PlaybackElement,
  RetriggerHint,
  StartHint,
  StopHint,
  SustainHint,
} from './types'
import { HintDescriber } from './hintdescriber'

export class LazyCursorStateHintProvider implements CursorStateHintProvider {
  constructor(
    private currentFrame: CursorFrame,
    private previousFrame: CursorFrame | undefined,
    private hintDescriber: HintDescriber,
  ) {}

  @util.memoize()
  get(): CursorStateHint[] {
    if (!this.previousFrame) {
      return []
    }
    if (this.currentFrame === this.previousFrame) {
      return []
    }

    const previousElements = new Set(this.previousFrame.getActiveElements())
    const currentElements = new Set(this.currentFrame.getActiveElements())

    const previousNotes = this.previousFrame
      .getActiveElements()
      .filter((e) => e.name === 'note')
    const currentNotes = this.currentFrame
      .getActiveElements()
      .filter((e) => e.name === 'note')

    return [
      ...this.getStopHints(currentElements, previousElements),
      ...this.getStartHints(currentElements, previousElements),
      ...this.getRetriggerHints(currentNotes, previousNotes),
      ...this.getSustainHints(currentNotes, previousNotes),
    ]
  }

  toHumanReadable(): string[] {
    return this.get().map((hint) => this.hintDescriber.describe(hint))
  }

  private getStartHints(
    currentElements: Set<PlaybackElement>,
    previousElements: Set<PlaybackElement>,
  ): StartHint[] {
    const hints = new Array<StartHint>()

    for (const element of currentElements) {
      if (!previousElements.has(element)) {
        hints.push({ type: 'start', element })
      }
    }

    return hints
  }

  private getStopHints(
    currentElements: Set<PlaybackElement>,
    previousElements: Set<PlaybackElement>,
  ): StopHint[] {
    const hints = new Array<StopHint>()

    for (const element of previousElements) {
      if (!currentElements.has(element)) {
        hints.push({ type: 'stop', element })
      }
    }

    return hints
  }

  private getRetriggerHints(
    currentNotes: elements.Note[],
    previousNotes: elements.Note[],
  ): RetriggerHint[] {
    const hints = new Array<RetriggerHint>()

    for (const currentNote of currentNotes) {
      const previousNote = previousNotes.find((previousNote) =>
        previousNote.containsEquivalentPitch(currentNote),
      )
      if (
        previousNote &&
        previousNote !== currentNote &&
        !previousNote.sharesACurveWith(currentNote)
      ) {
        hints.push({
          type: 'retrigger',
          untriggerElement: previousNote,
          retriggerElement: currentNote,
        })
      }
    }

    return hints
  }

  private getSustainHints(
    currentNotes: elements.Note[],
    previousNotes: elements.Note[],
  ): SustainHint[] {
    const hints = new Array<SustainHint>()

    for (const currentNote of currentNotes) {
      const previousNote = previousNotes.find((previousNote) =>
        previousNote.containsEquivalentPitch(currentNote),
      )
      if (
        previousNote &&
        previousNote !== currentNote &&
        previousNote.sharesACurveWith(currentNote)
      ) {
        hints.push({
          type: 'sustain',
          previousElement: previousNote,
          currentElement: currentNote,
        })
      }
    }

    return hints
  }
}
