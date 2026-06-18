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

export const getOrderItemUnitPrice = (item: {
  price?: number | null;
  unitPrice?: number | null;
  unit_price?: number | null;
  sellingPrice?: number | null;
  selling_price?: number | null;
  productPrice?: number | null;
  product_price?: number | null;
  subtotal?: number | null;
  quantity?: number | null;
}) => {
  if (typeof item.price === "number") return item.price;
  if (typeof item.unitPrice === "number") return item.unitPrice;
  if (typeof item.unit_price === "number") return item.unit_price;
  if (typeof item.sellingPrice === "number") return item.sellingPrice;
  if (typeof item.selling_price === "number") return item.selling_price;
  if (typeof item.productPrice === "number") return item.productPrice;
  if (typeof item.product_price === "number") return item.product_price;
  if (
    typeof item.subtotal === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  ) {
    return item.subtotal / item.quantity;
  }

  return null;
};
