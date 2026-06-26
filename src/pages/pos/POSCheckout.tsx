import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, RefreshCw, X, ArrowLeft, CornerDownLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { getProductByBarcode } from "@/services/productService";
import { checkout, initiatePayOS } from "@/services/checkoutService";
import { getOrderById } from "@/services/orderService";
import { getApiErrorMessage } from "@/services/apiError";
import { createCustomer, getCustomerByPhone } from "@/services/customerService";
import { CustomerByPhone } from "@/types/customer";
import { Product } from "@/types/products";
import { formatVnd } from "@/utils/format";
import BarcodeScanner from "@/components/pos/BarcodeScanner";

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
  const [customer, setCustomer] = useState<CustomerByPhone | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerLookupAttempted, setCustomerLookupAttempted] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "EWALLET">("CASH");
  const [amountReceived, setAmountReceived] = useState(0);
  const [loading, setLoading] = useState(false);
  const [payOSLink, setPayOSLink] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [searchBarcode, setSearchBarcode] = useState("");
  const [searchedProduct, setSearchProduct] = useState<Product | null>(null);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [isScanningToCart, setIsScanningToCart] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const membershipDiscountRate = customer?.membershipDiscountRate ?? customer?.discountRate ?? 0;
  const membershipDiscountPreview = totalAmount * membershipDiscountRate;
  const estimatedFinalAmount = Math.max(0, totalAmount - membershipDiscountPreview);
  const changeAmount = amountReceived > estimatedFinalAmount ? amountReceived - estimatedFinalAmount : 0;

  const handleScannerDetected = (scannedBarcode: string) => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.value = scannedBarcode;
    }
    setBarcode(scannedBarcode);
    scanBarcodeToCart();
  };

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

  const lookupCustomer = async () => {
    const phone = customerPhone.trim();
    if (!phone || isLoadingCustomer) return;

    setIsLoadingCustomer(true);
    try {
      const result = await getCustomerByPhone(phone);
      setCustomer(result);
      setCustomerLookupAttempted(true);
      toast.success("Customer loaded");
    } catch (error) {
      setCustomer(null);
      setCustomerLookupAttempted(true);
      toast.error(getApiErrorMessage(error, "Customer not found"));
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const openCreateCustomer = () => {
    setNewCustomer({
      fullName: "",
      phone: customerPhone.trim(),
      email: "",
    });
    setIsCreateCustomerOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = newCustomer.fullName.trim();
    const phone = newCustomer.phone.trim();
    const email = newCustomer.email.trim();

    if (!fullName || !phone || isCreatingCustomer) return;

    setIsCreatingCustomer(true);
    try {
      const createdCustomer = await createCustomer({
        fullName,
        phone,
        ...(email ? { email } : {}),
      });
      setCustomer(createdCustomer);
      setCustomerPhone(createdCustomer.phone);
      setCustomerLookupAttempted(true);
      setIsCreateCustomerOpen(false);
      toast.success("Customer created");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Create customer failed"));
    } finally {
      setIsCreatingCustomer(false);
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
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      amountReceived,
      items: cart.map((item) => ({
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
    setCustomer(null);
    setCustomerLookupAttempted(false);
    setIsCreateCustomerOpen(false);
    setAmountReceived(0);
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
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                title="Open Camera Scanner"
              >
                <Camera size={18} />
              </button>
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    setCustomer(null);
                    setCustomerLookupAttempted(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      lookupCustomer();
                    }
                  }}
                  placeholder="0912..."
                  className="min-w-0 flex-1 p-3 border border-border bg-background rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={lookupCustomer}
                  disabled={!customerPhone.trim() || isLoadingCustomer}
                  className="px-4 rounded-xl border border-border font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingCustomer ? "..." : "Lookup"}
                </button>
              </div>
              {customer && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-semibold text-right">{customer.fullName || customer.name || "Member"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Points</span>
                    <span className="font-semibold">{customer.totalPoints ?? customer.points ?? 0}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Membership</span>
                    <span className="font-semibold">{customer.membershipLevel || "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Discount Rate</span>
                    <span className="font-semibold">
                      {((customer.membershipDiscountRate ?? customer.discountRate ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              {!customer && customerLookupAttempted && customerPhone.trim() && (
                <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm space-y-3">
                  <div>
                    <p className="font-semibold text-amber-700">Customer not found</p>
                    <p className="text-muted-foreground">Create a loyalty customer for this phone number.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateCustomer}
                    className="w-full rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Create Loyalty Customer
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{formatVnd(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Member Discount Preview</span>
                <span className="font-medium">-{formatVnd(membershipDiscountPreview)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-border text-primary">
                <span>Estimated Final</span>
                <span>{formatVnd(estimatedFinalAmount)}</span>
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

      {isCreateCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <form
            onSubmit={handleCreateCustomer}
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Create Loyalty Customer</h2>
                <p className="text-sm text-muted-foreground">Customer profile for POS membership points.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCustomerOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={newCustomer.fullName}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <input
                type="text"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email Optional</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreateCustomerOpen(false)}
                className="flex-1 rounded-xl border border-border px-4 py-3 font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCustomer.fullName.trim() || !newCustomer.phone.trim() || isCreatingCustomer}
                className="flex-1 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingCustomer ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScannerDetected}
      />
    </div>
  );
}
