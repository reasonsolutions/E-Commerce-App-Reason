const state = { lastFetchTime: 0 };

export const wishlistCache = {
  get lastFetchTime() { return state.lastFetchTime; },
  markFresh: () => { state.lastFetchTime = Date.now(); },
  invalidate: () => { state.lastFetchTime = 0; },
};
