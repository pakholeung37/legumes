import { describe, it, expect } from 'vitest';
import { MeasureStyle } from '@/musicxml'
import { xml } from '@/util'

describe(MeasureStyle, () => {
  describe('getStaveNumber', () => {
    it('returns the number of the measure style', () => {
      const node = xml.measureStyle({ staffNumber: 4 })
      const measureStyle = new MeasureStyle(node)
      expect(measureStyle.getStaveNumber()).toBe(4)
    })

    it('defaults to null when number is missing', () => {
      const node = xml.measureStyle()
      const measureStyle = new MeasureStyle(node)
      expect(measureStyle.getStaveNumber()).toBeNull()
    })

    it('defaults to null when number is invalid', () => {
      const node = xml.measureStyle({ staffNumber: NaN })
      const measureStyle = new MeasureStyle(node)
      expect(measureStyle.getStaveNumber()).toBeNull()
    })
  })

  describe('getMultipleRestCount', () => {
    it('returns the multiple rest count', () => {
      const node = xml.measureStyle({
        multipleRest: xml.multipleRest({ multipleRestCount: 4 }),
      })
      const measureStyle = new MeasureStyle(node)
      expect(measureStyle.getMultipleRestCount()).toBe(4)
    })

    it('returns 0 when multiple rest is missing', () => {
      const node = xml.measureStyle()
      const measureStyle = new MeasureStyle(node)
      expect(measureStyle.getMultipleRestCount()).toBe(0)
    })

    it('returns 0 when multiple rest is invalid', () => {
      const node = xml.measureStyle({
        multipleRest: xml.multipleRest({ multipleRestCount: NaN }),
      })
      const measureStyle = new MeasureStyle(node)
      expect(measureStyle.getMultipleRestCount()).toBe(0)
    })
  })
})
