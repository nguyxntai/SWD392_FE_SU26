import { useEffect, useState } from "react";
import { Boxes, Plus, Edit, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "../../components/Navigation";
import { useNavigate, useLocation } from "react-router-dom";
import { Category } from "@/types/category";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "@/services/categoryService";

export function AdminCategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Category["status"]>("ACTIVE");
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsFetching(true);
        const data = await getCategories();
        setCategories(data);
      } catch (error: any) {
        alert(error.message || "Failed to load categories");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setStatus(category.status || "ACTIVE");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setName("");
    setDescription("");
    setStatus("ACTIVE");
  };

  const handleSave = async () => {
    if (isSaving) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Category name is required");
      return;
    }

    const isDuplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === trimmedName.toLowerCase() &&
        category.id !== editingCategory?.id
    );

    if (isDuplicate) {
      alert("Category already exists");
      return;
    }

    try {
      setIsSaving(true);

      if (editingCategory) {
        const updated = await updateCategory(
          editingCategory.id,
          trimmedName,
          description,
          status
        );

        setCategories((prev) =>
          prev.map((category) => (category.id === updated.id ? updated : category))
        );
      } else {
        const newCategory = await createCategory(trimmedName, description, status);
        setCategories((prev) => [...prev, newCategory]);
      }

      closeModal();
    } catch (err: any) {
      alert(err.message || "Save category failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (err: any) {
      const statusCode = err?.response?.status;
      const apiMessage = err?.response?.data?.message;

      if (statusCode === 403) {
        alert("You do not have permission to delete this category.");
        return;
      }

      if (statusCode === 409) {
        alert("Cannot delete this category because it is being used.");
        return;
      }

      alert(apiMessage || err.message || "Delete category failed");
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Boxes className="w-8 h-8" />
              Category Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage product categories and category availability</p>
          </div>

          <div className="flex flex-col items-stretch md:items-end gap-3">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-border w-full md:w-auto">
              <button
                onClick={() => navigate("/admin/products")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === "/admin/products"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => navigate("/admin/categories")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === "/admin/categories"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => navigate("/admin/inventory")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === "/admin/inventory"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => navigate("/admin/reports")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === "/admin/reports"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Reports
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 transition-all md:w-fit"
            >
              <Plus size={20} />
              Add Category
            </motion.button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Category Info</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isFetching ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center text-muted-foreground italic">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center text-muted-foreground italic">
                      No categories found. Click "Add Category" to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary text-lg">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            category.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/10">
                <h2 className="text-2xl font-bold text-primary">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-primary uppercase tracking-wider">Category Name *</label>
                  <input
                    placeholder="e.g. Beverages"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-primary uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Optional description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-primary uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Category["status"])}
                    className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-4 border border-border text-primary font-bold rounded-xl hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
