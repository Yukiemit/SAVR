import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const SERVICE_TABS = ["Transportation", "Volunteer Work"];

const VEHICLE_TYPES = [
  "Sedan",
  "Hatchback",
  "SUV (Sport Utility Vehicle)",
  "Crossover",
  "Pickup Truck",
  "Van / Minivan",
  "Cargo Van",
  "Box Truck",
  "Wagon",
  "Coupe",
  "Convertible",
  "Hybrid",
  "Electric Vehicle (EV)",
  "Diesel Vehicle",
  "Refrigerated Truck",
  "Motorcycle",
];

const TRANSPORT_CATEGORIES = [
  "No Liquid Foods",
  "No Frozen Foods",
  "No Glass Containers",
  "No Refrigerated Foods",
  "No Hot/Warm Foods",
  "No Bulk Produce",
  "No Raw Meat / Poultry",
  "No Raw Seafood / Fish",
  "No Bottled Beverages",
  "No Snacks / Sweets",
  "No Powdered Ingredients",
];

const VOLUNTEER_PREFERRED_WORK = [
  "Cook / Food Prep",
  "Packing / Sorting",
  "Delivery / Distribution",
  "Logistics / Warehouse",
  "Event / Community Assistance",
  "Admin / Documentation",
  "Medical Assistance",
];

const VOLUNTEER_SKILL_CATEGORIES = [
  "First Aid Certified",
  "Heavy Liftings",
  "Communication",
  "Cooking",
  "Driving",
  "Inventory Management",
  "Allergen Awareness",
  "Bilingual / Multilingual",
  "Physical Stamina",
  "Photography / Videography",
  "Grant Writing / Reporting",
];

const FREQUENCIES = ["Monthly", "Weekly", "Daily", "One-Time"];

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

// ── EMPTY FORM STATE ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  service_tab:        "Transportation",   // "Transportation" | "Volunteer Work"

  // Shared
  frequency:          "",
  date:               "",
  day_of_week:        "",
  starts_at:          "",
  ends_at:            "",
  all_day:            false,
  address:            "",
  first_name:         "",
  last_name:          "",
  email:              "",
  notes:              "",

  // Transportation-specific
  quantity:           "",
  vehicle_type:       "",
  capacity:           "",
  max_distance:       "",
  transport_categories: [],             // array of selected strings

  // Volunteer Work-specific
  headcount:          "",
  preferred_work:     "",
  skill_categories:   [],               // array of selected strings
};

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function Donor_DonateService() {
  const navigate = useNavigate();

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [errors,    setErrors]    = useState({});
  const [status,    setStatus]    = useState(null); // null | "loading" | "success" | "error"
  const [showPopup, setShowPopup] = useState(false);

  // ── Tab switch ───────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setForm({ ...EMPTY_FORM, service_tab: tab });
    setErrors({});
    setStatus(null);
  };

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;

    setForm((prev) => {
      const updated = { ...prev, [name]: newVal };

      if (name === "frequency") {
        updated.date        = "";
        updated.day_of_week = "";
      }

      if (name === "all_day" && checked) {
        updated.starts_at = "";
        updated.ends_at   = "";
      }

      return updated;
    });

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Checkbox toggle for multi-select arrays ──────────────────────────────
  const handleCheckboxToggle = (fieldName, value) => {
    setForm((prev) => {
      const arr = prev[fieldName];
      const updated = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [fieldName]: updated };
    });
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    const isTransport  = form.service_tab === "Transportation";
    const isVolunteer  = form.service_tab === "Volunteer Work";

    if (!form.frequency)   e.frequency = "Please select a frequency.";

    if (form.frequency === "Weekly" && !form.day_of_week)
      e.day_of_week = "Please select a day of the week.";

    if ((form.frequency === "Monthly" || form.frequency === "One-Time") && !form.date)
      e.date = "Please select a date.";

    if (!form.all_day) {
      if (!form.starts_at) e.starts_at = "Please enter a start time.";
      if (!form.ends_at)   e.ends_at   = "Please enter an end time.";
      if (form.starts_at && form.ends_at && form.starts_at >= form.ends_at)
        e.ends_at = "End time must be after start time.";
    }

    if (!form.address.trim()) e.address = "Address / coverage is required.";

    if (!form.first_name.trim()) e.first_name = "First name is required.";
    if (!form.last_name.trim())  e.last_name  = "Last name is required.";

    if (!form.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "Enter a valid email address.";
    }

    // Transportation-specific
    if (isTransport) {
      if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
        e.quantity = "Enter a valid quantity (number ≥ 1).";
      if (!form.vehicle_type)
        e.vehicle_type = "Please select a vehicle type.";
      if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
        e.capacity = "Enter a valid capacity.";
      if (!form.max_distance || isNaN(Number(form.max_distance)) || Number(form.max_distance) < 1)
        e.max_distance = "Enter a valid max distance.";
    }

    // Volunteer Work-specific
    if (isVolunteer) {
      if (!form.headcount || isNaN(Number(form.headcount)) || Number(form.headcount) < 1)
        e.headcount = "Enter a valid headcount (number ≥ 1).";
      if (!form.preferred_work)
        e.preferred_work = "Please select a preferred work type.";
    }

    return e;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus("loading");
    try {
      const isTransport = form.service_tab === "Transportation";

      const payload = {
        type:         "service",
        service_tab:  form.service_tab,
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

        ...(isTransport ? {
          quantity:              Number(form.quantity),
          vehicle_type:          form.vehicle_type,
          capacity:              Number(form.capacity),
          max_distance:          Number(form.max_distance),
          transport_categories:  form.transport_categories,
        } : {
          headcount:             Number(form.headcount),
          preferred_work:        form.preferred_work,
          skill_categories:      form.skill_categories,
        }),
      };

      await api.post("/donor/donations/service", payload);
      setStatus("success");
      setShowPopup(true);
      setForm(EMPTY_FORM);
      setTimeout(() => setShowPopup(false), 3000);
    } catch {
      setStatus("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const inp = (name) =>
    `don-svc-input${errors[name] ? " don-svc-input-err" : ""}`;

  const showDatePicker  = form.frequency === "Monthly" || form.frequency === "One-Time";
  const showDayDropdown = form.frequency === "Weekly";
  const hideDateAll     = form.frequency === "Daily";

  const isTransport = form.service_tab === "Transportation";
  const isVolunteer = form.service_tab === "Volunteer Work";

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

        {/* ── SERVICE TYPE TABS ── */}
        <div className="don-svc-tabs">
          {SERVICE_TABS.map((tab) => (
            <button
              key={tab}
              className={`don-svc-tab-btn${form.service_tab === tab ? " don-svc-tab-btn-active" : ""}`}
              onClick={() => handleTabChange(tab)}
              type="button"
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── FORM CARD ── */}
        <div className="don-svc-card">

          {/* ── TRANSPORTATION FIELDS ── */}
          {isTransport && (
            <>
              {/* ROW — Address + Quantity */}
              <div className="don-svc-row">
                <div className="don-svc-field don-svc-field-grow">
                  <label className="don-svc-label">Address / Coverage</label>
                  <input
                    className={inp("address")}
                    type="text"
                    name="address"
                    placeholder="Select a City / Region"
                    value={form.address}
                    onChange={handleChange}
                  />
                  {errors.address && <span className="don-svc-err">{errors.address}</span>}
                </div>
                <div className="don-svc-field don-svc-field-sm">
                  <label className="don-svc-label">Quantity</label>
                  <input
                    className={inp("quantity")}
                    type="number"
                    name="quantity"
                    min="1"
                    placeholder="#"
                    value={form.quantity}
                    onChange={handleChange}
                  />
                  {errors.quantity && <span className="don-svc-err">{errors.quantity}</span>}
                </div>
              </div>

              {/* ROW — Frequency + Date/Day + Time */}
              <div className="don-svc-row">
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

                {hideDateAll && (
                  <div className="don-svc-field don-svc-field-date don-svc-daily-note">
                    <label className="don-svc-label">Date</label>
                    <div className="don-svc-daily-badge">Repeats Every Day</div>
                  </div>
                )}

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

              {/* ROW — Type of Vehicle + Capacity + Max Distance */}
              <div className="don-svc-row">
                <div className="don-svc-field don-svc-field-grow">
                  <label className="don-svc-label">Type of Vehicle</label>
                  <select
                    className={inp("vehicle_type") + " don-svc-select"}
                    name="vehicle_type"
                    value={form.vehicle_type}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select Vehicle Type</option>
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.vehicle_type && <span className="don-svc-err">{errors.vehicle_type}</span>}
                </div>
                <div className="don-svc-field don-svc-field-sm">
                  <label className="don-svc-label">Capacity</label>
                  <input
                    className={inp("capacity")}
                    type="number"
                    name="capacity"
                    min="1"
                    placeholder="##"
                    value={form.capacity}
                    onChange={handleChange}
                  />
                  {errors.capacity && <span className="don-svc-err">{errors.capacity}</span>}
                </div>
                <div className="don-svc-field don-svc-field-sm">
                  <label className="don-svc-label">Max Distance</label>
                  <div className="don-svc-distance-wrap">
                    <input
                      className={inp("max_distance") + " don-svc-distance-input"}
                      type="number"
                      name="max_distance"
                      min="1"
                      placeholder="####"
                      value={form.max_distance}
                      onChange={handleChange}
                    />
                    <span className="don-svc-distance-unit">km</span>
                  </div>
                  {errors.max_distance && <span className="don-svc-err">{errors.max_distance}</span>}
                </div>
              </div>

              {/* Categories checkboxes */}
              <div className="don-svc-field">
                <label className="don-svc-label">
                  Categories <span className="don-svc-label-opt">(Select those that apply)</span>
                </label>
                <div className="don-svc-checkbox-grid">
                  {TRANSPORT_CATEGORIES.map((cat) => {
                    const checked = form.transport_categories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`don-svc-checkbox-pill${checked ? " don-svc-checkbox-pill-checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="don-svc-checkbox-hidden"
                          checked={checked}
                          onChange={() => handleCheckboxToggle("transport_categories", cat)}
                        />
                        {checked && <span className="don-svc-pill-check">✓</span>}
                        {cat}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Person */}
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

              {/* Extra Notes */}
              <div className="don-svc-field">
                <label className="don-svc-label">
                  Extra Notes <span className="don-svc-label-opt">(optional)</span>
                </label>
                <textarea
                  className="don-svc-input don-svc-textarea"
                  name="notes"
                  placeholder="Input Address / Coverage"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* ── VOLUNTEER WORK FIELDS ── */}
          {isVolunteer && (
            <>
              {/* ROW — Address + Headcount */}
              <div className="don-svc-row">
                <div className="don-svc-field don-svc-field-grow">
                  <label className="don-svc-label">Address / Coverage</label>
                  <input
                    className={inp("address")}
                    type="text"
                    name="address"
                    placeholder="Select a City / Region"
                    value={form.address}
                    onChange={handleChange}
                  />
                  {errors.address && <span className="don-svc-err">{errors.address}</span>}
                </div>
                <div className="don-svc-field don-svc-field-sm">
                  <label className="don-svc-label">Headcount</label>
                  <input
                    className={inp("headcount")}
                    type="number"
                    name="headcount"
                    min="1"
                    placeholder="##"
                    value={form.headcount}
                    onChange={handleChange}
                  />
                  {errors.headcount && <span className="don-svc-err">{errors.headcount}</span>}
                </div>
              </div>

              {/* ROW — Frequency + Date/Day + Time */}
              <div className="don-svc-row">
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

                {hideDateAll && (
                  <div className="don-svc-field don-svc-field-date don-svc-daily-note">
                    <label className="don-svc-label">Date</label>
                    <div className="don-svc-daily-badge">Repeats Every Day</div>
                  </div>
                )}

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

              {/* Preferred Work */}
              <div className="don-svc-field">
                <label className="don-svc-label">Preferred Work</label>
                <select
                  className={inp("preferred_work") + " don-svc-select"}
                  name="preferred_work"
                  value={form.preferred_work}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select Work Type</option>
                  {VOLUNTEER_PREFERRED_WORK.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                {errors.preferred_work && <span className="don-svc-err">{errors.preferred_work}</span>}
              </div>

              {/* Skill Categories checkboxes */}
              <div className="don-svc-field">
                <label className="don-svc-label">
                  Skill Categories <span className="don-svc-label-opt">(Select those that apply)</span>
                </label>
                <div className="don-svc-checkbox-grid">
                  {VOLUNTEER_SKILL_CATEGORIES.map((cat) => {
                    const checked = form.skill_categories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`don-svc-checkbox-pill${checked ? " don-svc-checkbox-pill-checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="don-svc-checkbox-hidden"
                          checked={checked}
                          onChange={() => handleCheckboxToggle("skill_categories", cat)}
                        />
                        {checked && <span className="don-svc-pill-check">✓</span>}
                        {cat}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Person */}
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

              {/* Extra Notes */}
              <div className="don-svc-field">
                <label className="don-svc-label">
                  Extra Notes <span className="don-svc-label-opt">(optional)</span>
                </label>
                <textarea
                  className="don-svc-input don-svc-textarea"
                  name="notes"
                  placeholder="Input Address / Coverage"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

        </div>
        {/* end don-svc-card */}

        {/* ── FEEDBACK POPUP ── */}
        {showPopup && (
          <div className="don-svc-popup-overlay" onClick={() => setShowPopup(false)}>
            <div
              className={`don-svc-popup-box${status === "success" ? " don-svc-popup-success" : " don-svc-popup-error"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="don-svc-popup-icon">
                {status === "success" ? "✓" : "✕"}
              </div>
              <div className="don-svc-popup-content">
                <p className="don-svc-popup-title">
                  {status === "success" ? "Submission Successful!" : "Submission Failed"}
                </p>
                <p className="don-svc-popup-msg">
                  {status === "success"
                    ? "Your service donation has been submitted successfully."
                    : "Something went wrong. Please try again."}
                </p>
              </div>
              <button className="don-svc-popup-close" onClick={() => setShowPopup(false)}>✕</button>
            </div>
          </div>
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
