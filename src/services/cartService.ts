import axiosClient from "./axiosClient";
import { ApiResponse } from "../types/api";
import { Cart, AddToCartRequest, UpdateItemRequest } from "../types/cart";
import { AxiosResponse } from "axios";

// Lấy giỏ hàng của user hiện tại
export const getMyCart = async (): Promise<AxiosResponse<ApiResponse<Cart>>> => {
  return axiosClient.get("/api/cart/myCart");
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (data: AddToCartRequest): Promise<AxiosResponse<ApiResponse<Cart>>> => {
  return axiosClient.post("/api/cart/addToCart", data);
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (data: UpdateItemRequest): Promise<AxiosResponse<ApiResponse<Cart>>> => {
  return axiosClient.put("/api/cart/updateItem", data);
};

// Xóa một sản phẩm khỏi giỏ hàng
export const deleteCartItem = async (productId: string): Promise<AxiosResponse<ApiResponse<Cart>>> => {
  return axiosClient.delete(`/api/cart/deleteItem/${productId}`);
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async (): Promise<AxiosResponse<ApiResponse<Cart>>> => {
  return axiosClient.delete("/api/cart/clearCart");
};

// Checkout giỏ hàng
export const checkout = async (): Promise<AxiosResponse<ApiResponse<any>>> => {
  return axiosClient.post("/api/cart/checkout");
};
