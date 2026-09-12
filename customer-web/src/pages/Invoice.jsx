import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { api } from "../api/client";
import NavBar from "../components/NavBar";

function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function paymentStatusLabel(status) {
  return String(status || "UNKNOWN")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function Invoice() {
  const { id } = useParams();

  const invoiceRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error(
        "Could not load invoice order:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Could not load invoice."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function downloadInvoice() {
    if (!invoiceRef.current || !order) {
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const element = invoiceRef.current;

      const options = {
        margin: 10,

        filename:
          `Sheegra-Invoice-${order.orderNumber}.pdf`,

        image: {
          type: "jpeg",
          quality: 0.98,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },

        pagebreak: {
          mode: [
            "avoid-all",
            "css",
            "legacy",
          ],
        },
      };

      await html2pdf()
        .set(options)
        .from(element)
        .save();
    } catch (err) {
      console.error(
        "Invoice download failed:",
        err
      );

      setError(
        "Could not generate the invoice PDF. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <NavBar />

        <div className="text-center py-16 text-ink/40">
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream">
        <NavBar />

        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="bg-white rounded-xl2 border border-red-200 p-5">
            <p className="text-red-600 text-sm">
              {error || "Invoice not found."}
            </p>

            <Link
              to="/orders"
              className="inline-block mt-4 bg-leaf text-cream rounded-xl px-5 py-3 font-semibold"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const customer =
    order.user || {};

  const address =
    order.address || {};

  const subtotal =
    Number(order.subtotal || 0);

  const discount =
    Number(order.discount || 0);

  const storeCashUsed =
    Number(order.storeCashUsed || 0);

  const deliveryFee =
    Number(order.deliveryFee || 0);

  const total =
    Number(order.total || 0);

  const invoiceNumber =
    `INV-${order.orderNumber}`;

  return (
    <div className="min-h-screen bg-cream">
      <NavBar />

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ================================================== */}
        {/* ACTION BAR */}
        {/* ================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">

          <Link
            to={`/orders/${order.id}`}
            className="text-sm font-semibold text-leaf hover:underline"
          >
            ← Back to Order
          </Link>

          <button
            type="button"
            onClick={downloadInvoice}
            disabled={downloading}
            className="bg-leaf text-cream rounded-xl px-5 py-3 font-semibold disabled:opacity-60"
          >
            {downloading
              ? "Generating PDF..."
              : "Download Invoice PDF"}
          </button>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* INVOICE */}
        {/* ================================================== */}

        <div
          ref={invoiceRef}
          className="bg-white text-black p-6 sm:p-10 rounded-xl2"
        >

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="flex flex-col sm:flex-row sm:justify-between gap-5 border-b border-gray-200 pb-6">

            <div>
              <h1 className="text-3xl font-bold">
                Sheegra
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                sheegra groceries. Delivered.
              </p>
            </div>

            <div className="sm:text-right">
              <h2 className="text-2xl font-bold">
                INVOICE
              </h2>

              <p className="text-sm text-gray-600 mt-1">
                {invoiceNumber}
              </p>

              <p className="text-sm text-gray-600">
                Order: {order.orderNumber}
              </p>

              <p className="text-sm text-gray-600">
                {formatDate(order.placedAt)}
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* CUSTOMER / DELIVERY */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-gray-200">

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                Customer
              </h3>

              <p className="font-semibold">
                {customer.name ||
                  "Sheegra Customer"}
              </p>

              {customer.phone && (
                <p className="text-sm text-gray-600">
                  {customer.phone}
                </p>
              )}

              {customer.email && (
                <p className="text-sm text-gray-600">
                  {customer.email}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                Deliver To
              </h3>

              <p className="font-semibold">
                {address.label || "Address"}
              </p>

              <p className="text-sm text-gray-600">
                {address.line1}
              </p>

              {address.line2 && (
                <p className="text-sm text-gray-600">
                  {address.line2}
                </p>
              )}

              {address.landmark && (
                <p className="text-sm text-gray-600">
                  {address.landmark}
                </p>
              )}

              <p className="text-sm text-gray-600">
                {address.city},{" "}
                {address.state} -{" "}
                {address.pincode}
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* ITEMS */}
          {/* ================================================= */}

          <div className="py-6">

            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
              Order Items
            </h3>

            <div className="overflow-hidden border border-gray-200 rounded-lg">

              <table className="w-full text-sm">

                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3">
                      Item
                    </th>

                    <th className="text-center p-3">
                      Qty
                    </th>

                    <th className="text-right p-3">
                      Unit Price
                    </th>

                    <th className="text-right p-3">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {order.items?.map((item) => {

                    const quantity =
                      Number(
                        item.quantity || 0
                      );

                    const price =
                      Number(
                        item.price || 0
                      );

                    const amount =
                      price * quantity;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100"
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {item.name}
                          </div>

                          {item.unit && (
                            <div className="text-xs text-gray-500">
                              {item.unit}
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {quantity}
                        </td>

                        <td className="p-3 text-right">
                          {money(price)}
                        </td>

                        <td className="p-3 text-right font-medium">
                          {money(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          </div>

          {/* ================================================= */}
          {/* TOTALS */}
          {/* ================================================= */}

          <div className="flex justify-end">

            <div className="w-full sm:w-80 space-y-2 text-sm">

              <div className="flex justify-between">
                <span className="text-gray-600">
                  Subtotal
                </span>

                <span>
                  {money(subtotal)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Coupon Discount
                  </span>

                  <span className="text-green-700">
                    -{money(discount)}
                  </span>
                </div>
              )}

              {storeCashUsed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Store Cash
                  </span>

                  <span className="text-green-700">
                    -{money(storeCashUsed)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">
                  Delivery Fee
                </span>

                <span>
                  {deliveryFee === 0
                    ? "FREE"
                    : money(deliveryFee)}
                </span>
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between text-lg font-bold">
                <span>
                  Total Paid
                </span>

                <span>
                  {money(total)}
                </span>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* PAYMENT */}
          {/* ================================================= */}

          <div className="mt-8 pt-6 border-t border-gray-200">

            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
              Payment Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">

              <p>
                <span className="text-gray-500">
                  Payment Status:
                </span>{" "}
                <span className="font-semibold">
                  {paymentStatusLabel(
                    order.paymentStatus
                  )}
                </span>
              </p>

              {order.razorpayPaymentId && (
                <p>
                  <span className="text-gray-500">
                    Payment ID:
                  </span>{" "}
                  <span className="font-mono text-xs">
                    {order.razorpayPaymentId}
                  </span>
                </p>
              )}

              {order.couponId && (
                <p>
                  <span className="text-gray-500">
                    Coupon Applied:
                  </span>{" "}
                  <span className="font-semibold">
                    {order.coupon?.code ||
                      "Coupon"}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="mt-10 pt-5 border-t border-gray-200 text-center">

            <p className="font-semibold">
              Thank you for shopping with Sheegra!
            </p>

            <p className="text-xs text-gray-500 mt-1">
              This is a computer-generated invoice
              and does not require a signature.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}