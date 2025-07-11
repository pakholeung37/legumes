import { describe, it, expect } from 'vitest';
import { Enum } from '@/util'

describe(Enum, () => {
  describe('includes', () => {
    it('returns true when the value is part of the choices', () => {
      const foo = new Enum(['foo'] as const)
      expect(foo.includes('foo')).toBeTruthy()
    })

    it('returns false when the value is not part of the choices', () => {
      const foo = new Enum(['foo'] as const)
      expect(foo.includes('bar')).toBeFalsy()
    })
  })
})
