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
    WarrantyType:    WarrantyType | null;
    WarrantyDetails: string | null;
}

export interface ProductShippingInfo {
    FreeShipping:             boolean;
    SeparateShippingRequired: boolean;
    EstimatedDeliveryDays:    string | null;
    CanShipInternational:     boolean;
    RestrictedCountries:      string[] | null;
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
    StockStatus:       { Value: number; Description: string };
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
    RelatedProducts:       null;
    MinPrice:              number;
    MaxComparePrice:       number;
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
    StockStatus:        { Value: number; Description: string };
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
    CreatedDate: string;
    CheckedoutDate: string | null;
    Images: string;
    Name: string;
    Count: number;
    Variant: string;
    BrandName: string;
    OrganisationId: string;
    OrganisationName: string;
    Price: number;
    PriceDetails: {
        Price: number;
        ComparePrice: number;
        Taxes: { VariantTaxConfigurationId: number; TaxId: number; TaxType: TaxType; TaxRate: number; IsActive: boolean; CreatedAt: string }[];
    };
}


// ─── Place order (/api/ecomm/placeOrder) ──────────────────────────────────────

export interface PlaceOrderTax {
  TaxId:   number;
  TaxName: string;
  TaxType: number;
  TaxRate: number;
  Reason:  string;
}

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
  Taxes?:             PlaceOrderTax[];
}

export interface PlaceOrderDetail {
  OrganisationID: string;
  ItemDetails:    PlaceOrderItemDetail[];
}

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
}

export interface PlaceOrderInterface {
  CustomerProfileCode:         number;
  OrderDeliveryAddressCode:    number;
  CartMasterCode?:             number;
  TotalAmountBeforeDiscount:   number;
  TotalAmountAfterDiscount:    number;
  CouponCode?:                 string;
  OrderDetails:                PlaceOrderDetail[];
  PaymentDetails:              PlaceOrderPaymentDetails;
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
  ORGANISATIONID:       string;
  OrganisationName:     string;
  IsInStock:            number;
  Images:               string[];
  PriceDetails: {
    Price:        number;
    ComparePrice: number;
    Taxes:        any[];
  };
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
export { OrderStatusCode };

export interface OrderHistoryItemInterface {
    Inventory_Id: number;
    Item_Id:      number;
    SubOrder:     SubOrderDetail;
    Variant:      string;
    Name:         string;
    Brand_Name:   string;
    Brand_Id:     number;
    Images:       string;
    Quantity:     number;
    Amount:       number;
    OrderStatus:  OrderStatusCode;
    OrderNumber:  string;
    OrderedDate:  string;
    PaymentInfo?: OrderPaymentInfoInterface;
}

export interface OrderDetailItemExtendedInterface extends OrderHistoryItemInterface {
    CreatedDate: string;
}

export interface SubOrderDetail {
    Code:   number;
    Number: string;
}

export interface OrderPaymentInfoInterface {
    AmountPaid:                  number;
    TotalAmountBeforeDiscount:   number;
    TotalAmountAfterDiscount:    number;
    Discount:                    number;
    CouponAvailed:               string | null;
    DeliveryCharges:             number;
    isFreeShipping:              boolean;
}

export interface OrderEventInterface {
    StatusCode:  number;
    Description: string;
    Date:        string;
    Location:    string | null;
    IsCompleted: boolean;
}

export interface OrderDetailResponseInterface {
    OrderDetails:   OrderDetailItemExtendedInterface[];
    DeliveryDetail: DeliveryAddressInterface[];
    Events:         OrderEventInterface[];
}