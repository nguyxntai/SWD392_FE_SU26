import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Navigation } from "../components/Navigation";
import * as cartService from "../services/cartService";
import * as productService from "../services/productService";
import * as categoryService from "../services/categoryService";
import { Cart } from "../types/cart";
import { Category } from "../types/category";
import { Product } from "../types/products";
import { toast } from "sonner";

/* =======================
   HELPER FUNCTION
======================= */
const getProductImage = (product: Product): string => {
  if (product.imageUrl) {
    return product.imageUrl;
  }
  // Fallback to avatar if no images
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=500&background=random`;
};

/* =======================
   COMPONENT
======================= */
export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("search")?.toLowerCase() || "";

  const productsRef = useRef<HTMLDivElement | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>("");

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  /* =======================
     FETCH PRODUCTS
  ======================= */
  useEffect(() => {
    fetchProducts();
    fetchCart();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Không thể tải danh sách danh mục");
    }
  };

  const handleSearchAndFilter = () => {
    // Local filtering is already handled by filteredProducts variable
    setShowFilters(false);
    toast.success("Đã áp dụng bộ lọc");
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortDirection("");
    fetchProducts();
  };

  const fetchCart = async () => {
    try {
      const response = await cartService.getMyCart();
      if (response.data?.result) {
        setCart(response.data.result);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  /* =======================
     FEATURED PRODUCT
  ======================= */
  const featuredProduct = products.length > 0 
    ? products.reduce((max, p) => p.price > max.price ? p : max)
    : null;

  /* =======================
     CART LOGIC
  ======================= */
  const handleAddToCart = async (productId: string) => {
    try {
      const response = await cartService.addToCart({
        productId,
        quantity: 1,
      });
      
      if (response?.data?.result) {
        setCart(response.data.result);
        toast.success("Đã thêm sản phẩm vào giỏ hàng");
        setIsCartOpen(true);
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng");
    }
  };

  const handleIncrementDecrement = async (productId: string, increment: boolean) => {
    try {
      const currentItem = cart?.items.find(item => item.productId === productId);
      if (!currentItem) return;

      const newQuantity = increment ? currentItem.quantity + 1 : currentItem.quantity - 1;

      const response = await cartService.updateCartItem({
        productId,
        quantity: newQuantity,
      });
      
      if (response?.data?.result) {
        setCart(response.data.result);
      }
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật số lượng");
    }
  };

  const handleSetQuantity = async (productId: string, newQuantity: number) => {
    try {
      const currentItem = cart?.items.find(item => item.productId === productId);
      if (!currentItem) return;

      const delta = newQuantity;
      
      const response = await cartService.updateCartItem({
        productId,
        quantity: delta,
      });
      
      if (response.data?.result) {
        setCart(response.data.result);
        toast.success("Đã cập nhật số lượng");
      }
    } catch (error: any) {
      console.error("Error setting quantity:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật số lượng");
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const response = await cartService.deleteCartItem(productId);
      
      if (response?.data?.result) {
        setCart(response.data.result);
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      }
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast.error(error.response?.data?.message || "Không thể xóa sản phẩm");
    }
  };

  const handleClearCart = async () => {
    try {
      const response = await cartService.clearCart();
      
      if (response?.data?.result) {
        setCart(response.data.result);
        toast.success("Đã xóa toàn bộ giỏ hàng");
      }
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      toast.error(error.response?.data?.message || "Không thể xóa giỏ hàng");
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await cartService.checkout();
      
      if (response?.data) {
        toast.success("Checkout thành công!");
        setCart(null);
        setIsCartOpen(false);
        fetchCart();
      }
    } catch (error: any) {
      console.error("Error during checkout:", error);
      toast.error(error.response?.data?.message || "Checkout thất bại");
    }
  };

  const handleQuantityDoubleClick = (productId: string, currentQuantity: number) => {
    setEditingQuantity(productId);
    setTempQuantity(currentQuantity.toString());
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === "Enter") {
      const newQuantity = parseInt(tempQuantity);
      if (!isNaN(newQuantity) && newQuantity > 0) {
        handleSetQuantity(productId, newQuantity);
      }
      setEditingQuantity(null);
      setTempQuantity("");
    } else if (e.key === "Escape") {
      setEditingQuantity(null);
      setTempQuantity("");
    }
  };

  /* =======================
     FILTER
  ======================= */
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      p.barcode.includes(searchInput);
    const matchCategory =
      !selectedCategory || p.categoryId === selectedCategory;
    const matchPrice =
      (!minPrice || p.price >= Number(minPrice)) &&
      (!maxPrice || p.price <= Number(maxPrice));
    return matchSearch && matchCategory && matchPrice;
  });

  // Get product details by ID
  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 animate-fade-in">
        {/* HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Our Products</h1>
            <p className="text-muted-foreground">Quality items for your everyday needs</p>
          </div>

          <div className="flex gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border border-border transition-all ${
                showFilters ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
            >
              <SlidersHorizontal size={20} />
            </motion.button>
          </div>
        </div>

        {/* FILTERS */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-background rounded-2xl border border-border p-8 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">Min Price</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">Max Price</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSelectedCategory("");
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="w-full py-3 text-primary font-bold hover:underline transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEATURED PRODUCT */}
        {featuredProduct && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div
              onClick={() => {
                productsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });

                setTimeout(() => {
                  setSelectedProduct(featuredProduct);
                }, 400);
              }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-background border border-border rounded-[2.5rem] p-10 cursor-pointer shadow-xl shadow-primary/5 hover:shadow-2xl transition-all"
            >
              <div className="aspect-square rounded-3xl overflow-hidden border border-border">
                <ImageWithFallback
                  src={getProductImage(featuredProduct)}
                  alt={featuredProduct.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              <div>
                <span className="inline-block mb-4 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                  Featured Choice
                </span>

                <h2 className="text-5xl font-bold text-primary mb-4 leading-tight">
                  {featuredProduct.name}
                </h2>

                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Barcode: {featuredProduct.barcode}
                </p>

                <p className="text-4xl font-bold text-primary mb-10">
                  {featuredProduct.price.toLocaleString()} VND
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(featuredProduct.id);
                  }}
                  className="px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/10 hover:bg-primary/90 transition-all"
                >
                  Add to Shopping Bag
                </motion.button>
              </div>
            </div>
          </motion.section>
        )}

        {/* PRODUCT GRID */}
        <div
          ref={productsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              className="group bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <ImageWithFallback
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-background/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border border-border">
                    {product.categoryName}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-lg mb-1 text-primary group-hover:text-primary/80 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-xs mb-4 uppercase tracking-tighter">
                  {product.barcode}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-primary">
                    {product.price.toLocaleString()} VND
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product.id);
                    }}
                  >
                    <Plus size={20} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-40">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-6">
              <Search size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* PRODUCT DETAIL MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-background rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 p-2 bg-background/80 backdrop-blur-md rounded-full border border-border text-primary z-10 hover:scale-110 transition-transform"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 aspect-square">
                  <ImageWithFallback
                    src={getProductImage(selectedProduct)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-10 flex flex-col">
                  <div className="mb-auto">
                    <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/10">
                      {selectedProduct.categoryName}
                    </span>
                    <h2 className="text-4xl font-bold text-primary mt-4 mb-2 leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm mb-8">
                      {selectedProduct.barcode}
                    </p>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between py-4 border-y border-border">
                        <span className="text-muted-foreground">Price per unit</span>
                        <span className="text-3xl font-bold text-primary">
                          {selectedProduct.price.toLocaleString()} VND
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Stock Status</span>
                        <span className={`font-bold ${selectedProduct.quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} items available` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex gap-4">
                    <button
                      disabled={selectedProduct.quantity <= 0}
                      onClick={() => handleAddToCart(selectedProduct.id)}
                      className="flex-1 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      Add to Shopping Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING CART BUTTON */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-primary text-primary-foreground rounded-full p-5 shadow-2xl shadow-primary/40 cursor-pointer"
      >
        <div className="relative">
          <ShoppingCart className="w-7 h-7" />
          {cart && cart.totalItems > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center ring-2 ring-background"
            >
              {cart.totalItems}
            </motion.span>
          )}
        </div>
      </motion.button>

      {/* CART SIDEBAR */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100]">
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl flex flex-col border-l border-border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CART HEADER */}
              <div className="flex justify-between items-center p-8 border-b border-border bg-muted/10">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
                  <ShoppingCart size={24} />
                  My Cart
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              {/* CART ITEMS */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart && cart.items && cart.items.length > 0 ? (
                  cart.items.map((item) => {
                    const product = getProductById(item.productId);
                    return (
                      <div key={item.productId} className="flex gap-4 p-4 bg-muted/20 rounded-2xl border border-border group hover:border-primary/20 transition-all">
                        {product && (
                          <div className="w-24 h-24 bg-background rounded-xl overflow-hidden border border-border flex-shrink-0">
                            <ImageWithFallback
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <p className="font-bold text-primary truncate text-lg">
                              {product?.name || "Product"}
                            </p>
                            <p className="text-sm text-muted-foreground font-medium">
                              {item.price.toLocaleString()} VND
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-1">
                              <button 
                                onClick={() => handleIncrementDecrement(item.productId, false)}
                                className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors text-primary"
                              >
                                <Minus size={14} />
                              </button>
                              
                              <span className="w-8 text-center font-bold text-sm">
                                {item.quantity}
                              </span>
                              
                              <button 
                                onClick={() => handleIncrementDecrement(item.productId, true)}
                                className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors text-primary"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button 
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-10">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                      <ShoppingCart size={32} className="opacity-20" />
                    </div>
                    <p className="text-lg font-medium">Your cart is empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>

              {/* CART FOOTER */}
              {cart && cart.items && cart.items.length > 0 && (
                <div className="border-t border-border p-8 space-y-6 bg-muted/10">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total Items</span>
                      <span className="font-bold text-primary">{cart.totalQuantity}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold pt-4 border-t border-border">
                      <span className="text-primary">Total</span>
                      <span className="text-primary">{cart.totalAmount.toLocaleString()} VND</span>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                  >
                    Proceed to Checkout
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
