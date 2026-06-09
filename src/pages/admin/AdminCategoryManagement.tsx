import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "../../components/Navigation";
import { useNavigate } from "react-router-dom";
import { Category } from "@/types/category";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "@/services/categoryService";

export function AdminCategoryManagement() {
  /* =====================
     STATE
  ====================== */
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  /* =====================
     GET ALL CATEGORIES
  ====================== */
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

  /* =====================
     MODAL HANDLERS
  ====================== */
  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setName("");
    setDescription("");
  };

  /* =====================
     CREATE / UPDATE
  ====================== */
  const handleSave = async () => {
    if (isSaving) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Category name is required");
      return;
    }

    // FE duplicate check
    const isDuplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== editingCategory?.id
    );

    if (isDuplicate) {
      alert("Category already exists");
      return;
    }

    try {
      setIsSaving(true);

      if (editingCategory) {
        // UPDATE
        const updated = await updateCategory(
          editingCategory.id,
          trimmedName,
          description
        );

        setCategories((prev) =>
          prev.map((c) =>
            c.id === updated.id ? updated : c
          )
        );
      } else {
        // CREATE
        const newCategory = await createCategory(trimmedName, description);
        setCategories((prev) => [...prev, newCategory]);
      }

      closeModal();
    } catch (err: any) {
      alert(err.message || "Save category failed");
    } finally {
      setIsSaving(false);
    }
  };

  /* =====================
    DELETE
  ===================== */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteCategory(id);

      // update UI sau khi delete thành công
      setCategories((prev) =>
        prev.filter((c) => c.id !== id)
      );
    } catch (err: any) {
      // Axios error
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message;

      if (status === 403) {
        alert("You do not have permission to delete this category.");
        return;
      }

      if (status === 409) {
        alert("Cannot delete this category because it is being used.");
        return;
      }

      alert(apiMessage || err.message || "Delete category failed");
    }
  };

  /* =====================
     RENDER
  ====================== */
  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Navigation />

      <div className="max-w-5xl mx-auto px-6 pt-10 animate-fade-in">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/admin/products")}
              className="flex items-center gap-2 px-6 py-3 border border-border bg-background text-primary font-bold rounded-xl hover:bg-muted transition-all"
            >
              <ArrowLeft size={18} />
              Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 transition-all"
            >
              <Plus size={20} />
              Add Category
            </motion.button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10 border-b border-border text-left text-muted-foreground">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Category Info</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching ? (
                <tr>
                  <td colSpan={2} className="px-6 py-20 text-center text-muted-foreground italic">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-20 text-center text-muted-foreground italic">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary text-lg">{c.name}</div>
                      {c.description && (
                        <div className="text-sm text-muted-foreground mt-1">{c.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
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

      {/* FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
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

/* =====================
   EMPTY STATE
====================== */
function determineEmptyState() {
  return (
    <tr>
      <td
        colSpan={2}
        className="px-6 py-12 text-center text-gray-500"
      >
        No categories found. Click “Add Category” to create one.
      </td>
    </tr>
  );
}
