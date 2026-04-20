import { useState } from "react";
import api from "../services/api";
import OtpVerification from "../components/OtpVerification";

// ── INDIVIDUAL FORM ──
function IndividualForm({ form, errors, handleChange, showPassword, setShowPassword, showConfirm, setShowConfirm }) {
  return (
    <>
      {/* ROW 1: First Name, Middle Name, Last Name, Suffix */}
      <div className="reg-form-row">
        <div className="reg-field reg-field-grow">
          <label className="reg-label">First Name</label>
          <input
            name="first_name"
            value={form.first_name}
            placeholder="First Name"
            className={`reg-input ${errors.first_name ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Middle Name</label>
          <input
            name="middle_name"
            value={form.middle_name}
            placeholder="Middle Name"
            className="reg-input"
            onChange={handleChange}
          />
        </div>
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Last Name</label>
          <input
            name="last_name"
            value={form.last_name}
            placeholder="Last Name"
            className={`reg-input ${errors.last_name ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field reg-field-sm">
          <label className="reg-label">Suffix</label>
          <input
            name="suffix"
            value={form.suffix}
            placeholder="Suffix"
            className="reg-input"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ROW 2: DOB, Gender, Email, Contact */}
      <div className="reg-form-row">
        <div className="reg-field">
          <label className="reg-label">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            className="reg-input"
            onChange={handleChange}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Gender</label>
          <select
            name="gender"
            value={form.gender}
            className="reg-input reg-select"
            onChange={handleChange}
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Email Address</label>
          <input
            name="email"
            value={form.email}
            placeholder="Email Address"
            className={`reg-input ${errors.email ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Contact Number</label>
          <input
            name="contact"
            value={form.contact}
            placeholder="Contact Number"
            className={`reg-input ${errors.contact ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ROW 3: Address */}
      <div className="reg-form-row">
        <div className="reg-field reg-field-xs">
          <label className="reg-label">House #</label>
          <input
            name="house"
            value={form.house}
            placeholder="House #"
            className={`reg-input ${errors.house ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Street</label>
          <input
            name="street"
            value={form.street}
            placeholder="Street"
            className={`reg-input ${errors.street ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Brgy.</label>
          <input
            name="barangay"
            value={form.barangay}
            placeholder="Brgy."
            className={`reg-input ${errors.barangay ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field reg-field-grow">
          <label className="reg-label">City / Municipality</label>
          <input
            name="city"
            value={form.city}
            placeholder="City / Municipality"
            className={`reg-input ${errors.city ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Province / Region</label>
          <input
            name="province"
            value={form.province}
            placeholder="Province / Region"
            className={`reg-input ${errors.province ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field reg-field-xs">
          <label className="reg-label">ZIP Code</label>
          <input
            name="zip"
            value={form.zip}
            placeholder="ZIP"
            className={`reg-input ${errors.zip ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ROW 4: Password */}
      <div className="reg-form-row">
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Password</label>
          <div className="reg-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              placeholder="Password"
              className={`reg-input ${errors.password ? "reg-input-error" : ""}`}
              onChange={handleChange}
            />
            <span className="reg-eye" onClick={() => setShowPassword(!showPassword)}>
              <span className="material-symbols-rounded">{showPassword ? "visibility_off" : "visibility"}</span>
            </span>
          </div>
        </div>
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Confirm Password</label>
          <div className="reg-password-wrap">
            <input
              type={showConfirm ? "text" : "password"}
              name="password_confirmation"
              value={form.password_confirmation}
              placeholder="Confirm Password"
              className={`reg-input ${errors.password_confirmation ? "reg-input-error" : ""}`}
              onChange={handleChange}
            />
            <span className="reg-eye" onClick={() => setShowConfirm(!showConfirm)}>
              <span className="material-symbols-rounded">{showConfirm ? "visibility_off" : "visibility"}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── ORGANIZATION FORM ──
function OrgForm({ form, errors, handleChange, showPassword, setShowPassword, showConfirm, setShowConfirm }) {
  return (
    <>
      {/* ROW 1: Org Name */}
      <div className="reg-form-row">
        <div className="reg-field" style={{ flex: 1 }}>
          <label className="reg-label">Organization Name</label>
          <input
            name="org_name"
            value={form.org_name}
            placeholder="Organization Name"
            className={`reg-input ${errors.org_name ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ROW 2: Website, Org Type, Industry */}
      <div className="reg-form-row">
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Website URL</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              name="website"
              value={form.website}
              placeholder="https://example.com"
              className={`reg-input ${errors.website ? "reg-input-error" : ""}`}
              onChange={handleChange}
              style={{ paddingRight: "32px" }}
            />
            <span className="material-symbols-rounded" style={{ position: "absolute", right: "8px", fontSize: "18px", color: "rgba(255,255,255,0.6)", pointerEvents: "none" }}>link</span>
          </div>
        </div>
        <div className="reg-field">
          <label className="reg-label">Organization Type</label>
          <select
            name="type"
            value={form.type}
            className={`reg-input reg-select ${errors.type ? "reg-input-error" : ""}`}
            onChange={handleChange}
          >
            <option value="">Organization Type</option>
            <option>Private</option>
            <option>Public</option>
          </select>
        </div>
        <div className="reg-field">
          <label className="reg-label">Industry / Sector</label>
          <select
            name="industry"
            value={form.industry}
            className={`reg-input reg-select ${errors.industry ? "reg-input-error" : ""}`}
            onChange={handleChange}
          >
            <option value="">Industry / Sector</option>
            <option>Food</option>
            <option>NGO</option>
            <option>Corporate</option>
          </select>
        </div>
      </div>

      {/* ROW 3: Contact Person, Last Name, Contact Number, Email */}
      <div className="reg-form-row">
        <div className="reg-field">
          <label className="reg-label">First Name</label>
          <input
            name="first_name"
            value={form.first_name}
            placeholder="First Name"
            className={`reg-input ${errors.first_name ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Last Name</label>
          <input
            name="last_name"
            value={form.last_name}
            placeholder="Last Name"
            className={`reg-input ${errors.last_name ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field">
          <label className="reg-label">Contact Number</label>
          <input
            name="contact"
            value={form.contact}
            placeholder="Contact Number"
            className={`reg-input ${errors.contact ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Email Address</label>
          <input
            name="email"
            value={form.email}
            placeholder="Email Address"
            className={`reg-input ${errors.email ? "reg-input-error" : ""}`}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ROW 4: Password */}
      <div className="reg-form-row">
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Password</label>
          <div className="reg-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              placeholder="Password"
              className={`reg-input ${errors.password ? "reg-input-error" : ""}`}
              onChange={handleChange}
            />
            <span className="reg-eye" onClick={() => setShowPassword(!showPassword)}>
              <span className="material-symbols-rounded">{showPassword ? "visibility_off" : "visibility"}</span>
            </span>
          </div>
        </div>
        <div className="reg-field reg-field-grow">
          <label className="reg-label">Confirm Password</label>
          <div className="reg-password-wrap">
            <input
              type={showConfirm ? "text" : "password"}
              name="password_confirmation"
              value={form.password_confirmation}
              placeholder="Confirm Password"
              className={`reg-input ${errors.password_confirmation ? "reg-input-error" : ""}`}
              onChange={handleChange}
            />
            <span className="reg-eye" onClick={() => setShowConfirm(!showConfirm)}>
              <span className="material-symbols-rounded">{showConfirm ? "visibility_off" : "visibility"}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── MAIN COMPONENT ──
export default function RegisterDonor() {
  const [tab, setTab] = useState("individual"); // "individual" | "organization"
  const [step, setStep] = useState("register"); // "register" | "verify" | "done"
  const [userId, setUserId] = useState(null);

  const [form, setForm] = useState({
    // individual
    first_name: "", middle_name: "", last_name: "", suffix: "",
    gender: "", dob: "",
    house: "", street: "", barangay: "", city: "", province: "", zip: "",
    contact: "", email: "", password: "", password_confirmation: "",
    // org
    org_name: "", website: "", industry: "", type: "",
    contact_person: "", position: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateIndividual = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!form.house.trim()) { newErrors.house = "House # is required."; }
    else if (!/^\d+$/.test(form.house.trim())) { newErrors.house = "House # must be a number only."; }
    if (!form.street.trim()) newErrors.street = "Street is required.";
    if (!form.barangay.trim()) newErrors.barangay = "Barangay is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (!form.province.trim()) newErrors.province = "Province is required.";
    if (!form.zip.trim()) { newErrors.zip = "ZIP Code is required."; }
    else if (!/^\d+$/.test(form.zip.trim())) { newErrors.zip = "ZIP Code must be numbers only."; }
    if (!form.contact.trim()) { newErrors.contact = "Contact number is required."; }
    else if (!/^\d{11}$/.test(form.contact.trim())) { newErrors.contact = "Contact number must be exactly 11 digits."; }
    if (!form.email.trim()) { newErrors.email = "Email is required."; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { newErrors.email = 'Email must contain "@" and ".".'; }
    if (!form.password) { newErrors.password = "Password is required."; }
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) { newErrors.password = "Password must be at least 8 characters with uppercase, lowercase, and a number."; }
    if (!form.password_confirmation) { newErrors.password_confirmation = "Please confirm your password."; }
    else if (form.password !== form.password_confirmation) { newErrors.password_confirmation = "Passwords do not match."; }
    return newErrors;
  };

  const validateOrg = () => {
    const newErrors = {};
    if (!form.org_name.trim()) newErrors.org_name = "Organization name is required.";
    if (form.website.trim()) {
      try { new URL(form.website.trim()); } catch { newErrors.website = "Website must be a valid URL."; }
    }
    if (!form.industry || form.industry === "Industry / Sector") newErrors.industry = "Please select an industry/sector.";
    if (!form.type || form.type === "Organization Type") newErrors.type = "Please select an organization type.";
    if (!form.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!form.email.trim()) { newErrors.email = "Email is required."; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { newErrors.email = 'Email must contain "@" and ".".'; }
    if (!form.contact.trim()) { newErrors.contact = "Contact number is required."; }
    else if (!/^\d{11}$/.test(form.contact.trim())) { newErrors.contact = "Contact number must be exactly 11 digits."; }
    if (!form.password) { newErrors.password = "Password is required."; }
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) { newErrors.password = "Password must be at least 8 characters with uppercase, lowercase, and a number."; }
    if (!form.password_confirmation) { newErrors.password_confirmation = "Please confirm your password."; }
    else if (form.password !== form.password_confirmation) { newErrors.password_confirmation = "Passwords do not match."; }
    return newErrors;
  };

  const handleSubmit = async () => {
    const clientErrors = tab === "individual" ? validateIndividual() : validateOrg();
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }

    setLoading(true);
    setErrors({});

    try {
      const payload = tab === "individual"
    ? { ...form, name: `${form.first_name} ${form.last_name}`, role: "donor" }
    : { ...form, contact_person: `${form.first_name} ${form.last_name}`, role: "donor_organization" };

      const res = await api.post("/register", payload);
      setUserId(res.data.user_id);
      setStep("verify");
    } catch (err) {
      const laravelErrors = err.response?.data?.errors;
      const statusCode = err.response?.status;
      if (laravelErrors) {
        const mapped = {};
        for (const field in laravelErrors) { mapped[field] = laravelErrors[field][0]; }
        setErrors(mapped);
      } else if (statusCode === 422) { setErrors({ general: "Validation failed. Please check your inputs." }); }
      else if (statusCode === 500) { setErrors({ general: "Server error. Please try again later." }); }
      else { setErrors({ general: "Registration failed. Please try again." }); }
    } finally {
      setLoading(false);
    }
  };

  // ── STEP: OTP ──
  if (step === "verify") {
    return <OtpVerification userId={userId} onSuccess={() => setStep("done")} />;
  }

  // ── STEP: DONE ──
  if (step === "done") {
    return (
      <div className="bg-foodbank">
        <div className="form-card fade-in text-center">
          <img src="/images/logoo.png" alt="FoodBank Logo" className="w-48 mx-auto mb-4" />
          <h2 className="form-title">🎉 Account Verified!</h2>
          <p className="form-subtitle">Your email has been verified. You can now log in.</p>
          <a href="/login" className="btn-register mt-4 inline-block">Go to Login</a>
        </div>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([_, msg]) => msg).map(([field, msg]) => ({ field, msg }));

  return (
    <div className="reg-main-bg">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <img src="/images/logoo.png" alt="Logo" style={{ height: "50px" }} />
        </div>
        <div className="nav-links" style={{ margin: "10px" }}>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/partners">Partners</a>
          <a href="/media">Media</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div className="reg-detail-content fade-in">

        {/* TITLE */}
        <div className="reg-detail-heading">
          <img src="/images/Glass_Donor.png" alt="Donor" className="reg-detail-heading-icon" />
          <h1 className="reg-detail-title">
            <span className="reg-main-title-accent">DONOR</span> DETAIL
          </h1>
        </div>
        <p className="reg-main-subtitle" style={{ marginBottom: "24px" }}>Please enter your details</p>

        {/* GLASS CARD */}
        <div className="reg-glass-card">

          {/* TABS */}
          <div className="reg-tabs">
            <button
              className={`reg-tab-btn ${tab === "individual" ? "reg-tab-active" : ""}`}
              onClick={() => { setTab("individual"); setErrors({}); }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>person</span>
              INDIVIDUAL
            </button>
            <button
              className={`reg-tab-btn ${tab === "organization" ? "reg-tab-active" : ""}`}
              onClick={() => { setTab("organization"); setErrors({}); }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>groups</span>
              ORGANIZATION
            </button>
          </div>

          {/* FORM */}
          {tab === "individual" ? (
            <IndividualForm
              form={form} errors={errors} handleChange={handleChange}
              showPassword={showPassword} setShowPassword={setShowPassword}
              showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            />
          ) : (
            <OrgForm
              form={form} errors={errors} handleChange={handleChange}
              showPassword={showPassword} setShowPassword={setShowPassword}
              showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            />
          )}

          {/* ERROR SUMMARY */}
          {errorList.length > 0 && (
            <div className="error-summary">
              <p className="error-summary-title">⚠️ Please fix the following:</p>
              <ul className="error-summary-list">
                {errorList.map(({ field, msg }) => <li key={field}>{msg}</li>)}
              </ul>
            </div>
          )}

          {/* REGISTER BUTTON */}
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button onClick={handleSubmit} className="reg-submit-btn" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
