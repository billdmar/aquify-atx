// Geographic helpers. Single source of truth for distance math so the map,
// list, filters, and hydration engine all agree.

import type { MapCenter } from '../types'

const EARTH_RADIUS_MILES = 3958.8

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

/**
 * Great-circle distance between two lat/lng points, in miles (Haversine).
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
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
 */
export function nearest<T extends { lat: number; lng: number }>(
  lat: number,
  lng: number,
  items: T[],
  count = 3,
): Array<T & { distanceMiles: number }> {
  return items
    .map((item) => ({
      ...item,
      distanceMiles: haversineDistance(lat, lng, item.lat, item.lng),
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, count)
}

// Default map center — downtown Austin, TX.
export const AUSTIN_CENTER: MapCenter = { lat: 30.2672, lng: -97.7431, zoom: 13 }
