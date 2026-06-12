export interface CheckoutItem {
  productId: string;
  barcode: string;
  quantity: number;
}

export interface CheckoutPayload {
  customerPhone?: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "EWALLET";
  amountReceived: number;
  discountAmount: number;
  items: CheckoutItem[];
}

export interface PayOSInitiateResponse {
  orderId: string;
  paymentId: string;
  merchantReference: string;
  providerSessionId: string;
  paymentLink: string;
  finalAmount: number;
  status: string;
}

export type PayOSReturnPaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface PayOSReturnResponse {
  orderId: string;
  paymentId: string;
  merchantReference: string;
  paymentStatus: PayOSReturnPaymentStatus;
  orderStatus: string;
  finalAmount: number;
}
