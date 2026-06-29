// fountainTypes.ts — single source of truth for how fountain types and
// statuses are labelled and coloured across the app (card, map popup,
// detail page). Previously duplicated in FountainCard and AquifyMap.

import type { FountainType, FountainStatus } from '../types'

/** Human-readable label for each fountain type. */
export const TYPE_LABELS: Record<FountainType, string> = {
  fountain: 'Drinking Fountain',
  'bottle-filler': 'Bottle Filler',
  both: 'Fountain + Bottle Filler',
}

/** Tailwind badge classes (light bg + readable text) per type. */
export const TYPE_BADGE_CLASSES: Record<FountainType, string> = {
  fountain: 'bg-blue-100 text-blue-800',
  'bottle-filler': 'bg-green-100 text-green-800',
  both: 'bg-purple-100 text-purple-800',
}

/** Marker fill colours (hex) per type, for the Leaflet div-icons. */
export const TYPE_MARKER_COLORS: Record<FountainType | 'inactive' | 'user', string> = {
  fountain: '#2563eb', // blue-600
  'bottle-filler': '#16a34a', // green-600
  both: '#7c3aed', // purple-600
  inactive: '#6b7280', // gray-500
  user: '#0284c7', // sky-600
}

/** Tailwind pill classes per status. */
export const STATUS_CLASSES: Record<FountainStatus, string> = {
  active: 'bg-green-100 text-green-800',
  unverified: 'bg-amber-100 text-amber-800',
  inactive: 'bg-gray-100 text-gray-600',
}

/** Tailwind dot colour per status. */
export const STATUS_DOTS: Record<FountainStatus, string> = {
  active: 'bg-green-500',
  unverified: 'bg-amber-500',
  inactive: 'bg-gray-400',
}

const TYPE_BADGE_FALLBACK = 'bg-gray-100 text-gray-700'

export function typeLabel(type: string): string {
  return TYPE_LABELS[type as FountainType] ?? type
}

export function typeBadgeClass(type: string): string {
  return TYPE_BADGE_CLASSES[type as FountainType] ?? TYPE_BADGE_FALLBACK
}

export function statusClass(status: string): string {
  return STATUS_CLASSES[status as FountainStatus] ?? STATUS_CLASSES.inactive
}

export function statusDot(status: string): string {
  return STATUS_DOTS[status as FountainStatus] ?? STATUS_DOTS.inactive
}
