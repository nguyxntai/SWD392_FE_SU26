import { useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  LogOut,
  Search,
  Store,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/services/authService";


const ROLE = {
  ADMIN: "ADMIN",
  PUBLIC: "PUBLIC",
} as const;

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  const isLoggedIn = Boolean(token);
  const isAdmin = role === ROLE.ADMIN;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [keyword, setKeyword] = useState("");

  const handleLogout = async () => {
    try {
      await logout(); // POST /api/auth/logout
    } catch (err) {
      console.warn("Logout API failed", err);
    } finally {
      navigate("/");
    }
  };

  useEffect(() => {
    setShowSearch(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
        ? "text-primary"
        : "text-muted-foreground";
    }

    return location.pathname.startsWith(path)
      ? "text-primary"
      : "text-muted-foreground";
  };

  return (
    <>
      {/* HEADER */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full border-b bg-background"
      >
        <div className="container mx-auto h-16 px-4 flex items-center">
          {/* LEFT */}
          <div className="flex-1 flex items-center gap-6">
            {["/", "/products"].map((path) => {
              const isCurrent =
                path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(path);

              return (
                <motion.button
                  key={path}
                  onClick={() => navigate(path)}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`relative hover:text-primary ${isActive(path)}`}
                >
                  {path === "/" ? "Home" : "Products"}

                  {isCurrent && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </motion.button>
              );
            })}

            {isAdmin && (
              <motion.button
                onClick={() => navigate("/admin/products")}
                whileHover={{ y: -2 }}
                className={`relative hover:text-primary ${isActive("/admin")}`}
              >
                Admin

                {location.pathname.startsWith("/admin") && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </motion.button>
            )}
          </div>

          {/* CENTER – BRAND */}
          <motion.div
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 flex items-center gap-2 cursor-pointer select-none"
          >
            <Store className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-wide">
              Instastore
            </span>
          </motion.div>

          {/* RIGHT */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.15 }}
              onClick={() => setShowSearch((prev) => !prev)}
              className="hover:text-primary"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {isLoggedIn && role === ROLE.PUBLIC && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                onClick={() => navigate("/cart")}
                className="hover:text-primary"
              >
                <ShoppingCart className="w-5 h-5" />
              </motion.button>
            )}

            {!isLoggedIn ? (
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                >
                  <User className="w-5 h-5" />
                  Login
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/signup")}
                  className="px-4 py-2 text-sm font-medium rounded-md 
                             bg-primary text-primary-foreground
                             hover:bg-primary/90"
                >
                  Sign Up
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ y: -2 }}
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 hover:text-primary"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </motion.button>

            )}
          </div>
        </div>
      </motion.header>

      {/* SEARCH DROPDOWN */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 w-full z-40 bg-background border-b shadow-md"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <input
                  autoFocus
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 border rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && keyword.trim()) {
                      navigate(
                        `/products?search=${encodeURIComponent(keyword)}`
                      );
                      setShowSearch(false);
                    }
                  }}
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (!keyword.trim()) return;
                    navigate(
                      `/products?search=${encodeURIComponent(keyword)}`
                    );
                    setShowSearch(false);
                  }}
                  className="px-4 py-2 rounded-md 
                             bg-primary text-primary-foreground
                             hover:bg-primary/90"
                >
                  Search
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* LOGOUT CONFIRM MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-xl shadow-xl p-6 w-[320px]"
            >
              <h3 className="text-lg font-semibold mb-2">
                Confirm logout
              </h3>

              <p className="text-sm text-muted-foreground mb-6">
                Bạn có chắc chắn muốn đăng xuất không?
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                {/* CANCEL */}
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="
                    flex-1 px-4 py-2 text-sm rounded-md
                    border border-border
                    hover:bg-muted
                    transition
                  "
                >
                  Cancel
                </button>

                {/* LOGOUT */}
                <button
                  onClick={async () => {
                    setShowLogoutConfirm(false);
                    await handleLogout();
                  }}
                  className="
                    flex-1 px-4 py-2 text-sm rounded-md
                    border border-destructive text-destructive
                    hover:bg-destructive hover:text-destructive-foreground
                    transition
                  "
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
