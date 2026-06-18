import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Navigation } from "../components/Navigation";
import * as productService from "../services/productService";
import * as categoryService from "../services/categoryService";
import { Category } from "../types/category";
import { Product } from "../types/products";
import { toast } from "sonner";

const getProductImage = (product: Product): string => {
  if (product.imageUrl) {
    return product.imageUrl;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=500&background=random`;
};

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const initialKeyword = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    setSearchInput(initialKeyword);
  }, [initialKeyword]);

  const fetchProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Could not load products");
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Could not load categories");
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      product.barcode.includes(searchInput);
    const matchCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchPrice =
      (!minPrice || product.price >= Number(minPrice)) &&
      (!maxPrice || product.price <= Number(maxPrice));

    return matchSearch && matchCategory && matchPrice;
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Products</h1>
            <p className="text-muted-foreground">Browse product information, stock status, and prices</p>
          </div>

          <div className="flex gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
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
                showFilters ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
              title="Toggle filters"
            >
              <SlidersHorizontal size={20} />
            </motion.button>
          </div>
        </div>

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
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
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
                    onClick={resetFilters}
                    className="w-full py-3 text-primary font-bold hover:underline transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <motion.button
              key={product.id}
              layout
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              className="group bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all text-left"
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
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      product.quantity > 0
                        ? "bg-green-100/95 text-green-700 border-green-200"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {product.quantity > 0 ? "In stock" : "Out of stock"}
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
                <div className="flex items-end justify-between gap-4">
                  <span className="text-xl font-bold text-primary">
                    {product.price.toLocaleString()} VND
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Stock: {product.quantity}
                  </span>
                </div>
              </div>
            </motion.button>
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
                  <div>
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
                        <span className={`font-bold ${selectedProduct.quantity > 0 ? "text-green-600" : "text-destructive"}`}>
                          {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} items available` : "Out of stock"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Unit</span>
                        <span className="font-bold text-primary">{selectedProduct.unit || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-bold text-primary">{selectedProduct.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
