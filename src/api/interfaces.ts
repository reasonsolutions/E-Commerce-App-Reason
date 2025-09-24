export interface PostCartSaveInterface {
  "CustomerLoginCode": null,
  "CustomerProfileCode": number,
  "Inventory_Id": number,
  "BranchCode": null,
  "CountryCode": null,
  "Quantity": number,
  "SpecialRemarks": string
}


export interface deleteCartInterface {
    "CartDetailsCode":string
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
    "CustomerName":string,
    "MobileNumber":string,
    "FullAddress":string,
    "CustomerProfileCode": number
}

export interface postUpdateDeliveryAddressInterface {
"CustomerProfileCode":number,
"OrderDeliveryAddressCode":number,
"CustomerName":string,
"MobileNumber":number,
"FullAddress":string
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
export interface ProductInterface {
    Item_Id: number;
    Name: string;
    Price: number;
    ComparePrice: number;
    Description: string;
    SubCategory_Id: number;
    Images: string;
    Date_Created: string;
    Brand_Id: number;
    Brand_Name: string;
    SCName: string;
    Category_Id: number;
    CategoryName: string;
    CategoryImage: string;
    Inventory_Id: number;
    Variant: string;
    Count: number;
}


//result of getbrands api
export interface BrandInterface {
    Brand_Id: number;
    Brand_Name: string;
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
    Category_Id: number;
    CategoryName: string;
    CategoryImage: string;
    Brands: CategoryBrandInterface[];
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

//result of select product api
export interface ProductDetailInterface {
    Brand_Id: number;
    Brand_Name: string;
    Date_Created: string;
    Inventory_Id: number;
    Variant: string;
    Count: number;
    Item_Id: number;
    Name: string;
    Price: number;
    ComparePrice: number;
    Description: string;
    Images: string;
    Category_Id: number;
    CategoryName: string;
    SCName: string;
}
//result of select product api (second part)
export interface VariantInterface {
    "Inventory_Id": number,
    "Images": string,
    "Price": number,
    "ComparePrice": number,
    "Variant": string,
    "Count": number,
    "Date_Created": string,
    "Date_Updated": string
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
    FullAddress: string;
    CustomerProfileCode: number;
    CreatedDate: string;
    UpdatedDate: string | null;
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
    Inventory_Id: number;
    Quantity: number;
    Images: string;
    Name: string;
    Price: number;
    ComparePrice: number;
    Count: number;
    Variant: string;
    Brand_Name: string;
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