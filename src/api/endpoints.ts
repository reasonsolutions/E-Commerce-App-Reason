// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authEndpoints = {
  postLoginCustomer:      'token/postLoginCustomer',
  getEcommAccessToken:    'token/getEcommAccessToken',
  postCreateCustomer:     'ecomm/postCreateCustomer',
  postConfirmCustomer:    'ecomm/postConfirmCustomer',
  postUpdateCustomer:     'ecomm/postUpdateCustomer',
  changePassword:         'ecomm/changePassword',
  forgotPassword:         'ecomm/forgotPassword',
  verifyForgotPasswordOTP:'ecomm/verifyForgotPasswordOTP',
  postReview:             'ecomm/postReview',
} as const;

// ─── Products ─────────────────────────────────────────────────────────────────
export const productEndpoints = {
  allProducts:              'ecomm/allProducts',
  getBrands:                'ecomm/getBrands',
  getCategory:              'ecomm/getCategory',
  getSubCategoryByCategory: 'ecomm/getSubCategoryByCategory',
  getProductByItemId:       'merchant/getProductByItemId',
} as const;

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartEndpoints = {
  postSaveCartItems:  'ecomm/addToCart',
  deleteCartItem:    'ecomm/deleteCartItem',
  getSavedCartItems: 'ecomm/getCart',
  quantityIncrement: 'ecomm/quantityIncrement',
  quantityDecrement: 'ecomm/quantityDecrement',
  updateCartItem:    'ecomm/postUpdateCartItem',
} as const;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderEndpoints = {
  placeOrder:        'ecomm/placeOrder',
  getOrderHistory:   'ecomm/getOrderHistory',
  getOrderStatus:    'ecomm/getOrderStatus',
  cancelOrder:       'merchant/postCancelledPlaceOrderByCustomer',
  getReturnReasons:  'ecomm/getReturnReasons',
  postReturnRequest: 'ecomm/postReturnRequest',
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

// ─── Payment ─────────────────────────────────────────────────────────────────
export const paymentEndpoints = {
  loadPaymentZone: 'mips/loadPaymentZone',
  getPaymentStatus: 'mips/getPaymentStatus'
}

// ─── Product Reviews ────────────────────────────────────────────────────────
export const reviewEndpoints = {
  addProductReview:  'ecomm/addProductReview',
  editProductReview: 'ecomm/editProductReview',
  getProductReview:  'ecomm/getProductReview',
} as const;

// Flat merged object for any reference that needs a single import
export const endpoints = {
  ...authEndpoints,
  ...productEndpoints,
  ...cartEndpoints,
  ...orderEndpoints,
  ...addressEndpoints,
  ...wishlistEndpoints,
  ...paymentEndpoints,
  ...reviewEndpoints,
} as const;
