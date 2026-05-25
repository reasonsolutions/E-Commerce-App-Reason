export interface PostCartSaveInterface {
  CustomerProfileCode: number;
  InventoryId: number;
  Quantity: number;
  IsPurchased: boolean;
}


export interface deleteCartInterface {
    CartDetailsCode: number;
    IsPurchased: boolean;
}

export interface OrderHistoryRequest {
    CustomerProfileCode: number;
}

export interface OrderDetailRequest {
    OrderNumber: string;
    CustomerProfileCode: number;
}

export interface CartQuantityRequest {
    CartDetailsCode: number;
    Inventory_Id: number;
}

export interface createCustomerInterface {
    "CustomerName": string,
    "Address": string,
    "StreetName": string,
    "CityName": string,
    "ZipCode": number,
    "CountryCode": number,
    "MobileNumber": number,
    "EmailID": string,
    "LoginPassword": string
}

export interface postLoginInterface {
    "LoginID": string,
    "Password": string
}

export interface postCreateDeliveryAddressInterface {
    CustomerName: string;
    MobileNumber: string;
    Address: string;
    StreetName: string;
    City: string;
    Landmark: string;
    Zipcode: string;
    IsPrimary: string;
    CustomerProfileCode: number;
}

export interface postUpdateDeliveryAddressInterface {
    CustomerProfileCode: number;
    OrderDeliveryAddressCode: number;
    CustomerName: string;
    MobileNumber: number;
    Address: string;
    StreetName: string;
    City: string;
    Landmark: string;
    Zipcode: number;
    IsPrimary: number;
}

export interface postPlacedSingleOrderInterface {
    "CustomerProfileCode": number,
    "OrderDeliveryAddressCode": number,
    "BranchCode": string,
    "CountryCode": string,
    "Quantity": number,
    "Amount": number,
    "DeliveryCharges": number,
    "DeliveryChargesVAT": number,
    "ItemCharges": number,
    "ItemChargesVAT": number,
    "Discount": number,
    "VAT": number,
    "OrderStatus": number,
    "Inventory_Id": number,
    "CartMasterCode": number
}

export interface postPlacedMultipleOrderInterface {
    "CustomerProfileCode": number,
    "OrderDeliveryAddressCode": number,
    "BranchCode": string,
    "CountryCode": string,
    "CartMasterCode": number,
    "OrderDetails": MultipleOrderDetailInterface[]
}

export interface MultipleOrderDetailInterface {
    "Inventory_Id": number,
    "Quantity": number,
    "Amount": number,
    "DeliveryCharges": number,
    "DeliveryChargesVAT": number,
    "ItemCharges": number,
    "ItemChargesVAT": number,
    "Discount": number,
    "VAT": number,
    "OrderStatus": number
}


//result of allproducts api
export interface ProductVariant {
    InventoryID: string;
    Variant: string;
    Stock: number;
    SKU: string;
    PriceDetails: {
        Price: number;
        ComparePrice: number;
    };
}

export interface ProductInterface {
    ItemID: number;
    Name: string;
    Description: string;
    SubcategoryID: string;
    Images: string;
    CreatedDate: string;
    BrandID: string;
    BrandName: string;
    SCName: string;
    CategoryID: string;
    CategoryName: string;
    CategoryImage: string;
    MinPrice: number;
    MaxComparePrice: number;
    Variants: ProductVariant[];
}


//result of getbrands api
export interface BrandInterface {
    Brand_Id: number;
    Brand_Name: string;
    BrandImage: string;
}

export interface GetBrandItem {
    BrandId: number;
    BrandName: string;
    BrandImage: string;
}

//result of products api by brand
export interface ProductByBrandCategoryDetails {
    Category_Id: number;
    CategoryName: string;
}

export interface ProductByBrandInterface {
    productsDetails: ProductByCategoryProductDetails[];
    categoryDetails: ProductByBrandCategoryDetails[];
}

export interface CategoryBrandInterface {
    Brand_Id: number;
    Brand_Name: string;
}

//result of getcategory api

export interface CategoryInterface {
    CategoryId: number;
    CategoryName: string;
    CategoryImage: string;
    Brands: CategoryBrandInterface[];
}

// raw row from getProductsByCategory — one row per inventory variant
export interface CategoryProductRaw {
    ItemID: number;
    Description: string;
    SubCategoryID: number;
    Images: string;
    CreatedDate: string;
    BrandID: number;
    MerchantID: number;
    BrandName: string;
    CategoryID: number;
    CategoryName: string;
    CategoryImage: string;
    SCName: string;
    Inventory_Id: number;
    Variant: string;
    Count: number;
    Date_Created: string;
    Date_Updated: string;
    Price: number | null;
    ComparePrice: number | null;
    SKU: string | null;
    ApprovedBy: number | null;
    ApprovedOn: string | null;
}

//get products by category api result
export interface ProductByCategoryProductDetails {
    Item_Id: number;
    Name: string;
    Price: number;
    ComparePrice: number;
    Description: string;
    SubCategory_Id: number;
    Images: string;
    Date_Created: string;
    Brand_Id: number;
    ApprovedBy: string | null;
    ApprovedOn: string | null;
    VendorID: number;
    Brand_Name: string;
    Category_Id: number;
    CategoryName: string;
    CategoryImage: string;
    SCName: string;
    Inventory_Id: number;
    Variant: string;
    Count: number;
    Date_Updated: string;
}

//result of products api by brands

export interface ProductByCategoryInterface {
    productsDetails: ProductByCategoryProductDetails[];
    brandsDetails: CategoryBrandInterface[];
}

export interface SubCategoryInterface {
    SubCategory_Id: number;
    Name: string;
}

// result of getProductByItemId api
export interface VariantPriceDetails {
    Price: number | null;
    ComparePrice: number | null;
}

export interface VariantInterface {
    InventoryId: string;
    Variant: string;
    Stock: number;
    SKU: string;
    PriceDetails: VariantPriceDetails;
    StockStatus: { Value: number; Description: string };
}

export interface ProductDetailInterface {
    ItemId: string;
    Name: string;
    Description: string;
    Images: string;
    BrandId: number;
    BrandName: string;
    CategoryId: string;
    CategoryName: string;
    SubCategoryName: string;
    Variants: VariantInterface[];
}

export interface LoggedInCustomerInterface {
    CustomerProfileCode: number;
    CustomerName: string;
    Address: string;
    StreetName: string;
    CityName: string;
    Zipcode: number;
    CountryCode: number;
    MobileNumber: number;
    EmailID: string;
    CartDetailsCount: number;
}

export interface DeliveryAddressInterface {
    OrderDeliveryAddressCode: number;
    CustomerName: string;
    MobileNumber: number;
    CustomerProfileCode: number;
    CreatedDate: string;
    UpdatedDate: string | null;
    Address: string | null;
    StreetName: string | null;
    City: string | null;
    Landmark: string | null;
    Zipcode: string | null;
    IsPrimary: boolean;
}

//Order api result
export interface OrderDetailItemInterface {
    Inventory_Id: number;
    Item_Id: number;
    Variant: string;
    Name: string;
    Images: string;
    Quantity: number;
    Amount: number;
    OrderStatus: number;
    CreatedDate: string;
    Brand_Id: number;
    Brand_Name: string;
}

export interface OrderInterface {
    OrderDetails: OrderDetailItemInterface[];
    DeliveryDetail: DeliveryAddressInterface[];
}

//result of get saved cart items api
export interface SavedCartItemInterface {
    CartDetailsCode: number;
    CartMasterCode: number;
    InventoryId: number;
    Quantity: number;
    IsPurchased: boolean;
    Images: string;
    Name: string;
    Count: number;
    Variant: string;
    BrandName: string;
    Price: number;
    PriceDetails: {
        Price: number;
        ComparePrice: number;
    };
}


// ─── Place order (new /placeOrder endpoint) ───────────────────────────────────

export interface PlaceOrderItemDetail {
  InventoryId:        number;
  Quantity:           number;
  Amount:             number;
  DeliveryCharges:    number;
  DeliveryChargesVAT: number;
  ItemCharges:        number;
  ItemChargesVAT:     number;
  Discount:           number;
  VAT:                number;
  OrderStatus:        number;
}

export interface PlaceOrderDetail {
  OrganisationID: string;
  ItemDetails:    PlaceOrderItemDetail[];
}

export interface PlaceOrderInterface {
  CustomerProfileCode:      number;
  OrderDeliveryAddressCode: number;
  CartMasterCode:           number;
  TotalAmount:              number;
  CouponCode?:              string;
  OrderDetails:             PlaceOrderDetail[];
}

// ─── Wishlist (confirmed real endpoints) ─────────────────────────────────────

export interface WishlistItemInterface {
  WishlistCode:         number;
  CustomerProfileCode:  number;
  InventoryID:          number;
  BrandName:            string;
  Name:                 string;
  AddedOn:              string;
  StockCount:           number;
  Price:                number;
  ComparePrice:         number;
  SKU:                  string;
  IsInStock:            number;
}

export interface PostAddToWishlistInterface {
  CustomerProfileCode: number;
  InventoryId:         number;
}

export interface PostDeleteWishlistInterface {
  WishlistCode:        number;
  CustomerProfileCode: number;
}

//result of order history api
export interface postOrderHistoryDetailsInterface {
    Inventory_Id: number,
    Item_Id: number,
    Variant: string,
    Name: string,
    Images: string,
    Quantity: number,
    Amount: number,
    OrderStatus: number,
    Brand_Id: number,
    Brand_Name: string
}

export type OrderStatusCode = 1 | 2 | 3 | 4;

export interface OrderHistoryItemInterface {
    Inventory_Id:  number;
    Item_Id:       number;
    Variant:       string;
    Name:          string;
    Brand_Name:    string;
    Brand_Id:      number;
    Images:        string;
    Quantity:      number;
    Amount:        number;
    OrderStatus:   OrderStatusCode;
    OrderNumber:   string;
    OrderedDate:   string;
}

export interface OrderDetailItemExtendedInterface extends OrderHistoryItemInterface {
    CreatedDate: string;
}

export interface OrderDetailResponseInterface {
    OrderDetails:   OrderDetailItemExtendedInterface[];
    DeliveryDetail: DeliveryAddressInterface[];
}