import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfileRewards() {
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
            Rewards
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            View your rewards and available benefits.
          </p>
        </div>

        {/* Rewards balance */}
        <div className="bg-leaf text-cream rounded-[24px] p-6">
          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-sm opacity-80">
                Available rewards
              </p>

              <p className="font-display font-800 text-3xl mt-2">
                0
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-white/15 grid place-items-center text-3xl">
              🏆
            </div>

          </div>

          <p className="text-xs opacity-75 mt-4">
            Your eligible rewards and benefits will appear here.
          </p>
        </div>

        {/* Rewards information */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            About Rewards
          </h2>

          <div className="space-y-4">

            {/* Earn */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                ⭐
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Earn rewards
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Eligible activities and purchases may qualify for rewards
                  according to Sheegra's reward rules.
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🎁
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Get benefits
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Available rewards can provide eligible benefits.
                </p>
              </div>
            </div>

            {/* Track */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                📊
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Track your rewards
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Your reward activity and available benefits can be shown
                  here when the rewards system is enabled.
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}