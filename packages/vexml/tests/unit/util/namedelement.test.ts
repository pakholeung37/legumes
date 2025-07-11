import { describe, it, expect } from 'vitest';
import { NamedElement } from '@/util'
import { xml } from '@/util'

describe(NamedElement, () => {
  describe('of', () => {
    it('creates a NamedElement instance', () => {
      const foo = xml.createElement('foo')
      const element = NamedElement.of(foo)
      expect(element).toBeInstanceOf(NamedElement)
    })

    it('sets the name property', () => {
      const foo = xml.createElement('foo')
      const element = NamedElement.of(foo)
      expect(element.name).toBe('foo')
    })
  })

  describe('isNamed', () => {
    it('returns true when the name matches the node', () => {
      const foo = xml.createElement('foo')
      const element = NamedElement.of(foo)
      expect(element.isNamed('foo')).toBeTruthy()
    })

    it('returns false when the name does not match the node', () => {
      const foo = xml.createElement('foo')
      const element = NamedElement.of(foo)
      expect(element.isNamed('fo')).toBeFalsy()
    })
  })

  describe('native', () => {
    it('returns the native element', () => {
      const foo = xml.createElement('foo')
      const element = NamedElement.of(foo)
      expect(element.native()).toBe(foo)
    })
  })

  describe('all', () => {
    it('returns all the descendent nodes matching the name', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz1 = xml.createElement('baz')
      const baz2 = xml.createElement('baz')
      foo.append(bar, baz1)
      bar.append(baz2)

      const element = NamedElement.of(foo)

      expect(element.all('baz')).toStrictEqual([
        NamedElement.of(baz1),
        NamedElement.of(baz2),
      ])
    })

    it('does not return siblings', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar, baz)

      const element = NamedElement.of(bar)

      expect(element.all('baz')).toHaveLength(0)
    })

    it('does not return ancestors', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      foo.append(bar)

      const element = NamedElement.of(bar)

      expect(element.all('foo')).toHaveLength(0)
    })
  })

  describe('first', () => {
    it('returns the first descendent nodes matching the name', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz1 = xml.createElement('baz')
      const baz2 = xml.createElement('baz')
      foo.append(bar, baz1)
      bar.append(baz2)

      const element = NamedElement.of(foo)

      expect(element.first('baz')).toStrictEqual(NamedElement.of(baz1))
    })

    it('does not return siblings', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar, baz)

      const element = NamedElement.of(bar)

      expect(element.first('baz')).toBeNull()
    })

    it('does not return ancestors', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      foo.append(bar)

      const element = NamedElement.of(bar)

      expect(element.first('foo')).toBeNull()
    })
  })

  describe('next', () => {
    it('returns the first sibling nodes matching the name', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar, baz)

      const element = NamedElement.of(bar)

      expect(element.next('baz')).toStrictEqual(NamedElement.of(baz))
    })

    it('does not return descendants', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar)
      bar.append(baz)

      const element = NamedElement.of(foo)

      expect(element.next('baz')).toBeNull()
    })

    it('does not return ancestors', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      foo.append(bar)

      const element = NamedElement.of(bar)

      expect(element.next('foo')).toBeNull()
    })
  })

  describe('prev', () => {
    it('returns the first sibling nodes matching the name', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar, baz)

      const element = NamedElement.of(baz)

      expect(element.previous('bar')).toStrictEqual(NamedElement.of(bar))
    })

    it('does not return descendants', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar)
      bar.append(baz)

      const element = NamedElement.of(foo)

      expect(element.previous('baz')).toBeNull()
    })

    it('does not return ancestors', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      foo.append(bar)

      const element = NamedElement.of(bar)

      expect(element.previous('foo')).toBeNull()
    })
  })

  describe('ancestor', () => {
    it('returns the first descendent nodes matching the name', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar)
      bar.append(baz)

      const element = NamedElement.of(baz)

      expect(element.ancestor('foo')).toStrictEqual(NamedElement.of(foo))
    })

    it('does not return siblings', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar, baz)

      const element = NamedElement.of(bar)

      expect(element.ancestor('baz')).toBeNull()
    })

    it('does not return descendents', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      foo.append(bar)
      bar.append(baz)

      const element = NamedElement.of(bar)

      expect(element.ancestor('baz')).toBeNull()
    })
  })

  describe('attr', () => {
    it('returns the attr with the specified name', () => {
      const foo = xml.createElement('foo')
      foo.setAttribute('bar', 'baz')

      const element = NamedElement.of(foo)

      expect(element.attr('bar').str()).toBe('baz')
    })

    it('defaults when the attribute is not set', () => {
      const foo = xml.createElement('foo')
      const element = NamedElement.of(foo)
      expect(element.attr('bar').str()).toBeNull()
    })
  })

  describe('content', () => {
    it('returns the text content of the node', () => {
      const foo = xml.createElement('foo')
      foo.textContent = 'bar'

      const element = NamedElement.of(foo)

      expect(element.content().str()).toBe('bar')
    })

    it('defaults when the text content is missing', () => {
      const foo = xml.createElement('foo')
      const element = NamedElement.of(foo)
      expect(element.content().str()).toBeNull()
    })
  })

  describe('children', () => {
    it('returns the children of the node with a single name', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')

      foo.append(bar, baz)

      const element = NamedElement.of(foo)

      expect(element.children('bar')).toStrictEqual([NamedElement.of(bar)])
    })

    it('returns the children of the node with multiple tag names', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')

      foo.append(bar, baz)

      const element = NamedElement.of(foo)

      expect(element.children('bar', 'baz')).toStrictEqual([
        NamedElement.of(bar),
        NamedElement.of(baz),
      ])
    })

    it('returns children in the order that they appear', () => {
      const foo = xml.createElement('foo')
      const bar1 = xml.createElement('bar')
      const bar2 = xml.createElement('bar')

      foo.append(bar1)
      bar1.append(bar2)

      const element = NamedElement.of(foo)

      expect(element.children('baz', 'bar')).toStrictEqual([
        NamedElement.of(bar1),
      ])
    })

    it('ignores ancestors deeper than child level', () => {
      const foo = xml.createElement('foo')
      const bar1 = xml.createElement('bar')
      const bar2 = xml.createElement('bar')

      foo.append(bar1)
      bar1.append(bar2)

      const element = NamedElement.of(foo)

      expect(element.children('bar', 'baz')).toStrictEqual([
        NamedElement.of(bar1),
      ])
    })

    it('returns all children when tag name is not given', () => {
      const foo = xml.createElement('foo')
      const bar = xml.createElement('bar')
      const baz = xml.createElement('baz')
      const bam = xml.createElement('bam')

      foo.append(bar, baz)
      bar.append(bam)

      const element = NamedElement.of(foo)

      expect(element.children()).toStrictEqual([
        NamedElement.of(bar),
        NamedElement.of(baz),
      ])
    })
  })
})
