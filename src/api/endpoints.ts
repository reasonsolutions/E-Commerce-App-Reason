// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authEndpoints = {
  postLoginCustomer:   'token/postLoginCustomer',
  postCreateCustomer:  'ecomm/postCreateCustomer',
  postConfirmCustomer: 'ecomm/postConfirmCustomer',
} as const;

// ─── Products ─────────────────────────────────────────────────────────────────
export const productEndpoints = {
  allProducts:              'ecomm/allProducts',
  getBrands:                'ecomm/getBrands',
  getProductsByBrands:      'ecomm/getProductsByBrands',
  getCategoryByBrand:       'ecomm/getCategoryByBrand',
  getCategory:              'ecomm/getCategory',
  getProductsByCategory:    'ecomm/getProductsByCategory',
  getSubCategoryByCategory: 'ecomm/getSubCategoryByCategory',
  getProductsBySubCategory: 'ecomm/getProductsBySubCategory',
  selectProduct:            'ecomm/selectProduct',
  searchProduct:            'ecomm/searchProduct',
  getProductByItemId:       'merchant/getProductByItemId',
} as const;

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartEndpoints = {
  postSaveCartItems:  'ecomm/postSaveCartItems',
  deleteCartItem:    'ecomm/deleteCartItem',
  getSavedCartItems: 'ecomm/getSaveCartItems',
  quantityIncrement: 'ecomm/quantityIncrement',
  quantityDecrement: 'ecomm/quantityDecrement',
  updateCartItem:    'ecomm/postUpdateCartItem',
} as const;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderEndpoints = {
  placeOrder:      'ecomm/placeOrder',
  getOrderHistory: 'ecomm/getOrderHistory',
  getOrderStatus:  'ecomm/getOrderStatus',
} as const;

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addressEndpoints = {
  postCreateDeliveryAddress:   'ecomm/postCreateDeliveryAddress',
  postDeleteDeliveryAddress:   'ecomm/postDeleteDeliveryAddress',
  getDeliveryAddress:          'ecomm/getDeliveryAddress',
  getDeliveryAddressForUpdate: 'ecomm/getDeliveryAddressForUpdate',
  postUpdateDeliveryAddress:   'ecomm/postUpdateDeliveryAddress',
} as const;

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistEndpoints = {
  getWishlist:        'ecomm/getWishlist',
  postAddToWishlist:  'ecomm/postAddToWishlist',
  postDeleteWishlist: 'ecomm/postDeleteWishlist',
} as const;

// Flat merged object for any reference that needs a single import
export const endpoints = {
  ...authEndpoints,
  ...productEndpoints,
  ...cartEndpoints,
  ...orderEndpoints,
  ...addressEndpoints,
  ...wishlistEndpoints,
} as const;
