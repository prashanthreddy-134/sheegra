import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function NavBar({ search, onSearch }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-xl2 bg-leaf grid place-items-center">
            <span className="text-cream font-display font-800 text-lg">
              F
            </span>
          </span>

          <div className="leading-tight">
            <div className="font-display font-800 text-lg text-ink">
              Sheegra
            </div>

            <div className="text-[11px] font-mono text-leaf -mt-0.5">
              delivery in ~18 min
            </div>
          </div>
        </Link>

        {/* Search */}
        {onSearch && (
          <div className="flex-1 max-w-xl">
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search for atta, rice, dal, milk..."
              className="w-full rounded-full border border-ink/15 bg-white px-4 py-2 text-sm focus:border-leaf outline-none"
            />
          </div>
        )}

        {/* Right side */}
        <nav className="ml-auto flex items-center gap-3 text-sm font-medium shrink-0">

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex items-center gap-2 px-3 py-2 rounded-full border border-ink/10 bg-white hover:border-leaf hover:text-leaf transition"
          >
            <span className="text-lg leading-none">
              🛒
            </span>

            <span className="hidden sm:inline">
              Cart
            </span>

            {count > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-leaf text-cream grid place-items-center text-[10px] font-bold">
                {count}
              </span>
            )}
          </Link>

          {/* Profile */}
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-ink/10 bg-white hover:border-leaf hover:text-leaf transition"
            >
              <span className="w-7 h-7 rounded-full bg-leaf text-cream grid place-items-center text-xs font-bold">
                {(user.name || "U").charAt(0).toUpperCase()}
              </span>

              <span className="hidden sm:inline">
                Profile
              </span>

              <span className="text-ink/40 text-xs">
                →
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-leaf font-semibold"
            >
              Login
            </Link>
          )}

        </nav>
      </div>
    </header>
  );
}