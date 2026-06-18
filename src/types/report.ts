export type ReportPeriod = "today" | "month" | "range";

export interface RevenueReport {
  paidOrderCount?: number;
  grossRevenue?: number;
  discountTotal?: number;
  netRevenue?: number;
}

export interface TopProductReportItem {
  productId?: string;
  productName: string;
  quantitySold?: number;
  revenue?: number;
}

export interface LowStockReportItem {
  productId?: string;
  productName: string;
  barcode?: string;
  quantity?: number;
  minStockLevel?: number;
}
