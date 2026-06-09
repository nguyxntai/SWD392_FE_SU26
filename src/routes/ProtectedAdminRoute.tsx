import { Navigate, Outlet } from "react-router-dom";

const ROLE = {
  ADMIN: "ADMIN",
};

export function ProtectedAdminRoute() {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  if (!token || role !== ROLE.ADMIN) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
