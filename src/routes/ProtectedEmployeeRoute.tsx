import { Navigate, Outlet } from "react-router-dom";

const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
};

export function ProtectedEmployeeRoute() {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  if (!token || (role !== ROLE.ADMIN && role !== ROLE.MANAGER && role !== ROLE.CASHIER)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
