import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ProductsPage } from "./pages/ProductsPage";
import Login from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import POSCheckout from "./pages/pos/POSCheckout";
import PaymentReturn from "./pages/payment/PaymentReturn";
import OrderDetail from "./pages/orders/OrderDetail";

import { AdminProductManagement } from "./pages/admin/AdminProductManagement";
import { AdminCategoryManagement } from "./pages/admin/AdminCategoryManagement";
import { ProtectedAdminRoute } from "./routes/ProtectedAdminRoute";
import { Toaster } from "./components/ui/sonner";
import { AppErrorBoundary } from "./components/AppErrorBoundary";



export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/pos" element={<POSCheckout />} />
          <Route path="/payment/success" element={<PaymentReturn />} />
          <Route path="/payment/cancel" element={<PaymentReturn />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />

          {/* ADMIN PROTECTED */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin/products" element={<AdminProductManagement />} />
            <Route path="/admin/categories" element={<AdminCategoryManagement />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
