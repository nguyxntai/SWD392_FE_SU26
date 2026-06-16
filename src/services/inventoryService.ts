import axiosClient from "./axiosClient";
import { ApiResponse } from "@/types/api";

export interface InventoryItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  minStockLevel: number;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  createdBy: string;
  type: "SALE" | "IMPORT" | "ADJUSTMENT";
  quantityChange: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  active?: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

export interface CreateImportReceiptRequest {
  supplierId: string;
  note?: string;
  items: Array<{
    barcode: string;
    quantity: number;
    unitCost: number;
  }>;
}

export const getInventory = async (): Promise<InventoryItem[]> => {
  const response = await axiosClient.get<ApiResponse<InventoryItem[]>>("/api/inventory");
  return response.data.result;
};

export const getInventoryTransactions = async (): Promise<InventoryTransaction[]> => {
  const response = await axiosClient.get<ApiResponse<InventoryTransaction[]>>("/api/inventory/transactions");
  return response.data.result;
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await axiosClient.get<ApiResponse<Supplier[]>>("/api/suppliers");
  return response.data.result;
};

export const createSupplier = async (payload: CreateSupplierRequest): Promise<Supplier> => {
  const response = await axiosClient.post<ApiResponse<Supplier>>("/api/suppliers", payload);
  return response.data.result;
};

export const createImportReceipt = async (payload: CreateImportReceiptRequest): Promise<unknown> => {
  const response = await axiosClient.post<ApiResponse<unknown>>("/api/import-receipts", payload);
  return response.data.result;
};
