import { describe, it, expect } from 'vitest';
import { PEDAL_TYPES, Pedal } from '@/musicxml'
import { xml } from '@/util'

describe(Pedal, () => {
  describe('getType', () => {
    it.each(PEDAL_TYPES.values)(
      `returns the type of the pedal: '%s'`,
      (type) => {
        const node = xml.pedal({ type })
        const pedal = new Pedal(node)
        expect(pedal.getType()).toBe(type)
      },
    )

    it(`defaults to 'start' when missing`, () => {
      const node = xml.pedal()
      const pedal = new Pedal(node)
      expect(pedal.getType()).toBe('start')
    })

    it(`defaults to 'start' when invalid`, () => {
      const node = xml.pedal({ type: 'foo' })
      const pedal = new Pedal(node)
      expect(pedal.getType()).toBe('start')
    })
  })

  describe('line', () => {
    it(`returns the line of the pedal: 'yes'`, () => {
      const node = xml.pedal({ line: 'yes' })
      const pedal = new Pedal(node)
      expect(pedal.line()).toBeTruthy()
    })

    it(`returns the line of the pedal: 'no'`, () => {
      const node = xml.pedal({ line: 'no' })
      const pedal = new Pedal(node)
      expect(pedal.line()).toBeFalsy()
    })

    it('defaults to false when missing', () => {
      const node = xml.pedal()
      const pedal = new Pedal(node)
      expect(pedal.line()).toBeFalsy()
    })

    it('defaults to false when invalid', () => {
      const node = xml.pedal({ line: 'foo' })
      const pedal = new Pedal(node)
      expect(pedal.line()).toBeFalsy()
    })
  })

  describe('sign', () => {
    it(`returns the sign of the pedal: 'yes'`, () => {
      const node = xml.pedal({ sign: 'yes' })
      const pedal = new Pedal(node)
      expect(pedal.sign()).toBeTruthy()
    })

    it(`returns the sign of the pedal: 'no'`, () => {
      const node = xml.pedal({ sign: 'no' })
      const pedal = new Pedal(node)
      expect(pedal.sign()).toBeFalsy()
    })

    it('defaults to false when missing', () => {
      const node = xml.pedal()
      const pedal = new Pedal(node)
      expect(pedal.sign()).toBeFalsy()
    })

    it('defaults to false when invalid', () => {
      const node = xml.pedal({ sign: 'foo' })
      const pedal = new Pedal(node)
      expect(pedal.sign()).toBeFalsy()
    })
  })
})
