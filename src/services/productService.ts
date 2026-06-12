import axiosClient from "./axiosClient";
import { CreateProductRequest, UpdateProductRequest, Product } from "@/types/products";
import { ApiResponse } from "@/types/api";

const SUCCESS_CODE = 1000;

export const getProducts = async (): Promise<Product[]> => {
  const response = await axiosClient.get<ApiResponse<Product[]>>("/api/products");
  return response.data.result;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await axiosClient.get<ApiResponse<Product>>(`/api/products/${id}`);
  return response.data.result;
};

export const getProductByBarcode = async (barcode: string): Promise<Product> => {
  const response = await axiosClient.get<ApiResponse<Product>>(
    `/api/products/barcode?code=${encodeURIComponent(barcode)}`
  );
  return response.data.result;
};

export const createProduct = async (product: CreateProductRequest): Promise<Product> => {
  const response = await axiosClient.post<ApiResponse<Product>>("/api/products", product);
  return response.data.result;
};

export const updateProduct = async (
  id: string,
  product: UpdateProductRequest
): Promise<Product> => {
  const response = await axiosClient.put<ApiResponse<Product>>(`/api/products/${id}`, product);
  return response.data.result;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await axiosClient.delete<ApiResponse<any>>(`/api/products/${id}`);
  if (response.data.code !== SUCCESS_CODE) {
    throw new Error(response.data.message || "Delete product failed");
  }
};
