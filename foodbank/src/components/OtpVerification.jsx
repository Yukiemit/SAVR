
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
      const res = await api.post("/verify-otp", {
        user_id: userId,
        otp: otpString,
      });
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
      <div className="form-card fade-in">
        <img
          src="/images/logobrown.png"
          alt="FoodBank Logo"
          className="w-48 mx-auto mb-2"
        />
        <h2 className="form-title">Verify Your Email</h2>
        <p className="form-subtitle">
          We sent a 6-digit code to your email. Enter it below.
        </p>

        <div className="flex justify-center gap-2 my-6" onPaste={handlePaste}>
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
              className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg
                         border-gray-300 focus:border-brown-500 focus:outline-none
                         transition-colors"
            />
          ))}
        </div>

        {error && (
          <div className="error-summary mb-4">
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          className="btn-register"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div className="text-center mt-4 text-sm text-gray-500">
          {resendTimer > 0 ? (
            <p>Resend code in {resendTimer}s</p>
          ) : (
            <button
              className="text-brown-600 underline cursor-pointer"
              onClick={handleResend}
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}