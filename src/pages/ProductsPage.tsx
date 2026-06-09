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

  const handleSearchAndFilter = async () => {
    try {
      const params: productService.SortAndSearchParams = {
        searching: searchInput || null,
        category: selectedCategory || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        direction: sortDirection || null,
      };

      const response = await productService.sortAndSearchProduct(params);
      if (response.data?.result) {
        setProducts(response.data.result);
        toast.success("Đã lọc sản phẩm thành công");
      }
    } catch (error) {
      console.error("Error searching/filtering products:", error);
      toast.error("Không thể lọc sản phẩm");
    }
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
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="pt-24 px-6 max-w-7xl mx-auto">
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
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-gray-50 rounded-3xl p-8 cursor-pointer card-hover"
            >
              <div className="aspect-square rounded-2xl overflow-hidden">
                <ImageWithFallback
                  src={getProductImage(featuredProduct)}
                  alt={featuredProduct.productName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="inline-block mb-3 px-4 py-1 text-sm bg-black text-white rounded-full">
                  Featured Product
                </span>

                <h2 className="text-4xl font-bold mb-4">
                  {featuredProduct.productName}
                </h2>

                <p className="text-gray-600 mb-6">
                  {featuredProduct.description}
                </p>

                <p className="text-3xl font-semibold mb-8">
                  ${featuredProduct.price.toLocaleString()}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(featuredProduct.id);
                  }}
                  className="btn-base btn-hover btn-press px-8 py-4 rounded-xl bg-black text-white cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* FILTER SECTION */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Bộ Lọc & Tìm Kiếm
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showFilters ? "Ẩn" : "Hiện"}
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-4">
                    {/* Search Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tìm kiếm
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="Nhập tên sản phẩm..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Category Select */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Danh mục
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        >
                          <option value="">Tất cả danh mục</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Min Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giá tối thiểu
                        </label>
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Max Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giá tối đa
                        </label>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="999999"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Sort Direction */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sắp xếp theo giá
                        </label>
                        <select
                          value={sortDirection}
                          onChange={(e) => setSortDirection(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        >
                          <option value="">Mặc định</option>
                          <option value="asc">Tăng dần</option>
                          <option value="desc">Giảm dần</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSearchAndFilter}
                        className="flex-1 bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                      >
                        Áp dụng lọc
                      </button>
                      <button
                        onClick={handleResetFilters}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Đặt lại
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* PRODUCTS GRID */}
        <div
          ref={productsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="card-hover animate-slide-up cursor-pointer flex flex-col h-full"
            >
              <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden">
                <ImageWithFallback
                  src={getProductImage(product)}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 py-4">
                <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {product.barcode}
                </p>
                <p className="text-lg font-medium mt-1">
                  ${product.price.toLocaleString()}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product.id);
                }}
                className="btn-base btn-hover btn-press w-full py-3 rounded-xl bg-black text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCT POPUP */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-3xl max-w-3xl w-full mx-4 p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 hover:text-red-500"
              >
                <X />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                  <ImageWithFallback
                    src={getProductImage(selectedProduct)}
                    alt={selectedProduct.productName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedProduct.productName}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {selectedProduct.description}
                  </p>
                  <p className="text-2xl font-semibold mb-6">
                    ${selectedProduct.price.toLocaleString()}
                  </p>

                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                    className="btn-base btn-hover btn-press w-full py-4 bg-black text-white rounded-xl cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING CART BUTTON */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-20 right-6 z-40 bg-black text-white rounded-full p-4 shadow-lg cursor-pointer"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cart && cart.totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.totalItems}
            </span>
          )}
        </div>
      </motion.button>

      {/* CART SIDEBAR */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CART HEADER */}
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  Giỏ Hàng ({cart?.totalQuantity || 0})
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* CART ITEMS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart && cart.items && cart.items.length > 0 ? (
                  cart.items.map((item) => {
                    const product = getProductById(item.productId);
                    return (
                      <div key={item.productId} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                        {product && (
                          <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={getProductImage(product)}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {product?.productName || "Unknown Product"}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${item.price.toLocaleString()}
                          </p>

                          <div className="flex items-center gap-3 mt-2">
                            <button 
                              onClick={() => handleIncrementDecrement(item.productId, false)}
                              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            
                            {editingQuantity === item.productId ? (
                              <input
                                type="number"
                                value={tempQuantity}
                                onChange={(e) => setTempQuantity(e.target.value)}
                                onKeyDown={(e) => handleQuantityKeyDown(e, item.productId)}
                                onBlur={() => {
                                  const newQuantity = parseInt(tempQuantity);
                                  if (!isNaN(newQuantity) && newQuantity > 0) {
                                    handleSetQuantity(item.productId, newQuantity);
                                  }
                                  setEditingQuantity(null);
                                }}
                                autoFocus
                                className="w-12 text-center border rounded px-1 py-0.5"
                              />
                            ) : (
                              <span 
                                onDoubleClick={() => handleQuantityDoubleClick(item.productId, item.quantity)}
                                className="w-12 text-center font-medium cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
                                title="Double click để chỉnh sửa"
                              >
                                {item.quantity}
                              </span>
                            )}
                            
                            <button 
                              onClick={() => handleIncrementDecrement(item.productId, true)}
                              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <p className="text-sm font-semibold mt-2">
                            Subtotal: ${item.subtotal.toLocaleString()}
                          </p>
                        </div>

                        <button 
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Giỏ hàng trống</p>
                  </div>
                )}
              </div>

              {/* CART FOOTER */}
              {cart && cart.items && cart.items.length > 0 && (
                <div className="border-t p-6 space-y-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tổng số lượng:</span>
                      <span className="font-medium">{cart.totalQuantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tổng sản phẩm:</span>
                      <span className="font-medium">{cart.totalItems}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Tổng tiền:</span>
                      <span className="text-black">${cart.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="btn-base btn-hover btn-press w-full py-4 bg-black text-white rounded-xl font-semibold"
                  >
                    Checkout
                  </button>

                  <button 
                    onClick={handleClearCart}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                  >
                    Xóa Toàn Bộ Giỏ Hàng
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
