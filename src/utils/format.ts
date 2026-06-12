export const formatVnd = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${value.toLocaleString()} VND`;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString();
};
