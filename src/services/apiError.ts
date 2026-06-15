import axios from "axios";

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;

  const status = error.response?.status;
  const message = (error.response?.data as { message?: string } | undefined)?.message;

  if (message) return message;
  if (status === 404) return fallback;
  if (status === 502) return "API gateway is unavailable. Please check ngrok/backend.";
  if (status) return `API request failed (${status}).`;

  return "Cannot connect to API. Please check backend or network.";
};
