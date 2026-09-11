import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function requestOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/admin/otp/request", { phone });
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.error || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/admin/otp/verify", { phone, code });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-panel px-4">
      <div className="w-full max-w-sm bg-white rounded-xl2 p-6">
        <div className="w-10 h-10 rounded-xl2 bg-leaf grid place-items-center mb-4">
          <span className="text-cream font-display font-800">F</span>
        </div>
        <h1 className="font-display font-800 text-xl mb-1">Sheegra Admin</h1>
        <p className="text-sm text-ink/60 mb-5">
          {step === "phone" ? "Sign in with your registered admin number." : `Code sent to ${phone}`}
        </p>

        {step === "phone" ? (
          <form onSubmit={requestOtp} className="space-y-3">
            <input type="tel" required placeholder="+91 98xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading} className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold disabled:opacity-60">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <input type="text" required maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm tracking-widest font-mono" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={loading} className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold disabled:opacity-60">
              {loading ? "Verifying..." : "Verify & sign in"}
            </button>
            <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-ink/50">Change number</button>
          </form>
        )}
      </div>
    </div>
  );
}
