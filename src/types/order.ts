export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";

export interface OrderItem {
  id?: string;
  productId?: string;
  productName: string;
  barcode?: string;
  price?: number;
  unitPrice?: number;
  unit_price?: number;
  sellingPrice?: number;
  selling_price?: number;
  productPrice?: number;
  product_price?: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  cashierName: string;
  customerName?: string;
  totalAmount: number;
  membershipLevel?: string;
  membershipDiscountRate?: number;
  membershipDiscountAmount?: number;
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
