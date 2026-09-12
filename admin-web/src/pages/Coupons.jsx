import { useEffect, useState } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";

const EMPTY = { code: "", description: "", discountType: "FLAT", discountValue: "", minOrderValue: "", maxDiscount: "", usageLimit: "" };

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api.get("/admin/coupons").then((res) => setCoupons(res.data));
  }
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        ...(form.minOrderValue && { minOrderValue: Number(form.minOrderValue) }),
        ...(form.maxDiscount && { maxDiscount: Number(form.maxDiscount) }),
        ...(form.usageLimit && { usageLimit: Number(form.usageLimit) }),
      };
      await api.post("/admin/coupons", payload);
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create coupon");
    }
  }

  async function deactivate(id) {
    await api.delete(`/admin/coupons/${id}`);
    load();
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-5">
        <h1 className="font-display font-800 text-xl">Coupons & offers</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-leaf text-cream text-sm font-semibold px-4 py-2 rounded-full">
          {showForm ? "Cancel" : "+ New coupon"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white rounded-xl2 border border-ink/10 p-4 mb-5 grid md:grid-cols-3 gap-3">
          <input required placeholder="Code (e.g. SHEE50)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="border border-ink/15 rounded-lg px-3 py-2 text-sm" />
          <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="border border-ink/15 rounded-lg px-3 py-2 text-sm">
            <option value="FLAT">Flat amount (₹)</option>
            <option value="PERCENT">Percentage (%)</option>
          </select>
          <input required type="number" placeholder="Discount value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="border border-ink/15 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Min order value" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} className="border border-ink/15 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Max discount cap" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="border border-ink/15 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="border border-ink/15 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-ink/15 rounded-lg px-3 py-2 text-sm md:col-span-3" />
          {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}
          <button className="bg-leaf text-cream text-sm font-semibold px-4 py-2 rounded-full md:col-span-3 w-fit">Create coupon</button>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-xl2 border border-ink/10 p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono font-semibold">{c.code}</div>
                <div className="text-xs text-ink/50">{c.description}</div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.isActive ? "bg-leaf-light text-leaf" : "bg-red-100 text-red-600"}`}>
                {c.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="text-sm mt-2">
              {c.discountType === "FLAT" ? `₹${Number(c.discountValue)} off` : `${Number(c.discountValue)}% off`}
              {c.minOrderValue && ` · Min order ₹${Number(c.minOrderValue)}`}
            </div>
            <div className="text-xs text-ink/50 mt-1">Used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""} times</div>
            {c.isActive && <button onClick={() => deactivate(c.id)} className="text-xs text-red-500 font-medium mt-2">Deactivate</button>}
          </div>
        ))}
      </div>
    </Layout>
  );
}
