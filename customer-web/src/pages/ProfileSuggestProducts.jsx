import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function ProfileSuggestProducts() {
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    if (!productName.trim()) {
      alert("Please enter a product name.");
      return;
    }

    /*
     * No product-suggestion backend endpoint exists yet.
     * This currently confirms the UI submission only.
     */
    setSubmitted(true);
    setProductName("");
    setDetails("");
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
            Suggest Products
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            Tell us what products you would like to see on Sheegra.
          </p>
        </div>

        {/* Success */}
        {submitted && (
          <div className="mb-5 rounded-[20px] border border-leaf/20 bg-leaf-light px-4 py-4">
            <p className="font-semibold text-sm text-leaf">
              Thanks for your suggestion! ✓
            </p>

            <p className="text-xs text-ink/50 mt-1">
              Your suggestion has been recorded for this session.
            </p>
          </div>
        )}

        {/* Suggestion Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[24px] border border-ink/10 p-5"
        >

          <h2 className="font-display font-800 text-lg mb-4">
            What should we add?
          </h2>

          {/* Product name */}
          <div className="mb-4">
            <label className="text-xs text-ink/50">
              Product name
            </label>

            <input
              value={productName}
              onChange={(e) =>
                setProductName(e.target.value)
              }
              placeholder="Example: Organic paneer"
              className="w-full mt-1 border border-ink/15 rounded-xl px-3 py-3 text-sm outline-none focus:border-leaf"
            />
          </div>

          {/* Details */}
          <div className="mb-5">
            <label className="text-xs text-ink/50">
              More details
            </label>

            <textarea
              value={details}
              onChange={(e) =>
                setDetails(e.target.value)
              }
              rows={5}
              placeholder="Tell us anything useful about the product..."
              className="w-full mt-1 border border-ink/15 rounded-xl px-3 py-3 text-sm outline-none focus:border-leaf resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold text-sm"
          >
            Send suggestion
          </button>

        </form>

        {/* Information */}
        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            Why suggest a product?
          </h2>

          <div className="space-y-4">

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                💡
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Tell us what you need
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Help us understand which products customers want to find
                  on Sheegra.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🛒
              </div>

              <div>
                <p className="font-semibold text-sm text-ink">
                  Improve the store
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Customer suggestions can help guide future product
                  additions.
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}