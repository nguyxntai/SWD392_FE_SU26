export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role?: string;
}
