import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfileHelp() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-medium text-leaf hover:opacity-70 transition mb-6"
        >
          <span className="text-lg">←</span>
          Back to Profile
        </button>

        <h1 className="font-display font-800 text-2xl text-ink">
          Help & Support
        </h1>

        <p className="text-sm text-ink/45 mt-1 mb-6">
          We're here to help with your Sheegra experience
        </p>

        <div className="space-y-3">
          <div className="bg-white rounded-[22px] border border-ink/10 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-leaf-light grid place-items-center text-xl">
              📦
            </div>

            <div>
              <h2 className="font-semibold text-sm">
                Order help
              </h2>

              <p className="text-xs text-ink/45 mt-1">
                Get help with an order or delivery.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[22px] border border-ink/10 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-leaf-light grid place-items-center text-xl">
              💳
            </div>

            <div>
              <h2 className="font-semibold text-sm">
                Payment help
              </h2>

              <p className="text-xs text-ink/45 mt-1">
                Get help with payment-related issues.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[22px] border border-ink/10 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-leaf-light grid place-items-center text-xl">
              💬
            </div>

            <div>
              <h2 className="font-semibold text-sm">
                Contact support
              </h2>

              <p className="text-xs text-ink/45 mt-1">
                Contact Sheegra support for assistance.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}