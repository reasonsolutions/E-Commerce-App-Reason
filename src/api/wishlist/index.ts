import { MOCK_MODE } from '../../config/env';
import * as real from './wishlistApi';
import * as mock from './mockWishlistApi';

const wishlist = MOCK_MODE ? mock : real;

export const getWishlist        = wishlist.getWishlist;
export const addToWishlist      = wishlist.addToWishlist;
export const removeFromWishlist = wishlist.removeFromWishlist;
