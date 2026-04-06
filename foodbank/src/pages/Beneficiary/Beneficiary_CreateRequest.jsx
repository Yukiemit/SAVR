import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Beneficiary from "../../components/NavBar_Beneficiary";
import api from "../../services/api";

// ── Empty state templates ─────────────────────────────────────────────────────
const EMPTY_FOOD = {
  request_name: "",
  food_type:    "",
  quantity:     "",
  unit:         "",
  population:   "",
  age_min:      "",
  age_max:      "",
  street:       "",
  barangay:     "",
  city:         "",
  zip_code:     "",
  request_date: "",
  urgency:      "",
};

const EMPTY_FINANCIAL = {
  request_name: "",
  amount:       "",
  population:   "",
  age_min:      "",
  age_max:      "",
  street:       "",
  barangay:     "",
  city:         "",
  zip_code:     "",
  request_date: "",
  urgency:      "",
};

const FOOD_TYPES = [
  "Canned Goods", "Dry Goods", "Fresh Produce", "Dairy Products", "Meat & Fish", "Any Meals"
];

const UNITS = ["kg", "g", "lbs", "pcs", "cans", "bags", "liters", "boxes"];

const URGENCY_LEVELS = [
  { value: "low",      label: "Low"      },
  { value: "medium",   label: "Medium"   },
  { value: "high",     label: "High"     },
];

export default function Beneficiary_CreateRequest() {
  const navigate = useNavigate();
  const [tab,     setTab]     = useState("food");       // "food" | "financial"
  const [food,    setFood]    = useState(EMPTY_FOOD);
  const [fin,     setFin]     = useState(EMPTY_FINANCIAL);
  const [errors,  setErrors]  = useState({});
  const [status,  setStatus]  = useState(null);         // null | "loading" | "success" | "error"

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFoodChange = (e) => {
    setFood((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: null }));
  };

  const handleFinChange = (e) => {
    setFin((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: null }));
  };

  const switchTab = (t) => {
    setTab(t);
    setErrors({});
    setStatus(null);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e   = {};
    const src = tab === "food" ? food : fin;

    if (!src.request_name.trim())  e.request_name = "Name of request is required.";
    if (!src.population)           e.population   = "Population is required.";
    else if (Number(src.population) < 1) e.population = "Population must be at least 1.";
    if (!src.age_min)              e.age_min      = "Age range (min) is required.";
    if (!src.age_max)              e.age_max      = "Age range (max) is required.";
    if (src.age_min && src.age_max && Number(src.age_min) > Number(src.age_max))
      e.age_max = "Max age must be ≥ min age.";
    if (!src.street.trim())        e.street       = "Street is required.";
    if (!src.barangay.trim())      e.barangay     = "Barangay is required.";
    if (!src.city.trim())          e.city         = "City / Municipality is required.";
    if (!src.zip_code.trim())      e.zip_code     = "ZIP code is required.";
    if (!src.request_date)         e.request_date = "Date is required.";
    if (!src.urgency)              e.urgency      = "Please select an urgency level.";

    if (tab === "food") {
      if (!food.food_type)         e.food_type = "Please select a food type.";
      if (!food.quantity)          e.quantity  = "Quantity is required.";
      else if (Number(food.quantity) < 1) e.quantity = "Quantity must be at least 1.";
      if (!food.unit)              e.unit      = "Please select a unit.";
    } else {
      if (!fin.amount)             e.amount    = "Amount is required.";
      else if (Number(fin.amount) < 1) e.amount = "Amount must be at least ₱1.";
    }

    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  // TODO (backend): POST /api/beneficiary/requests
  // Body (food):      { type: "food", request_name, food_type, quantity, unit,
  //                     population, age_range_min, age_range_max,
  //                     street, barangay, city, zip_code, request_date, urgency }
  // Body (financial): { type: "financial", request_name, amount,
  //                     population, age_range_min, age_range_max,
  //                     street, barangay, city, zip_code, request_date, urgency }
  // Returns: { id, status: "pending", created_at, ... }
  const handleSubmit = async () => {
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setStatus("loading");
    setErrors({});

    try {
      const src     = tab === "food" ? food : fin;
      const payload = {
        type:          tab,
        request_name:  src.request_name,
        population:    src.population,
        age_range_min: src.age_min,
        age_range_max: src.age_max,
        street:        src.street,
        barangay:      src.barangay,
        city:          src.city,
        zip_code:      src.zip_code,
        request_date:  src.request_date,
        urgency:       src.urgency,
        ...(tab === "food"
          ? { food_type: food.food_type, quantity: food.quantity, unit: food.unit }
          : { amount: fin.amount }),
      };

      await api.post("/beneficiary/requests", payload);
      setStatus("success");
      setFood(EMPTY_FOOD);
      setFin(EMPTY_FINANCIAL);
    } catch {
      setStatus("error");
    }
  };

  const errorList = Object.entries(errors)
    .filter(([_, msg]) => msg)
    .map(([field, msg]) => ({ field, msg }));

  const src     = tab === "food" ? food : fin;
  const onChange = tab === "food" ? handleFoodChange : handleFinChange;

  const inp = (name, hasErr) =>
    `ben-req-input${hasErr ? " ben-req-input-error" : ""}`;

  return (
    <div className="ben-wrapper">
      <NavBar_Beneficiary />

      <main className="ben-req-main">

        {/* ── PAGE HEADING ── */}
        <div className="ben-req-heading">
          <span
            className="material-symbols-rounded ben-req-heading-icon"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
          >
            volunteer_activism
          </span>
          <h1 className="ben-req-title">Create Request</h1>
        </div>
        <hr className="ben-req-divider" />

        {/* ── TYPE TABS ── */}
        <div className="ben-req-tabs">
          <button
            className={`ben-req-tab ${tab === "food" ? "ben-req-tab-active" : ""}`}
            onClick={() => switchTab("food")}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              lunch_dining
            </span>
            FOOD
          </button>
          <button
            className={`ben-req-tab ${tab === "financial" ? "ben-req-tab-active" : ""}`}
            onClick={() => switchTab("financial")}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              payments
            </span>
            FINANCIAL
          </button>
        </div>

        {/* ── FORM CARD ── */}
        <div className="ben-req-card">

          {/* Name of Request */}
          <div className="ben-req-field">
            <label className="ben-req-label">Name of Request</label>
            <input
              className={inp("request_name", errors.request_name)}
              type="text"
              name="request_name"
              placeholder="e.g. Kapatiran Fire Tondo Relief"
              value={src.request_name}
              onChange={onChange}
            />
          </div>

          {/* FOOD-SPECIFIC: Type of Food + Quantity + Unit */}
          {tab === "food" && (
            <div className="ben-req-row">
              <div className="ben-req-field ben-req-field-grow">
                <label className="ben-req-label">Type of Food Needed</label>
                <select
                  className={inp("food_type", errors.food_type) + " ben-req-select"}
                  name="food_type"
                  value={food.food_type}
                  onChange={handleFoodChange}
                >
                  <option value="" disabled>Select Food Type</option>
                  {FOOD_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="ben-req-field ben-req-field-sm">
                <label className="ben-req-label">Quantity</label>
                <input
                  className={inp("quantity", errors.quantity)}
                  type="number"
                  name="quantity"
                  placeholder="##"
                  min="1"
                  value={food.quantity}
                  onChange={handleFoodChange}
                />
              </div>
              <div className="ben-req-field ben-req-field-sm">
                <label className="ben-req-label">Unit</label>
                <select
                  className={inp("unit", errors.unit) + " ben-req-select"}
                  name="unit"
                  value={food.unit}
                  onChange={handleFoodChange}
                >
                  <option value="" disabled>Select</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* FINANCIAL-SPECIFIC: Amount */}
          {tab === "financial" && (
            <div className="ben-req-field">
              <label className="ben-req-label">Amount of Money Needed (₱)</label>
              <input
                className={inp("amount", errors.amount)}
                type="number"
                name="amount"
                placeholder="e.g. 5000"
                min="1"
                value={fin.amount}
                onChange={handleFinChange}
              />
            </div>
          )}

          {/* Population + Age Range */}
          <div className="ben-req-row">
            <div className="ben-req-field">
              <label className="ben-req-label"># of Population</label>
              <input
                className={inp("population", errors.population)}
                type="number"
                name="population"
                placeholder="##"
                min="1"
                value={src.population}
                onChange={onChange}
              />
            </div>
            <div className="ben-req-field">
              <label className="ben-req-label">Age Range</label>
              <div className="ben-req-age-row">
                <input
                  className={inp("age_min", errors.age_min)}
                  type="number"
                  name="age_min"
                  placeholder="Min"
                  min="0"
                  value={src.age_min}
                  onChange={onChange}
                />
                <span className="ben-req-age-sep">–</span>
                <input
                  className={inp("age_max", errors.age_max)}
                  type="number"
                  name="age_max"
                  placeholder="Max"
                  min="0"
                  value={src.age_max}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>

          {/* Address / Coverage */}
          <div className="ben-req-field">
            <label className="ben-req-label">Address / Coverage</label>
            <div className="ben-req-row ben-req-row-nowrap">
              <input
                className={inp("street", errors.street)}
                type="text"
                name="street"
                placeholder="Street"
                value={src.street}
                onChange={onChange}
              />
              <input
                className={inp("barangay", errors.barangay) + " ben-req-field-sm"}
                type="text"
                name="barangay"
                placeholder="Brgy."
                value={src.barangay}
                onChange={onChange}
              />
              <input
                className={inp("city", errors.city)}
                type="text"
                name="city"
                placeholder="City / Municipality"
                value={src.city}
                onChange={onChange}
              />
              <input
                className={inp("zip_code", errors.zip_code) + " ben-req-field-sm"}
                type="text"
                name="zip_code"
                placeholder="ZIP"
                value={src.zip_code}
                onChange={onChange}
              />
            </div>
          </div>

          {/* Date + Urgency */}
          <div className="ben-req-row">
            <div className="ben-req-field">
              <label className="ben-req-label">Date</label>
              <input
                className={inp("request_date", errors.request_date)}
                type="date"
                name="request_date"
                value={src.request_date}
                onChange={onChange}
              />
            </div>
            <div className="ben-req-field">
              <label className="ben-req-label">Urgency Level</label>
              <select
                className={inp("urgency", errors.urgency) + " ben-req-select"}
                name="urgency"
                value={src.urgency}
                onChange={onChange}
              >
                <option value="" disabled>Select Level</option>
                {URGENCY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* ── ERROR SUMMARY ── */}
        {errorList.length > 0 && (
          <div className="error-summary" style={{ maxWidth: 720, width: "100%" }}>
            <p className="error-summary-title">⚠️ Please fix the following:</p>
            <ul className="error-summary-list">
              {errorList.map(({ field, msg }) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── STATUS MESSAGES ── */}
        {status === "success" && (
          <p className="ben-req-status ben-req-status-success">
            ✓ Your request has been submitted successfully!
          </p>
        )}
        {status === "error" && (
          <p className="ben-req-status ben-req-status-error">
            Something went wrong. Please try again.
          </p>
        )}

        {/* ── SUBMIT ── */}
        <div className="ben-req-submit-row">
          <button
            className="ben-req-submit-btn"
            onClick={handleSubmit}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Submitting…" : "Submit"}
          </button>
        </div>

      </main>
    </div>
  );
}
