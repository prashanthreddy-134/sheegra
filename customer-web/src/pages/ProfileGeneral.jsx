import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfileGeneral() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12">

        {/* Back to Profile */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-medium text-leaf hover:opacity-70 transition mb-6"
        >
          <span className="text-lg">←</span>
          Back to Profile
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-800 text-2xl text-ink">
            General Information
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            Terms, privacy and other Sheegra information.
          </p>
        </div>

        {/* Information Links */}
        <div className="space-y-3">

          {/* Terms */}
          <button
            type="button"
            onClick={() => navigate("/terms")}
            className="group w-full bg-white border border-ink/10 rounded-[20px] px-4 py-4 flex items-center text-left hover:border-leaf/40 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-2xl bg-leaf-light grid place-items-center text-xl shrink-0">
              📄
            </div>

            <div className="ml-4 flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-ink">
                Terms & Conditions
              </h2>

              <p className="text-xs text-ink/45 mt-1">
                Read the terms that apply to using Sheegra.
              </p>
            </div>

            <span className="text-ink/30 text-xl ml-3 group-hover:text-leaf group-hover:translate-x-1 transition">
              →
            </span>
          </button>

          {/* Privacy */}
          <button
            type="button"
            onClick={() => navigate("/privacy")}
            className="group w-full bg-white border border-ink/10 rounded-[20px] px-4 py-4 flex items-center text-left hover:border-leaf/40 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-2xl bg-leaf-light grid place-items-center text-xl shrink-0">
              🔒
            </div>

            <div className="ml-4 flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-ink">
                Privacy Policy
              </h2>

              <p className="text-xs text-ink/45 mt-1">
                Learn how Sheegra handles your information.
              </p>
            </div>

            <span className="text-ink/30 text-xl ml-3 group-hover:text-leaf group-hover:translate-x-1 transition">
              →
            </span>
          </button>

          {/* Refund Policy */}
          <button
            type="button"
            onClick={() => navigate("/refund-policy")}
            className="group w-full bg-white border border-ink/10 rounded-[20px] px-4 py-4 flex items-center text-left hover:border-leaf/40 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-2xl bg-leaf-light grid place-items-center text-xl shrink-0">
              ↩️
            </div>

            <div className="ml-4 flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-ink">
                Refund Policy
              </h2>

              <p className="text-xs text-ink/45 mt-1">
                Learn about refunds and cancellations.
              </p>
            </div>

            <span className="text-ink/30 text-xl ml-3 group-hover:text-leaf group-hover:translate-x-1 transition">
              →
            </span>
          </button>

        </div>

        {/* App Information */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            Sheegra
          </h2>

          <div className="space-y-3 text-sm text-ink/60">

            <div className="flex justify-between gap-4">
              <span>App version</span>
              <span className="font-medium text-ink">
                1.0.0
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Delivery</span>
              <span className="font-medium text-ink">
                ~18 min
              </span>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}