import axiosClient from "./axiosClient";
import { ApiResponse } from "@/types/api";
import { CreateCustomerRequest, CustomerByPhone } from "@/types/customer";

export const getCustomerByPhone = async (phone: string): Promise<CustomerByPhone> => {
  const response = await axiosClient.get<ApiResponse<CustomerByPhone>>(
    `/api/customers/phone/${encodeURIComponent(phone)}`
  );
  return response.data.result;
};

export const createCustomer = async (payload: CreateCustomerRequest): Promise<CustomerByPhone> => {
  const response = await axiosClient.post<ApiResponse<CustomerByPhone>>("/api/customers", payload);
  return response.data.result;
};
