// Geographic helpers. Single source of truth for distance math so the map,
// list, filters, and hydration engine all agree.

const EARTH_RADIUS_MILES = 3958.8

const toRadians = (degrees) => (degrees * Math.PI) / 180

/**
 * Great-circle distance between two lat/lng points, in miles (Haversine).
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in miles
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MILES * c
}

/**
 * Return the `count` nearest items to a point, each annotated with a
 * `distanceMiles` field, sorted ascending. Items must have `lat`/`lng`.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {Array<{lat:number,lng:number}>} items
 * @param {number} count
 * @returns {Array<object & {distanceMiles:number}>}
 */
export function nearest(lat, lng, items, count = 3) {
  return items
    .map((item) => ({
      ...item,
      distanceMiles: haversineDistance(lat, lng, item.lat, item.lng),
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, count)
}

// Default map center — downtown Austin, TX.
export const AUSTIN_CENTER = { lat: 30.2672, lng: -97.7431, zoom: 13 }
