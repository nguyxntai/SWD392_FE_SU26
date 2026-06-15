import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { getApiErrorMessage } from "@/services/apiError";
import { getOrderById } from "@/services/orderService";
import { Order } from "@/types/order";
import { formatDateTime, formatVnd } from "@/utils/format";
import { Receipt } from "@/components/pos/Receipt";

export default function OrderDetail() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextOrder = await getOrderById(orderId);
      setOrder(nextOrder);
      setError("");

      // Auto print if requested
      if (searchParams.get("print") === "true") {
        setTimeout(() => {
          window.print();
        }, 1200);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load order."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      {/* 58mm Receipt for Printing */}
      {order && <Receipt order={order} />}

      <div className="mx-auto flex max-w-4xl flex-col gap-6 print:hidden">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 shadow-sm">
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to POS</span>
          </Link>
          <div className="flex gap-2">
            <button
              onClick={loadOrder}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              disabled={!order}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Printer size={18} />
              Print Bill
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Order Detail</p>
          <h1 className="mt-2 text-3xl font-bold">{loading ? "Loading order..." : order?.id || "Order not found"}</h1>

          {error && (
            <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {order && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Cashier</p>
                  <p className="font-semibold">{order.cashierName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-semibold">{order.customerName || "Guest"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created At</p>
                  <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={`font-semibold ${order.status === "PAID" ? "text-green-600" : "text-amber-600"}`}>
                    {order.status}
                  </p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 font-medium">Product</th>
                    <th className="py-3 text-right font-medium">Qty</th>
                    <th className="py-3 text-right font-medium">Price</th>
                    <th className="py-3 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="py-3">
                        <p className="font-medium">{item.productName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.barcode}</p>
                      </td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{formatVnd(item.price)}</td>
                      <td className="py-3 text-right font-semibold">{formatVnd(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ml-auto max-w-xs space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{formatVnd(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">{formatVnd(order.discountAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-lg font-bold text-primary">
                  <span>Final</span>
                  <span>{formatVnd(order.finalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
