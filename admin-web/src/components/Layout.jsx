import { useEffect, useState } from "react";
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen && window.innerWidth < 1024 ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    closeSidebar();
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full bg-cream">

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}
      <header
        className="
          lg:hidden
          fixed
          top-0
          left-0
          right-0
          z-40
          h-14
          w-full
          bg-panel
          text-cream
          flex
          items-center
          justify-between
          px-3
          shadow-md
        "
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="
            w-10
            h-10
            shrink-0
            rounded-lg
            bg-leaf
            grid
            place-items-center
            text-lg
            active:scale-95
            transition-transform
          "
        >
          ☰
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span
            className="
              w-8
              h-8
              shrink-0
              rounded-lg
              bg-leaf
              grid
              place-items-center
              font-display
              font-800
              text-sm
            "
          >
            S
          </span>

          <span className="font-display font-800 text-base truncate">
            Sheegra
          </span>
        </div>

        <div className="w-10 shrink-0" />
      </header>


      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
          className="
            lg:hidden
            fixed
            inset-0
            z-40
            bg-black/50
            backdrop-blur-[1px]
          "
        />
      )}


      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50

          h-screen
          w-64
          max-w-[85vw]

          bg-panel
          text-cream

          flex
          flex-col

          shadow-2xl
          lg:shadow-none

          transform
          transition-transform
          duration-300
          ease-out

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        {/* Sidebar header */}
        <div
          className="
            h-14
            min-h-14
            px-5
            flex
            items-center
            justify-between
            border-b
            border-white/10
          "
        >
          <div className="flex items-center gap-2 min-w-0">

            <span
              className="
                w-8
                h-8
                shrink-0
                rounded-lg
                bg-leaf
                grid
                place-items-center
                font-display
                font-800
                text-sm
              "
            >
              S
            </span>

            <span className="font-display font-800 text-lg truncate">
              Sheegra
            </span>

          </div>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            className="
              lg:hidden
              w-9
              h-9
              shrink-0
              rounded-lg
              bg-white/5
              hover:bg-white/10
              grid
              place-items-center
              text-lg
            "
          >
            ✕
          </button>
        </div>


        {/* Navigation */}
        <nav
          className="
            flex-1
            min-h-0
            overflow-y-auto
            px-3
            py-4
            space-y-1
          "
        >
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={closeSidebar}
              className={({ isActive }) => `
                flex
                items-center
                gap-3
                w-full
                px-3
                py-3
                rounded-lg
                text-sm
                font-medium
                transition-colors

                ${
                  isActive
                    ? "bg-leaf text-cream shadow-sm"
                    : "text-cream/60 hover:bg-white/5 hover:text-cream"
                }
              `}
            >
              <span className="w-6 min-w-6 text-center text-base">
                {link.icon}
              </span>

              <span className="truncate">
                {link.label}
              </span>
            </NavLink>
          ))}
        </nav>


        {/* User */}
        <div className="shrink-0 p-4 border-t border-white/10">

          <div className="text-xs text-cream/50 mb-3 truncate">
            {user?.phone || "Admin"}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-2
              px-3
              py-2.5
              rounded-lg
              text-sm
              text-cream/70
              hover:text-cream
              hover:bg-white/5
              transition-colors
            "
          >
            <span>↪</span>
            <span>Logout</span>
          </button>

        </div>
      </aside>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div
        className="
          w-full
          min-h-screen
          lg:ml-64
          lg:w-[calc(100%-16rem)]
        "
      >
        <main
          className="
            w-full
            min-w-0
            min-h-screen

            pt-14
            px-3
            pb-4

            sm:px-5
            sm:pb-5

            lg:pt-6
            lg:px-6
            lg:pb-6
          "
        >
          {children}
        </main>
      </div>

    </div>
  );
}