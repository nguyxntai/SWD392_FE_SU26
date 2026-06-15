import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, RefreshCw, X, ArrowLeft, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { getProductByBarcode } from "@/services/productService";
import { checkout, initiatePayOS } from "@/services/checkoutService";
import { getOrderById } from "@/services/orderService";
import { getApiErrorMessage } from "@/services/apiError";
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

const PAYOS_PENDING_ORDER_KEY = "posPendingPayOSOrderId";

export default function POSCheckout() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "EWALLET">("CASH");
  const [amountReceived, setAmountReceived] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [payOSLink, setPayOSLink] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [searchBarcode, setSearchBarcode] = useState("");
  const [searchedProduct, setSearchProduct] = useState<Product | null>(null);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [isScanningToCart, setIsScanningToCart] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalAmount = totalAmount - discountAmount;
  const changeAmount = amountReceived > finalAmount ? amountReceived - finalAmount : 0;

  const scanBarcodeToCart = async () => {
    const scannedBarcode = barcodeInputRef.current?.value.trim() || barcode.trim();
    if (!scannedBarcode || isScanningToCart) return;

    setIsScanningToCart(true);
    try {
      const product = await getProductByBarcode(scannedBarcode);
      addToCart(product);
      setBarcode("");
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Product not found"));
      setBarcode("");
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = "";
      }
    } finally {
      setIsScanningToCart(false);
      barcodeInputRef.current?.focus();
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await scanBarcodeToCart();
  };

  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    await scanBarcodeToCart();
  };

  const handleSearchProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcodeToSearch = searchBarcode.trim();
    if (!barcodeToSearch || isSearchingProduct) return;

    setIsSearchingProduct(true);
    try {
      const product = await getProductByBarcode(barcodeToSearch);
      setSearchProduct(product);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Product not found"));
      setSearchProduct(null);
    } finally {
      setIsSearchingProduct(false);
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
        const response = await checkout(payload);
        toast.success("Checkout successful");
        clearCart();
        // Navigate to order detail with auto-print
        if (response.order?.id) {
          navigate(`/orders/${response.order.id}?print=true`);
        }
      } else {
        const response = await initiatePayOS(payload);
        setPayOSLink(response.paymentLink);
        setCurrentOrderId(response.orderId);
        localStorage.setItem(PAYOS_PENDING_ORDER_KEY, response.orderId);
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
        localStorage.removeItem(PAYOS_PENDING_ORDER_KEY);
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

  const handlePaymentMethodChange = (method: "CASH" | "BANK_TRANSFER" | "EWALLET") => {
    setPaymentMethod(method);
    // Reset PayOS state if switching back to Cash or choosing a different method
    if (method === "CASH") {
      setPayOSLink(null);
      setCurrentOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center bg-background p-4 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/products")}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-primary"
            title="Back to Shop"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">POS Checkout</h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <form onSubmit={handleSearchProduct} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={searchBarcode}
                  onChange={(e) => setSearchBarcode(e.target.value)}
                  placeholder="Search by barcode..."
                  className="pl-10 pr-4 py-2 border border-border bg-background rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingProduct || !searchBarcode.trim()}
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                title="Search barcode"
              >
                <CornerDownLeft size={18} />
              </button>
            </form>
          </div>
          <div className="relative">
            <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Scan to cart..."
                  className="pl-10 pr-4 py-2 border border-border bg-background rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isScanningToCart}
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                title="Add scanned barcode to cart"
              >
                <CornerDownLeft size={18} />
              </button>
            </form>
          </div>
          <button onClick={clearCart} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {searchedProduct && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-muted/20 rounded-xl overflow-hidden">
              <img 
                src={searchedProduct.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(searchedProduct.name)}&size=200`} 
                alt={searchedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">{searchedProduct.name}</h3>
              <p className="text-muted-foreground font-mono">{searchedProduct.barcode}</p>
              <div className="flex gap-4 mt-1">
                <span className="text-sm font-semibold">Price: {searchedProduct.price.toLocaleString()} VND</span>
                <span className={`text-sm font-semibold ${searchedProduct.quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  Stock: {searchedProduct.quantity}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                addToCart(searchedProduct);
                setSearchProduct(null);
                setSearchBarcode("");
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
            >
              Add to Cart
            </button>
            <button 
              onClick={() => {
                setSearchProduct(null);
                setSearchBarcode("");
              }}
              className="px-6 py-3 border border-border rounded-xl font-bold hover:bg-muted transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
                        <Trash2 size={18} />
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
                  onClick={() => handlePaymentMethodChange("CASH")}
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
                  onClick={() => handlePaymentMethodChange("BANK_TRANSFER")}
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

            {payOSLink && paymentMethod !== "CASH" && (
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
            disabled={loading || cart.length === 0}
            className="w-full mt-auto py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/10"
          >
            {loading ? "Processing..." : "CHECKOUT"}
          </button>
        </div>
      </div>
    </div>
  );
}
