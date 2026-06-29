// types.ts — single source of truth for the Aquify ATX domain model.
//
// Every layer (data seed, Firestore access, contexts, components) imports
// these types so the shape of a fountain / review / submission is defined
// exactly once.

/** What a fountain dispenses. */
export type FountainType = 'fountain' | 'bottle-filler' | 'both'

/** Operational status of a fountain. */
export type FountainStatus = 'active' | 'unverified' | 'inactive'

/** A public water source on the map. Matches src/data/fountains.json. */
export interface Fountain {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: FountainType
  status: FountainStatus
  accessible: boolean
  notes?: string
  /** Provenance: 'seed' for committed data, or a user uid for submissions. */
  addedBy?: string
}

/** A fountain annotated with its great-circle distance from a reference point. */
export type FountainWithDistance = Fountain & { distanceMiles: number }

/** A simple lat/lng pair (e.g. the user's geolocation). */
export interface LatLng {
  lat: number
  lng: number
}

/** Map center, optionally with a zoom level. */
export type MapCenter = LatLng & { zoom?: number }

/** Current weather conditions feeding the hydration engine. */
export interface Weather {
  tempF: number
  heatIndexF: number
  uvIndex: number
  humidity: number
}

/** One reason the recommended intake was raised above baseline. */
export interface HydrationFactor {
  label: string
  cups: number
}

/** Output of the rule-based hydration engine. */
export interface HydrationScore {
  cups: number
  liters: number
  reason: string
  factors: HydrationFactor[]
}

/** Full hydration recommendation: score + weather + nearest fountains. */
export interface HydrationRecommendation extends HydrationScore {
  weather: Weather
  usedFallback: boolean
  nearestFountains: FountainWithDistance[]
}

/** Response shape from the /api/hydrate Gemini proxy. */
export type AiHydrateResult =
  | { ok: true; cups: number; tip: string; source: 'gemini' }
  | { ok: false; reason: 'no-key' | 'parse' | 'error' | 'method' | 'network' }

/** A star-rated review of a fountain. */
export interface Review {
  id: string
  fountainId: string
  authorUid: string
  /** Public display name only — never the author's email. */
  authorName: string
  rating: number
  comment: string
  upvotes: number
  createdAt?: unknown
}

/** A community-submitted fountain awaiting moderation. */
export interface Submission {
  id: string
  fountainData: Omit<Fountain, 'id'>
  authorUid: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: unknown
}

/**
 * The minimal user shape the app relies on. A subset of Firebase's User so
 * helpers can be called with either a real Firebase user or a test double.
 */
export interface AppUser {
  uid: string
  email: string | null
  displayName: string | null
}

/** Filter state owned by Home and driven by FilterBar. */
export interface FilterState {
  search: string
  types: Set<FountainType>
  activeOnly: boolean
  accessibleOnly: boolean
  radiusMiles: number | null
}

/** Which results view Home is showing. */
export type FountainView = 'map' | 'list'
