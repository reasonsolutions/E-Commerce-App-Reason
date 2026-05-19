import axiosInstance from '../axiosInstance';
import { orderEndpoints } from '../endpoints';
import type {
  PlaceOrderInterface,
  OrderHistoryRequest,
  OrderDetailRequest,
  // kept for AddressScreen's current postPlacedMultipleOrder call shape
  postPlacedMultipleOrderInterface,
} from '../interfaces';

// Primary order placement — maps to the new /placeOrder endpoint.
// Used by AddressScreen going forward.
export const placeOrder = async (data: PlaceOrderInterface) => {
  const response = await axiosInstance.post(orderEndpoints.placeOrder, data);
  return response.data;
};

// Legacy adapter: AddressScreen still calls postPlacedMultipleOrder with the
// old payload shape. This converts it to the new placeOrder envelope so the
// screen works without changes until it enters Phase 3 scope.
export const postPlacedMultipleOrder = async (data: postPlacedMultipleOrderInterface) => {
  const adapted: PlaceOrderInterface = {
    CustomerProfileCode:      data.CustomerProfileCode,
    OrderDeliveryAddressCode: data.OrderDeliveryAddressCode,
    CartMasterCode:           data.CartMasterCode,
    TotalAmount:              data.OrderDetails.reduce((sum, d) => sum + d.Amount, 0),
    OrderDetails: [
      {
        OrganisationID: 'NULL',
        ItemDetails: data.OrderDetails.map(d => ({
          InventoryId:        d.Inventory_Id,
          Quantity:           d.Quantity,
          Amount:             d.Amount,
          DeliveryCharges:    d.DeliveryCharges,
          DeliveryChargesVAT: d.DeliveryChargesVAT,
          ItemCharges:        d.ItemCharges,
          ItemChargesVAT:     d.ItemChargesVAT,
          Discount:           d.Discount,
          VAT:                d.VAT,
          OrderStatus:        d.OrderStatus,
        })),
      },
    ],
  };
  const response = await axiosInstance.post(orderEndpoints.placeOrder, adapted);
  return response.data;
};

export const postOrderHistory = async (customerprofilecode: number) => {
  const payload: OrderHistoryRequest = { CustomerProfileCode: customerprofilecode };
  const response = await axiosInstance.post(orderEndpoints.getOrderHistory, payload);
  return response.data;
};

export const postCnfOrderDetail = async (OrderMasterCode: string, CustomerProfileCode: number) => {
  const payload: OrderDetailRequest = { OrderNumber: OrderMasterCode, CustomerProfileCode };
  const response = await axiosInstance.post(orderEndpoints.getOrderStatus, payload);
  return response.data;
};
