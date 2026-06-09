import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { getProductByBarcode } from "@/services/productService";
import { checkout, initiatePayOS } from "@/services/checkoutService";
import { getOrderById } from "@/services/orderService";
import { Product } from "@/types/products";

type CartItem = {
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  subtotal: number;
};

export default function POSCheckout() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "EWALLET">("CASH");
  const [amountReceived, setAmountReceived] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [payOSLink, setPayOSLink] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalAmount = totalAmount - discountAmount;
  const changeAmount = amountReceived > finalAmount ? amountReceived - finalAmount : 0;

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode);
      addToCart(product);
      setBarcode("");
    } catch (error) {
      toast.error("Product not found");
      setBarcode("");
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error("Out of stock");
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity: 1,
          availableQuantity: product.quantity,
          subtotal: product.price,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          if (newQty > item.availableQuantity) {
            toast.error("Out of stock");
            return item;
          }
          return { ...item, quantity: newQty, subtotal: newQty * item.price };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);
    const payload = {
      customerPhone,
      paymentMethod,
      amountReceived,
      discountAmount,
      items: cart.map((item) => ({
        productId: item.productId,
        barcode: item.barcode,
        quantity: item.quantity,
      })),
    };

    try {
      if (paymentMethod === "CASH") {
        await checkout(payload);
        toast.success("Checkout successful");
        clearCart();
      } else {
        const response = await initiatePayOS(payload);
        setPayOSLink(response.paymentLink);
        setCurrentOrderId(response.orderId);
        toast.info("Payment link generated");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!currentOrderId) return;
    try {
      const order = await getOrderById(currentOrderId);
      if (order.status === "PAID") {
        toast.success("Payment verified");
        clearCart();
        setPayOSLink(null);
        setCurrentOrderId(null);
      } else {
        toast.info("Payment still pending");
      }
    } catch (error) {
      toast.error("Failed to check status");
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerPhone("");
    setAmountReceived(0);
    setDiscountAmount(0);
    setPayOSLink(null);
    setCurrentOrderId(null);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center bg-background p-4 rounded-2xl shadow-sm border border-border">
        <h1 className="text-2xl font-bold">POS Checkout</h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <form onSubmit={handleBarcodeSubmit}>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan barcode..."
                className="pl-10 pr-4 py-2 border border-border bg-background rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </form>
          </div>
          <button onClick={clearCart} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1">
        {/* CART */}
        <div className="flex-[2] bg-background rounded-2xl shadow-sm overflow-hidden flex flex-col border border-border">
          <div className="p-4 border-b bg-muted/10 flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            <span className="font-semibold">Cart Items ({cart.length})</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b z-10">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Qty</th>
                  <th className="p-4 font-medium">Subtotal</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.barcode}</div>
                    </td>
                    <td className="p-4">{item.price.toLocaleString()} VND</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:bg-muted/10 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:bg-muted/10 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-4 font-bold">{item.subtotal.toLocaleString()} VND</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground italic">
                      No items in cart. Scan a product to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="flex-1 bg-background rounded-2xl shadow-sm p-6 flex flex-col gap-6 border border-border">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Payment Summary</h2>
            
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Customer Phone (Optional)</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0912..."
                className="w-full p-3 border border-border bg-background rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{totalAmount.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Discount</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-24 text-right p-1 border border-border rounded bg-background focus:border-primary outline-none"
                />
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-border text-primary">
                <span>Final Amount</span>
                <span>{finalAmount.toLocaleString()} VND</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-muted-foreground font-medium">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === "CASH" 
                      ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary" 
                      : "border-border hover:bg-muted/10 text-muted-foreground"
                  }`}
                >
                  <Banknote size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === "BANK_TRANSFER" 
                      ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary" 
                      : "border-border hover:bg-muted/10 text-muted-foreground"
                  }`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">Bank/E-Wallet</span>
                </button>
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div className="space-y-2 p-4 bg-muted/5 rounded-xl border border-border">
                <label className="text-sm text-muted-foreground font-medium">Amount Received</label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  className="w-full p-3 border border-border bg-background rounded-xl text-xl font-bold focus:border-primary outline-none transition-all"
                />
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Change</span>
                  <span className="font-bold text-green-600">{changeAmount.toLocaleString()} VND</span>
                </div>
              </div>
            )}

            {payOSLink && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <RefreshCw size={16} className="animate-spin" />
                  Waiting for payment...
                </div>
                <div className="space-y-2">
                  <a
                    href={payOSLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
                  >
                    Open Payment Link
                  </a>
                  <button
                    onClick={checkPaymentStatus}
                    className="w-full flex items-center justify-center gap-2 py-2 text-primary font-medium hover:underline transition-all"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0 || (paymentMethod === "CASH" && amountReceived < finalAmount)}
            className="w-full mt-auto py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/10"
          >
            {loading ? "Processing..." : "CHECKOUT"}
          </button>
        </div>
      </div>
    </div>
  );
}
