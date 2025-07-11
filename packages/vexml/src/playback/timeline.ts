import { Logger } from '@/debug'
import { Duration } from './duration'
import {
  PlaybackElement,
  TimelineMoment,
  TimelineMomentEvent,
  ElementTransitionEvent,
} from './types'
import * as elements from '@/elements'
import { LegacyMeasureSequenceIterator } from './legacymeasuresequenceiterator'
import * as util from '@/util'
import { ElementDescriber } from './elementdescriber'

export class Timeline {
  constructor(
    private partIndex: number,
    private moments: TimelineMoment[],
    private describer: TimelineDescriber,
  ) {}

  static create(log: Logger, score: elements.Score): Timeline[] {
    const partCount = score.getPartCount()
    const timelines = new Array<Timeline>(partCount)
    for (let partIndex = 0; partIndex < partCount; partIndex++) {
      const elementDescriber = ElementDescriber.create(score, { partIndex })
      timelines[partIndex] = new TimelineFactory(log, score, partIndex).create(
        elementDescriber,
      )
    }
    return timelines
  }

  getPartIndex(): number {
    return this.partIndex
  }

  getMoment(index: number): TimelineMoment | null {
    return this.moments.at(index) ?? null
  }

  getMoments(): TimelineMoment[] {
    return this.moments
  }

  getMomentCount(): number {
    return this.moments.length
  }

  getDuration(): Duration {
    return this.moments.at(-1)?.time ?? Duration.zero()
  }

  toHumanReadable(): string[] {
    return this.describer.describe(this.moments)
  }
}

class TimelineFactory {
  // timeMs -> moment
  private moments = new Map<number, TimelineMoment>()
  private currentMeasureStartTime = Duration.zero()
  private nextMeasureStartTime = Duration.zero()

  constructor(
    private logger: Logger,
    private score: elements.Score,
    private partIndex: number,
  ) {}

  create(elementDescriber: ElementDescriber): Timeline {
    this.moments = new Map<number, TimelineMoment>()
    this.currentMeasureStartTime = Duration.zero()

    this.populateMoments()
    this.sortEventsWithinMoments()

    const moments = this.getSortedMoments()
    const describer = new TimelineDescriber(elementDescriber)

    return new Timeline(this.partIndex, moments, describer)
  }

  private getMeasuresInPlaybackOrder(): Array<{
    measure: elements.Measure
    willJump: boolean
  }> {
    const measures = this.score.getMeasures()

    const measureIndexes = Array.from(
      new LegacyMeasureSequenceIterator(
        measures.map((measure, index) => ({
          index,
          jumps: measure.getJumps(),
        })),
      ),
    )

    const result = new Array<{ measure: elements.Measure; willJump: boolean }>()

    for (let i = 0; i < measureIndexes.length; i++) {
      const current = measureIndexes[i]
      const next = measureIndexes.at(i + 1)
      const willJump = typeof next === 'number' && next !== current + 1
      const measure = measures[current]
      result.push({ measure, willJump })
    }

    return result
  }

  private proposeNextMeasureStartTime(time: Duration): void {
    this.nextMeasureStartTime = Duration.max(this.nextMeasureStartTime, time)
  }

  private toDuration(beat: util.Fraction, bpm: number): Duration {
    const duration = Duration.minutes(
      beat.divide(new util.Fraction(bpm)).toDecimal(),
    )
    // Round to the nearest ms. This is needed to correctly group transitions that should belong together.
    const ms = Math.round(duration.ms)
    return Duration.ms(ms)
  }

  private populateMoments(): void {
    for (const { measure, willJump } of this.getMeasuresInPlaybackOrder()) {
      if (measure.isMultiMeasure()) {
        this.populateMultiMeasureEvents(measure)
      } else {
        this.populateFragmentEvents(measure)
      }

      this.currentMeasureStartTime = this.nextMeasureStartTime

      if (willJump) {
        this.addJumpEvent(this.currentMeasureStartTime, measure)
      } else if (measure.isLastMeasureInSystem()) {
        const system = this.score.getSystems().at(measure.getSystemIndex())
        util.assertDefined(system)
        this.addSystemEndEvent(this.currentMeasureStartTime, system)
      }
    }
  }

  private populateMultiMeasureEvents(measure: elements.Measure): void {
    util.assert(measure.isMultiMeasure(), 'measure must be a multi-measure')

    const bpm = measure.getBpm()
    const duration = this.toDuration(measure.getBeatCount(), bpm)
    const startTime = this.currentMeasureStartTime
    const stopTime = startTime.add(duration)

    this.addTransitionStartEvent(startTime, measure, measure)
    this.addTransitionStopEvent(stopTime, measure, measure)

    this.proposeNextMeasureStartTime(stopTime)
  }

  private populateFragmentEvents(measure: elements.Measure): void {
    for (const fragment of measure.getFragments()) {
      if (fragment.isNonMusicalGap()) {
        this.populateNonMusicalGapEvents(fragment, measure)
      } else {
        this.populateVoiceEvents(fragment, measure)
      }
    }
  }

  private populateNonMusicalGapEvents(
    fragment: elements.Fragment,
    measure: elements.Measure,
  ): void {
    const duration = Duration.ms(fragment.getNonMusicalDurationMs())
    const startTime = this.currentMeasureStartTime
    const stopTime = startTime.add(duration)

    this.addTransitionStartEvent(startTime, measure, fragment)
    this.addTransitionStopEvent(stopTime, measure, fragment)

    this.proposeNextMeasureStartTime(stopTime)
  }

  private populateVoiceEvents(
    fragment: elements.Fragment,
    measure: elements.Measure,
  ): void {
    const voices = fragment
      .getParts()
      .filter((part) => part.getIndex() === this.partIndex)
      .flatMap((fragmentPart) => fragmentPart.getStaves())
      .flatMap((stave) => stave.getVoices())

    for (const voice of voices) {
      this.populateVoiceEntryEvents(voice, fragment, measure)
    }
  }

  private populateVoiceEntryEvents(
    voice: elements.Voice,
    fragment: elements.Fragment,
    measure: elements.Measure,
  ): void {
    const bpm = fragment.getBpm()

    for (const voiceEntry of voice.getEntries()) {
      const duration = this.toDuration(voiceEntry.getBeatCount(), bpm)
      // NOTE: getStartMeasureBeat() is relative to the start of the measure.
      const startTime = this.currentMeasureStartTime.add(
        this.toDuration(voiceEntry.getStartMeasureBeat(), bpm),
      )
      const stopTime = startTime.add(duration)

      this.addTransitionStartEvent(startTime, measure, voiceEntry)
      this.addTransitionStopEvent(stopTime, measure, voiceEntry)

      this.proposeNextMeasureStartTime(stopTime)
    }
  }

  private sortEventsWithinMoments(): void {
    for (const moment of this.moments.values()) {
      moment.events.sort((a, b) => {
        return this.getEventTypeOrder(a) - this.getEventTypeOrder(b)
      })
    }
  }

  private getEventTypeOrder(event: TimelineMomentEvent): number {
    if (event.type === 'transition' && event.kind === 'stop') {
      return 0
    }
    if (event.type === 'jump') {
      return 1
    }
    if (event.type === 'systemend') {
      return 2
    }
    if (event.type === 'transition' && event.kind === 'start') {
      return 3
    }
    util.assertUnreachable()
  }

  private upsert(time: Duration, event: TimelineMomentEvent): TimelineMoment {
    let moment: TimelineMoment
    if (this.moments.has(time.ms)) {
      moment = this.moments.get(time.ms)!
      moment.events.push(event)
    } else {
      moment = { time, events: [event] }
      this.moments.set(time.ms, moment)
    }
    return moment
  }

  private addTransitionStartEvent(
    time: Duration,
    measure: elements.Measure,
    element: PlaybackElement,
  ): void {
    this.upsert(time, {
      type: 'transition',
      kind: 'start',
      measure,
      element,
    })
  }

  private addTransitionStopEvent(
    time: Duration,
    measure: elements.Measure,
    element: PlaybackElement,
  ): void {
    this.upsert(time, {
      type: 'transition',
      kind: 'stop',
      measure,
      element,
    })
  }

  private addJumpEvent(time: Duration, measure: elements.Measure): void {
    this.upsert(time, { type: 'jump', measure })
  }

  private addSystemEndEvent(time: Duration, system: elements.System): void {
    this.upsert(time, { type: 'systemend', system })
  }

  private getSortedMoments(): TimelineMoment[] {
    const moments = Array.from(this.moments.values())
    return moments.sort((a, b) => a.time.compare(b.time))
  }
}

class TimelineDescriber {
  constructor(private elementDescriber: ElementDescriber) {}

  describe(moments: TimelineMoment[]): string[] {
    return moments.map((moment) => this.describeMoment(moment))
  }

  private describeMoment(moment: TimelineMoment): string {
    return `[${moment.time.ms}ms] ${moment.events.map((event) => this.describeEvent(event)).join(', ')}`
  }

  private describeEvent(event: TimelineMomentEvent): string {
    switch (event.type) {
      case 'transition':
        return this.describeTransition(event)
      case 'jump':
        return this.describeJump()
      case 'systemend':
        return this.describeSystemEnd()
    }
  }

  private describeTransition(event: ElementTransitionEvent): string {
    return `${event.kind}(${this.elementDescriber.describe(event.element)})`
  }

  private describeJump(): string {
    return 'jump'
  }

  private describeSystemEnd(): string {
    return 'systemend'
  }
}
