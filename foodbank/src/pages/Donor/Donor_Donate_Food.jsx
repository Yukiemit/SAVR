import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

// ── WAREHOUSE COORDINATES (for DELIVERY mode) ────────────────────────────────
// Backend: fetch from GET /api/settings/warehouse → { lat, lng, address }
// Update these to your actual warehouse coordinates.
const WAREHOUSE = {
  lat:     14.4445,
  lng:     120.9942,
  address: "231 Edi wow street, Las Piñas",
};

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const UNITS = ["g", "kg", "lbs", "L", "ml", "gal", "meal", "oz"];

const CATEGORIES = [
  "Meat",
  "Protein Alternatives",
  "Fruits",
  "Vegetables",
  "Grains & Cereals",
  "Dairy",
  "Fats & Oils",
  "Sugars & Sweets",
];

// ── EMPTY FOOD ITEM ──────────────────────────────────────────────────────────
const newItem = () => ({
  id:              Date.now() + Math.random(),
  food_name:       "",
  quantity:        "",
  unit:            "",
  category:        "",
  expiration_date: "",
  special_notes:   "",
  photo:           null,
  photo_preview:   null,
});

// ── EMPTY SCHEDULE STATE ─────────────────────────────────────────────────────
const EMPTY_SCHEDULE = {
  mode:            "pickup",
  pickup_address:  "",
  preferred_date:  "",
  time_slot_start: "",
  time_slot_end:   "",
};

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function Donor_Donate_Food() {
  const navigate = useNavigate();

  // ── Food items list ──────────────────────────────────────────────────────
  const [items,    setItems]    = useState([newItem()]);
  const [itemErrs, setItemErrs] = useState({});

  // ── Schedule ─────────────────────────────────────────────────────────────
  const [schedule,     setSchedule]     = useState(EMPTY_SCHEDULE);
  const [scheduleErrs, setScheduleErrs] = useState({});

  // ── Submit status ────────────────────────────────────────────────────────
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"

  // ── Food item helpers ────────────────────────────────────────────────────
  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => it.id === id ? { ...it, [field]: value } : it)
    );
    if (itemErrs[id]?.[field]) {
      setItemErrs((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: null },
      }));
    }
  };

  const handlePhotoChange = (id, file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    const preview = URL.createObjectURL(file);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, photo: file, photo_preview: preview } : it
      )
    );
  };

  const removePhoto = (id) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (it.photo_preview) URL.revokeObjectURL(it.photo_preview);
        return { ...it, photo: null, photo_preview: null };
      })
    );
  };

  const addItem    = () => setItems((prev) => [...prev, newItem()]);
  const removeItem = (id) => {
    setItems((prev) => {
      const updated = prev.filter((it) => it.id !== id);
      return updated.length === 0 ? [newItem()] : updated;
    });
  };

  // ── Schedule helpers ─────────────────────────────────────────────────────
  const schedChange = (e) => {
    const { name, value } = e.target;
    setSchedule((prev) => ({ ...prev, [name]: value }));
    if (scheduleErrs[name]) setScheduleErrs((p) => ({ ...p, [name]: null }));
  };

  const setMode = (mode) => {
    setSchedule((prev) => ({ ...prev, mode }));
    setScheduleErrs({});
  };

  // ── Address input helper (ready for Mapbox integration later) ─────────────
  // When Mapbox is integrated, replace this with forward geocode + map fly-to
  const handleAddressInput = (value) => {
    setSchedule((prev) => ({ ...prev, pickup_address: value }));
    if (scheduleErrs.pickup_address)
      setScheduleErrs((p) => ({ ...p, pickup_address: null }));
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    let valid = true;
    const newItemErrs = {};

    items.forEach((it) => {
      const e = {};
      if (!it.food_name.trim())
        e.food_name = "Food name is required.";
      if (!it.quantity || isNaN(Number(it.quantity)) || Number(it.quantity) < 1)
        e.quantity = "Enter a valid quantity.";
      if (!it.unit)
        e.unit = "Select a unit.";
      if (!it.category)
        e.category = "Select a category.";
      if (!it.expiration_date)
        e.expiration_date = "Expiration date is required.";
      if (Object.keys(e).length > 0) { newItemErrs[it.id] = e; valid = false; }
    });

    setItemErrs(newItemErrs);

    const se = {};
    if (schedule.mode === "pickup" && !schedule.pickup_address.trim())
      se.pickup_address = "Please enter your pickup address.";
    if (!schedule.preferred_date)
      se.preferred_date = "Preferred date is required.";
    if (!schedule.time_slot_start)
      se.time_slot_start = "Start time is required.";
    if (!schedule.time_slot_end)
      se.time_slot_end = "End time is required.";
    if (
      schedule.time_slot_start &&
      schedule.time_slot_end &&
      schedule.time_slot_start >= schedule.time_slot_end
    ) se.time_slot_end = "End time must be after start time.";

    setScheduleErrs(se);
    if (Object.keys(se).length > 0) valid = false;

    return valid;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  // Backend: POST /api/donor/donations  (multipart/form-data)
  // Fields:
  //   type              → "food"
  //   mode              → "pickup" | "delivery"
  //   pickup_address    → string (pickup only)
  //   preferred_date    → "YYYY-MM-DD"
  //   time_slot_start   → "HH:MM"
  //   time_slot_end     → "HH:MM"
  //   items             → JSON string of items array (without photos)
  //   photo_{index}     → File (one per item that has a photo)
  // Returns: { id, status: "pending", created_at, ... }
  const handleSubmit = async () => {
    if (!validate()) return;
    setStatus("loading");

    try {
      const fd = new FormData();
      fd.append("type",            "food");
      fd.append("mode",            schedule.mode);
      fd.append("preferred_date",  schedule.preferred_date);
      fd.append("time_slot_start", schedule.time_slot_start);
      fd.append("time_slot_end",   schedule.time_slot_end);

      if (schedule.mode === "pickup") {
        fd.append("pickup_address", schedule.pickup_address);
      }

      const itemsPayload = items.map(({ photo, photo_preview, ...rest }) => rest);
      fd.append("items", JSON.stringify(itemsPayload));

      items.forEach((it, idx) => {
        if (it.photo) fd.append(`photo_${idx}`, it.photo);
      });

      await api.post("/donor/donations", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      items.forEach((it) => {
        if (it.photo_preview) URL.revokeObjectURL(it.photo_preview);
      });

      setStatus("success");
      setItems([newItem()]);
      setSchedule(EMPTY_SCHEDULE);
    } catch {
      setStatus("error");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const iErr = (id, field) => itemErrs[id]?.[field];
  const sErr = (field)     => scheduleErrs[field];

  const itemInp = (id, field) =>
    `don-food-input${iErr(id, field) ? " don-food-input-err" : ""}`;

  const schedInp = (field) =>
    `don-food-sched-input${sErr(field) ? " don-food-sched-input-err" : ""}`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="don-food-wrapper">
      <NavBar_Donor />

      <main className="don-food-main">

        {/* ── PAGE HEADER ── */}
        <div className="don-food-page-header">
          <div className="don-food-title-row">
            <img
              src="/images/Donor_Food.png"
              alt="Food Donation"
              className="don-food-title-icon"
            />
            <h1 className="don-food-page-title">Food Donation</h1>
          </div>
          <hr className="don-food-page-divider" />
        </div>

        {/* ── BODY: two columns ── */}
        <div className="don-food-body">

          {/* ══ LEFT — Food Items ══ */}
          <div className="don-food-left">

            <div className="don-food-section-header">
              <h2 className="don-food-section-title">Food Donation Details</h2>
              <button className="don-food-add-btn" onClick={addItem}>
                + Add More
              </button>
            </div>

            <div className="don-food-items-list">
              {items.map((item, idx) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  index={idx}
                  total={items.length}
                  errors={itemErrs[item.id] || {}}
                  onUpdate={updateItem}
                  onPhotoChange={handlePhotoChange}
                  onRemovePhoto={removePhoto}
                  onRemove={removeItem}
                  itemInp={itemInp}
                />
              ))}
            </div>

          </div>

          {/* ══ RIGHT — Schedule Panel ══ */}
          <div className="don-food-right">
            <div className="don-food-sched-card">

              <h3 className="don-food-sched-title">Schedule Pickup &amp; Delivery</h3>

              {/* Mode toggle */}
              <div className="don-food-mode-toggle">
                <button
                  className={`don-food-mode-btn${schedule.mode === "pickup" ? " don-food-mode-active" : ""}`}
                  onClick={() => setMode("pickup")}
                >
                  PICK UP
                </button>
                <button
                  className={`don-food-mode-btn${schedule.mode === "delivery" ? " don-food-mode-active" : ""}`}
                  onClick={() => setMode("delivery")}
                >
                  DELIVERY
                </button>
              </div>

              {/* Address section */}
              {schedule.mode === "delivery" ? (
                <div className="don-food-sched-field">
                  <label className="don-food-sched-label">Warehouse Address</label>
                  <div className="don-food-warehouse-addr-row">
                    <span className="material-symbols-rounded don-food-warehouse-icon">warehouse</span>
                    <p className="don-food-warehouse-addr">{WAREHOUSE.address}</p>
                  </div>
                </div>
              ) : (
                <div className="don-food-sched-field">
                  <label className="don-food-sched-label">Pickup Address</label>
                  <div className="don-food-addr-input-wrap">
                    <span className="material-symbols-rounded don-food-addr-icon">location_on</span>
                    <input
                      className={schedInp("pickup_address") + " don-food-addr-input"}
                      type="text"
                      placeholder="Enter your pickup address"
                      value={schedule.pickup_address}
                      onChange={(e) => handleAddressInput(e.target.value)}
                    />
                  </div>
                  {sErr("pickup_address") && (
                    <span className="don-food-sched-err">{sErr("pickup_address")}</span>
                  )}
                </div>
              )}

              {/* ── MAP PLACEHOLDER ──────────────────────────────────────────
                  Replace this entire .don-food-map-placeholder div with:

                  <div ref={mapContainer} className="don-food-map" />

                  once Mapbox is integrated. The map container size
                  (.don-food-map) is already defined in the CSS.
              ─────────────────────────────────────────────────────────────── */}
              <div className="don-food-map-placeholder">
                {/* Swap src for your own map screenshot / placeholder image */}
                <img
                  src="/images/map_placeholder.png"
                  alt="Map placeholder"
                  className="don-food-map-placeholder-img"
                  draggable={false}
                />
                <div className="don-food-map-placeholder-badge">
                  <span className="material-symbols-rounded">map</span>
                  Map will appear here
                </div>
                {/* Pin dot representing the address */}
                {(schedule.mode === "pickup"
                    ? schedule.pickup_address
                    : WAREHOUSE.address) && (
                  <div className="don-food-map-pin">
                    <span className="material-symbols-rounded don-food-map-pin-icon">
                      {schedule.mode === "delivery" ? "warehouse" : "location_on"}
                    </span>
                    <span className="don-food-map-pin-label">
                      {schedule.mode === "delivery"
                        ? WAREHOUSE.address
                        : schedule.pickup_address}
                    </span>
                  </div>
                )}
              </div>

              {/* Preferred Date + Time Slot */}
              <div className="don-food-sched-row">

                <div className="don-food-sched-field don-food-sched-field-half">
                  <label className="don-food-sched-label">Preferred Date</label>
                  <input
                    className={schedInp("preferred_date")}
                    type="date"
                    name="preferred_date"
                    value={schedule.preferred_date}
                    onChange={schedChange}
                  />
                  {sErr("preferred_date") && (
                    <span className="don-food-sched-err">{sErr("preferred_date")}</span>
                  )}
                </div>

                <div className="don-food-sched-field don-food-sched-field-half">
                  <label className="don-food-sched-label">Time Slot</label>
                  <div className="don-food-timeslot-row">
                    <input
                      className={schedInp("time_slot_start") + " don-food-time-input"}
                      type="time"
                      name="time_slot_start"
                      value={schedule.time_slot_start}
                      onChange={schedChange}
                    />
                    <span className="don-food-time-sep">–</span>
                    <input
                      className={schedInp("time_slot_end") + " don-food-time-input"}
                      type="time"
                      name="time_slot_end"
                      value={schedule.time_slot_end}
                      onChange={schedChange}
                    />
                  </div>
                  {(sErr("time_slot_start") || sErr("time_slot_end")) && (
                    <span className="don-food-sched-err">
                      {sErr("time_slot_start") || sErr("time_slot_end")}
                    </span>
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ── STATUS ── */}
        {status === "success" && (
          <p className="don-food-status don-food-status-success">
            ✓ Food donation submitted successfully!
          </p>
        )}
        {status === "error" && (
          <p className="don-food-status don-food-status-error">
            Something went wrong. Please try again.
          </p>
        )}

        {/* ── SUBMIT ROW ── */}
        <div className="don-food-submit-row">
          <button
            className="don-food-cancel-btn"
            onClick={() => navigate("/donor/donate")}
          >
            Cancel
          </button>
          <button
            className="don-food-submit-btn"
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

// ── FOOD ITEM CARD ────────────────────────────────────────────────────────────
function FoodItemCard({
  item, index, total, errors,
  onUpdate, onPhotoChange, onRemovePhoto, onRemove, itemInp,
}) {
  const photoRef = useRef(null);

  return (
    <div className="don-food-item-card">

      {/* Card index label */}
      <div className="don-food-item-card-header">
        <span className="don-food-item-card-num">Item #{index + 1}</span>
        {total > 1 && (
          <button
            className="don-food-item-remove"
            onClick={() => onRemove(item.id)}
            title="Remove this item"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        )}
      </div>

      {/* Row 1: Food name | Quantity | Units | Category | Expiration */}
      <div className="don-food-item-row">

        <div className="don-food-item-field don-food-item-field-name">
          <label className="don-food-item-label">Food Item Name</label>
          <input
            className={itemInp(item.id, "food_name")}
            type="text"
            placeholder="e.g., Canned vegetables, Fresh fruits"
            value={item.food_name}
            onChange={(e) => onUpdate(item.id, "food_name", e.target.value)}
          />
          {errors.food_name && (
            <span className="don-food-item-err">{errors.food_name}</span>
          )}
        </div>

        <div className="don-food-item-field don-food-item-field-qty">
          <label className="don-food-item-label">Quantity</label>
          <input
            className={itemInp(item.id, "quantity")}
            type="number"
            min="1"
            placeholder="##"
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
          />
          {errors.quantity && (
            <span className="don-food-item-err">{errors.quantity}</span>
          )}
        </div>

        <div className="don-food-item-field don-food-item-field-unit">
          <label className="don-food-item-label">Units</label>
          <select
            className={itemInp(item.id, "unit") + " don-food-item-select"}
            value={item.unit}
            onChange={(e) => onUpdate(item.id, "unit", e.target.value)}
          >
            <option value="" disabled>–</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.unit && (
            <span className="don-food-item-err">{errors.unit}</span>
          )}
        </div>

        <div className="don-food-item-field don-food-item-field-cat">
          <label className="don-food-item-label">Category</label>
          <select
            className={itemInp(item.id, "category") + " don-food-item-select"}
            value={item.category}
            onChange={(e) => onUpdate(item.id, "category", e.target.value)}
          >
            <option value="" disabled>Select</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && (
            <span className="don-food-item-err">{errors.category}</span>
          )}
        </div>

        <div className="don-food-item-field don-food-item-field-exp">
          <label className="don-food-item-label">Expiration Date</label>
          <input
            className={itemInp(item.id, "expiration_date")}
            type="date"
            value={item.expiration_date}
            onChange={(e) => onUpdate(item.id, "expiration_date", e.target.value)}
          />
          {errors.expiration_date && (
            <span className="don-food-item-err">{errors.expiration_date}</span>
          )}
        </div>

      </div>

      {/* Row 2: Special Notes | Upload Photo */}
      <div className="don-food-item-row don-food-item-row2">

        <div className="don-food-item-field don-food-item-field-notes">
          <label className="don-food-item-label">
            Special Notes{" "}
            <span className="don-food-item-label-opt">(optional)</span>
          </label>
          <input
            className="don-food-input"
            type="text"
            placeholder="Allergies, storage requirements, etc."
            value={item.special_notes}
            onChange={(e) => onUpdate(item.id, "special_notes", e.target.value)}
          />
        </div>

        {/* Photo upload */}
        <div className="don-food-item-field don-food-item-field-photo">
          <label className="don-food-item-label">
            Photo{" "}
            <span className="don-food-item-label-opt">(optional)</span>
          </label>
          <div
            className={`don-food-photo-box${item.photo ? " don-food-photo-has-file" : ""}`}
            onClick={() => photoRef.current?.click()}
            title="Upload item photo"
          >
            {item.photo_preview ? (
              <img
                src={item.photo_preview}
                alt="Preview"
                className="don-food-photo-preview"
              />
            ) : (
              <>
                <span className="material-symbols-rounded don-food-photo-icon">upload</span>
                <span className="don-food-photo-text">Upload Photo</span>
              </>
            )}
          </div>
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => onPhotoChange(item.id, e.target.files?.[0])}
          />
          {item.photo && (
            <button
              className="don-food-photo-remove"
              onClick={() => onRemovePhoto(item.id)}
              type="button"
            >
              ✕ Remove
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
