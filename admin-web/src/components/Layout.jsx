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

  /* -------------------------------------------------
     Close mobile sidebar when screen becomes desktop
  -------------------------------------------------- */
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

  /* -------------------------------------------------
     Prevent background scrolling while mobile drawer
     is open
  -------------------------------------------------- */
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  function openSidebar() {
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function handleLogout() {
    closeSidebar();
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-cream">

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
          bg-panel
          text-cream
          flex
          items-center
          justify-between
          px-3
          shadow-md
        "
      >

        {/* Menu button */}
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open navigation menu"
          className="
            w-10
            h-10
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

        {/* Mobile brand */}
        <div className="flex items-center gap-2">

          <span
            className="
              w-8
              h-8
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

          <span className="font-display font-800 text-base">
            Sheegra
          </span>

        </div>

        {/* Right spacer keeps brand centered */}
        <div className="w-10" />

      </header>


      {/* =====================================================
          MOBILE BACKDROP
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

          bg-panel
          text-cream

          flex
          flex-col

          shadow-2xl

          transform
          transition-transform
          duration-300
          ease-out

          lg:translate-x-0
          lg:shadow-none

          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* =================================================
            SIDEBAR BRAND
        ================================================== */}
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

          <div className="flex items-center gap-2">

            <span
              className="
                w-8
                h-8
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

            <span className="font-display font-800 text-lg">
              Sheegra
            </span>

          </div>


          {/* Mobile close */}
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            className="
              lg:hidden
              w-9
              h-9
              rounded-lg
              bg-white/5
              hover:bg-white/10
              grid
              place-items-center
              text-lg
              transition-colors
            "
          >
            ✕
          </button>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================== */}
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

                transition-all
                duration-150

                ${
                  isActive
                    ? "bg-leaf text-cream shadow-sm"
                    : "text-cream/60 hover:bg-white/5 hover:text-cream"
                }
              `}
            >

              <span
                className="
                  w-6
                  min-w-6
                  text-center
                  text-base
                  shrink-0
                "
              >
                {link.icon}
              </span>

              <span className="truncate">
                {link.label}
              </span>

            </NavLink>
          ))}

        </nav>


        {/* =================================================
            USER + LOGOUT
        ================================================== */}
        <div
          className="
            shrink-0
            p-4
            border-t
            border-white/10
          "
        >

          <div
            className="
              text-xs
              text-cream/50
              mb-3
              truncate
            "
          >
            {user?.phone || "Admin"}
          </div>


          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full

              text-left

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
          MAIN APPLICATION AREA
      ====================================================== */}
      <div
        className="
          min-h-screen

          lg:ml-64
        "
      >

        <main
          className="
            min-h-screen

            pt-18
            px-3
            pb-4

            sm:px-5
            sm:pb-5

            lg:pt-6
            lg:px-6
            lg:pb-6

            min-w-0
            overflow-x-hidden
          "
        >
          {children}
        </main>

      </div>

    </div>
  );
}