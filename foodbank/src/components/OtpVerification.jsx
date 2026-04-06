import { useState, useRef, useEffect } from "react";
import api from "../services/api";

export default function OtpVerification({ userId, onSuccess }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer === 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/verify-otp", { user_id: userId, otp: otpString });
      onSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/resend-otp", { user_id: userId });
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend OTP.");
    }
  };

  return (
    <div className="bg-foodbank">
      <div className="form-card fade-in" style={{ textAlign: "center" }}>

        {/* LOGO */}
        <img
          src="/images/logobrown.png"
          alt="FoodBank Logo"
          style={{ width: "180px", margin: "0 auto 16px" }}
        />

        {/* TITLE */}
        <h2 className="form-title">Verify Your Email</h2>
        <p className="form-subtitle">
          We sent a 6-digit code to your email. Enter it below.
        </p>

        {/* OTP INPUTS */}
        <div
          onPaste={handlePaste}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            margin: "28px 0",
          }}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: "48px",
                height: "56px",
                textAlign: "center",
                fontSize: "22px",
                fontWeight: "700",
                border: "2px solid",
                borderColor: digit ? "#5a3e2b" : "#ccc",
                borderRadius: "10px",
                outline: "none",
                transition: "border-color 0.2s",
                background: "#fff",
                color: "#333",
              }}
            />
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div className="error-summary" style={{ marginBottom: "16px" }}>
            <p className="error-summary-title" style={{ margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* VERIFY BUTTON */}
        <button
          onClick={handleVerify}
          className="btn-register"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        {/* RESEND */}
        <div style={{ marginTop: "16px", fontSize: "14px", color: "#888" }}>
          {resendTimer > 0 ? (
            <p>Resend code in {resendTimer}s</p>
          ) : (
            <button
              onClick={handleResend}
              style={{
                background: "none",
                border: "none",
                color: "#5a3e2b",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Resend Code
            </button>
          )}
        </div>

      </div>
    </div>
  );
}