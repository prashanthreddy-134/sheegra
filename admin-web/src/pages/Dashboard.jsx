import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl2 border border-ink/10 p-4">
      <div className="text-xs text-ink/50 mb-1">{label}</div>
      <div className={`font-display font-800 text-2xl ${accent || ""}`}>
        {value}
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  if (!status) return "Unknown";

  return status
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClasses(status) {
  const value = String(status || "").toUpperCase();

  if (
    value.includes("DELIVERED") ||
    value.includes("COMPLETED")
  ) {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (
    value.includes("CANCEL") ||
    value.includes("FAILED")
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (
    value.includes("PENDING") ||
    value.includes("CONFIRM") ||
    value.includes("PROCESS") ||
    value.includes("PREPAR")
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-blue-50 text-blue-700 border-blue-200";
}

function OrderDetailsModal({ order, loading, onClose }) {
  if (!order) return null;

  const items = order.items || order.orderItems || [];

  const subtotal = Number(
    order.subtotal ??
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price ?? item.unitPrice ?? 0) *
            Number(item.quantity ?? 0),
        0
      )
  );

  const discount = Number(order.discount || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const storeCash =
    Number(order.storeCashUsed ?? order.storeCash ?? 0);

  const total = Number(
    order.total ??
      subtotal -
        discount +
        deliveryFee -
        storeCash
  );

  const customerName =
    order.user?.name ||
    order.customer?.name ||
    "Customer";

  const customerPhone =
    order.user?.phone ||
    order.customer?.phone ||
    "—";

  const address =
    order.address ||
    order.deliveryAddress ||
    order.shippingAddress;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-ink/10 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-ink/45 mb-1">
                ORDER DETAILS
              </div>

              <h2 className="font-display font-800 text-xl sm:text-2xl">
                {order.orderNumber || order.id}
              </h2>

              <p className="text-xs text-ink/45 mt-1">
                {formatDate(order.createdAt || order.created_at)}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-ink/10 flex items-center justify-center text-ink/60 hover:bg-ink/5 text-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Customer + Payment */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-ink/10 rounded-xl p-4">
              <div className="text-xs text-ink/45 mb-3 font-medium">
                CUSTOMER
              </div>

              <div className="font-semibold text-sm">
                {customerName}
              </div>

              <div className="text-sm text-ink/55 mt-1">
                {customerPhone}
              </div>
            </div>

            <div className="border border-ink/10 rounded-xl p-4">
  <div className="text-xs text-ink/45 mb-3 font-medium">
    PAYMENT
  </div>

  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="font-semibold text-sm">
        Razorpay
      </div>

      <div className="text-sm text-ink/55 mt-1">
        Status:{" "}
        {order.paymentStatus || "UNKNOWN"}
      </div>
    </div>

    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${
        order.paymentStatus === "PAID"
          ? "bg-green-50 text-green-700 border-green-200"
          : order.paymentStatus === "REFUNDED"
          ? "bg-purple-50 text-purple-700 border-purple-200"
          : order.paymentStatus === "FAILED"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      }`}
    >
      {order.paymentStatus || "UNKNOWN"}
    </span>
  </div>

  {order.razorpayPaymentId && (
    <div className="mt-3 pt-3 border-t border-ink/10">
      <div className="text-[10px] text-ink/40">
        PAYMENT ID
      </div>

      <div className="text-xs font-mono text-ink/70 break-all mt-1">
        {order.razorpayPaymentId}
      </div>
    </div>
  )}

  {order.razorpayOrderId && (
    <div className="mt-2">
      <div className="text-[10px] text-ink/40">
        RAZORPAY ORDER ID
      </div>

      <div className="text-xs font-mono text-ink/70 break-all mt-1">
        {order.razorpayOrderId}
      </div>
    </div>
  )}
</div>
          </div>

          {/* Address */}
          {address && (
            <div className="border border-ink/10 rounded-xl p-4">
              <div className="text-xs text-ink/45 mb-2 font-medium">
                DELIVERY ADDRESS
              </div>

              <div className="text-sm leading-6 text-ink/75">
                {typeof address === "string" ? (
                  address
                ) : (
                  <>
                    {address.name && (
                      <div className="font-semibold">
                        {address.name}
                      </div>
                    )}

                    {address.addressLine1 && (
                      <div>{address.addressLine1}</div>
                    )}

                    {address.addressLine2 && (
                      <div>{address.addressLine2}</div>
                    )}

                    {(address.city ||
                      address.state ||
                      address.pincode) && (
                      <div>
                        {[
                          address.city,
                          address.state,
                          address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Products */}
          <div className="border border-ink/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">
                  Ordered Products
                </h3>

                <p className="text-xs text-ink/45 mt-0.5">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-ink/45">
                Loading order details...
              </div>
            ) : items.length > 0 ? (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink/[0.025] border-b border-ink/10">
                        <th className="text-left px-4 py-3 font-medium text-ink/55">
                          Product
                        </th>

                        <th className="text-center px-4 py-3 font-medium text-ink/55">
                          Qty
                        </th>

                        <th className="text-right px-4 py-3 font-medium text-ink/55">
                          Price
                        </th>

                        <th className="text-right px-4 py-3 font-medium text-ink/55">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => {
                        const quantity = Number(item.quantity || 0);

                        const price = Number(
                          item.price ??
                            item.unitPrice ??
                            0
                        );

                        const amount = quantity * price;

                        return (
                          <tr
                            key={
                              item.id ||
                              item.productId ||
                              index
                            }
                            className="border-b border-ink/5 last:border-0"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium">
                                {item.name ||
                                  item.product?.name ||
                                  "Product"}
                              </div>

                              {item.product?.sku && (
                                <div className="text-xs text-ink/40 mt-0.5">
                                  SKU: {item.product.sku}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              {quantity}
                            </td>

                            <td className="px-4 py-3 text-right">
                              ₹{price.toFixed(2)}
                            </td>

                            <td className="px-4 py-3 text-right font-semibold">
                              ₹{amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-ink/10">
                  {items.map((item, index) => {
                    const quantity = Number(item.quantity || 0);

                    const price = Number(
                      item.price ??
                        item.unitPrice ??
                        0
                    );

                    const amount = quantity * price;

                    return (
                      <div
                        key={
                          item.id ||
                          item.productId ||
                          index
                        }
                        className="p-4"
                      >
                        <div className="flex justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm">
                              {item.name ||
                                item.product?.name ||
                                "Product"}
                            </div>

                            <div className="text-xs text-ink/45 mt-1">
                              ₹{price.toFixed(2)} × {quantity}
                            </div>
                          </div>

                          <div className="font-semibold text-sm whitespace-nowrap">
                            ₹{amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-sm text-ink/45">
                No product details available for this order.
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-[360px] border border-ink/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink/55">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-ink/55">Discount</span>
                <span className="text-green-600">
                  - ₹{discount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-ink/55">
                  Delivery Fee
                </span>
                <span>
                  ₹{deliveryFee.toFixed(2)}
                </span>
              </div>

              {storeCash > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink/55">
                    Store Cash Used
                  </span>
                  <span className="text-green-600">
                    - ₹{storeCash.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="border-t border-ink/10 pt-3 flex justify-between">
                <span className="font-semibold">
                  Total
                </span>

                <span className="font-display font-800 text-xl text-leaf">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border border-ink/10 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs text-ink/45 mb-1">
                  ORDER STATUS
                </div>

                <div className="font-semibold text-sm">
                  {statusLabel(
                    order.status || order.orderStatus
                  )}
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                  order.status || order.orderStatus
                )}`}
              >
                {statusLabel(
                  order.status || order.orderStatus
                )}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-1">
            <Link
              to={`/orders`}
              onClick={onClose}
              className="text-sm font-semibold text-leaf hover:underline"
            >
              Open Orders Management →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => {
      setData(res.data);
    });
  }, []);

  async function openOrder(order) {
    setSelectedOrder(order);

    /*
     * Try to get the complete order from the existing
     * admin order endpoint.
     *
     * If the endpoint isn't available, the dashboard
     * order data is still displayed.
     */
    if (!order?.id) return;

    setOrderLoading(true);

    try {
      const res = await api.get(`/admin/orders/${order.id}`);

      if (res.data) {
        setSelectedOrder(
          res.data.order || res.data
        );
      }
    } catch (error) {
      console.warn(
        "Could not load complete order details:",
        error
      );
    } finally {
      setOrderLoading(false);
    }
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-ink/40">
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="font-display font-800 text-xl mb-5">
        Dashboard
      </h1>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Revenue (30 days)"
          value={`₹${Number(
            data.revenueLast30Days
          ).toFixed(0)}`}
          accent="text-leaf"
        />

        <StatCard
          label="Total orders"
          value={data.totalOrders}
        />

        <StatCard
          label="Orders in progress"
          value={data.pendingOrders}
          accent="text-mango"
        />

        <StatCard
          label="Customers"
          value={data.totalCustomers}
        />
      </div>

      {/* Dashboard sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl2 border border-ink/10 p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-sm">
                Recent orders
              </h2>

              <p className="text-xs text-ink/40 mt-1">
                Latest customer orders
              </p>
            </div>

            <Link
              to="/orders"
              className="text-xs text-leaf font-medium hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentOrders?.length === 0 ? (
              <div className="border border-dashed border-ink/15 rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">🧾</div>

                <p className="text-sm text-ink/45">
                  No recent orders
                </p>
              </div>
            ) : (
              data.recentOrders?.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => openOrder(o)}
                  className="w-full text-left border border-ink/10 rounded-xl p-4 bg-white hover:border-leaf/40 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* Order number */}
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          🧾
                        </span>

                        <span className="font-semibold text-sm truncate">
                          {o.orderNumber || o.id}
                        </span>
                      </div>

                      {/* Customer */}
                      <div className="text-xs text-ink/55 mt-2">
                        👤{" "}
                        {o.user?.name ||
                          o.user?.phone ||
                          "Customer"}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-ink/40 mt-1">
                        📅{" "}
                        {formatDate(
                          o.createdAt ||
                            o.created_at
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-display font-800 text-lg text-leaf">
                        ₹{Number(o.total).toFixed(0)}
                      </div>

                      <span
                        className={`inline-flex mt-2 rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClasses(
                          o.status ||
                            o.orderStatus
                        )}`}
                      >
                        {statusLabel(
                          o.status ||
                            o.orderStatus ||
                            "Order"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Bottom action */}
                  <div className="border-t border-ink/10 mt-3 pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-ink/40">
                      Click to view complete order
                    </span>

                    <span className="text-xs font-semibold text-leaf group-hover:translate-x-1 transition-transform">
                      View Order →
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl2 border border-ink/10 p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-sm">
                Low stock alerts
              </h2>

              <p className="text-xs text-ink/40 mt-1">
                Products that need attention
              </p>
            </div>

            <Link
              to="/products"
              className="text-xs text-leaf font-medium hover:underline"
            >
              Manage →
            </Link>
          </div>

          {data.lowStockProducts.length === 0 ? (
            <div className="border border-dashed border-ink/15 rounded-xl p-6 text-center">
              <div className="text-2xl mb-2">📦</div>

              <p className="text-sm text-ink/40">
                Nothing low on stock right now.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="border border-ink/10 rounded-xl px-4 py-3 flex justify-between items-center"
                >
                  <span className="text-sm font-medium">
                    {p.name}
                  </span>

                  <span className="text-mango font-medium text-sm">
                    {p.stockQty} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={orderLoading}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </Layout>
  );
}