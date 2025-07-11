import { describe, it, expect } from 'vitest'

describe('types', () => {
  it('loads', () => {
    expect(() => import('@/musicxml/types')).not.toThrow()
  })
})
