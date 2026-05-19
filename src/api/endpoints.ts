// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authEndpoints = {
  postLoginCustomer:   'postLoginCustomer',
  postCreateCustomer:  'postCreateCustomer',
  postConfirmCustomer: 'postConfirmCustomer',
} as const;

// ─── Products ─────────────────────────────────────────────────────────────────
export const productEndpoints = {
  allProducts:              'allProducts',
  getBrands:                'getBrands',
  getProductsByBrands:      'getProductsByBrands',
  getCategoryByBrand:       'getCategoryByBrand',
  getCategory:              'getCategory',
  getProductsByCategory:    'getProductsByCategory',
  getSubCategoryByCategory: 'getSubCategoryByCategory',
  getProductsBySubCategory: 'getProductsBySubCategory',
  selectProduct:            'selectProduct',
  searchProduct:            'searchProduct',
} as const;

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartEndpoints = {
  postCartSaveItem:  'postCartSaveItem',
  deleteCartItem:    'deleteCartItem',
  getSavedCartItems: 'getSaveCartItems',
  quantityIncrement: 'quantityIncrement',
  quantityDecrement: 'quantityDecrement',
} as const;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderEndpoints = {
  placeOrder:      'placeOrder',
  getOrderHistory: 'getOrderHistory',
  getOrderStatus:  'getOrderStatus',
} as const;

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addressEndpoints = {
  postCreateDeliveryAddress:   'postCreateDeliveryAddress',
  postDeleteDeliveryAddress:   'postDeleteDeliveryAddress',
  getDeliveryAddress:          'getDeliveryAddress',
  getDeliveryAddressForUpdate: 'getDeliveryAddressForUpdate',
  postUpdateDeliveryAddress:   'postUpdateDeliveryAddress',
} as const;

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistEndpoints = {
  getWishlist:        'getWishlist',
  postAddToWishlist:  'postAddToWishlist',
  postDeleteWishlist: 'postDeleteWishlist',
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
