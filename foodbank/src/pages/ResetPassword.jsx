import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userId    = location.state?.userId;
  const email     = location.state?.email;

  // ── If no userId in state, redirect back ──
  if (!userId) {
    navigate("/forgot-password");
    return null;
  }

  const [step, setStep]       = useState("otp");  // "otp" | "newpass"
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [form, setForm]       = useState({ password: "", password_confirmation: "" });
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputsRef = useRef([]);

  // ── OTP input handling ──
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // ── Verify OTP ──
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/verify-reset-otp", { user_id: userId, otp: code });
      setStep("newpass");
    } catch (err) {
      const status = err.response?.status;
      if (status === 422) {
        setError("Invalid or expired code. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    try {
      await api.post("/forgot-password", { email });
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch {
      setError("Failed to resend code.");
    }
  };

  // ── Submit new password ──
  const handleResetPassword = async () => {
    if (!form.password) {
      setError("Please enter a new password.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/reset-password", {
        user_id:              userId,
        password:             form.password,
        password_confirmation: form.password_confirmation,
      });
      navigate("/login", { state: { message: "Password reset successful! Please log in." } });
    } catch {
      setError("Failed to reset password. Please try again.");
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

        {/* ── STEP 1: OTP ── */}
        {step === "otp" && (
          <>
            <h2 className="form-title">Enter Reset Code</h2>
            <p className="form-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            {/* OTP BOXES */}
            <div className="flex justify-center gap-3 my-6">
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
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                />
              ))}
            </div>

            {error && (
              <div className="error-summary mb-4">
                <p className="error-summary-title">⚠️ {error}</p>
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-gray-800 text-white py-3 rounded-full hover:bg-black transition"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              {resendTimer > 0 ? (
                `Resend code in ${resendTimer}s`
              ) : (
                <span
                  className="text-green-700 font-semibold cursor-pointer hover:underline"
                  onClick={handleResend}
                >
                  Resend Code
                </span>
              )}
            </p>
          </>
        )}

        {/* ── STEP 2: NEW PASSWORD ── */}
        {step === "newpass" && (
          <>
            <h2 className="form-title">Set New Password</h2>
            <p className="form-subtitle">
              Enter your new password below.
            </p>

            {/* NEW PASSWORD */}
            <div className="relative mb-5">
              <input
                type={showPass ? "text" : "password"}
                placeholder="New Password"
                className={`input w-full pr-10 ${error ? "input-error" : ""}`}
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }}
              />
              <span
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-2 cursor-pointer"
              >
                <span className="material-icons" style={{ fontSize: "20px", color: "#888" }}>
                  {showPass ? "visibility_off" : "visibility"}
                </span>
              </span>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="relative mb-5">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm New Password"
                className={`input w-full pr-10 ${error ? "input-error" : ""}`}
                value={form.password_confirmation}
                onChange={(e) => { setForm({ ...form, password_confirmation: e.target.value }); setError(""); }}
              />
              <span
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-2 cursor-pointer"
              >
                <span className="material-icons" style={{ fontSize: "20px", color: "#888" }}>
                  {showConfirm ? "visibility_off" : "visibility"}
                </span>
              </span>
            </div>

            {error && (
              <div className="error-summary mb-4">
                <p className="error-summary-title">⚠️ {error}</p>
              </div>
            )}

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-gray-800 text-white py-3 rounded-full hover:bg-black transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
