import axiosClient from "./axiosClient";
import { ApiResponse } from "@/types/api";
import { CheckoutPayload, PayOSInitiateResponse, PayOSReturnResponse } from "@/types/checkout";
import { CheckoutResponse } from "@/types/order";

export const checkout = async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
  const response = await axiosClient.post<ApiResponse<CheckoutResponse>>("/api/checkout", payload);
  return response.data.result;
};

export const initiatePayOS = async (payload: CheckoutPayload): Promise<PayOSInitiateResponse> => {
  const response = await axiosClient.post<ApiResponse<PayOSInitiateResponse>>("/api/checkout/payos/initiate", payload);
  return response.data.result;
};

export const getPayOSReturnResult = async (token: string): Promise<PayOSReturnResponse> => {
  const response = await axiosClient.get<ApiResponse<PayOSReturnResponse>>(
    `/api/payments/payos/return?token=${encodeURIComponent(token)}`
  );
  return response.data.result;
};
