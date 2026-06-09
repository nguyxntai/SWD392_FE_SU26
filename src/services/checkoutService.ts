import axiosClient from "./axiosClient";
import { ApiResponse } from "@/types/api";
import { CheckoutPayload, PayOSInitiateResponse } from "@/types/checkout";
import { CheckoutResponse } from "@/types/order";

export const checkout = async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
  const response = await axiosClient.post<ApiResponse<CheckoutResponse>>("/api/checkout", payload);
  return response.data.result;
};

export const initiatePayOS = async (payload: CheckoutPayload): Promise<PayOSInitiateResponse> => {
  const response = await axiosClient.post<ApiResponse<PayOSInitiateResponse>>("/api/checkout/payos/initiate", payload);
  return response.data.result;
};
