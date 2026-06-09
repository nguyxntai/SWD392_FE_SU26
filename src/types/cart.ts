export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
  totalItems: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateItemRequest {
  productId: string;
  quantity: number;
}
