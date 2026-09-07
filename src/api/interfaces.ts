import { TaxType }            from '../config/enum_files/TaxType';
import { WeightUnit }         from '../config/enum_files/WeightUnit';
import { DimensionUnit }      from '../config/enum_files/DimensionUnit';
import { VolumeUnit }         from '../config/enum_files/VolumeUnit';
import { ItemCondition }      from '../config/enum_files/ItemCondition';
import { HazardClass }        from '../config/enum_files/HazardClass';
import { HazardLabel }        from '../config/enum_files/HazardLabel';
import { WarrantyType }       from '../config/enum_files/WarrantyType';
import { ProductDemographic } from '../config/enum_files/ProductDemographic';
import { Season }             from '../config/enum_files/Season';
import { AddressLabel }       from '../config/enum_files/AddressLabel';
import { InventoryStockFilter } from '../config/enum_files/InventoryStockFilter';
import { PaymentModes }       from '../config/enum_files/PaymentModes';

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
    SortBy?: 'asc' | 'desc';
    DateFrom?: string | null;
    DateTo?: string | null;
    PageNumber?: number;
    PageSize?: number;
    OrderStatusList?: number[] | null;
    SearchQuery?: string | null;
}

export interface OrderDetailRequest {
    OrderNumber: string;
    CustomerProfileCode: number;
}

export interface CancelOrderSubItem {
    Id:          number;
    InventoryId: number;
}

export interface CancelOrderInterface {
    CustomerProfileCode:        number;
    CustomerPlatform:           number;
    OrderNumber:                string;
    SubOrder:                   CancelOrderSubItem[];
    CustomerCancellationReason: number;
    RefundMode:                 number;
    Remarks:                    string;
}

export interface ReturnReasonInterface {
    value:       number;
    description: string;
}

export interface ReturnOrderInterface {
    CustomerProfileCode: number;
    OrderNumber:         string;
    ReturnReasonType:    number;
    ReturnReasonRemark:  string;
    OrderDetailsCode:    number;
    OrderMasterCode:     number;
    // Omitted entirely for Cash on Delivery — nothing was paid upfront, so no
    // refund method applies. See isCOD handling in OrderDetailScreen.
    RefundMode?:         number;
}

export interface CartQuantityRequest {
    CartDetailsCode: number;
    Inventory_Id: number;
}

export interface createCustomerInterface {
    "CustomerName": string,
    "EmailID": string,
    "MobileNumber": number,
    "CountryCode": number,
    "Password": string,
}

export interface postLoginInterface {
    "LoginID": string,
    "Password": string,
    "ClientType": string,
}

export interface postUpdateCustomerInterface {
    CustomerProfileCode: number;
    CustomerName: string;
    EmailID: string;
    MobileNumber: string;
    CountryCode: number;
}

export interface ChangePasswordInterface {
    CustomerProfileCode: number;
    OldPassword:         string;
    NewPassword:         string;
}

export interface postReviewInterface {
    CustomerProfileCode: number;
    Rating:              number;
    Description:         string;
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
    CountryCode: number;
    AddressLabel?: AddressLabel;
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
    CountryCode: number;
    AddressLabel?: AddressLabel;
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
export interface VariantTax {
    VariantTaxConfigurationId: number;
    TaxId:             number;
    TaxType:           TaxType;
    TaxRate:           number;
    Reason:            string;
    IsActive:          number;
    CreatedAt:         string;
    UpdatedAt:         string;
    IsIncludedInPrice: number;
}

export interface PhysicalAttributes {
    Weight:        number | null;
    WeightUnit:    { Value: WeightUnit; Description: string } | null;
    PackageLength: number | null;
    PackageWidth:  number | null;
    PackageHeight: number | null;
    DimensionUnit: { Value: DimensionUnit; Description: string } | null;
    Volume:        number | null;
    VolumeUnit:    { Value: VolumeUnit; Description: string } | null;
    IsFragile:     boolean;
    IsPerishable:  boolean;
    ShelfLife:     string;
    Condition:     { Value: ItemCondition; Description: string } | null;
}

export interface ProductComplianceInfo {
    AgeRestrictedInfo: {
        IsAgeRestricted:      boolean;
        MinimumAge:           number | null;
        PrescriptionRequired: boolean;
    };
    HazardousInfo: {
        IsHazardous:          boolean;
        HazardClasses:        string[] | null;
        UnNumber:             string | null;
        HazardLabels:         string[] | null;
        HandlingInstructions: string | null;
        SafetyDataSheetURL:   string | null;
    };
    RestrictedRegion: string[];
    SaleHours:        { StartTime: string; EndTime: string } | null;
}

export interface ProductDetailComplianceInfo {
    AgeRestrictedInfo: {
        IsAgeRestricted:      boolean;
        MinimumAge:           number | null;
        PrescriptionRequired: boolean;
    };
    HazardousInfo: {
        isHazardous:              boolean;
        HazardClasses:            { Value: HazardClass; Description: string }[] | null;
        UnNumber:                 string | null;
        HazardLabels:             { Value: HazardLabel; Description: string }[] | null;
        HandlingInstructions:     string | null;
        SafetyHazardousSheetURL:  string | null;
    };
    RestrictedRegion: string[];
    SaleHours:        { StartTime: string; EndTime: string } | null;
}

export interface ProductClassification {
    IsDigital:              boolean;
    IsVirtual:              boolean;
    IsDownloadable:         boolean;
    CountryOfOrigin:        string | null;
    HSCode:                 string | null;
    Manufacturer:           string | null;
    ManufacturerPartNumber: string | null;
}

export interface ProductMarketing {
    Tags:            string[];
    MetaTitle:       string | null;
    MetaDescription: string | null;
}

export interface ProductPolicyInfo {
    IsReturnable:    boolean;
    ReturnWindow:    number | null;
    ReturnPolicy:    string | null;
    HasWarranty:     boolean;
    WarrantyPeriod:  number | null;
    // API sends the raw numeric code as a string (e.g. "1"), not a resolved
    // { Value, Description } pair like other enum fields — see ProductSpecs.tsx.
    WarrantyType:    WarrantyType | string | null;
    WarrantyDetails: string | null;
}

export interface ProductShippingInfo {
    FreeShipping:             boolean;
    SeparateShippingRequired: boolean;
    EstimatedDeliveryDays:    string | null;
    CanShipInternational:     boolean;
    RestrictedCountries:      string[] | null;
}

export interface CustomerRatingInterface {
    AvgRating:         number;
    RatingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
    TotalReviews:      number;
}

// allProducts variant
export interface ProductVariant {
    InventoryID:       string;
    Variant:           string;
    Stock:             number;
    SKU:               string;
    Threshold:         number;
    MaxPerOrder:       number;
    Remarks:           string;
    DateCreated:       string;
    DateUpdated:       string;
    StockStatus:       { Value: InventoryStockFilter; Description: string };
    BackOrder: {
        AllowBackOrder:        boolean;
        BackOrderLimit:        number | null;
        SupplierLeadTime:      number | null;
        BackOrderUsedQuantity: number;
        BackOrderUpdatedBy:    string;
        BackOrderUpdatedOn:    string | null;
    };
    PriceDetails: {
        Price:        number;
        ComparePrice: number;
        NetAmount:    number | null;
        TaxAmount:    number | null;
        GrossAmount:  number | null;
        DiscountPct:  number;
        Taxes:        VariantTax[];
    };
    PhysicalAttributes: PhysicalAttributes;
}

export interface ProductInterface {
    ItemID:                number;
    Name:                  string;
    OrganisationName:      string;
    OrganisationId:        string;
    Description:           string;
    SubcategoryID:         string;
    Images:                string;
    CreatedDate:           string;
    BrandID:               string;
    BrandName:             string;
    SCName:                string;
    CategoryID:            string;
    CategoryName:          string;
    CategoryImage:         string;
    RelatedProducts:       string | null;
    Price:                 number;
    ComparePrice:          number;
    DiscountPct:           number;
    // First-variant fields — populated by getProductsByCategory/Brand mapping
    Inventory_Id?:         number;
    Variant?:              string;
    ComplianceInfo:        ProductComplianceInfo;
    ProductClassification: ProductClassification;
    Marketing:             ProductMarketing;
    PolicyInfo:            ProductPolicyInfo;
    AdditionalInfo: {
        VideoUrl:            string | null;
        SizeChart:           string | null;
        CareInstructions:    string | null;
        MaterialComposition: string | null;
        Color:               string | null;
        Season:              Season | null;
    };
    ShippingInfo: ProductShippingInfo;
    Variants:     ProductVariant[];
    CustomerRating?: CustomerRatingInterface;
}


//result of getbrands api
export interface GetBrandItem {
    BrandId: number;
    BrandName: string;
    BrandImage: string;
}

// Legacy alias — mock data still references this name
export type BrandInterface = GetBrandItem;

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
    BrandId: string;
    BrandName: string;
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

// raw row from getProductsByCategory (productEndpoints.allProducts, filtered by
// category) — current backend shape: no root-level Price/ComparePrice/
// DiscountPct, pricing lives only per-variant under Variants[].PriceDetails.
export interface CategoryFeedProduct {
    ItemID:                number;
    Name:                  string;
    OrganisationName:      string;
    OrganisationId:        string;
    Description:           string;
    SubcategoryID:         string;
    Images:                string;
    CreatedDate:           string;
    BrandID:               string;
    BrandName:             string;
    SCName:                string;
    CategoryID:            string;
    CategoryName:          string;
    CategoryImage:         string;
    RelatedProducts:       string | null;
    ComplianceInfo:        ProductComplianceInfo;
    ProductClassification: ProductClassification;
    Marketing:             ProductMarketing;
    PolicyInfo:            ProductPolicyInfo;
    AdditionalInfo: {
        VideoUrl:            string | null;
        SizeChart:           string | null;
        CareInstructions:    string | null;
        MaterialComposition: string | null;
        Color:               string | null;
        Season:              Season | null;
    };
    ShippingInfo: ProductShippingInfo;
    Variants:     ProductVariant[];
    CustomerRating?: CustomerRatingInterface;
}

// raw row from getAllProducts (productEndpoints.allProducts) — full merchant-portal payload.
// Current backend shape: no root-level Price/ComparePrice/DiscountPct —
// pricing lives only per-variant under Variants[].PriceDetails.
export interface AllProductsRawItem {
    ItemID:                number;
    Name:                  string;
    OrganisationName:      string;
    OrganisationId:        string;
    Description:           string;
    SubcategoryID:         string;
    Images:                string;
    CreatedDate:           string;
    BrandID:               string;
    BrandName:             string;
    SCName:                string;
    CategoryID:            string;
    CategoryName:          string;
    CategoryImage:         string;
    RelatedProducts:       string | null;
    ComplianceInfo:        ProductComplianceInfo;
    ProductClassification: ProductClassification;
    Marketing:             ProductMarketing;
    PolicyInfo:            ProductPolicyInfo;
    AdditionalInfo: {
        VideoUrl:            string | null;
        SizeChart:           string | null;
        CareInstructions:    string | null;
        MaterialComposition: string | null;
        Color:               string | null;
        Season:              Season | null;
    };
    ShippingInfo: ProductShippingInfo;
    Variants:     ProductVariant[];
    CustomerRating?: CustomerRatingInterface;
}

//get products by category api result
export interface ProductByCategoryProductDetails {
    Item_Id: number;
    Name: string;
    Price: number;
    ComparePrice: number;
    DiscountPct: number;
    Description: string;
    SubCategory_Id: number;
    Images: string;
    Date_Created: string;
    Brand_Id: number;
    ApprovedBy: string | null;
    ApprovedOn: string | null;
    // Optional passthrough — populated only when sourced from getAllProducts
    // (mapProducts in ResultScreen.tsx); absent for getProductsByCategory rows.
    RelatedProducts?:       string | null;
    ComplianceInfo?:        ProductComplianceInfo;
    ProductClassification?: ProductClassification;
    Marketing?:             ProductMarketing;
    PolicyInfo?:            ProductPolicyInfo;
    AdditionalInfo?: {
        VideoUrl:            string | null;
        SizeChart:           string | null;
        CareInstructions:    string | null;
        MaterialComposition: string | null;
        Color:               string | null;
        Season:              Season | null;
    };
    ShippingInfo?: ProductShippingInfo;
    RawVariants?:  ProductVariant[];
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
    Category_Id: number;
    CreatedDate: string;
    MerchantID: number;
    SubCategoryImage: string;
    MerchantStaffID: number | null;
}

// result of getProductByItemId api
export interface VariantInterface {
    InventoryId:        string;
    Variant:            string;
    Stock:              number;
    SKU:                string;
    Threshold:          number;
    MaxPerOrder:        number;
    DateCreated:        string;
    DateUpdated:        string;
    Remarks:            string;
    Status:             string;
    VerificationStatus: string;
    StockStatus:        { Value: InventoryStockFilter; Description: string };
    BackOrder: {
        AllowBackOrder:        boolean;
        BackOrderLimit:        number | null;
        SupplierLeadTime:      number | null;
        BackOrderUsedQuantity: number;
        BackOrderUpdatedBy:    string;
        BackOrderUpdatedOn:    string | null;
    };
    PriceDetails: {
        Price:        number;
        ComparePrice: number;
        NetAmount:    number | null;
        TaxAmount:    number | null;
        GrossAmount:  number | null;
        DiscountPct:  number;
    };
    Taxes:              VariantTax[];
    PhysicalAttributes: PhysicalAttributes;
}

export interface ProductDetailInterface {
    ItemId:                string;
    Name:                  string;
    OrganisationID:        string;
    OrganisationName:      string;
    Description:           string;
    SubCategoryId:         string;
    Images:                string;
    DateCreated:           string;
    MerchantID:            string;
    MerchantStaffID:       string;
    RelatedProducts:       string;
    VerificationStatus:    string;
    Status:                string;
    ApprovedBy:            string;
    ApprovedOn:            string;
    Remarks:               string;
    BrandId:               number;
    BrandName:             string;
    SubCategoryName:       string;
    CategoryId:            string;
    CategoryName:          string;
    CategoryImage:         string;
    ComplianceInfo:        ProductDetailComplianceInfo;
    ProductClassification: ProductClassification;
    Marketing:             ProductMarketing;
    PolicyInfo:            ProductPolicyInfo;
    AdditionalInfo: {
        VideoUrl:            string | null;
        SizeChart:           string | null;
        CareInstructions:    string | null;
        MaterialComposition: string | null;
        Color:               string | null;
        ProductDemoGraphic:  ProductDemographic | null;
        Season:              Season | null;
    };
    ShippingInfo: ProductShippingInfo;
    Variants:     VariantInterface[];
    CustomerRating?: CustomerRatingInterface;
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
    AddressLabel?: AddressLabel | null;
    // Present on getDeliveryAddress; absent on getOrderStatus's DeliveryDetail —
    // keep optional rather than assuming both endpoints agree.
    CountryCode?: number | null;
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
    ItemId: number;
    Quantity: number;
    IsPurchased: boolean;
    CreatedDate: string;
    CheckedoutDate: string | null;
    Images: string;
    Name: string;
    Count: number;
    Variant: string;
    BrandName: string;
    OrganisationId: string;
    OrganisationName: string;
    Price?: number;
    MaxPerOrder: number | null;
    BackOrder?: {
        AllowBackOrder:        boolean;
        BackOrderLimit:        number | null;
        SupplierLeadTime:      number | null;
        BackOrderUsedQuantity: number;
        BackOrderUpdatedBy:    string | null;
        BackOrderUpdatedOn:    string | null;
    };
    PriceDetails: {
        Price: number;
        ComparePrice: number;
        NetAmount: number | null;
        TaxAmount: number | null;
        GrossAmount: number | null;
        TotalSaved?: number;
        Taxes: { VariantTaxConfigurationId: number; TaxId: number; TaxName?: string; TaxType: TaxType; TaxTypeDescription?: string; TaxRate: number; IsInclusive?: boolean; IsActive: boolean; CreatedAt: string; UpdatedAt?: string }[];
    };
}

// Cart-level tax breakdown row from getSaveCartItems — same shape as a per-item
// tax entry but pre-summed by the backend across the whole cart.
export interface CartTaxBreakdownItem {
    TaxId:              number;
    TaxName:            string;
    TaxRate:            number;
    TaxType:            TaxType;
    TaxTypeDescription: string;
    TaxAmount:          number;
}

// result of getSaveCartItems — root-level cart summary alongside Items[]
export interface SavedCartSummaryInterface {
    AmountToBePaid:       number;
    TotalInclusiveTax:    number;
    TotalExclusiveTax:    number;
    TotalDiscount:        number;
    // Backend-computed total savings (Σ ComparePrice-Price across items) —
    // use this directly rather than deriving from ItemsTotal, which is the
    // pre-discount MRP total despite its name, not a discounted subtotal.
    TotalSaved:           number;
    TotalShippingCharge:  number;
    ItemsTotal:           number;
    // Backend-computed discounted pre-tax subtotal (Σ Price×Qty across
    // items) — use this directly instead of summing item PriceDetails.Price
    // client-side.
    SubTotal:             number;
    Items:                SavedCartItemInterface[];
    TaxBreakdown:         CartTaxBreakdownItem[];
}


// ─── Place order (/api/ecomm/placeOrder) ──────────────────────────────────────

export interface PlaceOrderPaymentCard {
  Number:             string;
  AuthorizationCode:  string;
  CardAmount:         number;
  CardProcessingCode: string;
}

export interface PlaceOrderCashOnDelivery {
  ExpectedAmount:      number;
  CurrencyCode:        string;
  CollectionReference: string;
}

export interface PlaceOrderModeOfPayment {
  Cards?:          PlaceOrderPaymentCard;
  CashOnDelivery?: PlaceOrderCashOnDelivery;
}

export interface PlaceOrderPaymentDetails {
  PaymentModes:    number;
  Remark:          string;
  ModeOfPayments:  PlaceOrderModeOfPayment[];
  IsPaid:          boolean;
}

export interface PlaceOrderInterface {
  CustomerProfileCode:         number;
  OrderDeliveryAddressCode:    number;
  CartMasterCode?:             number;
  AmountPaid:                  number;
  CouponCode?:                 string;
  PaymentDetails:              PlaceOrderPaymentDetails;
}

export interface PlaceOrderResultItemTax {
  TaxId:            number;
  TaxName:          string;
  TaxType:          string;
  TaxValue:         number;
  IncludedInPrice:  boolean;
}

export interface PlaceOrderResultItem {
  OrderDetailsCode: number;
  ItemName:         string;
  // Comma-separated URLs, same format as SavedCartItemInterface.Images —
  // resolve with resolveImageUrl() before rendering.
  Images:           string;
  Variant:          string;
  BrandName:        string;
  Quantity:         number;
  Amount:           number;
  Discount:         number;
  VAT:              number;
  OrderStatus:      number;
  Taxes:            PlaceOrderResultItemTax[] | null;
}

export interface PlaceOrderSubOrder {
  SubOrderCode:     number;
  SubOrderNo:       string;
  OrganisationID:   string;
  ItemDetails:      PlaceOrderResultItem[];
}

// Result payload of a successful /api/ecomm/placeOrder call — PaymentAmount
// is the actual amount charged/owed; TotalSaved is the backend-computed
// total discount across all items (Σ Discount across ItemDetails).
export interface PlaceOrderResultInterface {
  OrderMasterCode:  number;
  OrderNumber:      string;
  CreatedDate:      string;
  TotalSaved:       number;
  CouponCode:       string | null;
  PaymentCode:      number;
  PaymentAmount:    number;
  CustomerEmail:    string;
  CustomerName:     string;
  PaymentMode:      PaymentModes;
  SubOrders:        PlaceOrderSubOrder[];
}

export interface PlaceOrderResponse {
  statusCode:   1 | 0;
  result:       PlaceOrderResultInterface;
  userMessage:  string;
}

// ─── Wishlist (confirmed real endpoints) ─────────────────────────────────────

export interface WishlistItemInterface {
  WishlistCode:         number;
  CustomerProfileCode:  number;
  InventoryID:          number;
  ItemID:               number;
  BrandName:            string;
  Name:                 string;
  AddedOn:              string;
  StockCount:           number;
  SKU:                  string;
  OrganisationName:     string;
  IsInStock:            number;
  Images:               string[];
  PriceDetails: {
    Price:        number;
    ComparePrice: number;
    NetAmount:    number | null;
    TaxAmount:    number | null;
    GrossAmount:  number | null;
    Taxes:        any[];
  };
}

// Raw shape returned by getWishlist API
export interface WishlistApiProduct {
  WishlistCode:        string;
  CustomerProfileCode: string;
  AddedOn:             string;
  ItemID:              number;
  Name:                string;
  Images:              string[];
  OrganisationId:      string;
  OrganisationName:    string;
  BrandName:           string;
  Variants: {
    InventoryID:   string;
    Variant:       string;
    Stock:         number;
    SKU:           string;
    StockStatus:   { Value: InventoryStockFilter; Description: string };
    PriceDetails:  { Price: number; ComparePrice: number; NetAmount: number | null; TaxAmount: number | null; GrossAmount: number | null; Taxes: any[] };
    PhysicalAttributes: any;
  }[];
}

export interface WishlistApiResponse {
  TotalRecords: number;
  Products:     WishlistApiProduct[];
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

import { OrderStatusCode } from '../config/enum_files/OrderStatus';
import { ItemEvents }      from '../config/enum_files/ItemEvents';
export { OrderStatusCode };

export interface OrderHistoryItemInterface {
    Inventory_Id:     number;
    Item_Id:          number;
    SubOrder:         SubOrderDetail;
    Variant:          string;
    Name:             string;
    Brand_Name:       string;
    Brand_Id:         number;
    Images:           string;
    Quantity:         number;
    Amount:           number;
    ComparePrice?:    number;
    OrderStatus:      OrderStatusCode;
    OrderMasterCode:  number;
    OrderNumber:      string;
    OrderedDate:      string;
    PaymentInfo?:     OrderPaymentInfoInterface;
    CompanyName?:     string;
}

export interface OrderHistoryApiResponse {
    TotalRecords: number;
    Orders:       {
        OrderMasterCode:  number;
        OrderNumber:      string;
        OrderedDate:      string;
        OrderPaymentInfo: OrderPaymentInfoInterface;
        Items:            Record<string, unknown>[];
    }[];
}

export interface OrderReturnEligibilityInterface {
    IsReturnWindowExpired: boolean;
    ReturnWindowClosesAt:  string | null;
}

export interface OrderDetailItemExtendedInterface extends OrderHistoryItemInterface {
    OrderDetailsCode: number;
    InventoryID:     number;
    ItemID:          number;
    BrandID:         number;
    BrandName:       string;
    Variant:         string;
    Images:          string;
    Events:          OrderEventInterface[];
    PricingDetails:  OrderPricingDetailsInterface;
    ReturnEligibility?: OrderReturnEligibilityInterface;
}

export interface SubOrderDetail {
    Code:   number;
    Number: string;
}

export interface OrderTaxInterface {
    TaxID:           number | null;
    TaxName:         string;
    // Sent as a numeric string (e.g. "2") on this endpoint — not the numeric
    // TaxType enum used by cart/product pricing. Compare via Number(TaxType).
    TaxType:         string;
    TaxValue:        number | null;
    IncludedInPrice: boolean | null;
    TaxedAmount:     number | null;
}

export interface OrderPricingDetailsInterface {
    Price?:        number;
    ComparePrice?: number;
    GrossAmount:   number;
    TotalDiscount: number;
    Taxes:         OrderTaxInterface[];
}

export interface OrderCashOnDeliveryDetail {
    ExpectedAmount:      string;
    CurrencyCode:        string;
    CollectionReference: string;
}

export interface OrderTaxBreakdownItem {
    TaxId:                   number;
    TaxName:                 string;
    TaxType:                 number;
    TaxTypeDescription:      string;
    TaxRate:                 number;
    TaxAmount:               number;
    IsInclusive?:            boolean;
}

export interface OrderPaymentInfoInterface {
    AmountPaid:                  number;
    GrossAmount?:                number;
    TotalDiscount?:              number;
    NetAmount?:                  number;
    FinalAmount?:                number;
    TotalAmountBeforeDiscount?:  number;
    TotalAmountAfterDiscount?:   number;
    Discount?:                   number;
    CouponAvailed:               string | null;
    DeliveryCharges:             number;
    isFreeShipping:              boolean;
    PaymentMode?:                { Code: number; Description: string };
    PaymentDetails?:             { CashOnDelivery?: OrderCashOnDeliveryDetail[] } & Record<string, unknown>;
    TaxBreakdown?:               OrderTaxBreakdownItem[];
    SubTotal?:                   number;
    TotalSaved?:                 number;
}

export interface OrderShipmentEventInterface {
    ItemStatusCode: ItemEvents;
    Description:    string;
    Date:           string;
}

export interface OrderEventInterface {
    StatusCode:      number;
    Description:     string;
    Date:            string;
    Location:        string | null;
    IsCompleted:     boolean;
    ShipementEvent?: OrderShipmentEventInterface[];
}

export interface OrderDetailResponseInterface {
    OrderDetails:   OrderDetailItemExtendedInterface[];
    DeliveryDetail: DeliveryAddressInterface;
    PaymentInfo:    OrderPaymentInfoInterface;
}

// ─── Product Reviews (ecomm/addProductReview, ecomm/editProductReview, ecomm/getProductReview) ────
// Images accepts a mix: existing photos as their hosted URL (pass through
// unchanged from what getProductReview returned) and newly-added photos as
// base64 data URIs — the backend uploads the base64 entries and stores/
// returns a hosted URL for them on the next read.

export interface AddProductReviewInterface {
    LoggedInCustomerDetails: {
        CustomerProfileCode: number;
    };
    ItemId:      number;
    Title:       string;
    Description: string;
    Rating:      number;
    Images:      string[];
}

export interface EditProductReviewInterface {
    ReviewId: number;
    LoggedInCustomerDetails: {
        CustomerProfileCode: number;
    };
    ItemId:      number;
    Title:       string;
    Description: string;
    Rating:      number;
    Images:      string[];
}

export interface AddProductReviewResultInterface {
    ReviewId: number;
}

export interface GetProductReviewRequest {
    ItemId:               number;
    CustomerProfileCode?: number | null;
    PageNumber?:          number;
    PageSize?:             number;
}

export interface ReviewPurchaseHistoryItem {
    PurchaseDate:            string;
    Variant:                 string;
    InventoryId:             number;
    OrderId:                 number;
    OrderDetailsCode:        number;
    OrderStatus:             string;
    OrderStatusDescription:  string;
}

export interface ProductReviewItem {
    ReviewId:    number;
    Rating:      number;
    Customer: {
        ProfileCode: number;
        Name:        string;
    };
    Title:            string;
    Description:      string;
    Images:            string[];
    PurchaseHistory:   ReviewPurchaseHistoryItem[];
    LastUpdatedDate:   string | null;
}

export interface GetProductReviewResultInterface {
    TotalRecords:      number;
    PageNumber:        number;
    PageSize:          number;
    LoggedInCustomer: {
        IsProductPurchasedBefore: boolean;
        Review:                   ProductReviewItem | null;
    } | null;
    CustomerRating: CustomerRatingInterface | null;
    Reviews: ProductReviewItem[];
}