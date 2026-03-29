import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/forgot-password", { email });
      // ✅ GO TO RESET PAGE WITH user_id
      navigate("/reset-password", {
        state: { userId: res.data.user_id, email },
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError("No account found with that email.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-foodbank relative">
      <img
        src="/images/logoo.png"
        alt="FoodBank Logo"
        className="absolute top-6 left-10 w-60 z-20"
      />

      <div className="form-card fade-in relative z-20">
        <h2 className="form-title">Forgot Password</h2>
        <p className="form-subtitle">
          Enter your email and we'll send you a 6-digit code to reset your password.
        </p>

        <div className="mb-5">
          <input
            name="email"
            placeholder="Email Address"
            className={`input w-full ${error ? "input-error" : ""}`}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
          />
        </div>

        {error && (
          <div className="error-summary mb-4">
            <p className="error-summary-title">⚠️ {error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gray-800 text-white py-3 rounded-full hover:bg-black transition"
        >
          {loading ? "Sending Code..." : "Send Reset Code"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Remember your password?{" "}
          <span
            className="text-green-700 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </span>
        </p>
      </div>
    </div>
  );
}
