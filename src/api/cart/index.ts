import * as real from './cartApi';

const cart = real;

export const getSavedCartItems      = cart.getSavedCartItems;
export const postSaveCartItems      = cart.postSaveCartItems;
export const postDeleteCartItem     = cart.postDeleteCartItem;
export const quantityIncrement      = cart.quantityIncrement;
export const quantityDecrement      = cart.quantityDecrement;
export const updateCartItemQuantity = cart.updateCartItemQuantity;
