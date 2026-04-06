import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userId    = location.state?.userId;
  const email     = location.state?.email;

  if (!userId) { navigate("/forgot-password"); return null; }

  const [step, setStep]               = useState("otp");
  const [otp, setOtp]                 = useState(["", "", "", "", "", ""]);
  const [form, setForm]               = useState({ password: "", password_confirmation: "" });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputsRef = useRef([]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/verify-reset-otp", { user_id: userId, otp: code });
      setStep("newpass");
    } catch (err) {
      setError(err.response?.status === 422
        ? "Invalid or expired code. Please try again."
        : "Something went wrong. Please try again."
      );
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post("/forgot-password", { email });
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((t) => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
      }, 1000);
    } catch { setError("Failed to resend code."); }
  };

  const handleResetPassword = async () => {
    if (!form.password) { setError("Please enter a new password."); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number."); return;
    }
    if (form.password !== form.password_confirmation) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/reset-password", {
        user_id: userId, password: form.password, password_confirmation: form.password_confirmation,
      });
      navigate("/login", { state: { message: "Password reset successful! Please log in." } });
    } catch { setError("Failed to reset password. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="reg-main-bg">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <img src="/images/logobrown.png" alt="Logo" style={{ height: "40px" }} />
        </div>
      </nav>

      <div className="login-content fade-in">
        <img src="/images/logoo.png" alt="FoodBank Logo" className="login-logo" />

        <div className="login-glass-card">

          {/* ── STEP 1: OTP ── */}
          {step === "otp" && (
            <>
              <div className="login-heading">
                <h1 className="login-title">
                  RESET <span className="reg-main-title-accent">CODE</span>
                </h1>
                <p className="login-subtitle">
                  We sent a 6-digit code to <strong style={{ color: "white" }}>{email}</strong>
                </p>
              </div>

              {/* OTP BOXES */}
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", margin: "8px 0" }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    style={{
                      width: "48px", height: "56px", textAlign: "center",
                      fontSize: "22px", fontWeight: "700",
                      border: "2px solid", borderColor: digit ? "#f4b942" : "rgba(255,255,255,0.4)",
                      borderRadius: "10px", outline: "none",
                      background: "rgba(255,255,255,0.15)", color: "white",
                      transition: "border-color 0.2s",
                    }}
                  />
                ))}
              </div>

              {error && (
                <div className="error-summary">
                  <p className="error-summary-title" style={{ margin: 0 }}>⚠️ {error}</p>
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <button onClick={handleVerifyOtp} disabled={loading} className="reg-submit-btn">
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </div>

              <p className="login-register-link">
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : (
                  <span onClick={handleResend} className="login-register-anchor" style={{ cursor: "pointer" }}>
                    Resend Code
                  </span>
                )}
              </p>
            </>
          )}

          {/* ── STEP 2: NEW PASSWORD ── */}
          {step === "newpass" && (
            <>
              <div className="login-heading">
                <h1 className="login-title">
                  NEW <span className="reg-main-title-accent">PASSWORD</span>
                </h1>
                <p className="login-subtitle">Enter your new password below.</p>
              </div>

              {/* NEW PASSWORD */}
              <div className="login-field">
                <label className="reg-label">New Password</label>
                <div className="reg-password-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="New Password"
                    className={`reg-input ${error ? "reg-input-error" : ""}`}
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }}
                  />
                  <span className="reg-eye" onClick={() => setShowPass(!showPass)}>
                    <span className="material-symbols-rounded">
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </span>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="login-field">
                <label className="reg-label">Confirm New Password</label>
                <div className="reg-password-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm New Password"
                    className={`reg-input ${error ? "reg-input-error" : ""}`}
                    value={form.password_confirmation}
                    onChange={(e) => { setForm({ ...form, password_confirmation: e.target.value }); setError(""); }}
                  />
                  <span className="reg-eye" onClick={() => setShowConfirm(!showConfirm)}>
                    <span className="material-symbols-rounded">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </span>
                </div>
              </div>

              {error && (
                <div className="error-summary">
                  <p className="error-summary-title" style={{ margin: 0 }}>⚠️ {error}</p>
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <button onClick={handleResetPassword} disabled={loading} className="reg-submit-btn">
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}