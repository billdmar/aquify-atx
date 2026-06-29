// Typed test fixtures — factory helpers so tests build valid domain objects
// without repeating (or mistyping) every field. Keeps test data in one place.

import type { AppUser, Fountain, Review } from '../types'

export function makeFountain(overrides: Partial<Fountain> = {}): Fountain {
  return {
    id: 'test-fountain',
    name: 'Test Fountain',
    address: '123 Test St, Austin, TX',
    lat: 30.2672,
    lng: -97.7431,
    type: 'fountain',
    status: 'active',
    accessible: false,
    ...overrides,
  }
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'test-review',
    fountainId: 'test-fountain',
    authorUid: 'u1',
    authorName: 'Test User',
    rating: 5,
    comment: 'Great fountain!',
    upvotes: 0,
    ...overrides,
  }
}

export function makeUser(overrides: Partial<AppUser> = {}): AppUser {
  return {
    uid: 'u1',
    email: 'test@example.com',
    displayName: 'Test User',
    ...overrides,
  }
}
