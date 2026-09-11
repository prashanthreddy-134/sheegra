import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/orders", label: "Orders", icon: "🧾" },
  { to: "/products", label: "Products", icon: "🥦" },
  { to: "/categories", label: "Categories", icon: "📂" },
  { to: "/customers", label: "Customers", icon: "👥" },
  { to: "/coupons", label: "Coupons", icon: "🏷️" },
  { to: "/reports", label: "Reports", icon: "📈" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-60 bg-panel text-cream flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-leaf grid place-items-center font-display font-800">F</span>
          <span className="font-display font-800">Sheegra</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? "bg-leaf text-cream" : "text-cream/60 hover:bg-white/5 hover:text-cream"
                }`
              }
            >
              <span>{l.icon}</span>{l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-cream/50 mb-2">{user?.phone}</div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm text-cream/70 hover:text-cream"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  );
}
