import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { api } from "../api/client";

export default function ProfileStoreCash() {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD STORE CASH
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadStoreCash() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/store-cash");

        if (!mounted) return;

        setBalance(Number(res.data?.balance || 0));
        setTransactions(
          Array.isArray(res.data?.transactions)
            ? res.data.transactions
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load Store Cash:",
          err
        );

        if (!mounted) return;

        setBalance(0);
        setTransactions([]);

        setError(
          err.response?.data?.error ||
            "Could not load Store Cash."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStoreCash();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  function formatAmount(amount) {
    return `₹${Number(amount || 0).toFixed(2)}`;
  }

  function formatDate(date) {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTransactionLabel(type) {
    switch (type) {
      case "CREDIT":
        return "Store Cash credited";

      case "DEBIT":
        return "Store Cash used";

      case "REFUND":
        return "Store Cash refunded";

      case "ADJUSTMENT":
        return "Store Cash adjustment";

      default:
        return "Store Cash transaction";
    }
  }

  function isCreditTransaction(type) {
    return (
      type === "CREDIT" ||
      type === "REFUND" ||
      type === "ADJUSTMENT"
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-cream">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-medium text-leaf hover:opacity-70 transition mb-6"
        >
          <span className="text-lg">←</span>
          Back to Profile
        </button>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="font-display font-800 text-2xl text-ink">
            Store Cash
          </h1>

          <p className="text-sm text-ink/45 mt-1">
            View your Store Cash balance and transaction history.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* ====================================================== */}
        {/* BALANCE */}
        {/* ====================================================== */}

        <div className="bg-leaf text-cream rounded-[24px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm opacity-80">
                Available Store Cash
              </p>

              <p className="font-display font-800 text-3xl mt-2">
                {loading
                  ? "..."
                  : formatAmount(balance)}
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-white/15 grid place-items-center text-3xl">
              💰
            </div>
          </div>

          <p className="text-xs opacity-75 mt-4">
            Use your Store Cash during checkout to reduce
            the amount you pay.
          </p>
        </div>

        {/* ====================================================== */}
        {/* INFORMATION */}
        {/* ====================================================== */}

        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            About Store Cash
          </h2>

          <div className="space-y-4">

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                💳
              </div>

              <div>
                <p className="font-semibold text-sm">
                  Use at checkout
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Your available Store Cash can be applied
                  toward eligible purchases at checkout.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                ↩
              </div>

              <div>
                <p className="font-semibold text-sm">
                  Refunds
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Eligible Store Cash amounts may be returned
                  to your Store Cash balance when an order is
                  cancelled or refunded.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-leaf-light grid place-items-center shrink-0">
                🎁
              </div>

              <div>
                <p className="font-semibold text-sm">
                  Promotional cash
                </p>

                <p className="text-xs text-ink/45 mt-1 leading-5">
                  Sheegra may provide promotional Store Cash
                  to customers.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ====================================================== */}
        {/* TRANSACTION HISTORY */}
        {/* ====================================================== */}

        <div className="bg-white rounded-[24px] border border-ink/10 p-5 mt-5">

          <h2 className="font-display font-800 text-lg mb-4">
            Store Cash history
          </h2>

          {loading ? (
            <p className="text-sm text-ink/40 text-center py-8">
              Loading transactions...
            </p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-leaf-light grid place-items-center text-2xl mb-3">
                💰
              </div>

              <p className="text-sm text-ink/40">
                No Store Cash transactions yet.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {transactions.map((transaction) => {
                const credit =
                  isCreditTransaction(
                    transaction.type
                  );

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3 last:border-b-0 last:pb-0"
                  >

                    <div className="flex items-start gap-3 min-w-0">

                      <div
                        className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
                          credit
                            ? "bg-leaf-light"
                            : "bg-red-50"
                        }`}
                      >
                        {credit ? "+" : "−"}
                      </div>

                      <div className="min-w-0">

                        <p className="font-semibold text-sm text-ink truncate">
                          {transaction.description ||
                            getTransactionLabel(
                              transaction.type
                            )}
                        </p>

                        <p className="text-xs text-ink/40 mt-1">
                          {formatDate(
                            transaction.createdAt
                          )}
                        </p>

                        {transaction.reference && (
                          <p className="text-[11px] text-ink/30 mt-1 truncate">
                            Ref:{" "}
                            {transaction.reference}
                          </p>
                        )}

                      </div>

                    </div>

                    <div
                      className={`font-semibold text-sm shrink-0 ${
                        credit
                          ? "text-leaf"
                          : "text-red-500"
                      }`}
                    >
                      {credit ? "+" : "-"}
                      {formatAmount(
                        transaction.amount
                      )}
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}