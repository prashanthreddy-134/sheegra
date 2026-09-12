import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("phone");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  const phoneRegex = /^\+?[1-9]\d{9,14}$/;

  // ========================================
  // TEMPORARY CUSTOMER LOGIN WITHOUT OTP
  // TESTING ONLY
  // ========================================

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanPhone = phone.trim();

    if (!phoneRegex.test(cleanPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        phone: cleanPhone,
      });

      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not login. Please check your registered mobile number."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // REGISTRATION - REQUEST OTP
  // ========================================

  async function handleRegisterOtp(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (!phoneRegex.test(cleanPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register/otp/request", {
        name: cleanName,
        phone: cleanPhone,
      });

      setName(cleanName);
      setPhone(cleanPhone);
      setOtp("");
      setStep("otp");
      setResendCooldown(30);

      setMessage("OTP sent successfully.");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not send registration OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // REGISTRATION - VERIFY OTP
  // ========================================

  async function handleRegisterVerify(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register/otp/verify", {
        name: cleanName,
        phone: cleanPhone,
        code: cleanOtp,
      });

      setMode("login");
      setStep("phone");

      setName("");
      setPhone(cleanPhone);
      setOtp("");
      setResendCooldown(0);

      setError("");
      setMessage(
        "Account created successfully. Please log in with your registered mobile number."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not complete registration."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // RESEND REGISTRATION OTP
  // ========================================

  async function handleResendOtp() {
    if (resendCooldown > 0 || resendLoading || loading) {
      return;
    }

    setError("");
    setMessage("");

    const cleanPhone = phone.trim();

    if (!phoneRegex.test(cleanPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    setResendLoading(true);

    try {
      await api.post("/auth/register/otp/request", {
        name: name.trim(),
        phone: cleanPhone,
      });

      setOtp("");
      setResendCooldown(30);
      setMessage("A new OTP has been sent.");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not resend OTP."
      );
    } finally {
      setResendLoading(false);
    }
  }

  // ========================================
  // CHANGE NUMBER
  // ========================================

  function backToPhone() {
    setStep("phone");
    setOtp("");
    setResendCooldown(0);
    setError("");
    setMessage("");
  }

  // ========================================
  // SWITCH LOGIN / REGISTER
  // ========================================

  function switchMode(newMode) {
    setMode(newMode);
    setStep("phone");
    setOtp("");
    setResendCooldown(0);
    setError("");
    setMessage("");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-cream px-4">
      <div className="w-full max-w-sm bg-white rounded-xl2 border border-ink/10 p-6">

        {/* Logo */}
        <div className="w-10 h-10 rounded-xl2 bg-leaf grid place-items-center mb-4">
          <span className="text-cream font-display font-800">
            F
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-display font-800 text-xl mb-1">
          {mode === "login"
            ? "Log in to Sheegra"
            : step === "otp"
            ? "Verify your mobile number"
            : "Create your Sheegra account"}
        </h1>

        <p className="text-sm text-ink/60 mb-5">
          {mode === "login"
            ? "Login using your registered mobile number."
            : step === "otp"
            ? `Enter the 6-digit OTP sent to ${phone}`
            : "Create your customer account to start shopping."}
        </p>

        {/* ================================= */}
        {/* LOGIN - NO OTP FOR TESTING */}
        {/* ================================= */}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">

            <input
              type="tel"
              required
              placeholder="+91 98xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm"
              autoComplete="tel"
              disabled={loading}
            />

            {message && (
              <p className="text-sm text-green-600">
                {message}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>
        )}

        {/* ================================= */}
        {/* REGISTER - PHONE */}
        {/* ================================= */}

        {mode === "register" && step === "phone" && (
          <form
            onSubmit={handleRegisterOtp}
            className="space-y-3"
          >

            <input
              type="text"
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm"
              autoComplete="name"
              disabled={loading}
            />

            <input
              type="tel"
              required
              placeholder="+91 98xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm"
              autoComplete="tel"
              disabled={loading}
            />

            {message && (
              <p className="text-sm text-green-600">
                {message}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Create account"}
            </button>

          </form>
        )}

        {/* ================================= */}
        {/* REGISTER - OTP */}
        {/* ================================= */}

        {mode === "register" && step === "otp" && (
          <form
            onSubmit={handleRegisterVerify}
            className="space-y-3"
          >

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-center text-lg tracking-[0.4em] font-semibold"
              autoComplete="one-time-code"
              autoFocus
              disabled={loading}
            />

            {message && (
              <p className="text-sm text-green-600">
                {message}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-leaf text-cream rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Verify & Create Account"}
            </button>

            <div className="flex justify-between pt-1">

              <button
                type="button"
                onClick={backToPhone}
                disabled={loading}
                className="text-sm text-ink/60 hover:text-leaf"
              >
                Change number
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={
                  loading ||
                  resendLoading ||
                  resendCooldown > 0
                }
                className="text-sm text-leaf font-semibold disabled:opacity-50"
              >
                {resendLoading
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>

            </div>

          </form>
        )}

        {/* ================================= */}
        {/* LOGIN / REGISTER SWITCH */}
        {/* ================================= */}

        <div className="text-center mt-5 pt-4 border-t border-ink/10">

          {mode === "login" ? (
            <p className="text-sm text-ink/60">
              New to Sheegra?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-leaf font-semibold"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p className="text-sm text-ink/60">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-leaf font-semibold"
              >
                Log in
              </button>
            </p>
          )}

        </div>

      </div>
    </div>
  );
}