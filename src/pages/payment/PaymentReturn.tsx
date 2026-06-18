import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Printer, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/services/apiError";
import { getPayOSReturnResult } from "@/services/checkoutService";
import { getOrderById } from "@/services/orderService";
import { PayOSReturnResponse } from "@/types/checkout";
import { Order } from "@/types/order";
import { formatDateTime, formatVnd, getOrderItemUnitPrice } from "@/utils/format";
import { Receipt } from "@/components/pos/Receipt";

const PAYOS_PENDING_ORDER_KEY = "posPendingPayOSOrderId";
const PAID_STATUS = "PAID";
const SUCCESS_STATUS = "SUCCESS";
const PENDING_STATUS = "PENDING";
const FAILED_STATUS = "FAILED";
const CANCELLED_STATUS = "CANCELLED";
const MAX_STATUS_CHECKS = 10;

export default function PaymentReturn() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [returnResult, setReturnResult] = useState<PayOSReturnResponse | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token") || "";
  const fallbackOrderId = useMemo(() => {
    return (
      searchParams.get("orderId") ||
      searchParams.get("order_id") ||
      localStorage.getItem(PAYOS_PENDING_ORDER_KEY) ||
      ""
    );
  }, [searchParams]);
  const isCancelPage = location.pathname.includes("/payment/cancel");

  const loadOrder = async (orderId: string) => {
    const nextOrder = await getOrderById(orderId);
    setOrder(nextOrder);
    return nextOrder;
  };

  const fetchTokenResult = async (showToast = false) => {
    if (!token) return null;

    setChecking(true);
    try {
      const nextResult = await getPayOSReturnResult(token);
      setReturnResult(nextResult);
      setError("");

      if (nextResult.paymentStatus === SUCCESS_STATUS) {
        localStorage.removeItem(PAYOS_PENDING_ORDER_KEY);
        await loadOrder(nextResult.orderId);
        if (showToast) toast.success("Payment verified");
        
        // Auto print after PayOS success
        setTimeout(() => {
          window.print();
        }, 1500);
      } else if (nextResult.paymentStatus === PENDING_STATUS && showToast) {
        toast.info("Payment is still being verified");
      } else if (nextResult.paymentStatus === CANCELLED_STATUS && showToast) {
        toast.info("Payment was cancelled");
      } else if (nextResult.paymentStatus === FAILED_STATUS && showToast) {
        toast.error("Payment failed");
      }

      return nextResult;
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load payment result."));
      return null;
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  const fetchFallbackOrder = async (showToast = false) => {
    if (!fallbackOrderId) {
      setError("Payment returned, but FE could not find the payment token or order id.");
      setLoading(false);
      return null;
    }

    setChecking(true);
    try {
      const nextOrder = await loadOrder(fallbackOrderId);
      setError("");

      if (nextOrder.status === PAID_STATUS) {
        localStorage.removeItem(PAYOS_PENDING_ORDER_KEY);
        if (showToast) toast.success("Payment verified");
        
        // Auto print after PayOS success
        setTimeout(() => {
          window.print();
        }, 1500);
      } else if (showToast) {
        toast.info("Payment is still being verified");
      }

      return nextOrder;
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load payment result."));
      return null;
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  const refreshPaymentResult = async (showToast = false) => {
    if (token) {
      return fetchTokenResult(showToast);
    }

    return fetchFallbackOrder(showToast);
  };

  useEffect(() => {
    let cancelled = false;
    let checks = 0;
    let timeoutId: number | undefined;

    const checkUntilSettled = async () => {
      if (cancelled) return;

      const result = await refreshPaymentResult();
      checks += 1;

      const stillPending = token && (result as PayOSReturnResponse | null)?.paymentStatus === PENDING_STATUS;

      if (!cancelled && stillPending && checks < MAX_STATUS_CHECKS) {
        timeoutId = window.setTimeout(checkUntilSettled, 2000);
      }
    };

    checkUntilSettled();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [token, fallbackOrderId]);

  const handlePrint = () => {
    window.print();
  };

  const paymentStatus = returnResult?.paymentStatus;
  const isSuccess = paymentStatus ? paymentStatus === SUCCESS_STATUS : order?.status === PAID_STATUS;
  const isPending = paymentStatus ? paymentStatus === PENDING_STATUS : !isSuccess && !error;
  const isCancelled = paymentStatus === CANCELLED_STATUS || (isCancelPage && !isSuccess && !isPending);
  const isFailed = paymentStatus === FAILED_STATUS;
  const finalAmount = returnResult?.finalAmount ?? order?.finalAmount;
  const orderDetailId = returnResult?.orderId || order?.id || fallbackOrderId;

  const heading = (() => {
    if (loading) return "Checking payment...";
    if (isSuccess) return "Payment Successful";
    if (isCancelled) return "Payment Cancelled";
    if (isFailed) return "Payment Failed";
    return "Payment Pending";
  })();

  const statusMessage = (() => {
    if (isSuccess) return "Payment has been confirmed by the backend.";
    if (isCancelled) return "Customer cancelled this PayOS payment.";
    if (isFailed) return "PayOS payment failed. Please create a new checkout if needed.";
    if (isPending) return "Payment is being verified. This page will refresh automatically.";
    return "Payment result could not be verified.";
  })();

  const iconClass = isSuccess
    ? "bg-green-100 text-green-700"
    : isFailed || isCancelled
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      {/* 58mm Receipt for Printing */}
      {order && isSuccess && <Receipt order={order} />}

      <div className="mx-auto flex max-w-3xl flex-col gap-6 print:hidden">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 shadow-sm print:hidden">
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to POS</span>
          </Link>
          <button
            onClick={() => refreshPaymentResult(true)}
            disabled={checking || (!token && !fallbackOrderId)}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} className={checking ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6 border-b border-border pb-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Payment Result</p>
              <h1 className="mt-2 text-3xl font-bold">{heading}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{statusMessage}</p>
              {returnResult && (
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Order ID: {returnResult.orderId}</p>
                  <p>Payment ID: {returnResult.paymentId}</p>
                  <p>Reference: {returnResult.merchantReference}</p>
                </div>
              )}
              {!returnResult && order && <p className="mt-2 text-sm text-muted-foreground">Order ID: {order.id}</p>}
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconClass}`}>
              {isSuccess ? <CheckCircle2 size={30} /> : isFailed || isCancelled ? <XCircle size={30} /> : <AlertCircle size={30} />}
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {returnResult && (
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Payment Status</p>
                <p className="font-semibold">{returnResult.paymentStatus}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Status</p>
                <p className="font-semibold">{returnResult.orderStatus}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Final Amount</p>
                <p className="font-semibold">{formatVnd(finalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Return Token</p>
                <p className="break-all font-mono text-xs">{token}</p>
              </div>
            </div>
          )}

          {order && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <p className={`font-semibold ${isSuccess ? "text-green-600" : "text-amber-600"}`}>{order.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Membership</p>
                  <p className="font-semibold">{order.membershipLevel || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Member Discount</p>
                  <p className="font-semibold">
                    {typeof order.membershipDiscountRate === "number"
                      ? `${(order.membershipDiscountRate * 100).toFixed(1)}%`
                      : "N/A"}
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
                      <td className="py-3 text-right">{formatVnd(getOrderItemUnitPrice(item))}</td>
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
                  <span className="text-muted-foreground">Membership Discount</span>
                  <span className="font-medium">{formatVnd(order.membershipDiscountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Discount</span>
                  <span className="font-medium">{formatVnd(order.discountAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-lg font-bold text-primary">
                  <span>Final</span>
                  <span>{formatVnd(order.finalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              disabled={!isSuccess || !order}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={20} />
              Print Bill
            </button>
            <Link
              to={orderDetailId ? `/orders/${orderDetailId}` : "/pos"}
              className={`inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-3 font-bold transition-colors hover:bg-muted ${
                orderDetailId ? "" : "pointer-events-none opacity-50"
              }`}
            >
              View Order
            </Link>
            <Link
              to="/pos"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-3 font-bold transition-colors hover:bg-muted"
            >
              New Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
