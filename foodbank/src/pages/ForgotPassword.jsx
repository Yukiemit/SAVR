import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address."); return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/forgot-password", { email });
      navigate("/reset-password", { state: { userId: res.data.user_id, email } });
    } catch (err) {
      setError(err.response?.status === 404
        ? "No account found with that email."
        : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-main-bg">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <img src="/images/logobrown.png" alt="Logo" style={{ height: "40px" }} />
        </div>
      </nav>

      {/* CARD */}
      <div className="login-content fade-in">
        <img src="/images/logoo.png" alt="FoodBank Logo" className="login-logo" />

        <div className="login-glass-card">
          <div className="login-heading">
            <h1 className="login-title">
              FORGOT <span className="reg-main-title-accent">PASSWORD</span>
            </h1>
            <p className="login-subtitle">
              Enter your email and we'll send you a 6-digit code to reset your password.
            </p>
          </div>

          {/* EMAIL INPUT */}
          <div className="login-field">
            <label className="reg-label">Email Address</label>
            <div className="reg-password-wrap">
              <input
                name="email"
                placeholder="Email Address"
                className={`reg-input ${error ? "reg-input-error" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="error-summary">
              <p className="error-summary-title" style={{ margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          {/* BUTTON */}
          <div style={{ textAlign: "center" }}>
            <button onClick={handleSubmit} disabled={loading} className="reg-submit-btn">
              {loading ? "Sending Code..." : "Send Reset Code"}
            </button>
          </div>

          {/* BACK TO LOGIN */}
          <p className="login-register-link">
            Remember your password?{" "}
            <span onClick={() => navigate("/login")} className="login-register-anchor" style={{ cursor: "pointer" }}>
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}