import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfileGiftCards() {
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
            E-Gift Cards
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            Manage your Sheegra gift cards
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-6 text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-leaf-light grid place-items-center text-3xl mb-4">
            🎁
          </div>

          <h2 className="font-display font-800 text-lg text-ink">
            No gift cards yet
          </h2>

          <p className="text-sm text-ink/45 mt-2 max-w-sm mx-auto">
            Your purchased or received Sheegra gift cards will appear
            here.
          </p>

        </div>

        {/* Information */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            About E-Gift Cards
          </h2>

          <div className="space-y-4">

            {/* Give a gift */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🎁
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Give a gift
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Gift cards can be used to give someone credit for shopping
                  on Sheegra.
                </p>
              </div>
            </div>

            {/* Checkout */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🛒
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Use at checkout
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Eligible gift card balances can be applied toward your
                  purchases.
                </p>
              </div>
            </div>

            {/* Security */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🔒
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Secure balance
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Your gift card balance and transactions will be associated
                  with your account.
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}