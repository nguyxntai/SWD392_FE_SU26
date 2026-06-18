import axiosClient from "./axiosClient";
import { ApiResponse } from "@/types/api";
import { LowStockReportItem, ReportPeriod, RevenueReport, TopProductReportItem } from "@/types/report";

type RangeParams = {
  from?: string;
  to?: string;
};

const getQueryParams = (period: ReportPeriod, range?: RangeParams) => {
  const params = new URLSearchParams();

  if (period === "today" || period === "month") {
    params.set("period", period);
  } else {
    if (range?.from) params.set("from", range.from);
    if (range?.to) params.set("to", range.to);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

const getPathSuffix = (period: ReportPeriod, range?: RangeParams) => {
  if (period === "today") return "/today";
  if (period === "month") return "/month";

  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  return `/range?${params.toString()}`;
};

const getReportWithFallback = async <T>(basePath: string, period: ReportPeriod, range?: RangeParams): Promise<T> => {
  const queryUrl = `${basePath}${getQueryParams(period, range)}`;
  const pathUrl = `${basePath}${getPathSuffix(period, range)}`;

  try {
    const response = await axiosClient.get<ApiResponse<T>>(queryUrl);
    return response.data.result;
  } catch (queryError: any) {
    const status = queryError.response?.status;
    if (status && status !== 404 && status !== 405) {
      throw queryError;
    }

    const response = await axiosClient.get<ApiResponse<T>>(pathUrl);
    return response.data.result;
  }
};

export const getRevenueReport = async (
  period: ReportPeriod,
  range?: RangeParams
): Promise<RevenueReport> => {
  return getReportWithFallback<RevenueReport>("/api/reports/revenue", period, range);
};

export const getTopProductsReport = async (
  period: ReportPeriod,
  range?: RangeParams
): Promise<TopProductReportItem[]> => {
  return getReportWithFallback<TopProductReportItem[]>("/api/reports/top-products", period, range);
};

export const getLowStockReport = async (): Promise<LowStockReportItem[]> => {
  const response = await axiosClient.get<ApiResponse<LowStockReportItem[]>>("/api/reports/low-stock");
  return response.data.result;
};
