import {
  ProductInterface,
  CategoryInterface,
  BrandInterface,
  ProductDetailInterface,
  VariantInterface,
  SavedCartItemInterface,
  WishlistItemInterface,
  DeliveryAddressInterface,
  LoggedInCustomerInterface,
  OrderDetailItemInterface,
  postOrderHistoryDetailsInterface,
} from '../interfaces';

// ─── Response envelope ────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  statusCode: number;
  exception: null;
  userMessage: string | null;
  result: T;
}

export function ok<T>(result: T, message?: string): ApiEnvelope<T> {
  return { statusCode: 1, exception: null, userMessage: message ?? null, result };
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const mockCategories: CategoryInterface[] = [
  {
    CategoryId: 1,
    CategoryName: 'Footwear',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146432/shoes_xu0vfr.png',
    Brands: [{ Brand_Id: 1, Brand_Name: 'Nike' }],
  },
  {
    CategoryId: 2,
    CategoryName: 'Watches',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146431/watch_ztlcto.png',
    Brands: [{ Brand_Id: 5, Brand_Name: 'Casio' }],
  },
  {
    CategoryId: 3,
    CategoryName: 'Bag',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146429/bags_x9w0pz.png',
    Brands: [{ Brand_Id: 6, Brand_Name: 'Van Heusen' }],
  },
  {
    CategoryId: 4,
    CategoryName: 'Pants',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146429/jeans_zmbaiy.png',
    Brands: [{ Brand_Id: 7, Brand_Name: 'Allen Solly' }],
  },
  {
    CategoryId: 5,
    CategoryName: 'Clothes',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146428/shirt_mjjvxn.png',
    Brands: [{ Brand_Id: 8, Brand_Name: 'ARROW' }],
  },
  {
    CategoryId: 7,
    CategoryName: 'Skin Care',
    CategoryImage: 'https://png.pngtree.com/png-clipart/20221015/original/pngtree-skincare-logo-png-image_8689417.png',
    Brands: [{ Brand_Id: 11, Brand_Name: 'Lakme' }],
  },
];

// ─── Brands ───────────────────────────────────────────────────────────────────

export const mockBrands: BrandInterface[] = [
  { Brand_Id: 1,  Brand_Name: 'Nike',        BrandImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
  { Brand_Id: 5,  Brand_Name: 'Casio',       BrandImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Casio_logo.svg/320px-Casio_logo.svg.png' },
  { Brand_Id: 6,  Brand_Name: 'Van Heusen',  BrandImage: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Van_Heusen_Logo.png' },
  { Brand_Id: 7,  Brand_Name: 'Allen Solly', BrandImage: 'https://upload.wikimedia.org/wikipedia/en/2/26/Allen_Solly_logo.png' },
  { Brand_Id: 8,  Brand_Name: 'ARROW',       BrandImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Arrow_brand_logo.jpg/320px-Arrow_brand_logo.jpg' },
  { Brand_Id: 11, Brand_Name: 'Lakme',       BrandImage: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Lakmé_logo.svg/320px-Lakmé_logo.svg.png' },
];

// ─── Products (all) ───────────────────────────────────────────────────────────

export const mockProducts: ProductInterface[] = [
  {
    ItemID: 1, Name: "Cortez Men's Shoes", MinPrice: 7495, MaxComparePrice: 8495,
    Description: "Was 1972. Now 2023. Sometimes more is better. Recrafting the revered look, we've refreshed the design with a wider toe area and firmer side panels so you can comfortably wear them day in, day out.",
    SubcategoryID: '1',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28282410/2024/3/15/af0f1c2c-b604-4c10-8148-6c2cda15ffaa1710483429264NikeCortezMensShoes1.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28282410/2024/3/15/21c42b51-791a-4b61-ba86-735a490e0a811710483429334NikeCortezMensShoes6.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28282410/2024/3/15/c0e48663-2149-4170-a755-ae6913d737dc1710483429351NikeCortezMensShoes5.jpg;',
    CreatedDate: '2024-07-01T00:00:00', BrandID: '1', BrandName: 'Nike',
    SCName: 'Shoes', CategoryID: '1', CategoryName: 'Footwear',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146432/shoes_xu0vfr.png',
    Variants: [{ InventoryID: '3', Variant: '14', Stock: 189, SKU: 'SKU-1-14', PriceDetails: { Price: 7495, ComparePrice: 8495 } }],
  },
  {
    ItemID: 9, Name: 'Men Analogue and Digital Chronograph Solar Powered Watch ECB-950MP-1ADF', MinPrice: 1600, MaxComparePrice: 1700,
    Description: 'Pack Contains: single watch. Display: analogue and digital. Movement: quartz. Power Source: solar. Water resistance: 100 m. Warranty: 2 years.',
    SubcategoryID: '2',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22598992/2023/3/31/8742cd00-78ba-4dd9-85bf-4c24379f243c1680261731212Watches1.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22598992/2023/3/31/8f3f3761-0292-4b9b-9351-b439ba7ac2281680261731230Watches4.jpg;',
    CreatedDate: '2024-07-01T00:00:00', BrandID: '5', BrandName: 'Casio',
    SCName: 'Watches', CategoryID: '2', CategoryName: 'Watches',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146431/watch_ztlcto.png',
    Variants: [{ InventoryID: '8', Variant: 'Units', Stock: 158, SKU: 'SKU-9-Units', PriceDetails: { Price: 1600, ComparePrice: 1700 } }],
  },
  {
    ItemID: 11, Name: 'Men Self-Design Single-Breasted Slim-Fit 2-Piece Suit', MinPrice: 6599, MaxComparePrice: 7435,
    Description: '100% Original Products. Pay on delivery might be available. Easy 7 days returns and exchanges.',
    SubcategoryID: '4',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22322842/2023/3/15/c7b756ff-29dc-4435-9e20-17d7381b58b31678866615734MenNavySlimFitTexturedFormalTwoPieceSuit1.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22322842/2023/3/15/1ed8cd60-69fd-4bb3-b413-47aee35c5b151678866615749MenNavySlimFitTexturedFormalTwoPieceSuit2.jpg;',
    CreatedDate: '2024-08-02T00:00:00', BrandID: '7', BrandName: 'Allen Solly',
    SCName: 'Cotton Pent', CategoryID: '4', CategoryName: 'Pants',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146429/jeans_zmbaiy.png',
    Variants: [{ InventoryID: '9', Variant: '37', Stock: 186, SKU: 'SKU-11-37', PriceDetails: { Price: 6599, ComparePrice: 7435 } }],
  },
  {
    ItemID: 15, Name: 'Structured Shoulder Bag', MinPrice: 1124, MaxComparePrice: 2499,
    Description: 'White solid shoulder bag. 1 main compartment, has a button closure, 3 inner pockets. One handle.',
    SubcategoryID: '6',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/29343624/2024/5/24/d272726d-c617-4a66-ada3-ed016a45e05c1716538603636-Van-Heusen-Women-Handbags-8891716538603161-4.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/29343624/2024/5/24/7a129234-34b2-466e-8457-3e7174379bbb1716538603614-Van-Heusen-Women-Handbags-8891716538603161-5.jpg;',
    CreatedDate: '2024-08-02T16:38:54.51', BrandID: '6', BrandName: 'Van Heusen',
    SCName: 'Shoulder Bag', CategoryID: '3', CategoryName: 'Bag',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146429/bags_x9w0pz.png',
    Variants: [{ InventoryID: '20', Variant: 'ONESIZE', Stock: 191, SKU: 'SKU-15-ONESIZE', PriceDetails: { Price: 1124, ComparePrice: 2499 } }],
  },
  {
    ItemID: 17, Name: 'Polo Collar Pure Cotton T-shirt', MinPrice: 1499, MaxComparePrice: 1599,
    Description: 'Yellow T-shirt for men. Solid Regular length. Polo collar. Short, regular sleeves. Knitted cotton fabric. Button closure.',
    SubcategoryID: '7',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28292176/2024/3/15/6eb511d5-087a-40d2-be3c-1ff9c4c94ba51710499906168ArrowSportMenPoloCollarAppliqueT-shirt5.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28292176/2024/3/15/d1f5a6a6-d590-43f0-a114-4db3d41b5b9d1710499906241ArrowSportMenPoloCollarAppliqueT-shirt6.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28292176/2024/3/15/a9aed791-63db-424c-9b3c-cefc431cc65a1710499906190ArrowSportMenPoloCollarAppliqueT-shirt7.jpg;',
    CreatedDate: '2024-09-18T07:30:07.96', BrandID: '8', BrandName: 'ARROW',
    SCName: 'T-Shirt', CategoryID: '5', CategoryName: 'Clothes',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146428/shirt_mjjvxn.png',
    Variants: [{ InventoryID: '23', Variant: 'S', Stock: 10, SKU: 'SKU-17-S', PriceDetails: { Price: 1499, ComparePrice: 1599 } }],
  },
  {
    ItemID: 28, Name: 'Matte Sunscreen SPF 50 PA+++ Niacinamide with UVA/B Protection - 50 ml', MinPrice: 250, MaxComparePrice: 349,
    Description: '100% Original Products. Pay on delivery might be available. Concerns: Sun Protection. Formulation: Lotion. Key Ingredients: Vitamin B3. Preferences: Fragrance-Free, SPF 30 to 50.',
    SubcategoryID: '11',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2137201/2025/4/14/4b95c457-97cf-4f02-84bf-7ef89ac36d481744628244363-Lakme-Matte-Sunscreen-SPF-50-PA-Niacinamide-with-UVAB-Protec-3.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2137201/2025/4/14/37d0ac75-fd66-4dea-8ee8-d69385551ab21744628244322-Lakme-Matte-Sunscreen-SPF-50-PA-Niacinamide-with-UVAB-Protec-4.jpg;',
    CreatedDate: '2025-09-18T10:17:51.99', BrandID: '11', BrandName: 'Lakme',
    SCName: 'Sunscreen', CategoryID: '7', CategoryName: 'Skin Care',
    CategoryImage: 'https://png.pngtree.com/png-clipart/20221015/original/pngtree-skincare-logo-png-image_8689417.png',
    Variants: [{ InventoryID: '59', Variant: '40-50 ML', Stock: 50, SKU: 'SKU-28-ML', PriceDetails: { Price: 250, ComparePrice: 349 } }],
  },
  {
    ItemID: 31, Name: "Air Jordan 40 PF 'Blue Suede'", MinPrice: 5000, MaxComparePrice: 6000,
    Description: "There's only one way to celebrate 40 years of Air Jordans. Full-length Zoom Strobel + ZoomX foam. Herringbone traction. Washed suede. Style: HM9932-400.",
    SubcategoryID: '1',
    Images: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/fe12ac0f-c417-429f-9c91-085e283c332f/AIR+JORDAN+40+PF.png;https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/a6db5942-521f-45e8-92bb-d68430ef6443/AIR+JORDAN+40+PF.png;https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/3cf9d3b9-2e29-4363-a473-622cf828b777/AIR+JORDAN+40+PF.png;',
    CreatedDate: '2025-09-22T11:33:42.193', BrandID: '1', BrandName: 'Nike',
    SCName: 'Shoes', CategoryID: '1', CategoryName: 'Footwear',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146432/shoes_xu0vfr.png',
    Variants: [{ InventoryID: '65', Variant: 'UK 5.5', Stock: 100, SKU: 'SKU-31-UK5.5', PriceDetails: { Price: 5000, ComparePrice: 6000 } }],
  },
  {
    ItemID: 22, Name: 'Unisex Brasilia 9.5 Drawstring Bag (18L)', MinPrice: 1116, MaxComparePrice: 1599,
    Description: 'Organization is the spice of life. Spacious main compartment. End zipped pockets. Side zipped pocket. Special zipped shoe compartment on the bottom.',
    SubcategoryID: '6',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/29988984/2024/6/18/26109f9e-0177-4045-8bef-4301511ebc4b1718711048492NikeNKBRSLADRWSTG95CAMOAOP1.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/29988984/2024/6/18/e739b36d-c46c-4c38-8a01-d8c7593d2d7e1718711048445NikeNKBRSLADRWSTG95CAMOAOP6.jpg;',
    CreatedDate: '2024-11-15T09:53:47.697', BrandID: '1', BrandName: 'Nike',
    SCName: 'Shoulder Bag', CategoryID: '1', CategoryName: 'Footwear',
    CategoryImage: 'https://res.cloudinary.com/dwnaq2fk7/image/upload/v1736146432/shoes_xu0vfr.png',
    Variants: [{ InventoryID: '41', Variant: 'OneSize', Stock: 2, SKU: 'SKU-22-OneSize', PriceDetails: { Price: 1116, ComparePrice: 1599 } }],
  },
];

// ─── Product detail + variants (for selectProduct) ───────────────────────────

const mockVariant = (id: string, label: string, price: number, comparePrice: number, stock: number): VariantInterface => ({
  InventoryId: id,
  Variant: label,
  Stock: stock,
  SKU: `SKU-${id}`,
  PriceDetails: { Price: price, ComparePrice: comparePrice },
  StockStatus: { Value: stock > 0 ? 1 : 2, Description: stock > 0 ? 'in_stock' : 'out_of_stock' },
});

export const mockProductDetailMap: Record<number, { detail: ProductDetailInterface; variants: VariantInterface[] }> = {
  3: {
    detail: {
      ItemId: '3', BrandId: 1, BrandName: 'Nike',
      Name: "Cortez Men's Shoes",
      Description: "Was 1972. Now 2023. Sometimes more is better. Recrafting the revered look, we've refreshed the design with a wider toe area and firmer side panels so you can comfortably wear them day in, day out.",
      Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28282410/2024/3/15/af0f1c2c-b604-4c10-8148-6c2cda15ffaa1710483429264NikeCortezMensShoes1.jpg;https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28282410/2024/3/15/21c42b51-791a-4b61-ba86-735a490e0a811710483429334NikeCortezMensShoes6.jpg;',
      CategoryId: '1', CategoryName: 'Footwear', SubCategoryName: 'Shoes',
      Variants: [
        mockVariant('1', '11', 7495, 8495, 0),
        mockVariant('2', '12', 7495, 8495, 0),
        mockVariant('3', '13', 7495, 8495, 45),
        mockVariant('4', '14', 7495, 8495, 189),
        mockVariant('5', '15', 7495, 8495, 72),
      ],
    },
    variants: [],
  },
  65: {
    detail: {
      ItemId: '65', BrandId: 1, BrandName: 'Nike',
      Name: "Air Jordan 40 PF 'Blue Suede'",
      Description: "There's only one way to celebrate 40 years of Air Jordans. Full-length Zoom Strobel + ZoomX foam. Herringbone traction. Washed suede.",
      Images: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/fe12ac0f-c417-429f-9c91-085e283c332f/AIR+JORDAN+40+PF.png;',
      CategoryId: '1', CategoryName: 'Footwear', SubCategoryName: 'Shoes',
      Variants: [
        mockVariant('65', 'UK 5.5', 5000, 6000, 100),
        mockVariant('66', 'UK 6',   5000, 6000, 2),
        mockVariant('67', 'UK 10',  5000, 6000, 1),
      ],
    },
    variants: [],
  },
  8: {
    detail: {
      ItemId: '8', BrandId: 5, BrandName: 'Casio',
      Name: 'Men Analogue and Digital Chronograph Solar Powered Watch ECB-950MP-1ADF',
      Description: 'Display: analogue and digital. Movement: quartz. Power Source: solar. Water resistance: 100 m. Warranty: 2 years.',
      Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22598992/2023/3/31/8742cd00-78ba-4dd9-85bf-4c24379f243c1680261731212Watches1.jpg;',
      CategoryId: '2', CategoryName: 'Watches', SubCategoryName: 'Watches',
      Variants: [mockVariant('8', 'Units', 1600, 1700, 158)],
    },
    variants: [],
  },
  59: {
    detail: {
      ItemId: '59', BrandId: 11, BrandName: 'Lakme',
      Name: 'Matte Sunscreen SPF 50 PA+++ Niacinamide with UVA/B Protection - 50 ml',
      Description: '100% Original Products. Concerns: Sun Protection. Key Ingredients: Vitamin B3. Preferences: Fragrance-Free, SPF 30 to 50.',
      Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2137201/2025/4/14/4b95c457-97cf-4f02-84bf-7ef89ac36d481744628244363-Lakme-Matte-Sunscreen-SPF-50-PA-Niacinamide-with-UVAB-Protec-3.jpg;',
      CategoryId: '7', CategoryName: 'Skin Care', SubCategoryName: 'Sunscreen',
      Variants: [
        mockVariant('59', '40-50 ML',  250, 349, 50),
        mockVariant('60', '80-100 gm', 250, 349, 20),
        mockVariant('61', '60-70 ML',  250, 349, 50),
      ],
    },
    variants: [],
  },
  23: {
    detail: {
      ItemId: '23', BrandId: 8, BrandName: 'ARROW',
      Name: 'Polo Collar Pure Cotton T-shirt',
      Description: 'Yellow T-shirt for men. Solid Regular length. Polo collar. Short, regular sleeves. Knitted cotton fabric. Button closure.',
      Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28292176/2024/3/15/6eb511d5-087a-40d2-be3c-1ff9c4c94ba51710499906168ArrowSportMenPoloCollarAppliqueT-shirt5.jpg;',
      CategoryId: '5', CategoryName: 'Clothes', SubCategoryName: 'T-Shirt',
      Variants: [
        mockVariant('23', 'S',  1499, 1599, 10),
        mockVariant('24', 'M',  1499, 1599, 19),
        mockVariant('25', 'XL', 1499, 1599, 30),
        mockVariant('26', 'L',  1499, 1599, 20),
      ],
    },
    variants: [],
  },
};

// Fallback for any Inventory_Id not in the map — use the first product
export function getMockProductDetail(inventoryId: number): { detail: ProductDetailInterface; variants: VariantInterface[] } {
  return mockProductDetailMap[inventoryId] ?? mockProductDetailMap[3];
}

// ─── Cart items ───────────────────────────────────────────────────────────────

export const mockCartItems: SavedCartItemInterface[] = [
  {
    CartDetailsCode: 320,
    CartMasterCode: 159,
    InventoryId: 7,
    Quantity: 1,
    IsPurchased: false,
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17264162/2023/3/14/b0b4f604-db5c-411e-95ef-a53731d1bd171678775868510-Crocs-Unisex-Off-White-Sliders-8121678775868171-1.jpg;',
    Name: 'Unisex Off White Sliders',
    Price: 1247,
    PriceDetails: { Price: 1247, ComparePrice: 1347 },
    Count: 196,
    Variant: '10',
    BrandName: 'Crocs',
  },
  {
    CartDetailsCode: 321,
    CartMasterCode: 159,
    InventoryId: 65,
    Quantity: 1,
    IsPurchased: false,
    Images: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/fe12ac0f-c417-429f-9c91-085e283c332f/AIR+JORDAN+40+PF.png;',
    Name: "Air Jordan 40 PF 'Blue Suede'",
    Price: 5000,
    PriceDetails: { Price: 5000, ComparePrice: 6000 },
    Count: 100,
    Variant: 'UK 5.5',
    BrandName: 'Nike',
  },
  {
    CartDetailsCode: 322,
    CartMasterCode: 159,
    InventoryId: 59,
    Quantity: 2,
    IsPurchased: false,
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2137201/2025/4/14/4b95c457-97cf-4f02-84bf-7ef89ac36d481744628244363-Lakme-Matte-Sunscreen-SPF-50-PA-Niacinamide-with-UVAB-Protec-3.jpg;',
    Name: 'Matte Sunscreen SPF 50 PA+++',
    Price: 250,
    PriceDetails: { Price: 250, ComparePrice: 349 },
    Count: 50,
    Variant: '40-50 ML',
    BrandName: 'Lakme',
  },
];

// ─── Delivery addresses ───────────────────────────────────────────────────────

export const mockDeliveryAddresses: DeliveryAddressInterface[] = [
  {
    OrderDeliveryAddressCode: 2,
    CustomerName: 'Demo User',
    MobileNumber: 9876543210,
    CustomerProfileCode: 100079,
    CreatedDate: '2024-07-25T12:08:59.733',
    UpdatedDate: null,
    Address: 'Flat 12B, Sunrise Apartments',
    StreetName: 'Hitech City Road',
    City: 'Hyderabad',
    Landmark: 'Near Cyber Towers',
    Zipcode: '500081',
    IsPrimary: true,
  },
  {
    OrderDeliveryAddressCode: 4,
    CustomerName: 'Demo User',
    MobileNumber: 9876543210,
    CustomerProfileCode: 100079,
    CreatedDate: '2024-07-26T13:04:57.717',
    UpdatedDate: null,
    Address: '45 Gandhi Nagar',
    StreetName: 'Banjara Hills',
    City: 'Hyderabad',
    Landmark: 'Near Road No. 12',
    Zipcode: '500034',
    IsPrimary: false,
  },
];

// ─── Auth / Customer ──────────────────────────────────────────────────────────

export const mockLoggedInCustomer: LoggedInCustomerInterface = {
  CustomerProfileCode: 100079,
  CustomerName: 'Demo User',
  Address: 'Flat 12B, Sunrise Apartments',
  StreetName: 'Hitech City Road',
  CityName: 'Hyderabad',
  Zipcode: 500081,
  CountryCode: 91,
  MobileNumber: 9876543210,
  EmailID: 'demo@reasonsolutions.com',
  CartDetailsCount: 3,
};

// ─── Order history ────────────────────────────────────────────────────────────

export const mockOrderHistory: (postOrderHistoryDetailsInterface & { OrderNumber?: string; OrderedDate?: string })[] = [
  {
    Inventory_Id: 65,
    Item_Id: 31,
    Variant: 'UK 5.5',
    Name: "Air Jordan 40 PF 'Blue Suede'",
    Images: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/fe12ac0f-c417-429f-9c91-085e283c332f/AIR+JORDAN+40+PF.png;',
    Quantity: 1,
    Amount: 5000,
    OrderStatus: 3,
    Brand_Id: 1,
    Brand_Name: 'Nike',
    OrderNumber: 'ORDNO_10041',
    OrderedDate: '2025-04-10T09:15:00.000',
  },
  {
    Inventory_Id: 59,
    Item_Id: 28,
    Variant: '40-50 ML',
    Name: 'Matte Sunscreen SPF 50 PA+++',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2137201/2025/4/14/4b95c457-97cf-4f02-84bf-7ef89ac36d481744628244363-Lakme-Matte-Sunscreen-SPF-50-PA-Niacinamide-with-UVAB-Protec-3.jpg;',
    Quantity: 2,
    Amount: 500,
    OrderStatus: 2,
    Brand_Id: 11,
    Brand_Name: 'Lakme',
    OrderNumber: 'ORDNO_10038',
    OrderedDate: '2025-04-05T14:30:00.000',
  },
  {
    Inventory_Id: 7,
    Item_Id: 5,
    Variant: '10',
    Name: 'Unisex Off White Sliders',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17264162/2023/3/14/b0b4f604-db5c-411e-95ef-a53731d1bd171678775868510-Crocs-Unisex-Off-White-Sliders-8121678775868171-1.jpg;',
    Quantity: 1,
    Amount: 1247,
    OrderStatus: 1,
    Brand_Id: 3,
    Brand_Name: 'Crocs',
    OrderNumber: 'ORDNO_10033',
    OrderedDate: '2025-03-28T11:00:00.000',
  },
  {
    Inventory_Id: 3,
    Item_Id: 1,
    Variant: '14',
    Name: "Cortez Men's Shoes",
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28282410/2024/3/15/af0f1c2c-b604-4c10-8148-6c2cda15ffaa1710483429264NikeCortezMensShoes1.jpg;',
    Quantity: 1,
    Amount: 7495,
    OrderStatus: 3,
    Brand_Id: 1,
    Brand_Name: 'Nike',
    OrderNumber: 'ORDNO_10027',
    OrderedDate: '2025-03-15T08:45:00.000',
  },
  {
    Inventory_Id: 23,
    Item_Id: 17,
    Variant: 'M',
    Name: 'Polo Collar Pure Cotton T-shirt',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/28292176/2024/3/15/6eb511d5-087a-40d2-be3c-1ff9c4c94ba51710499906168ArrowSportMenPoloCollarAppliqueT-shirt5.jpg;',
    Quantity: 2,
    Amount: 2998,
    OrderStatus: 4,
    Brand_Id: 8,
    Brand_Name: 'ARROW',
    OrderNumber: 'ORDNO_10019',
    OrderedDate: '2025-03-01T16:20:00.000',
  },
  {
    Inventory_Id: 20,
    Item_Id: 15,
    Variant: 'ONESIZE',
    Name: 'Structured Shoulder Bag',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/29343624/2024/5/24/d272726d-c617-4a66-ada3-ed016a45e05c1716538603636-Van-Heusen-Women-Handbags-8891716538603161-4.jpg;',
    Quantity: 1,
    Amount: 1124,
    OrderStatus: 2,
    Brand_Id: 6,
    Brand_Name: 'Van Heusen',
    OrderNumber: 'ORDNO_10012',
    OrderedDate: '2025-02-18T10:10:00.000',
  },
  {
    Inventory_Id: 8,
    Item_Id: 9,
    Variant: 'Units',
    Name: 'Men Analogue and Digital Chronograph Solar Powered Watch ECB-950MP-1ADF',
    Images: 'https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22598992/2023/3/31/8742cd00-78ba-4dd9-85bf-4c24379f243c1680261731212Watches1.jpg;',
    Quantity: 1,
    Amount: 1600,
    OrderStatus: 3,
    Brand_Id: 5,
    Brand_Name: 'Casio',
    OrderNumber: 'ORDNO_10005',
    OrderedDate: '2025-02-02T13:55:00.000',
  },
];

// ─── Order detail (for postCnfOrderDetail) ────────────────────────────────────

export const mockOrderDetail: { OrderDetails: OrderDetailItemInterface[]; DeliveryDetail: DeliveryAddressInterface[] } = {
  OrderDetails: [
    {
      Inventory_Id: 65,
      Item_Id: 31,
      Variant: 'UK 5.5',
      Name: "Air Jordan 40 PF 'Blue Suede'",
      Images: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/fe12ac0f-c417-429f-9c91-085e283c332f/AIR+JORDAN+40+PF.png;',
      Quantity: 1,
      Amount: 5000,
      OrderStatus: 1,
      CreatedDate: '2025-11-05T10:00:00.000',
      Brand_Id: 1,
      Brand_Name: 'Nike',
    },
  ],
  DeliveryDetail: [mockDeliveryAddresses[0]],
};

// ─── Wishlist (new domain — future API stub) ──────────────────────────────────

export const mockWishlistItems: WishlistItemInterface[] = [
  {
    WishlistCode: 1,
    CustomerProfileCode: 100079,
    InventoryID: 3,
    Name: "Cortez Men's Shoes",
    BrandName: 'Nike',
    AddedOn: '2025-10-01T09:00:00.000',
    StockCount: 45,
    Price: 7495,
    ComparePrice: 8495,
    SKU: 'SKU-3',
    IsInStock: 1,
  },
  {
    WishlistCode: 2,
    CustomerProfileCode: 100079,
    InventoryID: 20,
    Name: 'Structured Shoulder Bag',
    BrandName: 'Van Heusen',
    AddedOn: '2025-10-03T14:30:00.000',
    StockCount: 191,
    Price: 1124,
    ComparePrice: 2499,
    SKU: 'SKU-20',
    IsInStock: 1,
  },
];

// ─── Search results ───────────────────────────────────────────────────────────

export function getMockSearchResults(filterString: string): ProductInterface[] {
  const q = filterString.toLowerCase();
  return mockProducts.filter(
    p =>
      p.Name.toLowerCase().includes(q) ||
      p.BrandName.toLowerCase().includes(q) ||
      p.CategoryName.toLowerCase().includes(q),
  );
}

// ─── Products by category ─────────────────────────────────────────────────────

export function getMockProductsByCategory(categoryId: string | number): ProductInterface[] {
  const id = Number(categoryId);
  return mockProducts.filter(p => p.CategoryID === String(id));
}
