import axiosClient from "./axiosClient";
import { ApiResponse } from "@/types/api";
import { Category } from "@/types/category";

const SUCCESS_CODE = 1000;

/* =====================
   CREATE
===================== */
export async function createCategory(
  name: string,
  description?: string,
  status: Category["status"] = "ACTIVE"
): Promise<Category> {
  const response = await axiosClient.post<ApiResponse<Category>>(
    "/api/categories",
    { name, description, status }
  );

  const data = response.data;

  if (data.code !== SUCCESS_CODE) {
    throw new Error(data.message || "Create category failed");
  }

  return data.result;
}

/* =====================
   GET ALL
===================== */
export async function getCategories(): Promise<Category[]> {
  const response = await axiosClient.get<ApiResponse<Category[]>>(
    "/api/categories"
  );

  const data = response.data;

  if (data.code !== SUCCESS_CODE) {
    throw new Error(data.message || "Get categories failed");
  }

  return data.result;
}

/* =====================
   UPDATE
===================== */
export async function updateCategory(
  id: string,
  name: string,
  description?: string,
  status?: Category["status"]
): Promise<Category> {
  const response = await axiosClient.put<ApiResponse<Category>>(
    `/api/categories/${id}`,
    { name, description, status }
  );

  const data = response.data;

  if (data.code !== SUCCESS_CODE) {
    throw new Error(data.message || "Update category failed");
  }

  return data.result;
}

/* =====================
   DELETE
===================== */
export async function deleteCategory(id: string): Promise<void> {
  const response = await axiosClient.delete<ApiResponse<{}>>(
    `/api/categories/${id}`
  );

  const data = response.data;

  if (data.code !== SUCCESS_CODE) {
    throw new Error(data.message || "Delete category failed");
  }

}
