import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

const INITIAL_FORM = {
  service_type: "",
  quantity: "",
  frequency: "",
  date: "",
  time: "",
  address: "",
  first_name: "",
  last_name: "",
  email: "",
  notes: "",
};

export default function DonateService() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  // ── Field change ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (!form.service_type) errs.service_type = "Please select a service type.";

    if (!form.quantity) {
      errs.quantity = "Quantity is required.";
    } else if (!/^\d+$/.test(form.quantity) || parseInt(form.quantity) < 1) {
      errs.quantity = "Must be a whole number greater than 0.";
    }

    if (!form.frequency) errs.frequency = "Please select a frequency.";

    if (!form.date) {
      errs.date = "Date is required.";
    }

    if (!form.time) errs.time = "Time is required.";

    if (!form.address) {
      errs.address = "Address is required.";
    } else if (!/^[a-zA-Z0-9\s,.\-#/]+$/.test(form.address)) {
      errs.address = "Only letters, numbers, and common symbols allowed.";
    }

    if (!form.first_name) errs.first_name = "First name is required.";
    if (!form.last_name)  errs.last_name  = "Last name is required.";

    if (!form.email) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email must contain "@" and "."';
    }

    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/donor/donations/service", {
        service_type:  form.service_type,
        quantity:      parseInt(form.quantity),
        frequency:     form.frequency,
        date:          form.date,
        time:          form.time,
        address:       form.address,
        contact_first: form.first_name,
        contact_last:  form.last_name,
        contact_email: form.email,
        notes:         form.notes,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Service donation submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="ds-wrapper">
        <NavBar_Donor />
        <div className="ds-success-screen">
          <div className="ds-success-card">
            <span className="material-symbols-rounded ds-success-icon">check_circle</span>
            <h2 className="ds-success-title">Service Donation Submitted!</h2>
            <p className="ds-success-sub">Thank you for your contribution. Our team will be in touch soon.</p>
            <div className="ds-success-btns">
              <button className="ds-success-btn-home" onClick={() => navigate("/donate")}>
                Back to Donate
              </button>
              <button className="ds-success-btn-dash" onClick={() => navigate("/donor/dashboard")}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-wrapper">
      <NavBar_Donor />

      <div className="ds-page">

        {/* ── PAGE TITLE ── */}
        <div className="ds-title-section">
          <h1 className="ds-page-title">
            <img
              src="/images/Donor_Service_Dark.png"
              alt="Service"
              className="ds-title-icon"
            />
            Service Donation
          </h1>
          <hr className="ds-title-divider" />
        </div>

        {/* ── FORM CARD ── */}
        <form className="ds-form-card" onSubmit={handleSubmit} noValidate>

          {/* ROW 1: Service Type + Quantity */}
          <div className="ds-row ds-row-type">

            <div className="ds-field ds-field-grow">
              <label className="ds-label">Service Donation Type</label>
              <select
                name="service_type"
                className={`ds-input ds-select ${errors.service_type ? "ds-input-error" : ""}`}
                value={form.service_type}
                onChange={handleChange}
              >
                <option value="">Select Service Donation Type</option>
                <option value="Transportation">Transportation</option>
                <option value="Volunteer Work">Volunteer Work</option>
                <option value="Cooking Assistance">Cooking Assistance</option>
              </select>
              {errors.service_type && <p className="ds-error">{errors.service_type}</p>}
            </div>

            <div className="ds-field ds-field-qty">
              <label className="ds-label">Quantity</label>
              <input
                type="number"
                name="quantity"
                min="1"
                step="1"
                placeholder="##"
                className={`ds-input ds-input-center ${errors.quantity ? "ds-input-error" : ""}`}
                value={form.quantity}
                onChange={handleChange}
              />
              {errors.quantity && <p className="ds-error">{errors.quantity}</p>}
            </div>

          </div>

          {/* ROW 2: Frequency + Date + Time */}
          <div className="ds-row">

            <div className="ds-field">
              <label className="ds-label">Frequency</label>
              <select
                name="frequency"
                className={`ds-input ds-select ${errors.frequency ? "ds-input-error" : ""}`}
                value={form.frequency}
                onChange={handleChange}
              >
                <option value="">Select Frequency</option>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="One-Time">One-Time</option>
              </select>
              {errors.frequency && <p className="ds-error">{errors.frequency}</p>}
            </div>

            <div className="ds-field">
              <label className="ds-label">Date</label>
              <input
                type="date"
                name="date"
                className={`ds-input ds-input-center ${errors.date ? "ds-input-error" : ""}`}
                value={form.date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.date && <p className="ds-error">{errors.date}</p>}
            </div>

            <div className="ds-field">
              <label className="ds-label">Time</label>
              <input
                type="time"
                name="time"
                className={`ds-input ds-input-center ${errors.time ? "ds-input-error" : ""}`}
                value={form.time}
                onChange={handleChange}
              />
              {errors.time && <p className="ds-error">{errors.time}</p>}
            </div>

          </div>

          {/* ROW 3: Address */}
          <div className="ds-field">
            <label className="ds-label">Address / Coverage</label>
            <input
              type="text"
              name="address"
              placeholder="Input Address / Coverage"
              className={`ds-input ${errors.address ? "ds-input-error" : ""}`}
              value={form.address}
              onChange={handleChange}
            />
            {errors.address && <p className="ds-error">{errors.address}</p>}
          </div>

          {/* ROW 4: Contact Person */}
          <div className="ds-field">
            <label className="ds-label">Contact Person</label>
            <div className="ds-row ds-row-contact">
              <div className="ds-field-inline">
                <input
                  type="text"
                  name="first_name"
                  placeholder="Input First Name"
                  className={`ds-input ${errors.first_name ? "ds-input-error" : ""}`}
                  value={form.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && <p className="ds-error">{errors.first_name}</p>}
              </div>
              <div className="ds-field-inline">
                <input
                  type="text"
                  name="last_name"
                  placeholder="Input Last Name"
                  className={`ds-input ${errors.last_name ? "ds-input-error" : ""}`}
                  value={form.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && <p className="ds-error">{errors.last_name}</p>}
              </div>
              <div className="ds-field-inline">
                <input
                  type="email"
                  name="email"
                  placeholder="Input Email"
                  className={`ds-input ${errors.email ? "ds-input-error" : ""}`}
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="ds-error">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* ROW 5: Notes (optional) */}
          <div className="ds-field">
            <label className="ds-label">
              Service Description / Extra Notes
              <span className="ds-optional"> (optional)</span>
            </label>
            <textarea
              name="notes"
              placeholder="Input service description or any extra notes..."
              className="ds-input ds-textarea"
              value={form.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>

        </form>

        {/* ── SUBMIT BUTTON (outside card, bottom-right) ── */}
        <div className="ds-submit-row">
          <button
            className="ds-submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

      </div>
    </div>
  );
}
