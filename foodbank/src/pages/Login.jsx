import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
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
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address.';
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
        email: form.email,
        password: form.password,
        remember: form.remember,
      });

      const { token, role } = res.data;
      localStorage.setItem("token", token);

      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "staff") navigate("/staff/dashboard");
      else if (role === "donor") navigate("/donor/dashboard");
      else navigate("/dashboard");

    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 422) {
        setErrors({ general: "Invalid email or password. Please try again." });
      } else {
        setErrors({ general: "Something went wrong. Please try again later." });
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
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <img src="/images/logobrown.png" alt="Logo" style={{ height: "40px" }} />
        </div>
        <div className="nav-links">
          <a href="/home">Home</a>
          <a href="/about">About</a>
          <a href="/partners">Partners</a>
          <a href="/media">Media</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      {/* LOGIN CONTENT */}
      <div className="login-content fade-in">

        {/* LOGO */}
        <img
          src="/images/logoo.png"
          alt="FoodBank Logo"
          className="login-logo"
        />

        {/* GLASS CARD */}
        <div className="login-glass-card">

          {/* HEADING */}
          <div className="login-heading">
            <h1 className="login-title">
              WELCOME <span className="reg-main-title-accent">BACK!</span>
            </h1>
            <p className="login-subtitle">Please enter your details</p>
          </div>

          {/* GENERAL ERROR */}
          {errors.general && (
            <div className="error-summary" style={{ marginBottom: "4px" }}>
              <p className="error-summary-title" style={{ margin: 0 }}>⚠️ {errors.general}</p>
            </div>
          )}

          {/* EMAIL FIELD */}
          <div className="login-field">
            <label className="reg-label">Email</label>
            <div className="reg-password-wrap">
              <input
                name="email"
                value={form.email}
                placeholder="Email"
                className={`reg-input ${errors.email ? "reg-input-error" : ""}`}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="login-field-error">{errors.email}</p>}
          </div>

          {/* PASSWORD FIELD */}
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

          {/* REMEMBER ME + FORGOT PASSWORD */}
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
            <a href="/forgot-password" className="login-forgot">
              Forgot Password?
            </a>
          </div>

          {/* LOGIN BUTTON */}
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button
              onClick={handleSubmit}
              className="reg-submit-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </div>

          {/* REGISTER LINK */}
          <p className="login-register-link">
            Don't have an account?{" "}
            <a href="/register" className="login-register-anchor">
              Register here
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}
