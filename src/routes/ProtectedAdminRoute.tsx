import { Navigate, Outlet } from "react-router-dom";

const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
};

export function ProtectedAdminRoute() {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  if (!token || (role !== ROLE.ADMIN && role !== ROLE.MANAGER)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
