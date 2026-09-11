import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfileNotifications() {
  const navigate = useNavigate();

  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(true);
  const [general, setGeneral] = useState(true);

  function Toggle({ enabled, onChange }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition ${
          enabled ? "bg-leaf" : "bg-ink/20"
        }`}
        aria-label={enabled ? "Disable notification" : "Enable notification"}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    );
  }

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
            Notifications
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            Manage your notification preferences.
          </p>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5">

          <h2 className="font-display font-800 text-lg mb-4">
            Notification preferences
          </h2>

          <div className="divide-y divide-ink/10">

            {/* Order Updates */}
            <div className="py-4 first:pt-0">
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-leaf-light grid place-items-center text-xl shrink-0">
                  📦
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">
                    Order updates
                  </p>

                  <p className="text-xs text-ink/45 mt-1 leading-5">
                    Get updates about order confirmation, delivery and
                    completion.
                  </p>
                </div>

                <Toggle
                  enabled={orderUpdates}
                  onChange={setOrderUpdates}
                />

              </div>
            </div>

            {/* Offers */}
            <div className="py-4">
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-leaf-light grid place-items-center text-xl shrink-0">
                  🎁
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">
                    Offers & promotions
                  </p>

                  <p className="text-xs text-ink/45 mt-1 leading-5">
                    Receive information about offers, discounts and
                    promotions.
                  </p>
                </div>

                <Toggle
                  enabled={offers}
                  onChange={setOffers}
                />

              </div>
            </div>

            {/* General */}
            <div className="py-4 last:pb-0">
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-leaf-light grid place-items-center text-xl shrink-0">
                  🔔
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">
                    General notifications
                  </p>

                  <p className="text-xs text-ink/45 mt-1 leading-5">
                    Receive important information about your Sheegra
                    account.
                  </p>
                </div>

                <Toggle
                  enabled={general}
                  onChange={setGeneral}
                />

              </div>
            </div>

          </div>
        </div>

        {/* Information */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            About notifications
          </h2>

          <div className="space-y-4">

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center text-lg shrink-0">
                🔔
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Stay updated
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Notifications can help you stay informed about your orders
                  and Sheegra account.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center text-lg shrink-0">
                🔒
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Your preferences
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  You can change these notification choices whenever you want.
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}