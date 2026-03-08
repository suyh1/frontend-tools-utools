import { describe, expectTypeOf, it } from 'vitest'

describe('utools typing', () => {
  it('provides typed window objects', () => {
    expectTypeOf(window.utools).toBeObject()
    expectTypeOf(window.services).toBeObject()
  })
})
