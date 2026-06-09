export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";

export interface OrderItem {
  id: string;
  productName: string;
  barcode: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  cashierName: string;
  customerName?: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
}

export interface CheckoutResponse {
  order: Order;
  receiptNumber: string;
}
