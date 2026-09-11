import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfileReviews() {
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
            Review & Earn
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            Review your Sheegra purchases and earn rewards.
          </p>
        </div>

        {/* Empty state */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-6 text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-leaf-light grid place-items-center text-3xl mb-4">
            ⭐
          </div>

          <h2 className="font-display font-800 text-lg text-ink">
            No reviews yet
          </h2>

          <p className="text-sm text-ink/45 mt-2 max-w-sm mx-auto">
            Your eligible purchases will appear here when they are available
            for review.
          </p>

        </div>

        {/* Information */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            How Review & Earn works
          </h2>

          <div className="space-y-4">

            {/* Review products */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                ⭐
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Review your products
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Share your experience with products you have purchased from
                  Sheegra.
                </p>
              </div>
            </div>

            {/* Earn rewards */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🏆
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Earn rewards
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Eligible reviews may earn rewards according to Fresh
                  Store's reward rules.
                </p>
              </div>
            </div>

            {/* Eligible purchases */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                📦
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Eligible purchases
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Only eligible products and completed purchases can be
                  available for review.
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}