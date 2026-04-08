import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = ["Transportation", "Volunteer Work", "Cooking Assistance"];

const FREQUENCIES = ["Monthly", "Weekly", "Daily", "One-Time"];

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

// ── EMPTY FORM STATE ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  service_type:    "",
  quantity:        "",
  frequency:       "",
  date:            "",        // used for Monthly / One-Time (date input)
  day_of_week:     "",        // used for Weekly (dropdown)
  // Daily → no date field needed
  starts_at:       "",
  ends_at:         "",
  all_day:         false,
  address:         "",
  first_name:      "",
  last_name:       "",
  email:           "",
  notes:           "",        // optional
};

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function Donor_DonateService() {
  const navigate = useNavigate();

  const [form,       setForm]       = useState(EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [status,     setStatus]     = useState(null); // null | "loading" | "success" | "error"

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;

    setForm((prev) => {
      const updated = { ...prev, [name]: newVal };

      // Reset date-related fields when frequency changes
      if (name === "frequency") {
        updated.date        = "";
        updated.day_of_week = "";
      }

      // Clear time fields when all_day is checked
      if (name === "all_day" && checked) {
        updated.starts_at = "";
        updated.ends_at   = "";
      }

      return updated;
    });

    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (!form.service_type)
      e.service_type = "Please select a service donation type.";

    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      e.quantity = "Enter a valid quantity (number ≥ 1).";

    if (!form.frequency)
      e.frequency = "Please select a frequency.";

    // Date / day validation based on frequency
    if (form.frequency === "Weekly" && !form.day_of_week)
      e.day_of_week = "Please select a day of the week.";

    if ((form.frequency === "Monthly" || form.frequency === "One-Time") && !form.date)
      e.date = "Please select a date.";

    // Time validation (only when not all-day)
    if (!form.all_day) {
      if (!form.starts_at) e.starts_at = "Please enter a start time.";
      if (!form.ends_at)   e.ends_at   = "Please enter an end time.";
      if (form.starts_at && form.ends_at && form.starts_at >= form.ends_at)
        e.ends_at = "End time must be after start time.";
    }

    if (!form.address.trim())
      e.address = "Address / coverage is required.";

    if (!form.first_name.trim())
      e.first_name = "First name is required.";

    if (!form.last_name.trim())
      e.last_name = "Last name is required.";

    if (!form.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "Enter a valid email address.";
    }

    // notes is optional — no validation

    return e;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  // Backend: POST /api/donor/donations
  // Body: {
  //   type: "service",
  //   service_type, quantity, frequency,
  //   date (for Monthly/One-Time) | day_of_week (for Weekly) | null (Daily),
  //   starts_at, ends_at, all_day,
  //   address, first_name, last_name, email, notes
  // }
  // Returns: { id, status: "pending", created_at, ... }
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus("loading");
    try {
      const payload = {
        type:         "service",
        service_type: form.service_type,
        quantity:     Number(form.quantity),
        frequency:    form.frequency,
        date:         form.frequency === "Weekly"
                        ? form.day_of_week
                        : form.frequency === "Daily"
                          ? null
                          : form.date,
        all_day:      form.all_day,
        starts_at:    form.all_day ? null : form.starts_at,
        ends_at:      form.all_day ? null : form.ends_at,
        address:      form.address,
        first_name:   form.first_name,
        last_name:    form.last_name,
        email:        form.email,
        notes:        form.notes,
      };

      await api.post("/donor/donations/service", payload);
      setStatus("success");
      setForm(EMPTY_FORM);
    } catch {
      setStatus("error");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const inp = (name) =>
    `don-svc-input${errors[name] ? " don-svc-input-err" : ""}`;

  const showDatePicker  = form.frequency === "Monthly" || form.frequency === "One-Time";
  const showDayDropdown = form.frequency === "Weekly";
  const hideDateAll     = form.frequency === "Daily";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="don-svc-wrapper">

      {/* ── NAVBAR ── */}
      <NavBar_Donor />

      <main className="don-svc-main">

        {/* ── PAGE HEADER ── */}
        <div className="don-svc-page-header">
          <div className="don-svc-title-row">
            <img
              src="/images/Donor_Service_Dark.png"
              alt="Service Donation"
              className="don-svc-title-icon"
            />
            <h1 className="don-svc-page-title">Service Donation</h1>
          </div>
          <hr className="don-svc-page-divider" />
        </div>

        {/* ── FORM CARD ── */}
        <div className="don-svc-card">

          {/* ROW 1 — Service Type + Quantity */}
          <div className="don-svc-row">
            <div className="don-svc-field don-svc-field-grow">
              <label className="don-svc-label">Service Donation Type</label>
              <select
                className={inp("service_type") + " don-svc-select"}
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
              >
                <option value="" disabled>Select Service Donation Type</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.service_type && <span className="don-svc-err">{errors.service_type}</span>}
            </div>

            <div className="don-svc-field don-svc-field-sm">
              <label className="don-svc-label">Quantity</label>
              <input
                className={inp("quantity")}
                type="number"
                name="quantity"
                min="1"
                placeholder="##"
                value={form.quantity}
                onChange={handleChange}
              />
              {errors.quantity && <span className="don-svc-err">{errors.quantity}</span>}
            </div>
          </div>

          {/* ROW 2 — Frequency + Date/Day + Time */}
          <div className="don-svc-row">

            {/* Frequency */}
            <div className="don-svc-field don-svc-field-freq">
              <label className="don-svc-label">Frequency</label>
              <select
                className={inp("frequency") + " don-svc-select"}
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
              >
                <option value="" disabled>Select Frequency</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {errors.frequency && <span className="don-svc-err">{errors.frequency}</span>}
            </div>

            {/* Date — shown for Monthly / One-Time */}
            {showDatePicker && (
              <div className="don-svc-field don-svc-field-date">
                <label className="don-svc-label">Date</label>
                <input
                  className={inp("date")}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
                {errors.date && <span className="don-svc-err">{errors.date}</span>}
              </div>
            )}

            {/* Day of Week — shown for Weekly */}
            {showDayDropdown && (
              <div className="don-svc-field don-svc-field-date">
                <label className="don-svc-label">Day of Week</label>
                <select
                  className={inp("day_of_week") + " don-svc-select"}
                  name="day_of_week"
                  value={form.day_of_week}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select Day</option>
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.day_of_week && <span className="don-svc-err">{errors.day_of_week}</span>}
              </div>
            )}

            {/* Daily — no date field, just a note */}
            {hideDateAll && (
              <div className="don-svc-field don-svc-field-date don-svc-daily-note">
                <label className="don-svc-label">Date</label>
                <div className="don-svc-daily-badge">Repeats Every Day</div>
              </div>
            )}

            {/* Starts At */}
            <div className="don-svc-field don-svc-field-time">
              <label className="don-svc-label">Starts At</label>
              <input
                className={inp("starts_at")}
                type="time"
                name="starts_at"
                value={form.starts_at}
                onChange={handleChange}
                disabled={form.all_day}
              />
              {errors.starts_at && <span className="don-svc-err">{errors.starts_at}</span>}
            </div>

            {/* Ends At */}
            <div className="don-svc-field don-svc-field-time">
              <label className="don-svc-label">Ends At</label>
              <input
                className={inp("ends_at")}
                type="time"
                name="ends_at"
                value={form.ends_at}
                onChange={handleChange}
                disabled={form.all_day}
              />
              {errors.ends_at && <span className="don-svc-err">{errors.ends_at}</span>}
            </div>

          </div>

          {/* ALL DAY CHECKBOX */}
          <div className="don-svc-allday-row">
            <label className="don-svc-allday-label">
              <input
                className="don-svc-checkbox"
                type="checkbox"
                name="all_day"
                checked={form.all_day}
                onChange={handleChange}
              />
              All Day
            </label>
          </div>

          {/* ROW 3 — Address */}
          <div className="don-svc-field">
            <label className="don-svc-label">Address / Coverage</label>
            <input
              className={inp("address")}
              type="text"
              name="address"
              placeholder="Input Address / Coverage"
              value={form.address}
              onChange={handleChange}
            />
            {errors.address && <span className="don-svc-err">{errors.address}</span>}
          </div>

          {/* ROW 4 — Contact Person */}
          <div className="don-svc-field-group-label">
            <label className="don-svc-label">Contact Person</label>
          </div>
          <div className="don-svc-row">
            <div className="don-svc-field don-svc-field-contact">
              <input
                className={inp("first_name")}
                type="text"
                name="first_name"
                placeholder="Input First Name"
                value={form.first_name}
                onChange={handleChange}
              />
              {errors.first_name && <span className="don-svc-err">{errors.first_name}</span>}
            </div>
            <div className="don-svc-field don-svc-field-contact">
              <input
                className={inp("last_name")}
                type="text"
                name="last_name"
                placeholder="Input Last Name"
                value={form.last_name}
                onChange={handleChange}
              />
              {errors.last_name && <span className="don-svc-err">{errors.last_name}</span>}
            </div>
            <div className="don-svc-field don-svc-field-contact">
              <input
                className={inp("email")}
                type="email"
                name="email"
                placeholder="Input Email"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="don-svc-err">{errors.email}</span>}
            </div>
          </div>

          {/* ROW 5 — Notes (optional) */}
          <div className="don-svc-field">
            <label className="don-svc-label">
              Service Description / Extra Notes{" "}
              <span className="don-svc-label-opt">(optional)</span>
            </label>
            <textarea
              className="don-svc-input don-svc-textarea"
              name="notes"
              placeholder="Input service description or extra notes…"
              value={form.notes}
              onChange={handleChange}
            />
          </div>

        </div>
        {/* end don-svc-card */}

        {/* ── STATUS MESSAGES ── */}
        {status === "success" && (
          <p className="don-svc-status don-svc-status-success">
            ✓ Service donation submitted successfully!
          </p>
        )}
        {status === "error" && (
          <p className="don-svc-status don-svc-status-error">
            Something went wrong. Please try again.
          </p>
        )}

        {/* ── SUBMIT ROW ── */}
        <div className="don-svc-submit-row">
          <button
            className="don-svc-cancel-btn"
            onClick={() => navigate("/donor/donate")}
          >
            Cancel
          </button>
          <button
            className="don-svc-submit-btn"
            onClick={handleSubmit}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading"
              ? "Submitting…"
              : status === "success"
              ? "Submitted ✓"
              : "Submit"}
          </button>
        </div>

      </main>
    </div>
  );
}
