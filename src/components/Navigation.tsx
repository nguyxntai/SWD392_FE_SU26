import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ShoppingCart,
  User,
  LogOut,
  Search,
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
      navigate("/login");
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

  const handleLogoClick = () => {
    if (!isLoggedIn) return "/login";
    if (role === "ADMIN" || role === "MANAGER") return "/admin/products";
    if (role === "CASHIER") return "/pos";
    return "/products";
  };

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link to={handleLogoClick()} className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform">
            <span className="text-xl font-black">S</span>
          </div>
          <span className="text-2xl font-black tracking-tighter text-primary">STUURDY</span>
        </Link>

        {/* LINKS */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { name: "Shop", path: "/products", roles: ["ANY"] },
            { name: "POS", path: "/pos", roles: ["ADMIN", "MANAGER", "CASHIER"] },
            { name: "Admin", path: "/admin/products", roles: ["ADMIN", "MANAGER"] },
          ]
            .filter((link) => {
              if (!link.roles || link.roles.includes("ANY")) return true;
              return role && link.roles.includes(role);
            })
            .map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${isActive(
                  link.path
                )}`}
              >
                {link.name}
              </Link>
            ))}
        </div>

        {/* AUTH */}
        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="text-sm font-bold uppercase tracking-widest px-6 py-2 hover:bg-muted rounded-xl transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-sm font-bold uppercase tracking-widest px-6 py-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest px-6 py-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>

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
