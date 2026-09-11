import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfilePayments() {
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
            Payment Management
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            Manage how you pay for your Sheegra orders.
          </p>
        </div>

        {/* Current Payment Method */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5">

          <h2 className="font-display font-800 text-lg mb-4">
            Payment methods
          </h2>

          <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-leaf-light grid place-items-center text-xl shrink-0">
                💳
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink">
                  Razorpay
                </p>

                <p className="text-xs text-ink/45 mt-1">
                  Secure online payment at checkout
                </p>
              </div>

              <span className="text-[11px] bg-leaf-light text-leaf px-2 py-1 rounded-full shrink-0">
                Available
              </span>

            </div>

          </div>

          <p className="text-xs text-ink/40 mt-4 leading-5">
            Payment details are handled securely through the payment provider
            during checkout. Sheegra does not display or store your full
            card details here.
          </p>

        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            Payment information
          </h2>

          <div className="space-y-4">

            {/* Secure payments */}
            <div className="flex gap-3">

              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🔒
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Secure payments
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Online payments are processed through the secure payment
                  gateway used by Sheegra.
                </p>
              </div>

            </div>

            {/* Multiple methods */}
            <div className="flex gap-3">

              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                💰
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Multiple payment options
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Available payment options are shown to you during checkout.
                </p>
              </div>

            </div>

            {/* Store Cash */}
            <div className="flex gap-3">

              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🪙
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Store Cash
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Eligible Store Cash can be applied to reduce your payable
                  amount during checkout.
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Go to Checkout */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg">
            Ready to pay?
          </h2>

          <p className="text-sm text-ink/45 mt-1 mb-4">
            Add products to your cart and choose an available payment option
            during checkout.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold text-sm"
          >
            Continue Shopping
          </button>

        </div>

      </main>
    </div>
  );
}