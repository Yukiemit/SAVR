import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: "", // email for donor/org, username for admin/staff
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async () => {
    if (!form.identifier || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/login", form);
      const { role, user } = res.data;

      // ✅ SAVE USER INFO TO localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", role);

      // ✅ REDIRECT BASED ON ROLE
      if (role === "admin")        navigate("/admin/dashboard");
      else if (role === "staff")   navigate("/staff/dashboard");
      else if (role === "donor")   navigate("/donor/dashboard");
      else if (role == "organization")      navigate("/donor/dashboard");

    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 403 && err.response?.data?.user_id) {
        // ✅ UNVERIFIED EMAIL — redirect to OTP page
        navigate("/verify", { state: { userId: err.response.data.user_id } });
      } else {
        setError(message || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isTypingEmail = form.identifier.includes("@");
  const placeholder   = form.identifier === ""
    ? "Email or Username"
    : isTypingEmail ? "Email Address" : "Username";

  return (
    <div className="bg-foodbank relative">

      {/* LOGO TOP LEFT */}
      <img
        src="/images/logoo.png"
        alt="FoodBank Logo"
        className="absolute top-6 left-10 w-60 z-20"
      />

      {/* FORM */}
      <div className="form-card fade-in relative z-20">

        <h2 className="form-title">Welcome back!</h2>
        <p className="form-subtitle">Please enter your details</p>

        {/* IDENTIFIER — email or username */}
        <div className="mb-5">
          <input
            name="identifier"
            placeholder={placeholder}
            className={`input w-full ${error ? "input-error" : ""}`}
            value={form.identifier}
            onChange={handleChange}
          />
        </div>

        {/* PASSWORD */}
        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            className={`input w-full pr-10 ${error ? "input-error" : ""}`}
            value={form.password}
            onChange={handleChange}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 cursor-pointer"
          >
            <span className="material-icons" style={{ fontSize: "20px", color: "#888" }}>
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </span>
        </div>

        {/* REMEMBER + FORGOT */}
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Remember for 30 days
          </label>
          <span className="cursor-pointer hover:underline" onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </span>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-summary mb-4">
            <p className="error-summary-title">⚠️ {error}</p>
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gray-800 text-white py-3 rounded-full hover:bg-black transition"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </div>
    </div>
  );
}