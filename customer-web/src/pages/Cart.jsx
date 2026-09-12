import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { useCart } from "../context/CartContext";
import { api } from "../api/client";

function Cart() {
  const {
    items,
    subtotal,
    updateQuantity,
    cartError,
    clearCartError,
  } = useCart();

  const navigate = useNavigate();

  const [storeCashBalance, setStoreCashBalance] =
    useState(0);

  const [useStoreCash, setUseStoreCash] =
    useState(false);

  const [loadingStoreCash, setLoadingStoreCash] =
    useState(true);

  // ============================================================
  // LOAD STORE CASH
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadStoreCash() {
      try {
        const res = await api.get("/store-cash");

        if (!mounted) return;

        setStoreCashBalance(
          Number(res.data?.balance || 0)
        );
      } catch (err) {
        console.error(
          "Failed to load Store Cash:",
          err
        );

        if (mounted) {
          setStoreCashBalance(0);
        }
      } finally {
        if (mounted) {
          setLoadingStoreCash(false);
        }
      }
    }

    loadStoreCash();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // STORE CASH CALCULATION
  // ============================================================

  const storeCashToUse = useStoreCash
    ? Math.min(
        Number(storeCashBalance),
        Number(subtotal)
      )
    : 0;

  const remainingAfterStoreCash = Math.max(
    0,
    Number(subtotal) - storeCashToUse
  );

  // ============================================================
  // CHECKOUT
  // ============================================================

  function goToCheckout() {
    sessionStorage.setItem(
      "sheegraCashToUse",
      String(storeCashToUse)
    );

    navigate("/checkout", {
      state: {
        storeCashToUse,
      },
    });
  }

  // ============================================================
  // CART QUANTITY ERROR HANDLER
  // ============================================================

  function handleQuantityChange(
    productId,
    quantity
  ) {
    updateQuantity(productId, quantity).catch(
      () => {
        // CartContext already stores the customer-visible
        // error and refreshes the cart.
      }
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-cream">
      <NavBar />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ====================================================== */}
        {/* NAVIGATION */}
        {/* ====================================================== */}

        <div className="flex items-center justify-between mb-5">
          <button
  type="button"
  onClick={() => navigate("/")}
  className="text-sm font-medium text-leaf hover:opacity-70 transition"
>
  ← Back
</button>

          <Link
            to="/"
            className="text-sm font-medium text-leaf hover:opacity-70 transition"
          >
            Home
          </Link>
        </div>

        {/* ====================================================== */}
        {/* TITLE */}
        {/* ====================================================== */}

        <h1 className="font-display font-800 text-xl mb-4">
          Your cart
        </h1>

        {/* ====================================================== */}
        {/* CART ERROR */}
        {/* ====================================================== */}

        {cartError && (
          <div className="mb-4 rounded-xl2 border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Cart update failed
                </p>

                <p className="text-sm text-red-600 mt-0.5">
                  {cartError}
                </p>
              </div>

              <button
                type="button"
                onClick={clearCartError}
                className="text-red-500 text-lg leading-none"
                aria-label="Dismiss cart error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* EMPTY CART */}
        {/* ====================================================== */}

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink/40 mb-4">
              Your cart is empty.
            </p>

            <Link
              to="/"
              className="text-leaf font-semibold"
            >
              Browse products →
            </Link>
          </div>
        ) : (
          <>
            {/* ================================================== */}
            {/* CART ITEMS */}
            {/* ================================================== */}

            <div className="space-y-3 mb-6">
              {items.map((item) => {
                const stock = Number(
                  item.product?.stockQty ?? 0
                );

                const isOutOfStock = stock <= 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl2 border border-ink/10 p-3"
                  >
                    <div className="flex items-center gap-3">

                      {/* Product Image */}
                      <div className="w-14 h-14 rounded-xl bg-leaf-light grid place-items-center shrink-0 overflow-hidden">
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-xl">
                            🥬
                          </span>
                        )}
                      </div>

                      {/* Product Information */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.product?.name}
                        </div>

                        <div className="text-xs text-ink/50">
                          {item.product?.unit}
                        </div>

                        <div className="font-display font-800 text-sm mt-0.5">
                          ₹
                          {Number(
                            item.product?.sellingPrice || 0
                          ).toFixed(2)}
                        </div>

                        {isOutOfStock ? (
                          <div className="text-[11px] text-red-600 font-semibold mt-1">
                            Currently out of stock
                          </div>
                        ) : item.quantity >= stock ? (
                          <div className="text-[11px] text-orange-600 font-semibold mt-1">
                            Maximum available quantity
                          </div>
                        ) : null}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-leaf text-cream rounded-full px-2 py-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="w-6 h-6"
                          aria-label={`Decrease ${item.product?.name}`}
                        >
                          −
                        </button>

                        <span className="font-mono w-4 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            isOutOfStock ||
                            item.quantity >= stock
                          }
                          className={`w-6 h-6 ${
                            isOutOfStock ||
                            item.quantity >= stock
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                          aria-label={`Increase ${item.product?.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ================================================== */}
            {/* STORE CASH */}
            {/* ================================================== */}

            <div className="bg-white rounded-xl2 border border-ink/10 p-4 mb-4">
              <div className="flex items-center justify-between gap-4">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      💰
                    </span>

                    <h2 className="font-display font-800">
                      Store Cash
                    </h2>
                  </div>

                  {loadingStoreCash ? (
                    <p className="text-xs text-ink/40 mt-1">
                      Checking your Store Cash...
                    </p>
                  ) : (
                    <p className="text-xs text-ink/50 mt-1">
                      Available: ₹
                      {storeCashBalance.toFixed(2)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    loadingStoreCash ||
                    storeCashBalance <= 0
                  }
                  onClick={() =>
                    setUseStoreCash(
                      !useStoreCash
                    )
                  }
                  className={
                    "relative w-12 h-7 rounded-full transition " +
                    (
                      useStoreCash
                        ? "bg-leaf"
                        : "bg-ink/15"
                    )
                  }
                  aria-label="Use Store Cash"
                >
                  <span
                    className={
                      "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition " +
                      (
                        useStoreCash
                          ? "left-6"
                          : "left-1"
                      )
                    }
                  />
                </button>
              </div>

              {useStoreCash &&
                storeCashToUse > 0 && (
                  <div className="mt-4 pt-4 border-t border-ink/10 space-y-2">

                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">
                        Store Cash applied
                      </span>

                      <span className="font-semibold text-leaf">
                        -₹
                        {storeCashToUse.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">
                        Remaining
                      </span>

                      <span className="font-semibold">
                        ₹
                        {remainingAfterStoreCash.toFixed(
                          2
                        )}
                      </span>
                    </div>

                  </div>
                )}
            </div>

            {/* ================================================== */}
            {/* SUMMARY */}
            {/* ================================================== */}

            <div className="bg-white rounded-xl2 border border-ink/10 p-4 mb-4">

              <div className="flex justify-between text-sm mb-1">
                <span className="text-ink/60">
                  Subtotal
                </span>

                <span className="font-medium">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              {useStoreCash &&
                storeCashToUse > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink/60">
                      Store Cash
                    </span>

                    <span className="font-medium text-leaf">
                      -₹
                      {storeCashToUse.toFixed(2)}
                    </span>
                  </div>
                )}

              <div className="flex justify-between text-base font-semibold mt-3 pt-3 border-t border-ink/10">
                <span>
                  Payable before checkout fees
                </span>

                <span>
                  ₹
                  {remainingAfterStoreCash.toFixed(
                    2
                  )}
                </span>
              </div>

              <p className="text-xs text-ink/40 mt-2">
                Delivery fee and discounts are
                calculated at checkout.
              </p>
            </div>

            {/* ================================================== */}
            {/* CHECKOUT */}
            {/* ================================================== */}

            <button
              type="button"
              onClick={goToCheckout}
              className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold"
            >
              Continue to Checkout →
            </button>

            <Link
              to="/"
              className="block text-center text-sm text-leaf font-semibold mt-4"
            >
              Continue shopping
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;