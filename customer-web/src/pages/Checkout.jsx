import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import NavBar from "../components/NavBar";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

// ============================================================
// RAZORPAY SCRIPT
// ============================================================

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

// ============================================================
// PAYMENT METHOD NORMALIZATION
// ============================================================

function normalizePaymentMethod(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

// ============================================================
// PAYMENT METHOD DISPLAY
// ============================================================

function getPaymentMethodLabel(method) {
  const normalized =
    normalizePaymentMethod(method);

  const labels = {
    ANY: "Any payment method",

    UPI: "UPI",

    CARD: "Card",

    DEBIT_CARD: "Debit Card",

    CREDIT_CARD: "Credit Card",

    VISA: "Visa Card",

    VISA_DEBIT: "Visa Debit Card",

    VISA_DEBIT_CARD: "Visa Debit Card",

    VISA_CREDIT: "Visa Credit Card",

    VISA_CREDIT_CARD: "Visa Credit Card",

    MASTERCARD: "Mastercard",

    MASTERCARD_DEBIT:
      "Mastercard Debit Card",

    MASTERCARD_DEBIT_CARD:
      "Mastercard Debit Card",

    RUPAY: "RuPay Card",

    RUPAY_DEBIT: "RuPay Debit Card",

    RUPAY_DEBIT_CARD:
      "RuPay Debit Card",

    AMEX: "American Express Card",

    AMERICAN_EXPRESS:
      "American Express Card",

    NETBANKING: "Netbanking",

    NET_BANKING: "Netbanking",
  };

  return (
    labels[normalized] ||
    String(method || "Any payment method")
  );
}

// ============================================================
// RAZORPAY DISPLAY CONFIG
// ============================================================

function getRazorpayConfig(paymentMethod) {
  const method =
    normalizePaymentMethod(
      paymentMethod
    );

  // ----------------------------------------------------------
  // UPI ONLY
  // ----------------------------------------------------------

  if (method === "UPI") {
    return {
      blocks: {
        sheegraPayment: {
          name: "UPI",

          instruments: [
            {
              method: "upi",
            },
          ],
        },
      },

      sequence: [
        "sheegraPayment",
      ],

      preferences: {
        show_default_blocks: false,
      },
    };
  }

  // ----------------------------------------------------------
  // CARD TYPES / CARD NETWORKS
  // ----------------------------------------------------------

  const cardMethods = [
    "CARD",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "VISA",
    "VISA_DEBIT",
    "VISA_DEBIT_CARD",
    "VISA_CREDIT",
    "VISA_CREDIT_CARD",
    "MASTERCARD",
    "MASTERCARD_DEBIT",
    "MASTERCARD_DEBIT_CARD",
    "RUPAY",
    "RUPAY_DEBIT",
    "RUPAY_DEBIT_CARD",
    "AMEX",
    "AMERICAN_EXPRESS",
  ];

  if (
    cardMethods.includes(method)
  ) {
    return {
      blocks: {
        sheegraPayment: {
          name: "Cards",

          instruments: [
            {
              method: "card",
            },
          ],
        },
      },

      sequence: [
        "sheegraPayment",
      ],

      preferences: {
        show_default_blocks: false,
      },
    };
  }

  // ----------------------------------------------------------
  // NETBANKING ONLY
  // ----------------------------------------------------------

  if (
    method === "NETBANKING" ||
    method === "NET_BANKING"
  ) {
    return {
      blocks: {
        sheegraPayment: {
          name: "Netbanking",

          instruments: [
            {
              method: "netbanking",
            },
          ],
        },
      },

      sequence: [
        "sheegraPayment",
      ],

      preferences: {
        show_default_blocks: false,
      },
    };
  }

  // ----------------------------------------------------------
  // ANY PAYMENT METHOD
  // ----------------------------------------------------------

  return {
    preferences: {
      show_default_blocks: true,
    },
  };
}

// ============================================================
// CHECKOUT
// ============================================================

export default function Checkout() {
  const {
    items,
    subtotal,
    refresh,
  } = useCart();

  const { user } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  // ==========================================================
  // ADDRESS STATE
  // ==========================================================

  const [addresses, setAddresses] =
    useState([]);

  const [selectedAddress, setSelectedAddress] =
    useState(null);

  const [showNewAddress, setShowNewAddress] =
    useState(false);

  const [newAddress, setNewAddress] =
    useState({
      label: "Home",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    });

  // ==========================================================
  // STORE CASH
  // ==========================================================

  const [storeCashBalance, setStoreCashBalance] =
    useState(0);

  const [loadingStoreCash, setLoadingStoreCash] =
    useState(true);

  // ==========================================================
  // COUPON
  // ==========================================================

  const [selectedCoupon, setSelectedCoupon] =
    useState(
      () =>
        location.state?.selectedCoupon ||
        null
    );

  const [couponLoading, setCouponLoading] =
    useState(false);

  // ==========================================================
  // GENERAL STATE
  // ==========================================================

  const [placing, setPlacing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================================
  // COUPON CODE
  // ==========================================================

  const couponCode =
    typeof selectedCoupon === "string"
      ? selectedCoupon
          .trim()
          .toUpperCase()
      : (
          selectedCoupon?.code ||
          selectedCoupon?.coupon?.code ||
          ""
        )
          .trim()
          .toUpperCase();

  const couponSelected =
    Boolean(couponCode);

  // ==========================================================
  // COUPON PAYMENT METHOD
  // ==========================================================

  const couponPaymentMethod =
    normalizePaymentMethod(
      selectedCoupon?.paymentMethod ||
        selectedCoupon?.coupon?.paymentMethod ||
        "ANY"
    );

  const couponPaymentLabel =
    getPaymentMethodLabel(
      couponPaymentMethod
    );

  const couponHasPaymentRestriction =
    couponPaymentMethod !== "ANY";

  // ==========================================================
  // STORE CASH REQUEST
  // ==========================================================

  const routerStoreCash =
    Math.max(
      0,
      Number(
        location.state
          ?.storeCashToUse || 0
      )
    );

  let savedStoreCash = 0;

  try {
    savedStoreCash =
      Math.max(
        0,
        Number(
          sessionStorage.getItem(
            "sheegraCashToUse"
          ) || 0
        )
      );
  } catch {
    savedStoreCash = 0;
  }

  const requestedStoreCash =
    routerStoreCash > 0
      ? routerStoreCash
      : savedStoreCash;

  // ==========================================================
  // COUPON PREVIEW CALCULATOR
  // ==========================================================

  function calculatePreviewCouponDiscount(
    coupon,
    amount
  ) {
    if (
      !coupon ||
      typeof coupon !== "object"
    ) {
      return 0;
    }

    const source =
      coupon.coupon &&
      typeof coupon.coupon === "object"
        ? {
            ...coupon.coupon,
            ...coupon,
          }
        : coupon;

    const value =
      Number(
        source.discountValue || 0
      );

    const type =
      String(
        source.discountType || ""
      ).toUpperCase();

    const minOrderValue =
      Number(
        source.minOrderValue || 0
      );

    const maxDiscount =
      Number(
        source.maxDiscount || 0
      );

    const orderValue =
      Number(amount || 0);

    if (
      value <= 0 ||
      orderValue <= 0
    ) {
      return 0;
    }

    if (
      minOrderValue > 0 &&
      orderValue < minOrderValue
    ) {
      return 0;
    }

    let discount = 0;

    if (type === "PERCENT") {
      discount =
        (orderValue * value) /
        100;
    } else {
      discount = value;
    }

    if (maxDiscount > 0) {
      discount = Math.min(
        discount,
        maxDiscount
      );
    }

    return Math.max(
      0,
      Math.min(
        discount,
        orderValue
      )
    );
  }

  // ==========================================================
  // COUPON DISCOUNT
  // ==========================================================

  const couponDiscount =
    couponSelected
      ? calculatePreviewCouponDiscount(
          selectedCoupon,
          subtotal
        )
      : 0;

  // ==========================================================
  // STORE CASH LIMIT
  // ==========================================================

  const maximumStoreCashAfterCoupon =
    Math.max(
      0,
      Number(subtotal) -
        couponDiscount
    );

  const storeCashToUse =
    Math.min(
      requestedStoreCash,
      Number(storeCashBalance),
      maximumStoreCashAfterCoupon
    );

  // ==========================================================
  // FINAL PAYABLE
  // ==========================================================

  const estimatedPayable =
    Math.max(
      0,
      Number(subtotal) -
        couponDiscount -
        storeCashToUse
    );

  // ==========================================================
  // RESOLVE INCOMING COUPON
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function resolveIncomingCoupon() {
      const incomingCoupon =
        location.state
          ?.selectedCoupon;

      if (!incomingCoupon) {
        return;
      }

      // ------------------------------------------------------
      // COMPLETE OBJECT
      // ------------------------------------------------------

      if (
        typeof incomingCoupon ===
          "object" &&
        incomingCoupon !== null
      ) {
        const nestedCoupon =
          incomingCoupon.coupon;

        const completeCoupon =
          nestedCoupon &&
          typeof nestedCoupon ===
            "object"
            ? {
                ...nestedCoupon,
                ...incomingCoupon,
              }
            : incomingCoupon;

        if (mounted) {
          setSelectedCoupon(
            completeCoupon
          );
        }

        return;
      }

      // ------------------------------------------------------
      // ONLY CODE
      // ------------------------------------------------------

      const code =
        String(
          incomingCoupon
        )
          .trim()
          .toUpperCase();

      if (!code) {
        return;
      }

      setCouponLoading(true);

      try {
        const res =
          await api.get(
            "/coupons"
          );

        const coupons =
          Array.isArray(res.data)
            ? res.data
            : [];

        const matchedCoupon =
          coupons.find(
            (coupon) =>
              String(
                coupon?.code || ""
              )
                .trim()
                .toUpperCase() ===
              code
          );

        if (!mounted) {
          return;
        }

        if (matchedCoupon) {
          setSelectedCoupon(
            matchedCoupon
          );
        } else {
          setSelectedCoupon({
            code,
          });

          setError(
            "This coupon is no longer available."
          );
        }
      } catch (err) {
        console.error(
          "Could not load selected coupon:",
          err
        );

        if (mounted) {
          setSelectedCoupon({
            code,
          });

          setError(
            err.response?.data
              ?.error ||
              "Could not load coupon details."
          );
        }
      } finally {
        if (mounted) {
          setCouponLoading(
            false
          );
        }
      }
    }

    resolveIncomingCoupon();

    return () => {
      mounted = false;
    };
  }, [
    location.state?.selectedCoupon,
  ]);

  // ==========================================================
  // SAVE STORE CASH
  // ==========================================================

  useEffect(() => {
    if (routerStoreCash > 0) {
      try {
        sessionStorage.setItem(
          "sheegraCashToUse",
          String(
            routerStoreCash
          )
        );
      } catch {
        // Ignore storage errors.
      }
    }
  }, [routerStoreCash]);

  // ==========================================================
  // LOAD ADDRESSES
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadAddresses() {
      try {
        const res =
          await api.get(
            "/addresses"
          );

        if (!mounted) {
          return;
        }

        const list =
          Array.isArray(res.data)
            ? res.data
            : [];

        setAddresses(list);

        const defaultAddress =
          list.find(
            (address) =>
              address.isDefault
          ) ||
          list[0];

        if (defaultAddress) {
          setSelectedAddress(
            defaultAddress.id
          );
        }
      } catch (err) {
        console.error(
          "Failed to load addresses:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data
              ?.error ||
              "Could not load your saved addresses."
          );
        }
      }
    }

    loadAddresses();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // LOAD STORE CASH
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadStoreCash() {
      try {
        const res =
          await api.get(
            "/store-cash"
          );

        if (!mounted) {
          return;
        }

        setStoreCashBalance(
          Number(
            res.data?.balance ||
              0
          )
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
          setLoadingStoreCash(
            false
          );
        }
      }
    }

    loadStoreCash();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // SAVE ADDRESS
  // ==========================================================

  async function saveAddress(e) {
    e.preventDefault();

    setError("");

    try {
      const res =
        await api.post(
          "/addresses",
          newAddress
        );

      setAddresses((prev) => [
        res.data,
        ...prev,
      ]);

      setSelectedAddress(
        res.data.id
      );

      setShowNewAddress(false);

      setNewAddress({
        label: "Home",
        line1: "",
        city: "",
        state: "",
        pincode: "",
      });
    } catch (err) {
      setError(
        err.response?.data
          ?.error ||
          "Could not save address."
      );
    }
  }

  // ==========================================================
  // REMOVE COUPON
  // ==========================================================

  function removeCoupon() {
    setSelectedCoupon(null);

    setError("");

    try {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    } catch {
      // Ignore history errors.
    }
  }

  // ==========================================================
  // PLACE ORDER
  // ==========================================================

  async function placeOrder() {
    setError("");

    // --------------------------------------------------------
    // ADDRESS
    // --------------------------------------------------------

    if (!selectedAddress) {
      setError(
        "Please select a delivery address."
      );
      return;
    }

    // --------------------------------------------------------
    // CART
    // --------------------------------------------------------

    if (items.length === 0) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    // --------------------------------------------------------
    // STORE CASH
    // --------------------------------------------------------

    if (loadingStoreCash) {
      setError(
        "Please wait while Store Cash is loading."
      );
      return;
    }

    // --------------------------------------------------------
    // COUPON
    // --------------------------------------------------------

    if (couponLoading) {
      setError(
        "Please wait while coupon details are loading."
      );
      return;
    }

    setPlacing(true);

    try {
      // ======================================================
      // CHECKOUT REQUEST
      // ======================================================

      const payload = {
        addressId:
          selectedAddress,

        ...(couponSelected &&
        couponCode
          ? {
              couponCode,
            }
          : {}),

        ...(storeCashToUse > 0
          ? {
              storeCashToUse,
            }
          : {}),
      };

      console.log(
        "============================================"
      );

      console.log(
        "Sheegra CHECKOUT REQUEST:"
      );

      console.log(payload);

      console.log(
        "FRONTEND COUPON:",
        selectedCoupon
      );

      console.log(
        "FRONTEND COUPON CODE:",
        couponCode
      );

      console.log(
        "FRONTEND COUPON DISCOUNT:",
        couponDiscount
      );

      console.log(
        "FRONTEND COUPON PAYMENT METHOD:",
        couponPaymentMethod
      );

      console.log(
        "FRONTEND ESTIMATED PAYABLE:",
        estimatedPayable
      );

      console.log(
        "============================================"
      );

      const res =
        await api.post(
          "/orders/checkout",
          payload
        );

      const {
        order,
        devPayment,
        razorpay,
      } = res.data;

      console.log(
        "Sheegra CHECKOUT RESPONSE:",
        {
          order,
          devPayment,
          razorpay,
        }
      );

      if (!order) {
        throw new Error(
          "Server did not return an order."
        );
      }

      // ======================================================
      // SERVER TOTAL
      // ======================================================

      const serverOrderTotal =
        Number(
          order.total || 0
        );

      console.log(
        "SERVER ORDER TOTAL:",
        serverOrderTotal
      );

      console.log(
        "SERVER ORDER DISCOUNT:",
        Number(
          order.discount || 0
        )
      );

      // ======================================================
      // SERVER COUPON PAYMENT METHOD
      // ======================================================

      const serverCouponPaymentMethod =
        normalizePaymentMethod(
          order?.coupon
            ?.paymentMethod ||
            order?.paymentMethod ||
            couponPaymentMethod ||
            "ANY"
        );

      const serverCouponPaymentLabel =
        getPaymentMethodLabel(
          serverCouponPaymentMethod
        );

      console.log(
        "SERVER COUPON PAYMENT METHOD:",
        serverCouponPaymentMethod
      );

      // ======================================================
      // DEVELOPMENT PAYMENT
      // ======================================================

      if (
        devPayment === true
      ) {
        try {
          await api.post(
            "/payments/dev-confirm",
            {
              orderId:
                order.id,
            }
          );

          try {
            sessionStorage.removeItem(
              "sheegraCashToUse"
            );
          } catch {
            // Ignore storage errors.
          }

          await refresh();

          navigate(
            `/orders/${order.id}`
          );

          return;
        } catch (err) {
          setError(
            err.response?.data
              ?.error ||
              "Could not confirm development payment."
          );

          setPlacing(false);

          return;
        }
      }

      // ======================================================
      // RAZORPAY VALIDATION
      // ======================================================

      if (!razorpay) {
        throw new Error(
          "Razorpay order was not created by the server."
        );
      }

      if (!razorpay.orderId) {
        throw new Error(
          "Razorpay order ID is missing."
        );
      }

      if (!razorpay.keyId) {
        throw new Error(
          "Razorpay Key ID is missing."
        );
      }

      if (
        razorpay.amount ===
          undefined ||
        razorpay.amount ===
          null
      ) {
        throw new Error(
          "Razorpay amount is missing."
        );
      }

      // ======================================================
      // RAZORPAY AMOUNT
      // ======================================================

      const razorpayAmount =
        Number(
          razorpay.amount
        );

      const razorpayAmountInRupees =
        razorpayAmount / 100;

      console.log(
        "RAZORPAY AMOUNT:",
        razorpayAmount,
        "paise"
      );

      console.log(
        "RAZORPAY AMOUNT:",
        razorpayAmountInRupees,
        "rupees"
      );

      // ======================================================
      // PAYMENT AMOUNT SAFETY CHECK
      // ======================================================

      const amountsMatch =
        Math.round(
          razorpayAmountInRupees *
            100
        ) ===
        Math.round(
          serverOrderTotal *
            100
        );

      if (!amountsMatch) {
        console.error(
          "PAYMENT AMOUNT MISMATCH:",
          {
            orderTotal:
              serverOrderTotal,

            razorpayAmountInRupees,

            razorpayAmount,
          }
        );

        setError(
          `Payment amount mismatch. Order total is ₹${serverOrderTotal.toFixed(
            2
          )}, but Razorpay received ₹${razorpayAmountInRupees.toFixed(
            2
          )}. Please try again.`
        );

        setPlacing(false);

        return;
      }

      // ======================================================
      // ZERO PAYMENT
      // ======================================================

      if (
        serverOrderTotal <= 0
      ) {
        setError(
          "This order has no amount to pay. Please contact support."
        );

        setPlacing(false);

        return;
      }

      // ======================================================
      // LOAD RAZORPAY
      // ======================================================

      const loaded =
        await loadRazorpayScript();

      if (!loaded) {
        setError(
          "Could not load Razorpay. Check your internet connection and try again."
        );

        setPlacing(false);

        return;
      }

      if (!window.Razorpay) {
        setError(
          "Razorpay SDK is unavailable."
        );

        setPlacing(false);

        return;
      }

      // ======================================================
      // RAZORPAY PAYMENT CONFIG
      // ======================================================

      const razorpayConfig =
        getRazorpayConfig(
          serverCouponPaymentMethod
        );

      console.log(
        "RAZORPAY PAYMENT RESTRICTION:",
        serverCouponPaymentMethod
      );

      console.log(
        "RAZORPAY PAYMENT LABEL:",
        serverCouponPaymentLabel
      );

      // ======================================================
      // RAZORPAY OPTIONS
      // ======================================================

      const razorpayOptions = {
        key:
          razorpay.keyId,

        amount:
          razorpayAmount,

        currency:
          razorpay.currency ||
          "INR",

        order_id:
          razorpay.orderId,

        name:
          "Sheegra",

        description:
          `Order ${order.orderNumber}`,

        prefill: {
          name:
            user?.name || "",

          contact:
            user?.phone || "",

          email:
            user?.email || "",
        },

        notes: {
          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          couponCode:
            couponCode || "",

          couponDiscount:
            String(
              Number(
                order.discount ||
                  0
              )
            ),

          couponPaymentMethod:
            serverCouponPaymentMethod,
        },

        theme: {
          color:
            "#1B7A43",
        },

        config: {
          display:
            razorpayConfig,
        },

        handler:
          async (response) => {
            try {
              console.log(
                "RAZORPAY PAYMENT RESPONSE:",
                response
              );

              if (
                !response?.razorpay_order_id ||
                !response?.razorpay_payment_id ||
                !response?.razorpay_signature
              ) {
                throw new Error(
                  "Razorpay returned an incomplete payment response."
                );
              }

              // ------------------------------------------------
              // BACKEND IS FINAL AUTHORITY
              // ------------------------------------------------

              await api.post(
                "/payments/verify",
                {
                  razorpayOrderId:
                    response.razorpay_order_id,

                  razorpayPaymentId:
                    response.razorpay_payment_id,

                  razorpaySignature:
                    response.razorpay_signature,
                }
              );

              try {
                sessionStorage.removeItem(
                  "sheegraCashToUse"
                );
              } catch {
                // Ignore storage errors.
              }

              await refresh();

              navigate(
                `/orders/${order.id}`
              );
            } catch (err) {
              console.error(
                "Payment verification failed:",
                err
              );

              setError(
                err.response?.data
                  ?.error ||
                  "Payment succeeded but verification failed. Contact support with your order number."
              );

              setPlacing(false);
            }
          },

        modal: {
          ondismiss:
            () => {
              console.log(
                "Razorpay payment window closed."
              );

              setPlacing(false);
            },
        },
      };

      // ======================================================
      // OPEN RAZORPAY
      // ======================================================

      console.log(
        "OPENING RAZORPAY WITH:",
        {
          amount:
            razorpayOptions.amount,

          currency:
            razorpayOptions.currency,

          order_id:
            razorpayOptions.order_id,

          coupon:
            couponCode,

          paymentMethod:
            serverCouponPaymentMethod,
        }
      );

      const rzp =
        new window.Razorpay(
          razorpayOptions
        );

      rzp.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setError(
            response?.error
              ?.description ||
              "Payment failed. Please try again."
          );

          setPlacing(false);
        }
      );

      rzp.open();
    } catch (err) {
      console.error(
        "Checkout failed:",
        err
      );

      setError(
        err.response?.data
          ?.error ||
          err.message ||
          "Could not place order."
      );

      setPlacing(false);
    }
  }
  // ============================================================
// EMPTY CART
// ============================================================

if (items.length === 0) {
  return (
    <div className="min-h-screen bg-cream">
      <NavBar />

      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-ink/50 mb-4">
          Your cart is empty.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-leaf font-semibold"
        >
          Browse products →
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CHECKOUT UI
// ============================================================

return (
  <div className="min-h-screen bg-cream">
    <NavBar />

    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="text-sm font-semibold text-leaf hover:underline"
        >
          ← Back to Cart
        </button>

        <h1 className="font-display font-800 text-xl">
          Checkout
        </h1>

        <div className="w-20" />
      </div>

      {/* ================================================== */}
      {/* ADDRESS */}
      {/* ================================================== */}

      <h2 className="font-semibold text-sm text-ink/60 mb-2">
        DELIVER TO
      </h2>

      <div className="space-y-2 mb-4">
        {addresses.map((address) => (
          <label
            key={address.id}
            className={`block bg-white rounded-xl2 border p-3 cursor-pointer ${
              selectedAddress === address.id
                ? "border-leaf"
                : "border-ink/10"
            }`}
          >
            <input
              type="radio"
              name="address"
              className="mr-2"
              checked={
                selectedAddress === address.id
              }
              onChange={() =>
                setSelectedAddress(address.id)
              }
            />

            <span className="font-medium text-sm">
              {address.label}
            </span>

            <p className="text-xs text-ink/60 ml-5">
              {address.line1},{" "}
              {address.city},{" "}
              {address.state} -{" "}
              {address.pincode}
            </p>
          </label>
        ))}
      </div>

      {/* ================================================== */}
      {/* NEW ADDRESS */}
      {/* ================================================== */}

      {showNewAddress ? (
        <form
          onSubmit={saveAddress}
          className="bg-white rounded-xl2 border border-ink/10 p-4 space-y-2 mb-5"
        >
          <input
            required
            placeholder="Label (Home/Work)"
            value={newAddress.label}
            onChange={(e) =>
              setNewAddress({
                ...newAddress,
                label: e.target.value,
              })
            }
            className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm"
          />

          <input
            required
            placeholder="Address line"
            value={newAddress.line1}
            onChange={(e) =>
              setNewAddress({
                ...newAddress,
                line1: e.target.value,
              })
            }
            className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-3 gap-2">
            <input
              required
              placeholder="City"
              value={newAddress.city}
              onChange={(e) =>
                setNewAddress({
                  ...newAddress,
                  city: e.target.value,
                })
              }
              className="border border-ink/15 rounded-lg px-3 py-2 text-sm"
            />

            <input
              required
              placeholder="State"
              value={newAddress.state}
              onChange={(e) =>
                setNewAddress({
                  ...newAddress,
                  state: e.target.value,
                })
              }
              className="border border-ink/15 rounded-lg px-3 py-2 text-sm"
            />

            <input
              required
              placeholder="Pincode"
              value={newAddress.pincode}
              onChange={(e) =>
                setNewAddress({
                  ...newAddress,
                  pincode: e.target.value,
                })
              }
              className="border border-ink/15 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="text-sm font-semibold text-leaf"
            >
              Save address
            </button>

            <button
              type="button"
              onClick={() =>
                setShowNewAddress(false)
              }
              className="text-sm text-ink/50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() =>
            setShowNewAddress(true)
          }
          className="text-sm font-semibold text-leaf mb-6"
        >
          + Add new address
        </button>
      )}

      {/* ================================================== */}
      {/* COUPONS */}
      {/* ================================================== */}

      <h2 className="font-semibold text-sm text-ink/60 mb-2">
        COUPONS
      </h2>

      <button
        type="button"
        onClick={() =>
          navigate("/coupons", {
            state: {
              selectedCoupon:
                selectedCoupon || null,
            },
          })
        }
        className={`w-full bg-white rounded-xl2 border p-4 mb-4 text-left transition ${
          couponSelected
            ? "border-leaf"
            : "border-ink/10 hover:border-leaf"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">

            <p className="font-semibold text-sm truncate">
              {couponLoading
                ? "Loading coupon..."
                : couponSelected
                ? couponCode
                : "View available coupons"}
            </p>

            <p className="text-xs text-ink/50 mt-1">
              {couponLoading
                ? "Getting coupon details"
                : couponSelected
                ? "Coupon selected for this order"
                : "Choose from available offers"}
            </p>

            {/* ================================================= */}
            {/* DISCOUNT */}
            {/* ================================================= */}

            {couponSelected &&
              !couponLoading &&
              couponDiscount > 0 && (
                <p className="text-xs text-leaf mt-2 font-semibold">
                  🎉 You save ₹
                  {couponDiscount.toFixed(2)}{" "}
                  on this order
                </p>
              )}

            {couponSelected &&
              !couponLoading &&
              couponDiscount <= 0 && (
                <p className="text-xs text-red-500 mt-2">
                  Coupon does not currently
                  provide a discount for this order.
                </p>
              )}

            {/* ================================================= */}
            {/* PAYMENT REQUIREMENT */}
            {/* ================================================= */}

            {couponSelected &&
              !couponLoading &&
              couponHasPaymentRestriction && (
                <div className="mt-3 rounded-lg bg-leaf/10 border border-leaf/20 px-3 py-2">
                  <p className="text-xs font-semibold text-leaf">
                    Payment method required
                  </p>

                  <p className="text-xs text-ink/70 mt-1">
                    Pay using{" "}
                    <span className="font-semibold">
                      {couponPaymentLabel}
                    </span>{" "}
                    to receive this coupon discount.
                  </p>
                </div>
              )}
          </div>

          <div className="shrink-0 text-leaf font-semibold text-sm">
            {couponSelected
              ? "Change →"
              : "View →"}
          </div>
        </div>
      </button>

      {/* ================================================== */}
      {/* REMOVE COUPON */}
      {/* ================================================== */}

      {couponSelected && (
        <button
          type="button"
          onClick={removeCoupon}
          className="text-xs text-red-500 font-medium mb-5"
        >
          Remove coupon
        </button>
      )}

      {/* ================================================== */}
      {/* PAYMENT */}
      {/* ================================================== */}

      <div className="bg-white rounded-xl2 border border-ink/10 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">
              Pay through Razorpay
            </p>

            {couponHasPaymentRestriction ? (
              <p className="text-xs text-leaf mt-1 font-semibold">
                {couponPaymentLabel} required for{" "}
                {couponCode}
              </p>
            ) : (
              <p className="text-xs text-ink/50 mt-1">
                UPI, Cards, Netbanking & more
              </p>
            )}
          </div>

          <span className="text-leaf font-semibold text-sm">
            Secure
          </span>
        </div>
      </div>

      {/* ================================================== */}
      {/* FINAL SUMMARY */}
      {/* ================================================== */}

      <div className="bg-white rounded-xl2 border border-ink/10 p-4 mb-4">

        {/* SUBTOTAL */}

        <div className="flex justify-between text-sm mb-2">
          <span className="text-ink/60">
            Subtotal
          </span>

          <span>
            ₹
            {Number(subtotal).toFixed(2)}
          </span>
        </div>

        {/* ================================================= */}
        {/* COUPON DISCOUNT */}
        {/* ================================================= */}

        {couponSelected &&
          couponDiscount > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-ink/60">
                Coupon ({couponCode})
              </span>

              <span className="font-semibold text-leaf">
                -₹
                {couponDiscount.toFixed(2)}
              </span>
            </div>
          )}

        {/* ================================================= */}
        {/* STORE CASH */}
        {/* ================================================= */}

        {storeCashToUse > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-ink/60">
              Store Cash
            </span>

            <span className="font-medium text-leaf">
              -₹
              {storeCashToUse.toFixed(2)}
            </span>
          </div>
        )}

        {/* ================================================= */}
        {/* TOTAL */}
        {/* ================================================= */}

        <div className="border-t border-ink/10 mt-3 pt-3 flex justify-between font-semibold text-base">
          <span>
            Final payable
          </span>

          <span>
            ₹
            {estimatedPayable.toFixed(2)}
          </span>
        </div>

        {/* ================================================= */}
        {/* SAVING SUMMARY */}
        {/* ================================================= */}

        {couponDiscount > 0 && (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
            <p className="text-xs text-leaf font-semibold">
              🎉 You are saving ₹
              {couponDiscount.toFixed(2)}{" "}
              with {couponCode}
            </p>
          </div>
        )}

        <p className="text-xs text-ink/40 mt-2">
          No delivery fee. Final amount is
          calculated and validated by the server
          before payment.
        </p>
      </div>

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* PLACE ORDER */}
      {/* ================================================== */}

      <button
        type="button"
        onClick={placeOrder}
        disabled={
          placing ||
          loadingStoreCash ||
          couponLoading
        }
        className="w-full bg-mango text-white rounded-xl py-3 font-semibold disabled:opacity-60"
      >
        {placing
          ? "Processing..."
          : `Pay ₹${estimatedPayable.toFixed(
              2
            )} & place order`}
      </button>

      <p className="text-[11px] text-ink/40 text-center mt-2">
        {import.meta.env.MODE ===
        "development"
          ? "Development mode · Payment mode is controlled by the backend"
          : couponHasPaymentRestriction
          ? `Secured by Razorpay · ${couponPaymentLabel} required for coupon`
          : "Secured by Razorpay · UPI, Cards, Netbanking & more"}
      </p>
    </div>
  </div>
);
}