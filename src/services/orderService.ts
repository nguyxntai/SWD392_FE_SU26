import axiosClient from "./axiosClient";
import { ApiResponse } from "@/types/api";
import { Order } from "@/types/order";

export const getOrders = async (): Promise<Order[]> => {
  const response = await axiosClient.get<ApiResponse<Order[]>>("/api/orders");
  return response.data.result;
};

export const getOrderById = async (id: string): Promise<Order> => {
  const response = await axiosClient.get<ApiResponse<Order>>(`/api/orders/${id}`);
  return response.data.result;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await axiosClient.get<ApiResponse<Order[]>>("/api/me/orders");
  return response.data.result;
};
