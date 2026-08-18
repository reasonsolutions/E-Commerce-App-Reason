import axiosInstance from '../axiosInstance';
import { wishlistEndpoints } from '../endpoints';
import type {
  PostAddToWishlistInterface,
  PostDeleteWishlistInterface,
  WishlistItemInterface,
  WishlistApiResponse,
} from '../interfaces';

function normalizeWishlist(raw: WishlistApiResponse): WishlistItemInterface[] {
  return (raw.Products ?? []).map(p => {
    const v = p.Variants?.[0];
    return {
      WishlistCode:        Number(p.WishlistCode),
      CustomerProfileCode: Number(p.CustomerProfileCode),
      InventoryID:         Number(v?.InventoryID ?? 0),
      ItemID:              p.ItemID,
      BrandName:           p.BrandName ?? '',
      Name:                p.Name ?? '',
      AddedOn:             p.AddedOn ?? '',
      StockCount:          v?.Stock ?? 0,
      SKU:                 v?.SKU ?? '',
      OrganisationName:    p.OrganisationName ?? '',
      IsInStock:           v?.StockStatus?.Value === 1 ? 1 : 0,
      Images:              Array.isArray(p.Images) ? p.Images : [],
      PriceDetails: {
        Price:        v?.PriceDetails?.Price ?? 0,
        ComparePrice: v?.PriceDetails?.ComparePrice ?? 0,
        NetAmount:    v?.PriceDetails?.NetAmount ?? null,
        TaxAmount:    v?.PriceDetails?.TaxAmount ?? null,
        GrossAmount:  v?.PriceDetails?.GrossAmount ?? null,
        Taxes:        v?.PriceDetails?.Taxes ?? [],
      },
    };
  });
}

const WISHLIST_PAGE_SIZE = 50;

export const getWishlist = async (
  customerprofilecode: number,
  page: number = 1,
): Promise<{
  statusCode: number;
  result: WishlistItemInterface[];
  userMessage: string;
  hasMore: boolean;
  totalRecords: number;
}> => {
  const response = await axiosInstance.get(
    `${wishlistEndpoints.getWishlist}?customerProfileCode=${customerprofilecode}&pageNumber=${page}&pageSize=${WISHLIST_PAGE_SIZE}`,
  );
  const data = response.data;
  if (data?.statusCode !== 1) {
    return { statusCode: data?.statusCode ?? 0, result: [], userMessage: data?.userMessage ?? '', hasMore: false, totalRecords: 0 };
  }
  const apiResult = data.result as WishlistApiResponse;
  const totalRecords = apiResult?.TotalRecords ?? 0;
  return {
    statusCode: 1,
    result:     normalizeWishlist(apiResult),
    userMessage: data.userMessage ?? '',
    hasMore:     page * WISHLIST_PAGE_SIZE < totalRecords,
    totalRecords,
  };
};

export const addToWishlist = async (customerprofilecode: number, inventory_id: number) => {
  const payload: PostAddToWishlistInterface = {
    CustomerProfileCode: customerprofilecode,
    InventoryId:         inventory_id,
  };
  const response = await axiosInstance.post(wishlistEndpoints.postAddToWishlist, payload);
  return response.data;
};

export const removeFromWishlist = async (
  customerprofilecode: number,
  wishlistItemCode: number,
) => {
  const payload: PostDeleteWishlistInterface = {
    WishlistCode:        wishlistItemCode,
    CustomerProfileCode: customerprofilecode,
  };
  const response = await axiosInstance.post(wishlistEndpoints.postDeleteWishlist, payload);
  return response.data;
};
