export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
  timestamp?: string;
  path?: string;
}
