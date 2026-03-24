import { useState } from "react";
import api from "../services/api";

export default function RegisterDonor() {
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    gender: "",
    dob: "",
    house: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    zip: "",
    contact: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // ✅ CLEAR ERROR ON FIELD CHANGE
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // ── PERSONAL INFO ──
    if (!form.first_name.trim())
      newErrors.first_name = "First name is required.";
    if (!form.last_name.trim())
      newErrors.last_name = "Last name is required.";

    // ── ADDRESS (all required) ──
    if (!form.house.trim()) {
      newErrors.house = "House # is required.";
    } else if (!/^\d+$/.test(form.house.trim())) {
      newErrors.house = "House # must be a number only.";
    }
    if (!form.street.trim())
      newErrors.street = "Street is required.";
    if (!form.barangay.trim())
      newErrors.barangay = "Barangay is required.";
    if (!form.city.trim())
      newErrors.city = "City is required.";
    if (!form.province.trim())
      newErrors.province = "Province is required.";
    if (!form.zip.trim()) {
      newErrors.zip = "ZIP Code is required.";
    } else if (!/^\d+$/.test(form.zip.trim())) {
      newErrors.zip = "ZIP Code must be numbers only.";
    }

    // ── CONTACT ──
    if (!form.contact.trim()) {
      newErrors.contact = "Contact number is required.";
    } else if (!/^\d{11}$/.test(form.contact.trim())) {
      newErrors.contact = "Contact number must be exactly 11 digits.";
    }

    // ── EMAIL ──
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email must contain "@" and ".".';
    }

    // ── PASSWORD ──
    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      newErrors.password =
        "Password must be at least 8 characters with uppercase, lowercase, and a number.";
    }

    // ── CONFIRM PASSWORD ──
    if (!form.password_confirmation) {
      newErrors.password_confirmation = "Please confirm your password.";
    } else if (form.password !== form.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    // ✅ RUN CLIENT-SIDE VALIDATION FIRST
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await api.post("/register", {
        ...form,
        name: form.first_name + " " + form.last_name,
        role: "donor",
      });

      alert("Registered Successfully!");

      // ✅ RESET FORM AFTER SUCCESS
      setForm({
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        gender: "",
        dob: "",
        house: "",
        street: "",
        barangay: "",
        city: "",
        province: "",
        zip: "",
        contact: "",
        email: "",
        password: "",
        password_confirmation: "",
      });

    } catch (err) {
      const laravelErrors = err.response?.data?.errors;
      const statusCode = err.response?.status;

      if (laravelErrors) {
        // ✅ MAP LARAVEL VALIDATION ERRORS TO FIELDS
        const mapped = {};
        for (const field in laravelErrors) {
          mapped[field] = laravelErrors[field][0];
        }
        setErrors(mapped);
      } else if (statusCode === 422) {
        setErrors({ general: "Validation failed. Please check your inputs." });
      } else if (statusCode === 500) {
        setErrors({ general: "Server error. Please try again later." });
      } else {
        setErrors({ general: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ COLLECT ALL ACTIVE ERRORS INTO A LIST
  const errorList = Object.entries(errors)
    .filter(([_, msg]) => msg)
    .map(([field, msg]) => ({ field, msg }));

  return (
    <div className="bg-foodbank">
      <div className="form-card fade-in">

        {/* LOGO */}
        <img
          src="/images/logobrown.png"
          alt="FoodBank Logo"
          className="w-48 mx-auto mb-2"
        />
        <h2 className="form-title">Register as Donor!</h2>
        <p className="form-subtitle">Please enter your details</p>

        {/* ── PERSONAL INFO ── */}
        <div className="input-group">
          <input
            name="first_name"
            value={form.first_name}
            placeholder="First Name"
            className={`input ${errors.first_name ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <input
            name="last_name"
            value={form.last_name}
            placeholder="Last Name"
            className={`input ${errors.last_name ? "input-error" : ""}`}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <input
            name="middle_name"
            value={form.middle_name}
            placeholder="Middle Name"
            className="input"
            onChange={handleChange}
          />
          <input
            name="suffix"
            value={form.suffix}
            placeholder="Suffix"
            className="input"
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <input
            type="date"
            name="dob"
            value={form.dob}
            className="input"
            onChange={handleChange}
          />
          <select
            name="gender"
            value={form.gender}
            className="input"
            onChange={handleChange}
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        {/* ── ADDRESS ── */}
        <div className="input-group">
          <input
            name="house"
            value={form.house}
            placeholder="House #"
            className={`input ${errors.house ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <input
            name="street"
            value={form.street}
            placeholder="Street"
            className={`input ${errors.street ? "input-error" : ""}`}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <input
            name="barangay"
            value={form.barangay}
            placeholder="Barangay"
            className={`input ${errors.barangay ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <input
            name="city"
            value={form.city}
            placeholder="City"
            className={`input ${errors.city ? "input-error" : ""}`}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <input
            name="province"
            value={form.province}
            placeholder="Province"
            className={`input ${errors.province ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <input
            name="zip"
            value={form.zip}
            placeholder="ZIP Code"
            className={`input ${errors.zip ? "input-error" : ""}`}
            onChange={handleChange}
          />
        </div>

        {/* ── CONTACT & EMAIL ── */}
        <div className="input-group">
          <input
            name="contact"
            value={form.contact}
            placeholder="Contact Number"
            className={`input ${errors.contact ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <input
            name="email"
            value={form.email}
            placeholder="Email"
            className={`input ${errors.email ? "input-error" : ""}`}
            onChange={handleChange}
          />
        </div>

        {/* ── PASSWORD ── */}
        <div className="input-group">
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              placeholder="Password"
              className={`input w-full pr-10 ${errors.password ? "input-error" : ""}`}
              onChange={handleChange}
            />
            <span
              className="absolute right-2 top-2 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-icons" style={{ fontSize: "20px", color: "#888" }}>
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </span>
          </div>

          <div className="relative w-full">
            <input
              type={showConfirm ? "text" : "password"}
              name="password_confirmation"
              value={form.password_confirmation}
              placeholder="Confirm Password"
              className={`input w-full pr-10 ${errors.password_confirmation ? "input-error" : ""}`}
              onChange={handleChange}
            />
            <span
              className="absolute right-2 top-2 cursor-pointer"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              <span className="material-icons" style={{ fontSize: "20px", color: "#888" }}>
                {showConfirm ? "visibility_off" : "visibility"}
              </span>
            </span>
          </div>
        </div>

        {/* ✅ ERROR SUMMARY — BELOW FORM, ABOVE BUTTON */}
        {errorList.length > 0 && (
          <div className="error-summary">
            <p className="error-summary-title">⚠️ Please fix the following:</p>
            <ul className="error-summary-list">
              {errorList.map(({ field, msg }) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="btn-register"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

      </div>
    </div>
  );
}
