import { useEffect, useState } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";

const NEXT_STATUS = {
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
};

const STATUS_OPTIONS = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

function formatStatus(status) {
  return status?.replace(/_/g, " ") || "UNKNOWN";
}

function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // ==========================================================
  // LOAD ORDERS
  // ==========================================================

  async function load(showLoading = false) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const res = await api.get("/admin/orders", {
        params: statusFilter
          ? { status: statusFilter }
          : {},
      });

      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Could not load orders:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  // ==========================================================
  // INITIAL LOAD + FILTER CHANGE
  // ==========================================================

  useEffect(() => {
    load(true);
  }, [statusFilter]);

  // ==========================================================
  // AUTOMATIC REFRESH
  // ==========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      load(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [statusFilter]);

  // ==========================================================
  // UPDATE ORDER STATUS
  // ==========================================================

  async function updateStatus(id, status) {
    if (updatingId) return;

    try {
      setUpdatingId(id);

      await api.patch(`/admin/orders/${id}/status`, {
        status,
      });

      await load(false);

      // Update currently opened invoice too
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status,
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Could not update order status:", err);

      alert(
        err.response?.data?.error ||
          "Could not update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // ==========================================================
  // OPEN ORDER DETAILS
  // ==========================================================

  function openOrder(order) {
    setSelectedOrder(order);
  }

  // ==========================================================
  // CLOSE ORDER DETAILS
  // ==========================================================

  function closeOrder() {
    setSelectedOrder(null);
  }

  // ==========================================================
  // CALCULATE ITEM TOTAL
  // ==========================================================

  function itemTotal(item) {
    return Number(item.price || 0) * Number(item.quantity || 0);
  }

  // ==========================================================
  // ORDER DETAILS / INVOICE MODAL
  // ==========================================================

  function OrderDetails({ order, onClose }) {
    if (!order) return null;

    const items = order.items || [];

    const subtotal = Number(
      order.subtotal ??
        items.reduce(
          (sum, item) => sum + itemTotal(item),
          0
        )
    );

    const discount = Number(order.discount || 0);

    const deliveryFee = Number(
      order.deliveryFee || 0
    );

    const total = Number(order.total || 0);

    const storeCashUsed = Number(
      order.storeCashUsed || 0
    );

    return (
      <div
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-3 sm:p-5"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* =================================================
              INVOICE HEADER
             ================================================= */}

          <div className="p-5 sm:p-6 border-b border-ink/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-leaf text-cream grid place-items-center font-display font-800">
                    S
                  </div>

                  <div>
                    <div className="font-display font-800 text-lg leading-none">
                      Sheegra
                    </div>

                    <div className="text-[11px] text-ink/40 mt-1">
                      Order Invoice
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 grid place-items-center text-lg text-ink/60"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-ink/40">
                  Order Number
                </div>

                <div className="font-semibold text-sm mt-1">
                  {order.orderNumber}
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-[11px] uppercase tracking-wide text-ink/40">
                  Order Date
                </div>

                <div className="font-semibold text-sm mt-1">
                  {formatDate(order.placedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              CUSTOMER + PAYMENT
             ================================================= */}

          <div className="p-5 sm:p-6 border-b border-ink/10 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-2">
                Customer
              </div>

              <div className="font-semibold text-sm">
                {order.user?.name ||
                  "Customer"}
              </div>

              {order.user?.phone && (
                <div className="text-sm text-ink/55 mt-1">
                  {order.user.phone}
                </div>
              )}

              {order.user?.email && (
                <div className="text-sm text-ink/55 mt-1 break-all">
                  {order.user.email}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-2">
                Payment
              </div>

              <div className="flex sm:justify-end">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    order.paymentStatus === "PAID"
                      ? "bg-leaf-light text-leaf"
                      : order.paymentStatus ===
                        "FAILED"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {formatStatus(
                    order.paymentStatus
                  )}
                </span>
              </div>

              <div className="text-sm text-ink/55 mt-2">
                Order status:{" "}
                <span className="font-medium text-ink">
                  {formatStatus(order.status)}
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              DELIVERY ADDRESS
             ================================================= */}

          {order.address && (
            <div className="p-5 sm:p-6 border-b border-ink/10">
              <div className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-2">
                Delivery Address
              </div>

              <div className="text-sm text-ink/70 leading-6">
                {order.address.line1 && (
                  <div>
                    {order.address.line1}
                  </div>
                )}

                {order.address.line2 && (
                  <div>
                    {order.address.line2}
                  </div>
                )}

                <div>
                  {[
                    order.address.city,
                    order.address.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>

                {order.address.pincode && (
                  <div>
                    PIN:{" "}
                    {order.address.pincode}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================
              PRODUCTS
             ================================================= */}

          <div className="p-5 sm:p-6">
            <div className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-3">
              Products
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block border border-ink/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ink/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink/50">
                      Product
                    </th>

                    <th className="text-center px-3 py-3 text-xs font-semibold text-ink/50">
                      Qty
                    </th>

                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink/50">
                      Price
                    </th>

                    <th className="text-right px-4 py-3 text-xs font-semibold text-ink/50">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-ink/5"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">
                          {item.name}
                        </div>

                        {item.unit && (
                          <div className="text-xs text-ink/40 mt-0.5">
                            {item.unit}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center text-ink/70">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-3 text-right text-ink/70">
                        {money(item.price)}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {money(
                          itemTotal(item)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile product cards */}
            <div className="sm:hidden space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-ink/10 rounded-xl p-3"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">
                        {item.name}
                      </div>

                      {item.unit && (
                        <div className="text-xs text-ink/40 mt-0.5">
                          {item.unit}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm">
                        {money(
                          itemTotal(item)
                        )}
                      </div>

                      <div className="text-xs text-ink/40 mt-1">
                        ×{item.quantity} ·{" "}
                        {money(item.price)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* =================================================
                TOTALS
               ================================================= */}

            <div className="mt-5 border-t border-ink/10 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-ink/50">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    {money(subtotal)}
                  </span>
                </div>

                {deliveryFee > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-ink/50">
                      Delivery Fee
                    </span>

                    <span className="font-medium">
                      {money(deliveryFee)}
                    </span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-ink/50">
                      Discount
                    </span>

                    <span className="font-medium text-leaf">
                      -{money(discount)}
                    </span>
                  </div>
                )}

                {storeCashUsed > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-ink/50">
                      Store Cash Used
                    </span>

                    <span className="font-medium text-leaf">
                      -{money(
                        storeCashUsed
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t border-ink/10 pt-3 mt-3 flex justify-between items-center gap-4">
                  <span className="font-display font-800 text-base">
                    Total
                  </span>

                  <span className="font-display font-800 text-xl text-leaf">
                    {money(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                STATUS ACTIONS INSIDE INVOICE
               ================================================= */}

            <div className="mt-5 pt-4 border-t border-ink/10">
              <div className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-3">
                Order Status
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold bg-leaf-light text-leaf px-2.5 py-1.5 rounded-full">
                  {formatStatus(order.status)}
                </span>

                {(NEXT_STATUS[
                  order.status
                ] || []).map((next) => (
                  <button
                    key={next}
                    disabled={
                      updatingId === order.id
                    }
                    onClick={() =>
                      updateStatus(
                        order.id,
                        next
                      )
                    }
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50 ${
                      next === "CANCELLED"
                        ? "border border-red-300 text-red-600 hover:bg-red-50"
                        : "bg-leaf text-cream hover:opacity-90"
                    }`}
                  >
                    {updatingId === order.id
                      ? "Updating..."
                      : `Mark ${formatStatus(
                          next
                        )}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* =================================================
              FOOTER
             ================================================= */}

          <div className="px-5 sm:px-6 py-4 bg-ink/[0.025] border-t border-ink/10 flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <Layout>
      {/* ======================================================
          PAGE HEADER
         ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <h1 className="font-display font-800 text-xl">
            Orders
          </h1>

          <p className="text-xs text-ink/40 mt-1">
            View and manage customer orders
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="w-full sm:w-auto text-sm border border-ink/15 rounded-full px-3 py-2 bg-white outline-none focus:border-leaf"
        >
          <option value="">
            All statuses
          </option>

          {STATUS_OPTIONS.map((status) => (
            <option
              key={status}
              value={status}
            >
              {formatStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {/* ======================================================
          ORDERS
         ====================================================== */}

      {loading ? (
        <div className="bg-white rounded-xl2 border border-ink/10 py-16 text-center">
          <div className="text-sm text-ink/40">
            Loading orders...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl2 border border-ink/10 p-4 sm:p-5"
            >
              {/* Order top */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm">
                    {o.orderNumber}
                  </div>

                  <div className="text-xs text-ink/50 mt-1">
                    {o.user?.name ||
                      o.user?.phone ||
                      "Customer"}
                    {" · "}
                    {formatDate(o.placedAt)}
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="font-display font-800 text-lg">
                    {money(o.total)}
                  </div>

                  <div className="text-xs text-ink/50 mt-1">
                    {formatStatus(
                      o.paymentStatus
                    )}
                  </div>
                </div>
              </div>

              {/* Product summary */}
              <div className="mt-3 bg-ink/[0.025] rounded-xl p-3">
                <div className="text-xs font-semibold text-ink/40 uppercase tracking-wide mb-1.5">
                  Products
                </div>

                <div className="text-sm text-ink/70 leading-6">
                  {(o.items || []).map(
                    (item, index) => (
                      <span key={item.id}>
                        {item.name}{" "}
                        <span className="text-ink/40">
                          ×{item.quantity}
                        </span>

                        {index <
                          o.items.length - 1 &&
                          ", "}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Address */}
              {o.address && (
                <div className="text-xs text-ink/60 mt-3">
                  <span className="font-semibold text-ink/70">
                    Deliver to:
                  </span>{" "}
                  {o.address.line1},{" "}
                  {o.address.city} -{" "}
                  {o.address.pincode}
                </div>
              )}

              {/* Bottom controls */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <span className="text-xs font-medium bg-leaf-light text-leaf px-2.5 py-1 rounded-full">
                    {formatStatus(o.status)}
                  </span>

                  {(NEXT_STATUS[
                    o.status
                  ] || []).map((next) => (
                    <button
                      key={next}
                      disabled={
                        updatingId === o.id
                      }
                      onClick={() =>
                        updateStatus(
                          o.id,
                          next
                        )
                      }
                      className={`text-xs font-semibold px-3 py-1 rounded-full disabled:opacity-50 ${
                        next === "CANCELLED"
                          ? "border border-red-300 text-red-600 hover:bg-red-50"
                          : "bg-leaf text-cream hover:opacity-90"
                      }`}
                    >
                      {updatingId === o.id
                        ? "Updating..."
                        : `Mark ${formatStatus(
                            next
                          )}`}
                    </button>
                  ))}
                </div>

                {/* VIEW ORDER */}
                <button
                  onClick={() =>
                    openOrder(o)
                  }
                  className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl border border-ink/15 bg-white text-ink text-sm font-semibold hover:bg-ink/[0.035] transition"
                >
                  View Order
                </button>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="bg-white rounded-xl2 border border-ink/10">
              <p className="text-ink/40 text-center py-16">
                No orders match this filter.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          ORDER DETAILS MODAL
         ====================================================== */}

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={closeOrder}
        />
      )}
    </Layout>
  );
}