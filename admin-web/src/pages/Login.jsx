import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/admin/login", {
        phone,
      });

      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not login"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-panel px-4">
      <div className="w-full max-w-sm bg-white rounded-xl2 p-6">
        <div className="w-10 h-10 rounded-xl2 bg-leaf grid place-items-center mb-4">
          <span className="text-cream font-display font-800">
            S
          </span>
        </div>

        <h1 className="font-display font-800 text-xl mb-1">
          Sheegra Admin
        </h1>

        <p className="text-sm text-ink/60 mb-5">
          Sign in with your registered admin number.
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-3"
        >
          <input
            type="tel"
            required
            placeholder="+91 98xxxxxxxx"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm"
          />

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
              ? "Signing in..."
              : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}