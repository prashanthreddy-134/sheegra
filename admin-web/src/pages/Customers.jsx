import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";

const CUSTOMER_REFRESH_INTERVAL = 10000;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Store Cash
  const [cashAmount, setCashAmount] = useState("");
  const [cashMessage, setCashMessage] = useState(
    "Free Store Cash"
  );
  const [givingCash, setGivingCash] = useState(false);

  // ==========================================================
  // LOAD CUSTOMERS
  // ==========================================================

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const res = await api.get("/admin/customers", {
          params: q ? { q } : {},
        });

        setCustomers(res.data.customers || []);
      } catch (err) {
        console.error(
          "Could not load customers:",
          err
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [q]
  );

  // ==========================================================
  // INITIAL LOAD AND RELOAD WHEN SEARCH CHANGES
  // ==========================================================

  useEffect(() => {
    load(true);
  }, [load]);

  // ==========================================================
  // AUTOMATIC REFRESH
  // ==========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      load(false);
    }, CUSTOMER_REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [load]);

  // ==========================================================
  // REFRESH WHEN ADMIN RETURNS TO TAB
  // ==========================================================

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        load(false);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [load]);

  // ==========================================================
  // REFRESH WHEN INTERNET CONNECTION RETURNS
  // ==========================================================

  useEffect(() => {
    function handleOnline() {
      load(false);
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [load]);

  // ==========================================================
  // GIVE STORE CASH TO ALL CUSTOMERS
  // ==========================================================

  async function giveCashToAll() {
    const amount = Number(cashAmount);

    if (!cashAmount || !Number.isFinite(amount)) {
      alert("Please enter a valid cash amount.");
      return;
    }

    if (amount <= 0) {
      alert("Cash amount must be greater than ₹0.");
      return;
    }

    if (amount > 100000) {
      alert("Maximum amount allowed is ₹1,00,000.");
      return;
    }

    if (customers.length === 0) {
      alert("There are no customers to receive Store Cash.");
      return;
    }

    const activeCustomers = customers.filter(
      (customer) => customer.isActive
    );

    if (activeCustomers.length === 0) {
      alert("There are no active customers.");
      return;
    }

    const confirmed = window.confirm(
      `Give ₹${amount.toFixed(
        2
      )} Store Cash to ALL active customers?\n\n` +
        `Customers receiving cash: ${activeCustomers.length}\n` +
        `Total Store Cash added: ₹${(
          amount * activeCustomers.length
        ).toFixed(2)}\n\n` +
        `This action cannot be undone automatically.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setGivingCash(true);

      const res = await api.post(
        "/admin/store-cash/all",
        {
          amount,
          description:
            cashMessage.trim() ||
            "Free Store Cash",
        }
      );

      alert(
        res.data?.message ||
          "Store Cash given successfully to all customers."
      );

      setCashAmount("");
      setCashMessage("Free Store Cash");

      await load(false);
    } catch (err) {
      console.error(
        "Could not give Store Cash:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Could not give Store Cash to customers."
      );
    } finally {
      setGivingCash(false);
    }
  }

  // ==========================================================
  // ENABLE / DISABLE CUSTOMER
  // ==========================================================

  async function toggleActive(c) {
    try {
      await api.patch(
        `/admin/customers/${c.id}/status`,
        {
          isActive: !c.isActive,
        }
      );

      await load(false);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Could not update customer status."
      );
    }
  }

  // ==========================================================
  // DELETE CUSTOMER
  // ==========================================================

  async function deleteCustomer(c) {
    const confirmed = window.confirm(
      `Delete customer "${c.name || c.phone}"?\n\n` +
        "This will permanently remove this customer account " +
        "and their testing data. This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(c.id);

      await api.delete(
        `/admin/customers/${c.id}`
      );

      alert(
        "Customer deleted successfully."
      );

      await load(false);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Could not delete customer."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const activeCustomerCount =
    customers.filter(
      (customer) => customer.isActive
    ).length;

  const totalCash =
    Number(cashAmount || 0) *
    activeCustomerCount;

  return (
    <Layout>

      {/* =====================================================
          HEADER
         ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:justify-between
          sm:items-center
          mb-5
        "
      >
        <h1 className="font-display font-800 text-xl">
          Customers
        </h1>

        <input
          placeholder="Search by name or phone"
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
          className="
            w-full
            sm:w-auto
            sm:min-w-[260px]
            text-sm
            border
            border-ink/15
            rounded-full
            px-4
            py-2
            bg-white
            outline-none
            focus:border-leaf
          "
        />
      </div>


      {/* =====================================================
          FREE STORE CASH
         ===================================================== */}

      <div
        className="
          bg-white
          rounded-[20px]
          border
          border-ink/10
          p-4
          sm:p-5
          mb-4
          sm:mb-5
        "
      >

        <div className="flex items-start gap-3 sm:gap-4">

          {/* Icon */}
          <div
            className="
              w-10
              h-10
              sm:w-12
              sm:h-12
              rounded-2xl
              bg-leaf-light
              grid
              place-items-center
              text-xl
              sm:text-2xl
              shrink-0
            "
          >
            💰
          </div>


          <div className="flex-1 min-w-0">

            <h2
              className="
                font-display
                font-800
                text-base
                text-ink
              "
            >
              Give Free Store Cash
            </h2>

            <p className="text-xs text-ink/50 mt-1">
              Add Store Cash to every active customer
              at once.
            </p>


            {/* Inputs */}
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
                mt-4
              "
            >

              {/* Cash Amount */}
              <div>

                <label
                  className="
                    block
                    text-xs
                    font-medium
                    text-ink/60
                    mb-1
                  "
                >
                  Cash amount
                </label>

                <div className="relative">

                  <span
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-sm
                      text-ink/50
                    "
                  >
                    ₹
                  </span>

                  <input
                    type="number"
                    min="1"
                    max="100000"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) =>
                      setCashAmount(
                        e.target.value
                      )
                    }
                    placeholder="Enter amount"
                    className="
                      w-full
                      border
                      border-ink/15
                      rounded-xl
                      pl-8
                      pr-3
                      py-2.5
                      text-sm
                      bg-cream/30
                      focus:border-leaf
                      outline-none
                    "
                  />

                </div>

              </div>


              {/* Message */}
              <div>

                <label
                  className="
                    block
                    text-xs
                    font-medium
                    text-ink/60
                    mb-1
                  "
                >
                  Message / reason
                </label>

                <input
                  type="text"
                  value={cashMessage}
                  onChange={(e) =>
                    setCashMessage(
                      e.target.value
                    )
                  }
                  placeholder="Free Store Cash"
                  maxLength={250}
                  className="
                    w-full
                    border
                    border-ink/15
                    rounded-xl
                    px-3
                    py-2.5
                    text-sm
                    bg-cream/30
                    focus:border-leaf
                    outline-none
                  "
                />

              </div>

            </div>


            {/* Summary */}
            <div
              className="
                mt-4
                bg-leaf-light/40
                rounded-xl
                px-4
                py-3
              "
            >

              <div
                className="
                  flex
                  justify-between
                  items-center
                  text-xs
                  gap-3
                "
              >

                <span className="text-ink/50">
                  Active customers
                </span>

                <span className="font-semibold text-ink">
                  {activeCustomerCount}
                </span>

              </div>


              <div
                className="
                  flex
                  justify-between
                  items-center
                  mt-1
                  gap-3
                "
              >

                <span className="text-xs text-ink/50">
                  Total Store Cash
                </span>

                <span
                  className="
                    font-display
                    font-800
                    text-leaf
                  "
                >
                  ₹{totalCash.toFixed(2)}
                </span>

              </div>

            </div>


            {/* Button */}
            <button
              type="button"
              onClick={giveCashToAll}
              disabled={givingCash}
              className="
                mt-4
                w-full
                sm:w-auto
                px-5
                py-2.5
                rounded-xl
                bg-leaf
                text-cream
                text-sm
                font-semibold
                hover:opacity-90
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {givingCash
                ? "Giving Store Cash..."
                : "💰 Give to All Customers"}
            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          CUSTOMER TABLE - DESKTOP
         ===================================================== */}

      <div
        className="
          hidden
          lg:block
          bg-white
          rounded-xl2
          border
          border-ink/10
          overflow-hidden
        "
      >

        <table className="w-full text-sm">

          <thead
            className="
              bg-ink/5
              text-left
              text-ink/50
            "
          >
            <tr>

              <th className="px-4 py-2">
                Name
              </th>

              <th className="px-4 py-2">
                Phone
              </th>

              <th className="px-4 py-2">
                Orders
              </th>

              <th className="px-4 py-2">
                Joined
              </th>

              <th className="px-4 py-2">
                Status
              </th>

              <th className="px-4 py-2">
                Actions
              </th>

            </tr>
          </thead>


          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan="6"
                  className="
                    px-4
                    py-8
                    text-center
                    text-ink/50
                  "
                >
                  Loading customers...
                </td>

              </tr>

            ) : customers.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="
                    px-4
                    py-8
                    text-center
                    text-ink/50
                  "
                >
                  No customers found.
                </td>

              </tr>

            ) : (

              customers.map((c) => (

                <tr
                  key={c.id}
                  className="
                    border-t
                    border-ink/5
                  "
                >

                  {/* Name */}
                  <td
                    className="
                      px-4
                      py-2
                      font-medium
                    "
                  >
                    {c.name || "—"}
                  </td>


                  {/* Phone */}
                  <td className="px-4 py-2">
                    {c.phone}
                  </td>


                  {/* Orders */}
                  <td className="px-4 py-2">
                    {c._count.orders}
                  </td>


                  {/* Joined */}
                  <td
                    className="
                      px-4
                      py-2
                      text-ink/50
                    "
                  >
                    {new Date(
                      c.createdAt
                    ).toLocaleDateString()}
                  </td>


                  {/* Status */}
                  <td className="px-4 py-2">

                    <span
                      className={`
                        text-xs
                        font-medium
                        px-2
                        py-0.5
                        rounded-full

                        ${
                          c.isActive
                            ? "bg-leaf-light text-leaf"
                            : "bg-red-100 text-red-600"
                        }
                      `}
                    >
                      {c.isActive
                        ? "Active"
                        : "Disabled"}
                    </span>

                  </td>


                  {/* Actions */}
                  <td className="px-4 py-2">

                    <div
                      className="
                        flex
                        justify-end
                        items-center
                        gap-3
                      "
                    >

                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(c)
                        }
                        className="
                          text-xs
                          font-medium
                          text-ink/60
                          hover:text-ink
                        "
                      >
                        {c.isActive
                          ? "Disable"
                          : "Enable"}
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          deleteCustomer(c)
                        }
                        disabled={
                          deletingId === c.id
                        }
                        className="
                          text-xs
                          font-medium
                          text-red-600
                          hover:text-red-700
                          disabled:opacity-50
                        "
                      >
                        {deletingId === c.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>


      {/* =====================================================
          CUSTOMER CARDS - MOBILE
         ===================================================== */}

      <div
        className="
          lg:hidden
          space-y-3
        "
      >

        {loading ? (

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-ink/10
              px-4
              py-8
              text-center
              text-sm
              text-ink/50
            "
          >
            Loading customers...
          </div>

        ) : customers.length === 0 ? (

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-ink/10
              px-4
              py-8
              text-center
              text-sm
              text-ink/50
            "
          >
            No customers found.
          </div>

        ) : (

          customers.map((c) => (

            <div
              key={c.id}
              className="
                bg-white
                rounded-2xl
                border
                border-ink/10
                p-4
                w-full
                min-w-0
              "
            >

              {/* =================================================
                  CUSTOMER HEADER
                 ================================================= */}

              <div
                className="
                  mb-4
                  min-w-0
                "
              >

                <h2
                  className="
                    font-display
                    font-800
                    text-base
                    text-ink
                    leading-tight
                    break-words
                  "
                >
                  {c.name || "Unnamed customer"}
                </h2>

                <p
                  className="
                    text-sm
                    text-ink/50
                    mt-1
                    break-all
                  "
                >
                  {c.phone}
                </p>

              </div>


              {/* =================================================
                  CUSTOMER DETAILS
                 ================================================= */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  text-sm
                "
              >

                {/* Orders */}
                <div
                  className="
                    rounded-xl
                    bg-cream/50
                    px-3
                    py-2.5
                    min-w-0
                  "
                >

                  <div
                    className="
                      text-xs
                      text-ink/40
                      mb-1
                    "
                  >
                    Orders
                  </div>

                  <div className="font-semibold text-ink">
                    {c._count.orders}
                  </div>

                </div>


                {/* Joined */}
                <div
                  className="
                    rounded-xl
                    bg-cream/50
                    px-3
                    py-2.5
                    min-w-0
                  "
                >

                  <div
                    className="
                      text-xs
                      text-ink/40
                      mb-1
                    "
                  >
                    Joined
                  </div>

                  <div
                    className="
                      font-medium
                      text-ink
                      text-xs
                      sm:text-sm
                    "
                  >
                    {new Date(
                      c.createdAt
                    ).toLocaleDateString()}
                  </div>

                </div>


                {/* Status */}
                <div
                  className="
                    col-span-2
                    rounded-xl
                    bg-cream/50
                    px-3
                    py-2.5
                    flex
                    items-center
                    justify-between
                    gap-2
                  "
                >

                  <div className="text-xs text-ink/40">
                    Status
                  </div>

                  <span
                    className={`
                      text-xs
                      font-semibold
                      px-3
                      py-1.5
                      rounded-full

                      ${
                        c.isActive
                          ? "bg-leaf-light text-leaf"
                          : "bg-red-100 text-red-600"
                      }
                    `}
                  >
                    {c.isActive
                      ? "Active"
                      : "Disabled"}
                  </span>

                </div>

              </div>


              {/* =================================================
                  MOBILE ACTIONS
                 ================================================= */}

              <div
                className="
                  mt-4
                  pt-4
                  border-t
                  border-ink/10
                  grid
                  grid-cols-2
                  gap-2
                "
              >

                {/* Disable / Enable */}
                <button
                  type="button"
                  onClick={() =>
                    toggleActive(c)
                  }
                  className="
                    w-full
                    py-2.5
                    rounded-lg
                    border
                    border-ink/15
                    text-ink/70
                    text-sm
                    font-semibold
                    hover:bg-ink/5
                    transition-colors
                  "
                >
                  {c.isActive
                    ? "Disable"
                    : "Enable"}
                </button>


                {/* Delete */}
                <button
                  type="button"
                  onClick={() =>
                    deleteCustomer(c)
                  }
                  disabled={
                    deletingId === c.id
                  }
                  className="
                    w-full
                    py-2.5
                    rounded-lg
                    border
                    border-red-200
                    text-red-600
                    text-sm
                    font-semibold
                    hover:bg-red-50
                    transition-colors
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {deletingId === c.id
                    ? "Deleting..."
                    : "Delete"}
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </Layout>
  );
}