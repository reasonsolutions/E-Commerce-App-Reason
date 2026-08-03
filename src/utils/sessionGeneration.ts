// Monotonic counter identifying the current login session. Bumped once, at
// the very start of clearSession(), before any other clearing happens.
//
// Any async operation that writes into a shared (non-component-scoped) cache
// — module-level objects, Context state reset via a non-React setter, etc. —
// should capture getSessionGeneration() before it starts, then compare it
// again immediately before the write. If the numbers differ, a logout (or
// another logout+login cycle) happened while the operation was in flight, so
// the write is stale and must be skipped.
//
// Deliberately just a number: no tokens, no user data, no React dependency —
// safe to import from the API layer (productApi.ts) as well as from Context
// files and screens.
let generation = 0;

export function getSessionGeneration(): number {
  return generation;
}

export function bumpSessionGeneration(): void {
  generation += 1;
}
