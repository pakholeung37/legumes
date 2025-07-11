import { describe, it, expect } from 'vitest'
import { Articulations, LINE_TYPES } from '@/musicxml/'
import { xml } from '@/util'

describe(Articulations, () => {
  describe('getAccents', () => {
    it('returns the accents of the articulations', () => {
      const accent1 = xml.accent({ placement: 'above' })
      const accent2 = xml.accent({ placement: 'below' })
      const node = xml.articulations({ accents: [accent1, accent2] })

      const articulations = new Articulations(node)

      expect(articulations.getAccents()).toStrictEqual([
        { type: 'accent', placement: 'above' },
        { type: 'accent', placement: 'below' },
      ])
    })

    it('returns an empty array if there are no accents', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getAccents()).toHaveLength(0)
    })

    it('does not conflate strong accents', () => {
      const node = xml.articulations({
        strongAccents: [xml.strongAccent({ placement: 'above' })],
      })
      const articulations = new Articulations(node)
      expect(articulations.getAccents()).toHaveLength(0)
    })
  })

  describe('getStrongAccents', () => {
    it('returns the strong accents of the articulations', () => {
      const strongAccent1 = xml.strongAccent({ placement: 'above' })
      const strongAccent2 = xml.strongAccent({ placement: 'below' })
      const node = xml.articulations({
        strongAccents: [strongAccent1, strongAccent2],
      })

      const articulations = new Articulations(node)

      expect(articulations.getStrongAccents()).toStrictEqual([
        { type: 'strongaccent', placement: 'above' },
        { type: 'strongaccent', placement: 'below' },
      ])
    })

    it('returns an empty array if there are no strong accents', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getStrongAccents()).toHaveLength(0)
    })

    it('does not conflate normal accents', () => {
      const node = xml.articulations({
        accents: [xml.accent({ placement: 'above' })],
      })
      const articulations = new Articulations(node)
      expect(articulations.getStrongAccents()).toHaveLength(0)
    })
  })

  describe('getStaccatos', () => {
    it('returns the staccatos of the articulations', () => {
      const staccato1 = xml.staccato({ placement: 'above' })
      const staccato2 = xml.staccato({ placement: 'below' })
      const node = xml.articulations({ staccatos: [staccato1, staccato2] })

      const articulations = new Articulations(node)

      expect(articulations.getStaccatos()).toStrictEqual([
        { type: 'staccato', placement: 'above' },
        { type: 'staccato', placement: 'below' },
      ])
    })

    it('returns an empty array if there are no staccatos', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getStaccatos()).toHaveLength(0)
    })
  })

  describe('getTenutos', () => {
    it('returns the tenutos of the articulations', () => {
      const tenuto1 = xml.tenuto({ placement: 'above' })
      const tenuto2 = xml.tenuto({ placement: 'below' })
      const node = xml.articulations({ tenutos: [tenuto1, tenuto2] })

      const articulations = new Articulations(node)

      expect(articulations.getTenutos()).toStrictEqual([
        { type: 'tenuto', placement: 'above' },
        { type: 'tenuto', placement: 'below' },
      ])
    })

    it('returns an empty array if there are no tenutos', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getTenutos()).toHaveLength(0)
    })
  })

  describe('getDetactedLegatos', () => {
    it('returns the detached legatos of the articulations', () => {
      const detachedLegato1 = xml.detachedLegato({ placement: 'above' })
      const detachedLegato2 = xml.detachedLegato({ placement: 'below' })
      const node = xml.articulations({
        detachedLegatos: [detachedLegato1, detachedLegato2],
      })

      const articulations = new Articulations(node)

      expect(articulations.getDetachedLegatos()).toStrictEqual([
        { type: 'detachedlegato', placement: 'above' },
        { type: 'detachedlegato', placement: 'below' },
      ])
    })

    it('returns an empty array if there are no detached legatos', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getDetachedLegatos()).toHaveLength(0)
    })
  })

  describe('getStaccatissimos', () => {
    it('returns the staccatissimos of the articulations', () => {
      const staccatissimo1 = xml.staccatissimo({ placement: 'above' })
      const staccatissimo2 = xml.staccatissimo({ placement: 'below' })
      const node = xml.articulations({
        staccatissimos: [staccatissimo1, staccatissimo2],
      })

      const articulations = new Articulations(node)

      expect(articulations.getStaccatissimos()).toStrictEqual([
        { type: 'staccatissimo', placement: 'above' },
        { type: 'staccatissimo', placement: 'below' },
      ])
    })

    it('returns an empty array if there are no staccatissimos', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getStaccatissimos()).toHaveLength(0)
    })
  })

  describe('getScoops', () => {
    it('returns the scoops of the articulations: %s', () => {
      const scoop1 = xml.scoop({ placement: 'above' })
      const scoop2 = xml.scoop({ placement: 'below' })
      const node = xml.articulations({ scoops: [scoop1, scoop2] })

      const articulations = new Articulations(node)

      expect(articulations.getScoops()).toStrictEqual([
        { type: 'scoop', placement: 'above', lineType: 'solid' },
        { type: 'scoop', placement: 'below', lineType: 'solid' },
      ])
    })

    it.each(LINE_TYPES.values)(
      'returns the correct line-type: %s',
      (lineType) => {
        const node = xml.articulations({ scoops: [xml.scoop({ lineType })] })
        const articulations = new Articulations(node)
        expect(articulations.getScoops()).toStrictEqual([
          { type: 'scoop', placement: null, lineType },
        ])
      },
    )

    it('returns an empty array if there are no scoops', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getScoops()).toHaveLength(0)
    })
  })

  describe('getPlops', () => {
    it('returns the plops of the articulations: %s', () => {
      const plop1 = xml.plop({ placement: 'above' })
      const plop2 = xml.plop({ placement: 'below' })
      const node = xml.articulations({ plops: [plop1, plop2] })

      const articulations = new Articulations(node)

      expect(articulations.getPlops()).toStrictEqual([
        { type: 'plop', placement: 'above', lineType: 'solid' },
        { type: 'plop', placement: 'below', lineType: 'solid' },
      ])
    })

    it.each(LINE_TYPES.values)(
      'returns the correct line-type: %s',
      (lineType) => {
        const node = xml.articulations({ plops: [xml.plop({ lineType })] })
        const articulations = new Articulations(node)
        expect(articulations.getPlops()).toStrictEqual([
          { type: 'plop', placement: null, lineType },
        ])
      },
    )

    it('returns an empty array if there are no plops', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getPlops()).toHaveLength(0)
    })
  })

  describe('getDoits', () => {
    it('returns the doits of the articulations: %s', () => {
      const doit1 = xml.doit({ placement: 'above' })
      const doit2 = xml.doit({ placement: 'below' })
      const node = xml.articulations({ doits: [doit1, doit2] })

      const articulations = new Articulations(node)

      expect(articulations.getDoits()).toStrictEqual([
        { type: 'doit', placement: 'above', lineType: 'solid' },
        { type: 'doit', placement: 'below', lineType: 'solid' },
      ])
    })

    it.each(LINE_TYPES.values)(
      'returns the correct line-type: %s',
      (lineType) => {
        const node = xml.articulations({ doits: [xml.doit({ lineType })] })
        const articulations = new Articulations(node)
        expect(articulations.getDoits()).toStrictEqual([
          { type: 'doit', placement: null, lineType },
        ])
      },
    )

    it('returns an empty array if there are no doits', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getDoits()).toHaveLength(0)
    })
  })

  describe('getFalloffs', () => {
    it('returns the falloffs of the articulations: %s', () => {
      const falloff1 = xml.falloff({ placement: 'above' })
      const falloff2 = xml.falloff({ placement: 'below' })
      const node = xml.articulations({ falloffs: [falloff1, falloff2] })

      const articulations = new Articulations(node)

      expect(articulations.getFalloffs()).toStrictEqual([
        { type: 'falloff', placement: 'above', lineType: 'solid' },
        { type: 'falloff', placement: 'below', lineType: 'solid' },
      ])
    })

    it.each(LINE_TYPES.values)(
      'returns the correct line-type: %s',
      (lineType) => {
        const node = xml.articulations({
          falloffs: [xml.falloff({ lineType })],
        })
        const articulations = new Articulations(node)
        expect(articulations.getFalloffs()).toStrictEqual([
          { type: 'falloff', placement: null, lineType },
        ])
      },
    )

    it('returns an empty array if there are no falloffs', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getFalloffs()).toHaveLength(0)
    })
  })

  describe('getBreathMarks', () => {
    it('returns the breath marks of the articulations', () => {
      const breathMark1 = xml.breathMark({ placement: 'above' })
      const breathMark2 = xml.breathMark({ placement: 'below' })
      const node = xml.articulations({
        breathMarks: [breathMark1, breathMark2],
      })

      const articulations = new Articulations(node)

      expect(articulations.getBreathMarks()).toStrictEqual([
        { type: 'breathmark', placement: 'above' },
        { type: 'breathmark', placement: 'below' },
      ])
    })

    it('returns an empty array if there are no breath marks', () => {
      const node = xml.articulations()
      const articulations = new Articulations(node)
      expect(articulations.getBreathMarks()).toHaveLength(0)
    })
  })
})
