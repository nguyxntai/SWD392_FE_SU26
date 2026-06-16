import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import {
  Edit,
  Trash2,
  Plus,
  X,
  Upload,
  DollarSign,
  Boxes,
  Search,
  Filter,
  Barcode,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Navigation } from '../../components/Navigation';
import * as productService from '../../services/productService';
import * as categoryService from '../../services/categoryService';
import { Category } from '../../types/category';
import { Product } from '../../types/products';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const getProductImage = (product: Product): string => {
  if (product.imageUrl) {
    return product.imageUrl;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=500&background=random`;
};

export function AdminProductManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'All' | 'Active' | 'Inactive'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: 0,
    costPrice: 0,
    unit: '',
    categoryId: '',
    imageUrl: '',
    initialQuantity: 0,
    minStockLevel: 0,
    active: true,
  });

  /* =====================
     FETCH DATA
  ====================== */
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

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

  const handleSearch = async () => {
    // Current backend doesn't have search endpoint in spec, 
    // but I'll filter locally or wait for API update.
    // For now, let's keep it simple or implement search if possible.
    fetchProducts();
  };

  /* =====================
     FILTER LOGIC
  ====================== */
  const filteredProducts = products.filter((product) => {
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && product.status === 'ACTIVE') ||
      (statusFilter === 'Inactive' && product.status === 'INACTIVE');

    const matchCategory =
      categoryFilter === 'All' ||
      product.categoryId === categoryFilter;

    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        product.barcode.includes(searchTerm);

    return matchStatus && matchCategory && matchSearch;
  });

  /* =====================
     MODAL HANDLERS
  ====================== */
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '',
      price: 0,
      costPrice: 0,
      unit: '',
      categoryId: '',
      imageUrl: '',
      initialQuantity: 0,
      minStockLevel: 0,
      active: true,
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      costPrice: product.costPrice,
      unit: product.unit,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      initialQuantity: product.quantity, // Use current quantity as initial for edit
      minStockLevel: product.minStockLevel,
      active: product.status === 'ACTIVE',
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  /* =====================
     SAVE PRODUCT
  ====================== */
  const handleSave = async () => {
    if (!formData.name || !formData.categoryId || !formData.barcode) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (editingProduct) {
        // UPDATE PRODUCT
        const updateData = {
          categoryId: formData.categoryId,
          name: formData.name,
          barcode: formData.barcode,
          price: formData.price,
          costPrice: formData.costPrice,
          unit: formData.unit,
          imageUrl: formData.imageUrl,
          active: formData.active,
          minStockLevel: formData.minStockLevel,
        };

        await productService.updateProduct(editingProduct.id, updateData);
        toast.success('Product updated successfully');
      } else {
        // CREATE PRODUCT
        const createData = {
          categoryId: formData.categoryId,
          name: formData.name,
          barcode: formData.barcode,
          price: formData.price,
          costPrice: formData.costPrice,
          unit: formData.unit,
          imageUrl: formData.imageUrl,
          initialQuantity: formData.initialQuantity,
          minStockLevel: formData.minStockLevel,
        };
        await productService.createProduct(createData);
        toast.success('Product created successfully');
      }

      fetchProducts();
      closeFormModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Could not save product');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await productService.deleteProduct(product.id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'Could not delete product');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Navigation />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 pt-24"
      >
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Boxes className="w-8 h-8" />
              Product Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage products, pricing, inventory details, and availability</p>
          </div>

          <div className="flex gap-4">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-border w-full md:w-auto">
              <button
                onClick={() => navigate('/admin/products')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === '/admin/products'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => navigate('/admin/categories')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === '/admin/categories'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => navigate('/admin/inventory')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === '/admin/inventory'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Inventory
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/10 transition-all"
            >
              <Plus size={20} />
              Add New Product
            </motion.button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name or barcode..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-muted/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <select
                className="bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <select
              className="bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Price</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">Stock</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted/20">
                          <ImageWithFallback
                            src={getProductImage(p)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-bold text-primary">{p.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{p.barcode}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-muted rounded text-xs font-medium">{p.categoryName}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary">
                      {p.price.toLocaleString()} VND
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium">{p.quantity}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Unit: {p.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        p.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground italic">
                      No products found. Try adjusting your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* FORM MODAL */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeFormModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/10">
                <h2 className="text-2xl font-bold text-primary">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={closeFormModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Barcode *</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Scan or enter barcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Can, Bottle, Pack..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Sale Price (VND) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Cost Price (VND)</label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  {!editingProduct && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-primary uppercase tracking-wider">Initial Quantity</label>
                      <input
                        type="number"
                        value={formData.initialQuantity}
                        onChange={(e) => setFormData({ ...formData, initialQuantity: Number(e.target.value) })}
                        className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Min Stock Level</label>
                    <input
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Image URL</label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.png"
                      className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {editingProduct && (
                  <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-xl border border-border">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                    <label htmlFor="active" className="text-sm font-bold text-primary uppercase tracking-wider cursor-pointer select-none">
                      Active Product
                    </label>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-border bg-muted/10 flex gap-4">
                <button
                  onClick={closeFormModal}
                  className="flex-1 py-4 border border-border text-primary font-bold rounded-xl hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
