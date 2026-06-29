import { describe, it, expect } from 'vitest'
import { createFountainSearch, searchFountains } from './search'
import { makeFountain } from '../test/fixtures'

const fountains = [
  makeFountain({
    id: 'barton',
    name: 'Barton Springs Pool Entrance',
    address: '2201 Barton Springs Rd, Austin, TX 78746',
  }),
  makeFountain({
    id: 'ladybird',
    name: 'Lady Bird Lake Trail — S. 1st St Bridge',
    address: 'S 1st St & Riverside Dr, Austin, TX 78704',
  }),
  makeFountain({
    id: 'central',
    name: 'Austin Central Library',
    address: '710 W César Chávez St, Austin, TX 78701',
  }),
]

describe('searchFountains', () => {
  const fuse = createFountainSearch(fountains)

  it('matches exactly on name ("Barton" → Barton Springs)', () => {
    const results = searchFountains(fuse, 'Barton')
    expect(results?.[0]?.id).toBe('barton')
  })

  it('tolerates a typo ("bartn" → Barton Springs)', () => {
    const results = searchFountains(fuse, 'bartn')
    expect(results?.map((f) => f.id)).toContain('barton')
  })

  it('tolerates a misspelled multi-word name ("lday bird" → Lady Bird)', () => {
    const results = searchFountains(fuse, 'lday bird')
    expect(results?.map((f) => f.id)).toContain('ladybird')
  })

  it('is accent-insensitive ("cesar chavez" → Central Library)', () => {
    const results = searchFountains(fuse, 'cesar chavez')
    expect(results?.map((f) => f.id)).toContain('central')
  })

  it('returns null for a blank term', () => {
    expect(searchFountains(fuse, '')).toBeNull()
    expect(searchFountains(fuse, '   ')).toBeNull()
  })

  it('returns an empty array for a clearly-nonmatching term', () => {
    const results = searchFountains(fuse, 'zzzqqxnonsense')
    expect(results).toEqual([])
  })
})
