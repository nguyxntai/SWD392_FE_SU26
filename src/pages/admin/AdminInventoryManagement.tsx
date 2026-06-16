import { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  History,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  Barcode as BarcodeIcon,
  Plus,
  X,
} from 'lucide-react';
import { Navigation } from '../../components/Navigation';
import * as inventoryService from '../../services/inventoryService';
import { InventoryItem, InventoryTransaction, Supplier } from '../../services/inventoryService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateTime } from '../../utils/format';
import { useLocation, useNavigate } from 'react-router-dom';

export function AdminInventoryManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [importForm, setImportForm] = useState({
    quantity: 1,
    unitCost: 0,
    supplierId: '',
    note: '',
  });
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (activeTab === 'current') {
      fetchInventory();
    } else {
      fetchTransactions();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getInventory();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Could not load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const data = await inventoryService.getSuppliers();
      setSuppliers(data.filter((supplier) => supplier.active !== false));
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Could not load suppliers");
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getInventoryTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Could not load inventory transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.includes(searchTerm)
  );

  const filteredTransactions = transactions.filter(tx => 
    tx.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.barcode?.includes(searchTerm)
  );

  const openImportModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setImportForm({
      quantity: 1,
      unitCost: 0,
      supplierId: suppliers[0]?.id || '',
      note: '',
    });
    setSupplierForm({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
    setIsImportModalOpen(true);
    if (suppliers.length === 0) {
      fetchSuppliers();
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setSelectedItem(null);
  };

  const handleImportStock = async () => {
    if (!selectedItem) return;

    if (importForm.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (importForm.unitCost < 0) {
      toast.error('Unit cost cannot be negative');
      return;
    }

    if (!importForm.supplierId && !supplierForm.name.trim()) {
      toast.error('Please select a supplier or create a new one');
      return;
    }

    if (
      !importForm.supplierId &&
      (!supplierForm.phone.trim() || !supplierForm.email.trim() || !supplierForm.address.trim())
    ) {
      toast.error('Please fill all supplier fields');
      return;
    }

    setIsSubmittingImport(true);
    try {
      let supplierId = importForm.supplierId;

      if (!supplierId) {
        const newSupplier = await inventoryService.createSupplier({
          name: supplierForm.name.trim(),
          phone: supplierForm.phone.trim(),
          email: supplierForm.email.trim(),
          address: supplierForm.address.trim(),
          active: true,
        });

        supplierId = newSupplier.id;
        setSuppliers((prev) => [...prev, newSupplier]);
      }

      await inventoryService.createImportReceipt({
        supplierId,
        note: importForm.note.trim() || `Import stock for ${selectedItem.productName}`,
        items: [
          {
            barcode: selectedItem.barcode,
            quantity: importForm.quantity,
            unitCost: importForm.unitCost,
          },
        ],
      });

      toast.success('Stock imported successfully');
      closeImportModal();
      await fetchInventory();
      if (activeTab === 'history') {
        await fetchTransactions();
      }
    } catch (error: any) {
      console.error('Error importing stock:', error);
      toast.error(error.response?.data?.message || 'Could not import stock');
    } finally {
      setIsSubmittingImport(false);
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
              Inventory Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage inventory levels and stock movement history</p>
          </div>

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
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-border w-full md:w-fit mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'current' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Current Inventory
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <History className="w-4 h-4" />
            Transaction History
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-border mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-muted/20"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'current' ? (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Product</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Barcode</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Quantity</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Minimum Stock</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Boxes className="w-8 h-8 animate-bounce text-primary/40" />
                            <p className="text-muted-foreground">Loading inventory...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const isLowStock = item.quantity <= item.minStockLevel;
                        return (
                          <tr key={item.productId} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-primary">{item.productName}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
                                <BarcodeIcon className="w-4 h-4" />
                                {item.barcode}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-lg font-bold ${isLowStock ? 'text-destructive' : 'text-primary'}`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {item.minStockLevel}
                            </td>
                            <td className="px-6 py-4">
                              {isLowStock ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Low stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                                  In stock
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => openImportModal(item)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                              >
                                <Plus className="w-4 h-4" />
                                Import Stock
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Time</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Product</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Type</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Change</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Details</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          Loading history...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          No transaction history yet
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isImport = tx.type === 'IMPORT';
                        const isSale = tx.type === 'SALE';
                        
                        return (
                          <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {formatDateTime(tx.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-primary">
                              {tx.productName}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                isImport ? 'bg-blue-100 text-blue-700' : 
                                isSale ? 'bg-green-100 text-green-700' : 
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {isImport ? <ArrowDownLeft className="w-3.5 h-3.5" /> : 
                                 isSale ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${tx.quantityChange > 0 ? 'text-green-600' : 'text-destructive'}`}>
                                {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {tx.beforeQuantity} {'->'} {tx.afterQuantity}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-4 h-4" />
                                {tx.createdBy}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isImportModalOpen && selectedItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeImportModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/10 px-8 py-6">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Import Stock</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedItem.productName}</p>
                </div>
                <button onClick={closeImportModal} className="rounded-full p-2 transition-colors hover:bg-muted">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-8">
                <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Barcode</span>
                    <span className="font-mono font-semibold text-primary">{selectedItem.barcode}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Current stock</span>
                    <span className="font-bold text-primary">{selectedItem.quantity}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-primary">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      value={importForm.quantity}
                      onChange={(e) => setImportForm({ ...importForm, quantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-muted/30 p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-primary">Unit Cost</label>
                    <input
                      type="number"
                      min={0}
                      value={importForm.unitCost}
                      onChange={(e) => setImportForm({ ...importForm, unitCost: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-muted/30 p-3 font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-primary">Supplier</label>
                  <select
                    value={importForm.supplierId}
                    onChange={(e) => setImportForm({ ...importForm, supplierId: e.target.value })}
                    disabled={isLoadingSuppliers}
                    className="w-full rounded-xl border border-border bg-muted/30 p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {isLoadingSuppliers ? 'Loading suppliers...' : 'Create a new supplier below'}
                    </option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!importForm.supplierId && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="mb-4">
                      <p className="font-bold text-primary">New supplier</p>
                      <p className="text-sm text-muted-foreground">
                        A supplier is required before creating an import receipt.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-primary">Name *</label>
                        <input
                          type="text"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                          placeholder="ABC Supplier"
                          className="w-full rounded-xl border border-border bg-background p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-primary">Phone *</label>
                        <input
                          type="text"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                          placeholder="0900000009"
                          className="w-full rounded-xl border border-border bg-background p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-primary">Email *</label>
                        <input
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                          placeholder="supplier@example.com"
                          className="w-full rounded-xl border border-border bg-background p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-primary">Address *</label>
                        <input
                          type="text"
                          value={supplierForm.address}
                          onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                          placeholder="Ho Chi Minh"
                          className="w-full rounded-xl border border-border bg-background p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-primary">Note</label>
                  <textarea
                    value={importForm.note}
                    onChange={(e) => setImportForm({ ...importForm, note: e.target.value })}
                    rows={3}
                    placeholder="Import receipt note"
                    className="w-full resize-none rounded-xl border border-border bg-muted/30 p-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex gap-4 border-t border-border bg-muted/10 p-8">
                <button
                  onClick={closeImportModal}
                  disabled={isSubmittingImport}
                  className="flex-1 rounded-xl border border-border py-4 font-bold text-primary transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportStock}
                  disabled={isSubmittingImport}
                  className="flex-1 rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingImport ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
