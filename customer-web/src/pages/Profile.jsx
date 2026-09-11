import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";

const menuSections = [
  {
    title: "Quick access",
    items: [
      {
        title: "Your orders",
        subtitle: "Track and manage your orders",
        icon: "📦",
        path: "/orders",
      },
      {
        title: "Help & support",
        subtitle: "Get help with your Sheegra experience",
        icon: "💬",
        path: "/profile/help",
      },
      {
        title: "Your wishlist",
        subtitle: "Products you saved",
        icon: "♡",
        path: "/wishlist",
      },
    ],
  },

  {
    title: "Store Cash & Gift Cards",
    items: [
      {
        title: "Store Cash",
        subtitle: "Use your free cash to buy products",
        icon: "💰",
        path: "/profile/store-cash",
      },
      {
        title: "E-Gift Cards",
        subtitle: "Manage your gift cards",
        icon: "🎁",
        path: "/profile/gift-cards",
      },
    ],
  },

  {
    title: "Your information",
    items: [
      {
        title: "Review & Earn",
        subtitle: "Review products and earn rewards",
        icon: "⭐",
        path: "/profile/reviews",
      },
      {
        title: "Your refunds",
        subtitle: "Check your refund status",
        icon: "↩",
        path: "/profile/refunds",
      },
      {
        title: "Wishlist",
        subtitle: "View your saved products",
        icon: "❤️",
        path: "/wishlist",
      },
      {
        title: "E-Gift Card",
        subtitle: "Manage your gift cards",
        icon: "🎁",
        path: "/profile/gift-cards",
      },
      {
        title: "Help & Support",
        subtitle: "Get help with your orders and account",
        icon: "🆘",
        path: "/profile/help",
      },
      {
        title: "Saved Addresses",
        subtitle: "Manage your delivery addresses",
        icon: "📍",
        path: "/profile/addresses",
      },
      {
        title: "Profile Details",
        subtitle: "Edit your name and email",
        icon: "👤",
        path: "/profile/details",
      },
      {
        title: "Rewards",
        subtitle: "View your rewards and benefits",
        icon: "🏆",
        path: "/profile/rewards",
      },
      {
        title: "Payment Management",
        subtitle: "Manage your payment methods",
        icon: "💳",
        path: "/profile/payments",
      },
    ],
  },

  {
    title: "Other information",
    items: [
      {
        title: "Suggest Products",
        subtitle: "Tell us what products you want",
        icon: "💡",
        path: "/profile/suggest-products",
      },
      {
        title: "Notifications",
        subtitle: "Manage your notification preferences",
        icon: "🔔",
        path: "/profile/notifications",
      },
      {
        title: "General Information",
        subtitle: "Terms, privacy and other information",
        icon: "ℹ️",
        path: "/profile/general",
      },
    ],
  },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /*
   * Restore Profile position BEFORE the browser paints.
   * This prevents the visible "top → jump down" effect.
   */
  useLayoutEffect(() => {
    const savedPosition = sessionStorage.getItem(
      "profileScrollPosition"
    );

    if (savedPosition !== null) {
      window.scrollTo(0, Number(savedPosition));
    }
  }, []);

  function handleOptionClick(path) {
    /*
     * Save the exact position at the moment
     * the customer clicks the option.
     */
    sessionStorage.setItem(
      "profileScrollPosition",
      String(window.scrollY)
    );

    navigate(path);
  }

  function handleLogout() {
    sessionStorage.removeItem("profileScrollPosition");
    logout();
    navigate("/login");
  }

  function handleBackHome() {
    sessionStorage.removeItem("profileScrollPosition");
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12">

        {/* Back to Home */}
        <button
          onClick={handleBackHome}
          className="flex items-center gap-2 text-sm font-medium text-leaf hover:opacity-70 transition mb-6"
        >
          <span className="text-lg">←</span>
          Back to Home
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mb-7">
          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-full bg-leaf text-cream grid place-items-center font-display font-800 text-2xl shrink-0">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h1 className="font-display font-800 text-xl text-ink truncate">
                {user?.name || "Sheegra User"}
              </h1>

              <p className="text-sm text-ink/50 mt-1">
                {user?.phone || "Phone number unavailable"}
              </p>
            </div>

          </div>
        </div>

        {/* Profile Sections */}
        {menuSections.map((section) => (
          <section
            key={section.title}
            className="mb-7"
          >
            <h2 className="text-xs font-semibold tracking-wide text-ink/45 uppercase mb-3 px-1">
              {section.title}
            </h2>

            <div className="space-y-3">

              {section.items.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleOptionClick(item.path)}
                  className="group w-full bg-white border border-ink/10 rounded-[20px] px-4 py-4 flex items-center text-left hover:border-leaf/40 hover:shadow-sm transition-all"
                >

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-leaf-light grid place-items-center text-xl shrink-0 group-hover:scale-105 transition">
                    {item.icon}
                  </div>

                  {/* Text */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="font-semibold text-sm text-ink">
                      {item.title}
                    </div>

                    <div className="text-xs text-ink/45 mt-1 leading-5">
                      {item.subtitle}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-ink/25 text-xl ml-3 group-hover:text-leaf group-hover:translate-x-1 transition">
                    →
                  </div>

                </button>
              ))}

            </div>
          </section>
        ))}

        {/* Logout */}
        <div className="mt-2">
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-red-200 rounded-[20px] px-5 py-4 text-red-600 font-semibold text-sm hover:bg-red-50 transition"
          >
            Log out
          </button>
        </div>

        {/* App Version */}
        <div className="text-center mt-8">
          <p className="text-xs text-ink/35">
            Sheegra
          </p>

          <p className="text-[11px] text-ink/25 mt-1">
            App version 1.0.0
          </p>
        </div>

      </main>
    </div>
  );
}