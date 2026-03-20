import { useState } from "react";
import api from "../services/api";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await api.post("/login", form);
      alert("Login successful!");
      console.log(res.data);
    } catch (err) {
      console.error(err.response?.data);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="bg-foodbank relative">

      {/* ✅ LOGO TOP LEFT */}
      <img
        src="/images/logoo.png"
        alt="FoodBank Logo"
        className="absolute top-6 left-10 w-60 z-20"
      />

      {/* ✅ FORM */}
      <div className="form-card fade-in relative z-20">

        <h2 className="form-title">Welcome back!</h2>
        <p className="form-subtitle">Please enter your details</p>

        {/* EMAIL */}
        <div className="mb-5">
          <input
            name="email"
            placeholder="Email"
            className="input w-full"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        {/* PASSWORD */}
        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            className="input w-full pr-10"
            value={form.password}
            onChange={handleChange}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 cursor-pointer"
          >
            👁️
          </span>
        </div>

        {/* REMEMBER + FORGOT */}
        <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Remember for 30 days
          </label>

          <span className="cursor-pointer hover:underline">
            Forgot Password?
          </span>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          className="w-full bg-gray-800 text-white py-3 rounded-full hover:bg-black transition"
        >
          Log In
        </button>

      </div>
    </div>
  );
}