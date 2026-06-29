// search.ts — fuzzy, typo-tolerant fountain search built on Fuse.js.
//
// Home's filter bar previously did a plain `haystack.includes(term)` substring
// match. This module replaces that text step with a ranked fuzzy search over a
// fountain's name + address so "bartn" still finds "Barton Springs" and an
// accented "César" matches a plain "Cesar" query. The exact-match filters
// (type / status / accessibility / radius) stay in Home; this only owns text.

import Fuse from 'fuse.js'
import type { IFuseOptions } from 'fuse.js'
import type { Fountain } from '../types'

/** Strip diacritics so "César" indexes/queries the same as "Cesar". */
export function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

// Index name + address. `getFn` normalizes the indexed text; we normalize the
// query the same way in searchFountains so accent-insensitivity is symmetric.
const FUSE_OPTIONS: IFuseOptions<Fountain> = {
  keys: [
    { name: 'name', getFn: (f) => normalize(f.name) },
    { name: 'address', getFn: (f) => normalize(f.address) },
  ],
  // ~0.4 is tuned for typo tolerance: forgiving enough to catch a dropped or
  // swapped letter, tight enough that a clearly-unrelated term returns nothing.
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

/** Build a reusable Fuse index over a set of fountains. */
export function createFountainSearch(fountains: Fountain[]): Fuse<Fountain> {
  return new Fuse(fountains, FUSE_OPTIONS)
}

/**
 * Run a fuzzy search, returning matched fountains in Fuse rank order.
 * A blank/empty term returns null so the caller can treat it as "no text
 * filter" (rather than "no results").
 */
export function searchFountains(
  fuse: Fuse<Fountain>,
  term: string,
): Fountain[] | null {
  const trimmed = term.trim()
  if (!trimmed) return null
  return fuse.search(normalize(trimmed)).map((result) => result.item)
}
