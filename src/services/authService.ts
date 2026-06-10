import axiosClient from "./axiosClient";
import { jwtDecode } from "jwt-decode";
import { RegisterPayload, LoginPayload } from "@/types/auth";
import { ApiResponse } from "@/types/api";

const SUCCESS_CODE = 1000;

// ================= TYPES =================

interface JwtPayload {
  role?: string;
  roles?: string[];
  authorities?: string[];
  scope?: string;
}

// ================= LOGIN =================

export async function login(payload: LoginPayload) {
  const response = await axiosClient.post<ApiResponse<any>>(
    "/api/auth/login",
    payload
  );

  const data = response.data;

  if (data.code !== SUCCESS_CODE) {
    throw new Error(data.message || "Login failed");
  }

  const { accessToken, refreshToken } = data.result;

  // save tokens
  localStorage.setItem("accessToken", accessToken); 
  localStorage.setItem("refreshToken", refreshToken);

  // decode jwt to get role
  const decoded = jwtDecode<JwtPayload>(accessToken);
  console.log("JWT DECODED:", decoded);

  let role: string | undefined;

  if (decoded.role) {
    role = decoded.role;
  } else if (decoded.roles?.length) {
    role = decoded.roles[0];
  } else if (decoded.authorities?.length) {
    role = decoded.authorities[0].replace("ROLE_", "");
  } else if (decoded.scope) {
    role = decoded.scope;
  }

  if (role) {
    localStorage.setItem("role", role);
  }

  return data.result;
}
// ================= REGISTER =================

export async function register(payload: RegisterPayload): Promise<void> {
  const response = await axiosClient.post("/api/auth/register", payload);

  const data = response.data;

  if (data.code !== SUCCESS_CODE) {
    throw new Error(data.message || "Register failed");
  }
}

// ================= LOGOUT =================

export async function logout(): Promise<void> {
  try {    
      await axiosClient.post("/api/auth/logout", null, {
        withCredentials: true, // backend dùng cookie
      });
  } catch (err) {
    console.warn("Logout API failed, clearing local data anyway");
  } finally {
    // clear local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
  }
}

// ================= REFRESH TOKEN =================

export async function refreshToken() {
  const response = await axiosClient.post<ApiResponse<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>>("/api/auth/refresh");

  const data = response.data;

  if (data.code !== SUCCESS_CODE) {
    throw new Error(data.message || "Refresh token failed");
  }

  const { accessToken } = data.result;

  // chỉ lưu accessToken
  localStorage.setItem("accessToken", accessToken);

  return data.result;
}

