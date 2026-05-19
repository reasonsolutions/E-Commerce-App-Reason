import type {
  Order,
  OrderDetail,
  OrderDetailResponse,
  OrderStatusCode,
  DeliveryAddress,
} from '../interfaces';

function parseImages(raw: string): string[] {
  return (raw ?? '').split(';').filter(Boolean);
}

export function adaptOrder(raw: any): Order {
  return {
    inventoryId:  raw.Inventory_Id,
    itemId:       raw.Item_Id,
    variant:      raw.Variant ?? '',
    name:         raw.Name ?? '',
    brand:        raw.Brand_Name ?? '',
    brandId:      raw.Brand_Id,
    images:       parseImages(raw.Images),
    quantity:     raw.Quantity,
    amount:       raw.Amount,
    status:       raw.OrderStatus as OrderStatusCode,
    orderNumber:  raw.OrderNumber ?? '',
    orderedDate:  raw.OrderedDate ?? raw.CreatedDate ?? '',
  };
}

export function adaptOrderDetail(raw: any): OrderDetail {
  return {
    ...adaptOrder(raw),
    createdDate: raw.CreatedDate ?? raw.OrderedDate ?? '',
    orderedDate: raw.OrderedDate ?? raw.CreatedDate ?? '',
  };
}

function adaptDeliveryAddress(raw: any): DeliveryAddress {
  return {
    code:                raw.OrderDeliveryAddressCode,
    customerName:        raw.CustomerName ?? '',
    mobile:              String(raw.MobileNumber ?? ''),
    fullAddress:         raw.FullAddress ?? '',
    customerProfileCode: raw.CustomerProfileCode,
  };
}

export function adaptOrderDetailResponse(raw: any): OrderDetailResponse {
  return {
    orderDetails:   (raw.OrderDetails ?? []).map(adaptOrderDetail),
    deliveryDetail: (raw.DeliveryDetail ?? []).map(adaptDeliveryAddress),
  };
}
