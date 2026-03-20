import { useState } from "react";
import api from "../services/api";

export default function RegisterOrg() {
  const [form, setForm] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (form.password !== form.password_confirmation) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await api.post("/register", {
        ...form,
        role: "organization",
      });

      alert("Organization Registered!");
    } catch (err) {
      console.log(err.response?.data);
      alert(JSON.stringify(err.response?.data?.errors));
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-foodbank">

      {/* GREEN OVERLAY */}
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm"></div>

      {/* FORM CARD */}
      <div className="relative form-card fade-in w-[420px] p-8">
        {/* ✅ LOGO (TOP CENTER) */}
        <img
          src="/images/logobrown.png"
          alt="FoodBank Logo"
          className="w-48 mx-auto mb-2"
        />
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Register as Organization!
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Please enter your details
        </p>

        {/* ORG NAME */}
        <div className="input-group">
          <input
            name="org_name"
            placeholder="Organization Name"
            className="input"
            onChange={handleChange}
          />
        </div>

        {/* WEBSITE */}
        <div className="input-group flex items-center">
          <input
            name="website"
            placeholder="Website URL"
            className="input"
            onChange={handleChange}
          />
          <span className="ml-2">🔗</span>
        </div>

        {/* INDUSTRY + TYPE */}
        <div className="input-group grid grid-cols-2 gap-4">
          <select name="industry" className="input" onChange={handleChange}>
            <option>Industry / Sector</option>
            <option>Food</option>
            <option>NGO</option>
            <option>Corporate</option>
          </select>

          <select name="type" className="input" onChange={handleChange}>
            <option>Organization Type</option>
            <option>Private</option>
            <option>Public</option>
          </select>
        </div>

        {/* CONTACT PERSON */}
        <div className="input-group grid grid-cols-2 gap-4">
          <input
            name="contact_person"
            placeholder="Contact Person"
            className="input"
            onChange={handleChange}
          />
          <input
            name="position"
            placeholder="Position / Role"
            className="input"
            onChange={handleChange}
          />
        </div>

        {/* EMAIL + CONTACT */}
        <div className="input-group grid grid-cols-2 gap-4">
          <input
            name="email"
            placeholder="Email Address"
            className="input"
            onChange={handleChange}
          />
          <input
            name="contact"
            placeholder="Contact Number"
            className="input"
            onChange={handleChange}
          />
        </div>

        {/* PASSWORD */}
        <div className="input-group flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            className="input"
            onChange={handleChange}
          />
          <span
            className="ml-2 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </span>
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="input-group flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            name="password_confirmation"
            placeholder="Confirm Password"
            className="input"
            onChange={handleChange}
          />
          <span
            className="ml-2 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </span>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          className="btn-register mt-6"
        >
          Register
        </button>
      </div>
    </div>
  );
}