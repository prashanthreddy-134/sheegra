import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";

const EMPTY = {
  name: "",
  description: "",
  unit: "",
  mrp: "",
  sellingPrice: "",
  categoryId: "",
  stockQty: "",
  imageUrl: "",
};

const REFRESH_INTERVAL = 10000;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------
  // Load products
  // ----------------------------------------

  const loadProducts = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const res = await api.get("/products", {
        params: {
          limit: 100,
        },
      });

      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Could not load products:", err);

      if (showLoading) {
        setError(
          err.response?.data?.error ||
            "Could not load products"
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // ----------------------------------------
  // Initial load
  // ----------------------------------------

  useEffect(() => {
    loadProducts(true);

    api
      .get("/categories")
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error ||
            "Could not load categories"
        );
      });
  }, [loadProducts]);

  // ----------------------------------------
  // Automatic refresh
  // ----------------------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      loadProducts(false);
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [loadProducts]);

  // ----------------------------------------
  // Refresh when admin returns to tab
  // ----------------------------------------

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadProducts(false);
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
  }, [loadProducts]);

  // ----------------------------------------
  // Refresh when internet reconnects
  // ----------------------------------------

  useEffect(() => {
    function handleOnline() {
      loadProducts(false);
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [loadProducts]);

  // ----------------------------------------
  // Image upload
  // ----------------------------------------

  async function handleImageFile(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setForm((f) => ({
        ...f,
        imageUrl: res.data.url,
      }));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Image upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  // ----------------------------------------
  // Edit product
  // ----------------------------------------

  function startEdit(p) {
    setError("");
    setEditing(p.id);

    setForm({
      name: p.name || "",
      description: p.description || "",
      unit: p.unit || "",
      mrp: p.mrp ?? "",
      sellingPrice: p.sellingPrice ?? "",
      categoryId: p.categoryId || "",
      stockQty: p.stockQty ?? "",
      imageUrl: p.imageUrl || "",
    });
  }

  // ----------------------------------------
  // Add new product
  // ----------------------------------------

  function startNew() {
    setError("");
    setEditing("new");

    setForm({
      ...EMPTY,
      categoryId: categories[0]?.id || "",
    });
  }

  // ----------------------------------------
  // Cancel form
  // ----------------------------------------

  function cancelForm() {
    if (saving) return;

    setEditing(null);
    setForm(EMPTY);
    setError("");
  }

  // ----------------------------------------
  // Save / Update product
  // ----------------------------------------

  async function save(e) {
    e.preventDefault();

    if (saving) return;

    setError("");

    const name = form.name.trim();
    const unit = form.unit.trim();

    if (!name) {
      setError("Product name is required");
      return;
    }

    if (!unit) {
      setError("Unit is required");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category");
      return;
    }

    const mrp = Number(form.mrp);
    const sellingPrice = Number(form.sellingPrice);
    const stockQty = Number(form.stockQty);

    if (!Number.isFinite(mrp) || mrp <= 0) {
      setError("Please enter a valid MRP");
      return;
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setError("Please enter a valid selling price");
      return;
    }

    if (!Number.isFinite(stockQty) || stockQty < 0) {
      setError("Please enter a valid stock quantity");
      return;
    }

    const payload = {
      ...form,
      name,
      unit,
      mrp,
      sellingPrice,
      stockQty,
    };

    setSaving(true);

    try {
      if (editing === "new") {
        await api.post("/products", payload);
      } else {
        await api.put(`/products/${editing}`, payload);
      }

      setEditing(null);
      setForm(EMPTY);

      await loadProducts(false);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error;

      if (
        status === 409 ||
        message?.toLowerCase().includes("duplicate") ||
        message?.toLowerCase().includes("unique")
      ) {
        setError(
          "This product already exists with the same name and unit."
        );
      } else {
        setError(
          message || "Could not save product"
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------
  // Delete / deactivate product
  // ----------------------------------------

  async function deleteProduct(id) {
    if (
      !confirm(
        "Deactivate this product? It will be hidden from customers."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      await loadProducts(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not remove product"
      );
    }
  }

  // ----------------------------------------
  // Quick stock update
  // ----------------------------------------

  async function quickStock(id, stockQty) {
    if (!Number.isFinite(stockQty) || stockQty < 0) {
      setError("Stock quantity cannot be negative.");
      return;
    }

    try {
      await api.patch(`/products/${id}/stock`, {
        stockQty: Number(stockQty),
      });

      await loadProducts(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not update stock"
      );
    }
  }

  // ----------------------------------------
  // Product status helper
  // ----------------------------------------

  function getStockStatus(p) {
    const stock = Number(p.stockQty);

    const lowStock =
      stock > 0 &&
      stock <= Number(p.lowStockAlert || 10);

    const outOfStock = stock <= 0;

    if (outOfStock) {
      return {
        label: "OUT OF STOCK",
        className:
          "text-red-600 bg-red-100",
      };
    }

    if (lowStock) {
      return {
        label: "LOW STOCK",
        className:
          "text-mango bg-mango/10",
      };
    }

    return {
      label: "IN STOCK",
      className:
        "text-leaf bg-leaf-light",
    };
  }

  return (
    <Layout>

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div
        className="
          flex
          flex-col
          gap-3

          sm:flex-row
          sm:items-center
          sm:justify-between

          mb-5
        "
      >
        <h1 className="font-display font-800 text-xl">
          Products
        </h1>

        <button
          onClick={startNew}
          disabled={saving}
          className="
            bg-leaf
            text-cream
            text-sm
            font-semibold
            px-4
            py-2
            rounded-full
            disabled:opacity-60
            w-full
            sm:w-auto
          "
        >
          + Add product
        </button>
      </div>


      {/* =====================================================
          PRODUCT FORM
      ====================================================== */}
      {editing && (
        <form
          onSubmit={save}
          className="
            bg-white
            rounded-xl2
            border
            border-ink/10
            p-4
            mb-5

            grid
            grid-cols-1
            md:grid-cols-2

            gap-3
          "
        >

          <input
            required
            placeholder="Product name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="
              w-full
              min-w-0
              border
              border-ink/15
              rounded-lg
              px-3
              py-2
              text-sm
            "
          />

          <select
            required
            value={form.categoryId}
            onChange={(e) =>
              setForm({
                ...form,
                categoryId: e.target.value,
              })
            }
            className="
              w-full
              min-w-0
              border
              border-ink/15
              rounded-lg
              px-3
              py-2
              text-sm
            "
          >
            <option value="">
              Select category
            </option>

            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </select>


          <input
            required
            placeholder="Unit (e.g. 1 kg)"
            value={form.unit}
            onChange={(e) =>
              setForm({
                ...form,
                unit: e.target.value,
              })
            }
            className="
              w-full
              min-w-0
              border
              border-ink/15
              rounded-lg
              px-3
              py-2
              text-sm
            "
          />


          {/* Image URL + Upload */}
          <div
            className="
              flex
              flex-col
              gap-2

              sm:flex-row
              sm:items-center
              sm:gap-2

              min-w-0
            "
          >
            <input
              placeholder="Image URL (or upload →)"
              value={form.imageUrl}
              onChange={(e) =>
                setForm({
                  ...form,
                  imageUrl: e.target.value,
                })
              }
              className="
                w-full
                min-w-0
                flex-1
                border
                border-ink/15
                rounded-lg
                px-3
                py-2
                text-sm
              "
            />

            <label
              className="
                text-xs
                font-medium
                text-leaf
                border
                border-leaf
                rounded-lg
                px-3
                py-2
                cursor-pointer
                text-center
                whitespace-nowrap
                shrink-0
              "
            >
              {uploading
                ? "Uploading..."
                : "Upload image"}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFile}
                className="hidden"
                disabled={uploading || saving}
              />
            </label>
          </div>


          {form.imageUrl && (
            <div className="flex items-center">
              <img
                src={form.imageUrl}
                alt="Preview"
                className="
                  w-16
                  h-16
                  object-cover
                  rounded-lg
                  border
                  border-ink/10
                "
              />
            </div>
          )}


          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="MRP"
            value={form.mrp}
            onChange={(e) =>
              setForm({
                ...form,
                mrp: e.target.value,
              })
            }
            className="
              w-full
              min-w-0
              border
              border-ink/15
              rounded-lg
              px-3
              py-2
              text-sm
            "
          />


          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Selling price"
            value={form.sellingPrice}
            onChange={(e) =>
              setForm({
                ...form,
                sellingPrice: e.target.value,
              })
            }
            className="
              w-full
              min-w-0
              border
              border-ink/15
              rounded-lg
              px-3
              py-2
              text-sm
            "
          />


          <input
            required
            type="number"
            min="0"
            placeholder="Stock quantity"
            value={form.stockQty}
            onChange={(e) =>
              setForm({
                ...form,
                stockQty: e.target.value,
              })
            }
            className="
              w-full
              min-w-0
              border
              border-ink/15
              rounded-lg
              px-3
              py-2
              text-sm
            "
          />


          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            className="
              w-full
              min-w-0
              border
              border-ink/15
              rounded-lg
              px-3
              py-2
              text-sm

              md:col-span-2
            "
            rows={2}
          />


          {error && (
            <p
              className="
                text-sm
                text-red-600
                md:col-span-2
              "
            >
              {error}
            </p>
          )}


          <div
            className="
              md:col-span-2

              flex
              flex-col
              gap-2

              sm:flex-row
            "
          >
            <button
              type="submit"
              disabled={uploading || saving}
              className="
                bg-leaf
                text-cream
                text-sm
                font-semibold
                px-4
                py-2
                rounded-full
                disabled:opacity-60
                w-full
                sm:w-auto
              "
            >
              {saving
                ? "Saving..."
                : editing === "new"
                ? "Save product"
                : "Update product"}
            </button>

            <button
              type="button"
              onClick={cancelForm}
              disabled={saving}
              className="
                text-sm
                text-ink/50
                disabled:opacity-50
                w-full
                sm:w-auto
                px-4
                py-2
              "
            >
              Cancel
            </button>
          </div>

        </form>
      )}


      {/* =====================================================
          ERROR
      ====================================================== */}
      {!editing && error && (
        <div
          className="
            bg-red-50
            border
            border-red-200
            text-red-600
            text-sm
            rounded-lg
            px-4
            py-3
            mb-4
          "
        >
          {error}
        </div>
      )}


      {/* =====================================================
          DESKTOP PRODUCTS TABLE
          Visible only on desktop
      ====================================================== */}
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

          <thead className="bg-ink/5 text-left text-ink/50">
            <tr>

              <th className="px-4 py-2">
                Product
              </th>

              <th className="px-4 py-2">
                Category
              </th>

              <th className="px-4 py-2">
                Price
              </th>

              <th className="px-4 py-2">
                Stock
              </th>

              <th className="px-4 py-2">
                Status
              </th>

              <th className="px-4 py-2"></th>

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
                  Loading products...
                </td>
              </tr>

            ) : products.length === 0 ? (

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
                  No products found.
                </td>
              </tr>

            ) : (

              products.map((p) => {
                const stock = Number(p.stockQty);

                const lowStock =
                  stock > 0 &&
                  stock <= Number(
                    p.lowStockAlert || 10
                  );

                const outOfStock = stock <= 0;

                return (
                  <tr
                    key={p.id}
                    className="border-t border-ink/5"
                  >

                    <td className="px-4 py-2 font-medium">
                      {p.name}{" "}
                      <span className="text-ink/40 font-normal">
                        ({p.unit})
                      </span>
                    </td>


                    <td className="px-4 py-2 text-ink/60">
                      {p.category?.name || "-"}
                    </td>


                    <td className="px-4 py-2">
                      ₹{Number(p.sellingPrice)}
                    </td>


                    <td className="px-4 py-2">

                      <input
                        type="number"
                        min="0"
                        defaultValue={stock}
                        onBlur={(e) => {
                          const newValue =
                            Number(e.target.value);

                          if (
                            Number.isFinite(newValue) &&
                            newValue !== stock
                          ) {
                            quickStock(
                              p.id,
                              newValue
                            );
                          }
                        }}
                        className={`
                          w-16
                          border
                          rounded
                          px-2
                          py-1
                          text-xs

                          ${
                            outOfStock
                              ? "border-red-400 text-red-600"
                              : lowStock
                              ? "border-mango text-mango"
                              : "border-ink/15"
                          }
                        `}
                      />

                    </td>


                    <td className="px-4 py-2">

                      {outOfStock ? (

                        <span
                          className="
                            text-xs
                            font-semibold
                            text-red-600
                            bg-red-100
                            px-2
                            py-1
                            rounded-full
                          "
                        >
                          OUT OF STOCK
                        </span>

                      ) : lowStock ? (

                        <span
                          className="
                            text-xs
                            font-semibold
                            text-mango
                            bg-mango/10
                            px-2
                            py-1
                            rounded-full
                          "
                        >
                          LOW STOCK
                        </span>

                      ) : (

                        <span
                          className="
                            text-xs
                            font-medium
                            text-leaf
                            bg-leaf-light
                            px-2
                            py-1
                            rounded-full
                          "
                        >
                          IN STOCK
                        </span>

                      )}

                    </td>


                    <td
                      className="
                        px-4
                        py-2
                        text-right
                        space-x-2
                      "
                    >

                      <button
                        onClick={() =>
                          startEdit(p)
                        }
                        className="text-leaf font-medium"
                      >
                        Edit
                      </button>


                      <button
                        onClick={() =>
                          deleteProduct(p.id)
                        }
                        className="text-red-500 font-medium"
                      >
                        Remove
                      </button>

                    </td>

                  </tr>
                );
              })

            )}

          </tbody>

        </table>
      </div>


      {/* =====================================================
          MOBILE PRODUCTS
          Visible only on phones/tablets
      ====================================================== */}
      <div className="lg:hidden space-y-3">

        {loading ? (

          <div
            className="
              bg-white
              rounded-xl2
              border
              border-ink/10
              px-4
              py-8
              text-center
              text-sm
              text-ink/50
            "
          >
            Loading products...
          </div>

        ) : products.length === 0 ? (

          <div
            className="
              bg-white
              rounded-xl2
              border
              border-ink/10
              px-4
              py-8
              text-center
              text-sm
              text-ink/50
            "
          >
            No products found.
          </div>

        ) : (

          products.map((p) => {
            const stock = Number(p.stockQty);
            const status = getStockStatus(p);

            return (
              <div
                key={p.id}
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

                {/* Product name */}
                <div className="min-w-0 mb-4">

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
                    {p.name}
                  </h2>

                  <div
                    className="
                      text-sm
                      text-ink/40
                      mt-1
                      break-words
                    "
                  >
                    {p.unit}
                  </div>

                </div>


                {/* Product details */}
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    text-sm
                  "
                >

                  {/* Category */}
                  <div>
                    <div className="text-xs text-ink/40 mb-1">
                      Category
                    </div>

                    <div
                      className="
                        font-medium
                        text-ink
                        break-words
                      "
                    >
                      {p.category?.name || "-"}
                    </div>
                  </div>


                  {/* Price */}
                  <div>
                    <div className="text-xs text-ink/40 mb-1">
                      Price
                    </div>

                    <div className="font-semibold text-ink">
                      ₹{Number(p.sellingPrice)}
                    </div>
                  </div>


                  {/* Stock */}
                  <div>
                    <div className="text-xs text-ink/40 mb-1">
                      Stock
                    </div>

                    <input
                      type="number"
                      min="0"
                      defaultValue={stock}
                      onBlur={(e) => {
                        const newValue =
                          Number(e.target.value);

                        if (
                          Number.isFinite(newValue) &&
                          newValue !== stock
                        ) {
                          quickStock(
                            p.id,
                            newValue
                          );
                        }
                      }}
                      className={`
                        w-full
                        max-w-full
                        border
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        bg-white

                        ${
                          stock <= 0
                            ? "border-red-400 text-red-600"
                            : stock <=
                              Number(
                                p.lowStockAlert || 10
                              )
                            ? "border-mango text-mango"
                            : "border-ink/15"
                        }
                      `}
                    />
                  </div>


                  {/* Status */}
                  <div>

                    <div className="text-xs text-ink/40 mb-1">
                      Status
                    </div>

                    <span
                      className={`
                        inline-flex
                        items-center
                        text-xs
                        font-semibold
                        px-3
                        py-1.5
                        rounded-full
                        ${status.className}
                      `}
                    >
                      {status.label}
                    </span>

                  </div>

                </div>


                {/* =================================================
                    MOBILE ACTIONS
                ================================================== */}
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

                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="
                      w-full
                      py-2.5
                      rounded-lg
                      border
                      border-leaf
                      text-leaf
                      text-sm
                      font-semibold
                      hover:bg-leaf-light
                      transition-colors
                    "
                  >
                    Edit
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      deleteProduct(p.id)
                    }
                    className="
                      w-full
                      py-2.5
                      rounded-lg
                      border
                      border-red-200
                      text-red-500
                      text-sm
                      font-semibold
                      hover:bg-red-50
                      transition-colors
                    "
                  >
                    Remove
                  </button>

                </div>

              </div>
            );
          })

        )}

      </div>

    </Layout>
  );
}