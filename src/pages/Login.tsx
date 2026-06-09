import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Navigation } from "../components/Navigation";
import { login } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);

    try {
      await login({
        username,
        password,
      });

      // clear guest data if any
      localStorage.removeItem("guest_cart");

      navigate("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* PAGE ANIMATION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="pt-11 min-h-screen flex items-center justify-center px-6 py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl p-10 shadow-lg border border-gray-100">
            {/* TITLE */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl mb-3 font-semibold">Admin Login</h1>
            </motion.div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="
                    w-full px-4 py-3 rounded-xl border border-border
                    focus:border-primary focus:outline-none
                    focus:ring-2 focus:ring-primary/20
                    transition-all
                  "
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="
                      w-full px-4 py-3 rounded-xl border border-border
                      focus:border-primary focus:outline-none
                      focus:ring-2 focus:ring-primary/20
                      transition-all pr-12
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="
                      absolute right-4 top-1/2 -translate-y-1/2
                      text-gray-400 hover:text-primary transition
                    "
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* ERROR MESSAGE */}
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              {/* SUBMIT */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="
                  w-full px-8 py-4 bg-primary text-primary-foreground
                  rounded-xl font-semibold text-lg
                  hover:bg-primary/90 transition-all
                  disabled:opacity-60 disabled:cursor-not-allowed
                  shadow-lg shadow-primary/10
                "
              >
                {loading ? "Signing in..." : "Sign In"}
              </motion.button>

              {/* FOOTER */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-center mt-6"
              >
                <p className="text-muted-foreground text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-primary font-semibold hover:underline"
                    onClick={() => navigate("/signup")}
                  >
                    Sign up
                  </button>
                </p>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
