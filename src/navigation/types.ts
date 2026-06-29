import type { SavedCartItemInterface, OrderDetailItemExtendedInterface } from '../api/interfaces';

interface DeliveryAddress {
  OrderDeliveryAddressCode: number;
  CustomerName:   string;
  MobileNumber:   number | string;
  CustomerProfileCode: number;
  CreatedDate:    string;
  UpdatedDate:    string | null;
  Address:        string | null;
  StreetName:     string | null;
  City:           string | null;
  Landmark:       string | null;
  Zipcode:        string | null;
  IsPrimary:      boolean;
}

interface OrderSuccessCartItem {
  name:          string;
  quantity:      number;
  price:         number;
  comparePrice?: number;
  image:         string;
}

interface OrderSuccessDeliveryAddress {
  street: string;
  city:   string;
}

export type RootStackParamList = {
  Login:              { skipEntrance?: boolean } | undefined;
  Register:           undefined;
  OTPVerification: {
    CustomerName:   string;
    EmailID:        string;
    MobileNumber:   string;
    CountryCode:    number;
  };
  Home:               undefined;
  Product:            { product?: string };
  Cart:               undefined;
  Result: {
    categoryId?:    string;
    brandId?:       number;
    searchQuery?:   string;
    categoryName?:  string;
    flashDeals?:    boolean;
    itemIds?:       number[];
  };
  Address:            { cartItems?: SavedCartItemInterface[] };
  OrderSuccess: {
    orderNumber?:              string;
    itemCount?:                number;
    orderTotal?:               number;
    orderTotalBeforeDiscount?: number;
    orderCurrency?:            string;
    orderTimestamp?:           string | null;
    orderStatus?:              number | null;
    paymentMethod?:            string | null;
    deliveryAddress?:          OrderSuccessDeliveryAddress | null;
    cartItems?:                OrderSuccessCartItem[];
  };
  Orders:             undefined;
  OrderDetails: {
    orderItem:    OrderDetailItemExtendedInterface;
    orderNumber:  string;
  };
  Profile:            undefined;
  Wishlist:           undefined;
  AddressManagement:  undefined;
  Search:             undefined;
  EcomPayment: {
    profileCode:      number;
    cartItems:        SavedCartItemInterface[];
    selectedAddress:  DeliveryAddress;
    orderTotal:       number;
  };
  HelpCenter:         undefined;
  Brands:             undefined;
  Categories:         undefined;
  Legal:              { type: 'privacy' | 'terms' };
};
