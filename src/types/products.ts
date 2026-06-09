import { ApiResponse } from "./api";

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  barcode: string;
  price: number;
  costPrice: number;
  unit: string;
  imageUrl: string;
  status: "ACTIVE" | "INACTIVE";
  quantity: number;
  minStockLevel: number;
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  barcode: string;
  price: number;
  costPrice: number;
  unit: string;
  imageUrl: string;
  initialQuantity: number;
  minStockLevel: number;
}

export interface UpdateProductRequest {
  categoryId?: string;
  name?: string;
  barcode?: string;
  price?: number;
  costPrice?: number;
  unit?: string;
  imageUrl?: string;
  active?: boolean;
  minStockLevel?: number;
}

export type { ApiResponse };
