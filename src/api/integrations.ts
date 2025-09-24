import axiosInstance from "./axiosInstance";
import { endpoints } from './endpoints'
import { createCustomerInterface , PostCartSaveInterface , postLoginInterface , postCreateDeliveryAddressInterface , postUpdateDeliveryAddressInterface , postPlacedMultipleOrderInterface , postPlacedSingleOrderInterface } from "./interfaces";

const getAllProducts = async () => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.allProducts}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching brands: ", error);
    throw error;
  }
};

const getBrands = async () => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getBrands}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching brands: ", error);
    throw error;
  }
};

const getCategories = async () => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getCategory}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching categories: ", error);
    throw error;
  }
};

const getSubCategories = async (categoryCode:string) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getSubCategory}?Categorycode=${categoryCode}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching subcategories: ", error);
    throw error;
  }
};

const getProductsByCategory = async (categorycode: string) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getProductsByCategory}?categorycode=${categorycode}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching products by category: ", error);
    throw error;
  }
};

const getProductsBySubCategory = async (subcategorycode: string) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getProductsBySubCategory}?subcategorycode=${subcategorycode}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching products by subcategory: ", error);
    throw error;
  }
};

const selectProduct = async (inventorycode: string) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.selectProduct}?inventorycode=${inventorycode}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching product: ", error);
    throw error;
  }
};

const searchProducts = async (filterstring: string,category_id:string) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.searchProduct}?filterstring=${filterstring}&Category_Id=${category_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error searching products: ", error);
    throw error;
  }
};

const getSavedCartItems = async (customerprofilecode: number) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getSavedCartItems}?CustomerProfileCode=${customerprofilecode}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching saved cart items: ", error);
    throw error;
  }
};

const postCreateCustomer = async (data: createCustomerInterface) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postCreateCustomer}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error creating customer: ", error);
    throw error;
  }
};

const postSaveCartItems = async (data: PostCartSaveInterface) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postCartSaveItem}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error saving cart items: ", error);
    throw error;
  }
};

const loginCustomer = async (data: postLoginInterface) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postLoginCustomer}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error logging in: ", error);
    throw error;
  }
};

const quantityIncrement = async (cartdetailscode: number, inventory_id: number) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.quantityIncrement}`,
      { CartDetailsCode: cartdetailscode, Inventory_Id: inventory_id }
    );
    return response.data;
  } catch (error) {
    console.error("Error incrementing quantity: ", error);
    throw error;
  }
};
const quantityDecrement = async (cartdetailscode: number, inventory_id: number) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.quantityDecrement}`,
      { CartDetailsCode: cartdetailscode, Inventory_Id: inventory_id }
    );
    return response.data;
  } catch (error) {
    console.error("Error decrementing quantity: ", error);
    throw error;
  }
};

const postCreateDeliveryAddress = async (data: postCreateDeliveryAddressInterface) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postCreateDeliveryAddress}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error creating delivery address: ", error);
    throw error;
  }
};

const postDeleteDeliveryAddress = async (OrderDeliveryAddressCode: number) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postDeleteDeliveryAddress}`,
      { OrderDeliveryAddressCode: OrderDeliveryAddressCode }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting delivery address: ", error);
    throw error;
  }
};

const getDeliveryAddresses = async (customerprofilecode: number) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getDeliveryAddress}?CustomerProfileCode=${customerprofilecode}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery addresses: ", error);
    throw error;
  }
};

const getDeliveryAddressForUpdate = async (orderdeliveryaddresscode: number, customerprofilecode: number) => {
  try {
    const response = await axiosInstance.get(
      `${endpoints.getDeliveryAddressForUpdate}?CustomerProfileCode=${customerprofilecode}&OrderDeliveryAddressCode=${orderdeliveryaddresscode}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery address for update: ", error);
    throw error;
  }
};

const postUpdateDeliveryAddress = async (data: postUpdateDeliveryAddressInterface) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postUpdateDeliveryAddress}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error updating delivery address: ", error);
    throw error;
  }
};

const postPlacedSingleOrder = async (data: postPlacedSingleOrderInterface) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postPlacedSingleOrder}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error placing single order: ", error);
    throw error;
  }
};
const postPlacedMultipleOrder = async (data: postPlacedMultipleOrderInterface) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postPlacedMultipleOrder}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error placing multiple order: ", error);
    throw error;
  }
};

const postCnfOrderDetail = async (OrderMasterCode: string, CustomerProfileCode: number) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postCnfOrderDetail}`,
      {
        "OrderNumber": OrderMasterCode, 
        "CustomerProfileCode": CustomerProfileCode
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error confirming order detail: ", error);
    throw error;
  }
};

const postDeleteCartItem = async (cartdetailscode: string) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.deleteCartItem}`,
      { CartDetailsCode: cartdetailscode }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting cart item: ", error);
    throw error;
  }
};

const postOrderHistory = async (customerprofilecode: number) => {
  try {
    const response = await axiosInstance.post(
      `${endpoints.postOrderHistoryDetail}`,
      { CustomerProfileCode: customerprofilecode }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching order history: ", error);
    throw error;
  }
};

export {
    getAllProducts,
    getBrands,
    getCategories,
    getSubCategories,
    getProductsByCategory,
    getProductsBySubCategory,
    selectProduct,
    searchProducts,
    getSavedCartItems,
    postCreateCustomer,
    postSaveCartItems,
    loginCustomer,
    quantityIncrement,
    quantityDecrement,
    postCreateDeliveryAddress,
    postDeleteDeliveryAddress,
    getDeliveryAddresses,
    getDeliveryAddressForUpdate,
    postUpdateDeliveryAddress,
    postPlacedSingleOrder,
    postPlacedMultipleOrder,
    postCnfOrderDetail,
    postDeleteCartItem,
    postOrderHistory
};