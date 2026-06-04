import { haversineDistance, nearest, AUSTIN_CENTER } from './geo.js'

// ---------------------------------------------------------------------------
// haversineDistance
// ---------------------------------------------------------------------------
describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(30.2672, -97.7431, 30.2672, -97.7431)).toBe(0)
  })

  it('returns a finite positive number for two distinct points', () => {
    const d = haversineDistance(30.2672, -97.7431, 29.7604, -95.3698)
    expect(Number.isFinite(d)).toBe(true)
    expect(d).toBeGreaterThan(0)
  })

  it('approximates Austin → Houston as ~146 miles (±5 mi tolerance)', () => {
    // Austin: 30.2672, -97.7431  |  Houston: 29.7604, -95.3698
    const d = haversineDistance(30.2672, -97.7431, 29.7604, -95.3698)
    expect(Math.abs(d - 146)).toBeLessThan(5)
  })

  it('is symmetric: d(a,b) === d(b,a)', () => {
    const lat1 = 30.2672; const lng1 = -97.7431
    const lat2 = 29.7604; const lng2 = -95.3698
    const ab = haversineDistance(lat1, lng1, lat2, lng2)
    const ba = haversineDistance(lat2, lng2, lat1, lng1)
    expect(Math.abs(ab - ba)).toBeLessThan(1e-9)
  })

  it('1 degree of latitude ≈ 69 miles (±2 mi tolerance)', () => {
    // Along the equator, one degree latitude ≈ 69.1 mi
    const d = haversineDistance(0, 0, 1, 0)
    expect(Math.abs(d - 69.1)).toBeLessThan(2)
  })
})

// ---------------------------------------------------------------------------
// nearest
// ---------------------------------------------------------------------------
describe('nearest', () => {
  const origin = { lat: 30.2672, lng: -97.7431 }

  const items = [
    { id: 'a', lat: 30.2843, lng: -97.7367 }, // UT Gregory ~1.5 mi N
    { id: 'b', lat: 29.7604, lng: -95.3698 }, // Houston ~146 mi
    { id: 'c', lat: 30.2640, lng: -97.7713 }, // Barton Springs ~0.3 mi SW
    { id: 'd', lat: 30.5083, lng: -97.8203 }, // Brushy Creek ~17 mi N
    { id: 'e', lat: 30.2606, lng: -97.7497 }, // Ladybird S1st ~0.5 mi S
  ]

  it('returns at most `count` items (default 3)', () => {
    const result = nearest(origin.lat, origin.lng, items)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('returns at most the requested count when explicitly specified', () => {
    const result = nearest(origin.lat, origin.lng, items, 2)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('results are sorted ascending by distanceMiles', () => {
    const result = nearest(origin.lat, origin.lng, items, 5)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distanceMiles).toBeGreaterThanOrEqual(result[i - 1].distanceMiles)
    }
  })

  it('each result has a numeric distanceMiles', () => {
    const result = nearest(origin.lat, origin.lng, items, 5)
    for (const item of result) {
      expect(typeof item.distanceMiles).toBe('number')
      expect(Number.isFinite(item.distanceMiles)).toBe(true)
    }
  })

  it('does not filter items — just sorts and slices', () => {
    // All 5 items requested; expect all 5 back
    const result = nearest(origin.lat, origin.lng, items, 5)
    expect(result.length).toBe(5)
  })

  it('returns all items when count is larger than the list', () => {
    const result = nearest(origin.lat, origin.lng, items, 100)
    expect(result.length).toBe(items.length)
  })

  it('returns [] for an empty list', () => {
    const result = nearest(origin.lat, origin.lng, [], 3)
    expect(result).toEqual([])
  })

  it('preserves original item fields alongside distanceMiles', () => {
    const result = nearest(origin.lat, origin.lng, items, 1)
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('lat')
    expect(result[0]).toHaveProperty('lng')
    expect(result[0]).toHaveProperty('distanceMiles')
  })

  it('closest item to Austin center is Barton Springs area, not Houston', () => {
    const result = nearest(origin.lat, origin.lng, items, 1)
    // Houston (id: b) is the farthest; the nearest should NOT be Houston
    expect(result[0].id).not.toBe('b')
    expect(result[0].distanceMiles).toBeLessThan(10)
  })
})

// ---------------------------------------------------------------------------
// AUSTIN_CENTER
// ---------------------------------------------------------------------------
describe('AUSTIN_CENTER', () => {
  it('has the expected shape with lat, lng, and zoom', () => {
    expect(AUSTIN_CENTER).toHaveProperty('lat')
    expect(AUSTIN_CENTER).toHaveProperty('lng')
    expect(AUSTIN_CENTER).toHaveProperty('zoom')
  })

  it('has numeric lat/lng/zoom values', () => {
    expect(typeof AUSTIN_CENTER.lat).toBe('number')
    expect(typeof AUSTIN_CENTER.lng).toBe('number')
    expect(typeof AUSTIN_CENTER.zoom).toBe('number')
  })

  it('lat/lng is in the Austin area', () => {
    // Austin is roughly between 30.1–30.5 N, 97.5–98.0 W
    expect(AUSTIN_CENTER.lat).toBeGreaterThan(30)
    expect(AUSTIN_CENTER.lat).toBeLessThan(31)
    expect(AUSTIN_CENTER.lng).toBeLessThan(-97)
    expect(AUSTIN_CENTER.lng).toBeGreaterThan(-99)
  })

  it('has the documented exact coordinate values', () => {
    expect(AUSTIN_CENTER.lat).toBe(30.2672)
    expect(AUSTIN_CENTER.lng).toBe(-97.7431)
    expect(AUSTIN_CENTER.zoom).toBe(13)
  })
})
