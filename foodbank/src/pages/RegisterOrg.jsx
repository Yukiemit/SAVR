import { useState } from "react";
import api from "../services/api";

export default function RegisterOrg() {
  const [form, setForm] = useState({
    org_name: "",
    website: "",
    industry: "",
    type: "",
    contact_person: "",
    position: "",
    email: "",
    contact: "",
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

    // ── ORG NAME ──
    if (!form.org_name.trim())
      newErrors.org_name = "Organization name is required.";

    // ── WEBSITE ──
    if (form.website.trim()) {
      try {
        new URL(form.website.trim());
      } catch {
        newErrors.website = "Website must be a valid URL (e.g. https://example.com).";
      }
    }

    // ── INDUSTRY & TYPE (required dropdowns) ──
    if (!form.industry || form.industry === "Industry / Sector")
      newErrors.industry = "Please select an industry/sector.";
    if (!form.type || form.type === "Organization Type")
      newErrors.type = "Please select an organization type.";

    // ── CONTACT PERSON ──
    if (!form.contact_person.trim())
      newErrors.contact_person = "Contact person is required.";

    // ── EMAIL ──
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email must contain "@" and ".".';
    }

    // ── CONTACT NUMBER ──
    if (!form.contact.trim()) {
      newErrors.contact = "Contact number is required.";
    } else if (!/^\d{11}$/.test(form.contact.trim())) {
      newErrors.contact = "Contact number must be exactly 11 digits.";
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
        role: "organization",
      });

      alert("Organization Registered!");

      // ✅ RESET FORM AFTER SUCCESS
      setForm({
        org_name: "",
        website: "",
        industry: "",
        type: "",
        contact_person: "",
        position: "",
        email: "",
        contact: "",
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
    <div className="relative min-h-screen flex items-center justify-center bg-foodbank">

      {/* GREEN OVERLAY */}
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm"></div>

      {/* FORM CARD */}
      <div className="relative form-card fade-in w-[420px] p-8">

        {/* LOGO */}
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

        {/* ── ORG NAME ── */}
        <div className="input-group">
          <input
            name="org_name"
            value={form.org_name}
            placeholder="Organization Name"
            className={`input ${errors.org_name ? "input-error" : ""}`}
            onChange={handleChange}
          />
        </div>

        {/* ── WEBSITE ── */}
        <div className="input-group flex items-center">
          <input
            name="website"
            value={form.website}
            placeholder="Website URL"
            className={`input ${errors.website ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <span className="ml-2">🔗</span>
        </div>

        {/* ── INDUSTRY + TYPE ── */}
        <div className="input-group grid grid-cols-2 gap-4">
          <select
            name="industry"
            value={form.industry}
            className={`input ${errors.industry ? "input-error" : ""}`}
            onChange={handleChange}
          >
            <option value="">Industry / Sector</option>
            <option>Food</option>
            <option>NGO</option>
            <option>Corporate</option>
          </select>

          <select
            name="type"
            value={form.type}
            className={`input ${errors.type ? "input-error" : ""}`}
            onChange={handleChange}
          >
            <option value="">Organization Type</option>
            <option>Private</option>
            <option>Public</option>
          </select>
        </div>

        {/* ── CONTACT PERSON + POSITION ── */}
        <div className="input-group grid grid-cols-2 gap-4">
          <input
            name="contact_person"
            value={form.contact_person}
            placeholder="Contact Person"
            className={`input ${errors.contact_person ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <input
            name="position"
            value={form.position}
            placeholder="Position / Role"
            className="input"
            onChange={handleChange}
          />
        </div>

        {/* ── EMAIL + CONTACT ── */}
        <div className="input-group grid grid-cols-2 gap-4">
          <input
            name="email"
            value={form.email}
            placeholder="Email Address"
            className={`input ${errors.email ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <input
            name="contact"
            value={form.contact}
            placeholder="Contact Number"
            className={`input ${errors.contact ? "input-error" : ""}`}
            onChange={handleChange}
          />
        </div>

        {/* ── PASSWORD ── */}
        <div className="input-group flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            placeholder="Password"
            className={`input ${errors.password ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <span
            className="ml-2 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-icons" style={{ fontSize: "20px", color: "#888" }}>
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </span>
        </div>

        {/* ── CONFIRM PASSWORD ── */}
        <div className="input-group flex items-center">
          <input
            type={showConfirm ? "text" : "password"}
            name="password_confirmation"
            value={form.password_confirmation}
            placeholder="Confirm Password"
            className={`input ${errors.password_confirmation ? "input-error" : ""}`}
            onChange={handleChange}
          />
          <span
            className="ml-2 cursor-pointer"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            <span className="material-icons" style={{ fontSize: "20px", color: "#888" }}>
              {showConfirm ? "visibility_off" : "visibility"}
            </span>
          </span>
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

        {/* ── BUTTON ── */}
        <button
          onClick={handleSubmit}
          className="btn-register mt-6"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

      </div>
    </div>
  );
}
