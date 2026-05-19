import { MOCK_MODE } from '../../config/env';
import * as real from './cartApi';
import * as mock from './mockCartApi';

const cart = MOCK_MODE ? mock : real;

export const getSavedCartItems  = cart.getSavedCartItems;
export const postSaveCartItems  = cart.postSaveCartItems;
export const postDeleteCartItem = cart.postDeleteCartItem;
export const quantityIncrement  = cart.quantityIncrement;
export const quantityDecrement  = cart.quantityDecrement;
