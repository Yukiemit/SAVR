import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.identifier.trim()) {
      newErrors.identifier = "Email or is required.";
    }
    // ✅ Only validate email format if it looks like an email
    else if (
      form.identifier.includes("@") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identifier)
    ) {
      newErrors.identifier = "Enter a valid email address.";
    }
    if (!form.password) newErrors.password = "Password is required.";
    return newErrors;
  };

  const handleSubmit = async () => {
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }

    setLoading(true);
    setErrors({});

    try {
      const res = await api.post("/login", {
        identifier: form.identifier,
        password:   form.password,
        remember:   form.remember,
      });

      const { token, role, sub_type, user } = res.data;

      localStorage.setItem("token",    token);
      localStorage.setItem("user",     JSON.stringify(user));
      localStorage.setItem("role",     role);
      localStorage.setItem("sub_type", sub_type ?? "individual");

      if (role === "admin")             navigate("/admin/dashboard");
      else if (role === "staff")        navigate("/staff/dashboard");
      else if (role === "donor")        navigate("/donor/dashboard");
      else if (role === "beneficiary")  navigate("/beneficiary/dashboard");
      else if (role === "organization") navigate("/org/dashboard");

    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 403 && message?.includes("verify")) {
        const userId = err.response?.data?.user_id;
        navigate(`/verify-otp?user_id=${userId}`);
        return; // don't fall through to setLoading(false) below
      } else if (!err.response) {
        setErrors({ general: "Cannot reach the server. Make sure the backend is running." });
      } else {
        // Show the actual message from the backend so you know exactly what's wrong
        setErrors({ general: message || `Error ${status}: Something went wrong.` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="reg-main-bg">
      <nav className="navbar">
        <div className="logo">
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/partners">Partners</a>
          <a href="/media">Media</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      <div className="login-content fade-in">
        <img src="/images/logoo.png" alt="FoodBank Logo" className="login-logo" />

        <div className="login-glass-card">
          <div className="login-heading">
            <h1 className="login-title">
              WELCOME <span className="reg-main-title-accent">BACK!</span>
            </h1>
            <p className="login-subtitle">Please enter your details</p>
          </div>

          {errors.general && (
            <div style={{
              background: "#fdecea",
              border: "1.5px solid #f44336",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}>
              <span className="material-symbols-rounded" style={{ color: "#c62828", fontSize: 22, flexShrink: 0 }}>error</span>
              <p style={{ margin: 0, color: "#c62828", fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                {errors.general}
              </p>
            </div>
          )}

          {/* ✅ Changed: label + field name is now "identifier" */}
          <div className="login-field">
            <label className="reg-label">Email</label>
            <div className="reg-password-wrap">
              <input
                type="text"
                name="identifier"
                value={form.identifier}
                placeholder="Enter your email"
                className={`reg-input ${errors.identifier ? "reg-input-error" : ""}`}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="username"
              />
            </div>
            {errors.identifier && <p className="login-field-error">{errors.identifier}</p>}
          </div>

          <div className="login-field">
            <label className="reg-label">Password</label>
            <div className="reg-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                placeholder="Password"
                className={`reg-input ${errors.password ? "reg-input-error" : ""}`}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
              <span className="reg-eye" onClick={() => setShowPassword(!showPassword)}>
                <span className="material-symbols-rounded">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </span>
            </div>
            {errors.password && <p className="login-field-error">{errors.password}</p>}
          </div>

          <div className="login-row-meta">
            <label className="login-remember">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="login-checkbox"
              />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="login-forgot">Forgot Password?</a>
          </div>

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button onClick={handleSubmit} className="reg-submit-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </div>

          <p className="login-register-link">
            Don't have an account?{" "}
            <a href="/register" className="login-register-anchor">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
}