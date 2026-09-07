import type { SavedCartItemInterface, OrderDetailItemExtendedInterface, SavedCartSummaryInterface } from '../api/interfaces';
import type { SortKey } from '../components/ui';

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
  AddressLabel?:  number | null;
  CountryCode:    number | null;
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
  MainTabs:           undefined;
  Home:               undefined;
  Product:            { product?: string };
  Cart:               undefined;
  Result: {
    categoryId?:      string;
    brandId?:         number;
    searchQuery?:     string;
    categoryName?:    string;
    flashDeals?:      boolean;
    itemIds?:         number[];
    initialSort?:     SortKey;
    initialDiscount?: boolean;
  };
  Checkout:          undefined;
  OrderSuccess: {
    orderNumber?:     string;
    itemCount?:       number;
    orderTotal?:      number;
    totalSaved?:      number;
    orderCurrency?:   string;
    orderTimestamp?:  string | null;
    paymentMethod?:   string | null;
    deliveryAddress?: OrderSuccessDeliveryAddress | null;
    cartItems?:       OrderSuccessCartItem[];
  };
  Orders:             { refresh?: true } | undefined;
  OrderDetails: {
    orderItem:    OrderDetailItemExtendedInterface;
    orderNumber:  string;
  };
  Profile:            undefined;
  Wishlist:           undefined;
  AddressManagement:  { from?: 'checkout' } | undefined;
  AddAddress:         { editAddress?: DeliveryAddress } | undefined;
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
  ProductReviews: {
    itemId:   number;
    itemName?: string;
  };
};
