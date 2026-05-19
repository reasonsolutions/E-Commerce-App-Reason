import { MOCK_DELAY_MS } from '../../config/env';
import {
  createCustomerInterface,
  PostCartSaveInterface,
  postLoginInterface,
  postCreateDeliveryAddressInterface,
  postUpdateDeliveryAddressInterface,
  postPlacedMultipleOrderInterface,
  postPlacedSingleOrderInterface,
} from '../interfaces';
import {
  ok,
  mockCategories,
  mockBrands,
  mockProducts,
  mockCartItems,
  mockDeliveryAddresses,
  mockLoggedInCustomer,
  mockOrderHistory,
  mockOrderDetail,
  mockWishlistItems,
  getMockProductDetail,
  getMockSearchResults,
  getMockProductsByCategory,
  WishlistItemInterface,
} from './mockData';

// ─── Runtime state (in-memory for demo session) ───────────────────────────────

let _cartItems = [...mockCartItems];
let _addresses = [...mockDeliveryAddresses];
let _wishlist = [...mockWishlistItems];
let _nextAddressCode = 100;
let _nextWishlistCode = 10;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

// ─── Products ─────────────────────────────────────────────────────────────────

const getAllProducts = async () => delay(ok(mockProducts));

const getBrands = async () => delay(ok(mockBrands));

const getCategories = async () => delay(ok(mockCategories));

const getSubCategories = async (_categoryCode: string) =>
  delay(ok([]));

const getProductsByCategory = async (categorycode: string) => {
  const products = getMockProductsByCategory(categorycode);
  return delay(ok({ productsDetails: products, brandsDetails: mockBrands }));
};

const getProductsBySubCategory = async (_subcategorycode: string) =>
  delay(ok({ productsDetails: mockProducts, brandsDetails: mockBrands }));

const selectProduct = async (inventorycode: string) => {
  const id = Number(inventorycode);
  const { detail, variants } = getMockProductDetail(id);
  return delay(ok([detail, variants]));
};

const searchProducts = async (filterstring: string, _category_id: string) => {
  const results = getMockSearchResults(filterstring);
  return delay(ok(results));
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

const getSavedCartItems = async (_customerprofilecode: number) =>
  delay(ok(_cartItems));

let _nextCartDetailsCode = 400;

const postSaveCartItems = async (data: PostCartSaveInterface) => {
  const existing = _cartItems.find(item => item.Inventory_Id === data.Inventory_Id);
  if (existing) {
    _cartItems = _cartItems.map(item =>
      item.Inventory_Id === data.Inventory_Id
        ? { ...item, Quantity: item.Quantity + data.Quantity }
        : item,
    );
  } else {
    const product = mockProducts.find(p => p.Inventory_Id === data.Inventory_Id);
    if (product) {
      _cartItems = [
        ..._cartItems,
        {
          CartDetailsCode: _nextCartDetailsCode++,
          CartMasterCode: 159,
          Inventory_Id: product.Inventory_Id,
          Quantity: data.Quantity,
          Images: product.Images,
          Name: product.Name,
          Price: product.Price,
          ComparePrice: product.ComparePrice,
          Count: product.Count,
          Variant: product.Variant,
          Brand_Name: product.Brand_Name,
        },
      ];
    }
  }
  return delay(ok(true, 'Item added to cart.'));
};

const postDeleteCartItem = async (cartdetailscode: number) => {
  _cartItems = _cartItems.filter(item => item.CartDetailsCode !== cartdetailscode);
  return delay(ok(true, 'Cart item deleted.'));
};

const quantityIncrement = async (cartdetailscode: number, _inventory_id: number) => {
  _cartItems = _cartItems.map(item =>
    item.CartDetailsCode === cartdetailscode
      ? { ...item, Quantity: item.Quantity + 1 }
      : item,
  );
  return delay(ok(true));
};

const quantityDecrement = async (cartdetailscode: number, _inventory_id: number) => {
  _cartItems = _cartItems.map(item =>
    item.CartDetailsCode === cartdetailscode && item.Quantity > 1
      ? { ...item, Quantity: item.Quantity - 1 }
      : item,
  );
  return delay(ok(true));
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

const loginCustomer = async (data: postLoginInterface) => {
  if (data.LoginID === 'ishaan' && data.Password === 'reason1') {
    return delay(ok(mockLoggedInCustomer));
  }
  return delay({ statusCode: 0, exception: null, userMessage: 'Invalid email or password.', result: null });
};

const postCreateCustomer = async (_data: createCustomerInterface) =>
  delay(ok(true, 'Account created successfully.'));

// ─── Addresses ────────────────────────────────────────────────────────────────

const getDeliveryAddresses = async (_customerprofilecode: number) =>
  delay(ok(_addresses));

const getDeliveryAddressForUpdate = async (
  orderdeliveryaddresscode: number,
  _customerprofilecode: number,
) => {
  const found = _addresses.find(a => a.OrderDeliveryAddressCode === orderdeliveryaddresscode);
  return delay(ok(found ? [found] : []));
};

const postCreateDeliveryAddress = async (data: postCreateDeliveryAddressInterface) => {
  const newAddress = {
    OrderDeliveryAddressCode: _nextAddressCode++,
    CustomerName: data.CustomerName,
    MobileNumber: Number(data.MobileNumber),
    FullAddress: data.FullAddress,
    CustomerProfileCode: data.CustomerProfileCode,
    CreatedDate: new Date().toISOString(),
    UpdatedDate: null,
  };
  _addresses = [..._addresses, newAddress];
  return delay(ok(true, 'Address created successfully.'));
};

const postUpdateDeliveryAddress = async (data: postUpdateDeliveryAddressInterface) => {
  _addresses = _addresses.map(a =>
    a.OrderDeliveryAddressCode === data.OrderDeliveryAddressCode
      ? { ...a, CustomerName: data.CustomerName, MobileNumber: data.MobileNumber, FullAddress: data.FullAddress, UpdatedDate: new Date().toISOString() }
      : a,
  );
  return delay(ok(true, 'Address updated successfully.'));
};

const postDeleteDeliveryAddress = async (OrderDeliveryAddressCode: number) => {
  _addresses = _addresses.filter(a => a.OrderDeliveryAddressCode !== OrderDeliveryAddressCode);
  return delay(ok(true, 'Address deleted.'));
};

// ─── Orders ───────────────────────────────────────────────────────────────────

const postPlacedSingleOrder = async (_data: postPlacedSingleOrderInterface) =>
  delay(ok({ OrderNumber: `ORDNO_MOCK_${Date.now()}` }, 'Order placed successfully.'));

const postPlacedMultipleOrder = async (_data: postPlacedMultipleOrderInterface) =>
  delay(ok({ OrderNumber: `ORDNO_MOCK_${Date.now()}` }, 'Order placed successfully.'));

const postCnfOrderDetail = async (_OrderMasterCode: string, _CustomerProfileCode: number) =>
  delay(ok(mockOrderDetail));

const postOrderHistory = async (_customerprofilecode: number) =>
  delay(ok({ OrdHistoryDetails: mockOrderHistory }));

// ─── Wishlist (future API stub) ───────────────────────────────────────────────

const getWishlist = async (_customerprofilecode: number) =>
  delay(ok(_wishlist));

const addToWishlist = async (customerprofilecode: number, inventory_id: number) => {
  const product = mockProducts.find(p => p.Inventory_Id === inventory_id);
  if (!product) return delay(ok(false, 'Product not found.'));
  const already = _wishlist.some(w => w.Inventory_Id === inventory_id);
  if (already) return delay(ok(true, 'Already in wishlist.'));
  const newItem: WishlistItemInterface = {
    WishlistItemCode: _nextWishlistCode++,
    CustomerProfileCode: customerprofilecode,
    Inventory_Id: product.Inventory_Id,
    Item_Id: product.Item_Id,
    Name: product.Name,
    Images: product.Images,
    Price: product.Price,
    ComparePrice: product.ComparePrice,
    Variant: product.Variant,
    Brand_Name: product.Brand_Name,
    AddedDate: new Date().toISOString(),
  };
  _wishlist = [..._wishlist, newItem];
  return delay(ok(true, 'Added to wishlist.'));
};

const removeFromWishlist = async (_customerprofilecode: number, wishlistItemCode: number) => {
  _wishlist = _wishlist.filter(w => w.WishlistItemCode !== wishlistItemCode);
  return delay(ok(true, 'Removed from wishlist.'));
};

export {
  getAllProducts,
  getBrands,
  getCategories,
  getSubCategories,
  getProductsByCategory,
  getProductsBySubCategory,
  selectProduct,
  searchProducts,
  getSavedCartItems,
  postCreateCustomer,
  postSaveCartItems,
  loginCustomer,
  quantityIncrement,
  quantityDecrement,
  postCreateDeliveryAddress,
  postDeleteDeliveryAddress,
  getDeliveryAddresses,
  getDeliveryAddressForUpdate,
  postUpdateDeliveryAddress,
  postPlacedSingleOrder,
  postPlacedMultipleOrder,
  postCnfOrderDetail,
  postDeleteCartItem,
  postOrderHistory,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
