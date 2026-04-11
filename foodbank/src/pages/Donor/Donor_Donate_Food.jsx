import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

// ── GOOGLE MAPS SETUP ────────────────────────────────────────────────────────
const LIBRARIES = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "220px", borderRadius: "10px" };
const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

// ── WAREHOUSE (DELIVERY mode — fixed drop-off location) ──────────────────────
const WAREHOUSE = {
  lat:     14.5564,
  lng:     121.0166,
  address: "Room 300, DHI Building, No. 2 Lapu Lapu Avenue, Magallanes, Makati City 1232, Metro Manila, Philippines",
};

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const UNITS      = ["g", "kg", "lbs", "L", "ml", "gal", "meal", "oz"];
const CATEGORIES = [
  "Meat", "Protein Alternatives", "Fruits", "Vegetables",
  "Grains & Cereals", "Dairy", "Fats & Oils", "Sugars & Sweets",
];

// ── EMPTY HELPERS ────────────────────────────────────────────────────────────
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

const EMPTY_SCHEDULE = {
  mode:            "pickup",
  pickup_address:  "",
  preferred_date:  "",
  time_slot_start: "",
  time_slot_end:   "",
};

// ── INIT — stable first items ─────────────────────────────────────────────────
const FIRST_ITEM  = newItem();
const SECOND_ITEM = newItem();

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function Donor_Donate_Food() {
  const navigate = useNavigate();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // ── Map state ────────────────────────────────────────────────────────────
  const [mapCenter,  setMapCenter]  = useState(DEFAULT_CENTER);
  const [markerPos,  setMarkerPos]  = useState(null);
  const autocompleteRef             = useRef(null);
  const mapRef                      = useRef(null);

  // ── Food items ───────────────────────────────────────────────────────────
  const [items,     setItems]     = useState([FIRST_ITEM, SECOND_ITEM]);
  const [activeIds, setActiveIds] = useState(new Set([FIRST_ITEM.id]));
  const [itemErrs,  setItemErrs]  = useState({});

  // ── Schedule ─────────────────────────────────────────────────────────────
  const [schedule,     setSchedule]     = useState(EMPTY_SCHEDULE);
  const [scheduleErrs, setScheduleErrs] = useState({});

  // ── Submit status ────────────────────────────────────────────────────────
  const [status,    setStatus]    = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // ── Map callbacks ────────────────────────────────────────────────────────
  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) return;
    const lat     = place.geometry.location.lat();
    const lng     = place.geometry.location.lng();
    const address = place.formatted_address || place.name || "";
    setMarkerPos({ lat, lng });
    setMapCenter({ lat, lng });
    setSchedule((prev) => ({ ...prev, pickup_address: address }));
    if (scheduleErrs.pickup_address)
      setScheduleErrs((p) => ({ ...p, pickup_address: null }));
  };

  const onMarkerDragEnd = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    setMapCenter({ lat, lng });
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, geoStatus) => {
        if (geoStatus === "OK" && results[0]) {
          setSchedule((prev) => ({ ...prev, pickup_address: results[0].formatted_address }));
        }
      });
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  // ── Activate an item ─────────────────────────────────────────────────────
  const activateItem = (id) => {
    setActiveIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      setItems((prevItems) => {
        const idx = prevItems.findIndex((it) => it.id === id);
        if (idx === prevItems.length - 1) {
          return [...prevItems, newItem()];
        }
        return prevItems;
      });
      return next;
    });
  };

  // ── Food item helpers ────────────────────────────────────────────────────
  const updateItem = (id, field, value) => {
    activateItem(id);
    setItems((prev) =>
      prev.map((it) => it.id === id ? { ...it, [field]: value } : it)
    );
    if (itemErrs[id]?.[field])
      setItemErrs((prev) => ({ ...prev, [id]: { ...prev[id], [field]: null } }));
  };

  const handlePhotoChange = (id, file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) return;
    activateItem(id);
    const preview = URL.createObjectURL(file);
    setItems((prev) =>
      prev.map((it) => it.id === id ? { ...it, photo: file, photo_preview: preview } : it)
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

  const removeItem = (id) => {
    setItems((prev) => {
      const updated = prev.filter((it) => it.id !== id);
      if (updated.length === 0) {
        const fresh = newItem();
        const blank = newItem();
        setActiveIds(new Set([fresh.id]));
        return [fresh, blank];
      }
      const lastIsActive = activeIds.has(updated[updated.length - 1].id);
      if (lastIsActive) {
        return [...updated, newItem()];
      }
      return updated;
    });
    setActiveIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setItemErrs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // ── Schedule helpers ─────────────────────────────────────────────────────
  const schedChange = (e) => {
    const { name, value } = e.target;
    setSchedule((prev) => ({ ...prev, [name]: value }));
    if (scheduleErrs[name]) setScheduleErrs((p) => ({ ...p, [name]: null }));
    if (name === "time_slot_start") setScheduleErrs((p) => ({ ...p, time_slot_end: null }));
  };

  const setMode = (mode) => {
    setSchedule((prev) => ({ ...prev, mode }));
    setScheduleErrs({});
    if (mode === "delivery") {
      setMapCenter({ lat: WAREHOUSE.lat, lng: WAREHOUSE.lng });
      setMarkerPos({ lat: WAREHOUSE.lat, lng: WAREHOUSE.lng });
    } else {
      setMarkerPos(null);
      setMapCenter(DEFAULT_CENTER);
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    let valid = true;
    const newItemErrs = {};
    const activeItems = items.filter((it) => activeIds.has(it.id));

    activeItems.forEach((it) => {
      const e = {};
      if (!it.food_name.trim())        e.food_name       = "Food name is required.";
      if (!it.quantity || isNaN(Number(it.quantity)) || Number(it.quantity) < 1)
                                        e.quantity        = "Enter a valid quantity.";
      if (!it.unit)                     e.unit            = "Select a unit.";
      if (!it.category)                 e.category        = "Select a category.";
      if (!it.expiration_date)          e.expiration_date = "Expiration date is required.";
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
    if (schedule.time_slot_start && schedule.time_slot_end &&
        schedule.time_slot_start >= schedule.time_slot_end)
      se.time_slot_end = "End time must be after start time.";

    setScheduleErrs(se);
    if (Object.keys(se).length > 0) valid = false;
    return valid;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setStatus("loading");

    try {
      const activeItems = items.filter((it) => activeIds.has(it.id));
      const fd = new FormData();
      fd.append("type",            "food");
      fd.append("mode",            schedule.mode);
      fd.append("preferred_date",  schedule.preferred_date);
      fd.append("time_slot_start", schedule.time_slot_start);
      fd.append("time_slot_end",   schedule.time_slot_end);

      if (schedule.mode === "pickup") {
        fd.append("pickup_address", schedule.pickup_address);
        if (markerPos) {
          fd.append("pickup_lat", markerPos.lat);
          fd.append("pickup_lng", markerPos.lng);
        }
      }
      if (schedule.mode === "delivery") fd.append("delivery_address", WAREHOUSE.address);

      const itemsPayload = activeItems.map(({ photo, photo_preview, ...rest }) => rest);
      fd.append("items", JSON.stringify(itemsPayload));
      activeItems.forEach((it, idx) => { if (it.photo) fd.append(`photo_${idx}`, it.photo); });

      await api.post("/donor/donations/food", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      activeItems.forEach((it) => { if (it.photo_preview) URL.revokeObjectURL(it.photo_preview); });

      const fresh = newItem();
      const blank = newItem();
      setItems([fresh, blank]);
      setActiveIds(new Set([fresh.id]));
      setItemErrs({});
      setSchedule(EMPTY_SCHEDULE);
      setMarkerPos(null);
      setMapCenter(DEFAULT_CENTER);
      setStatus("success");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);

    } catch {
      setStatus("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
    }
  };

  // ── CSS helpers ──────────────────────────────────────────────────────────
  const iErr    = (id, field) => itemErrs[id]?.[field];
  const sErr    = (field)     => scheduleErrs[field];
  const itemInp = (id, field) =>
    `don-food-input${iErr(id, field) ? " don-food-input-err" : ""}`;
  const schedInp = (field) =>
    `don-food-sched-input${sErr(field) ? " don-food-sched-input-err" : ""}`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="don-food-wrapper">
      <NavBar_Donor />

      <main className="don-food-main" style={{ maxWidth: "1400px" }}>

        {/* PAGE HEADER */}
        <div className="don-food-page-header" style={{ textAlign: "left" }}>
          <div className="don-food-title-row" style={{ justifyContent: "flex-start" }}>
            <img src="/images/Donor_Food_Dark.png" alt="Food Donation" className="don-food-title-icon" />
            <h1 className="don-food-page-title">Food Donation</h1>
          </div>
        </div>

        {/* BODY */}
        <div className="don-food-body" style={{ alignItems: "flex-start", position: "relative" }}>

          {/* ══ LEFT — scrollable food items ══ */}
          <div
            className="don-food-left"
            style={{ flex: 1, minWidth: 0, paddingRight: "452px" }}
          >
            <div className="don-food-section-header">
              <h2 className="don-food-section-title">Food Donation Details</h2>
            </div>

            <div className="don-food-items-list">
              {items.map((item, idx) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  index={idx}
                  total={items.length}
                  isActive={activeIds.has(item.id)}
                  errors={itemErrs[item.id] || {}}
                  onActivate={() => activateItem(item.id)}
                  onUpdate={updateItem}
                  onPhotoChange={handlePhotoChange}
                  onRemovePhoto={removePhoto}
                  onRemove={removeItem}
                  itemInp={itemInp}
                />
              ))}
            </div>
          </div>

          {/* ══ RIGHT — fixed schedule + submit panel ══ */}
          <div
            className="don-food-right"
            style={{
              width: "420px",
              position: "fixed",
              top: "80px",
              bottom: "20px",
              right: "max(calc((100vw - 1400px) / 2 + 40px), 20px)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              zIndex: 50,
            }}
          >

            {/* Schedule card */}
            <div
              className="don-food-sched-card"
              style={{ flex: "1 1 auto", overflowY: "auto", minHeight: 0 }}
            >
              <h3 className="don-food-sched-title">Schedule Pickup &amp; Delivery</h3>

              {/* Mode toggle */}
              <div className="don-food-mode-toggle">
                <button
                  className={`don-food-mode-btn${schedule.mode === "pickup" ? " don-food-mode-active" : ""}`}
                  onClick={() => setMode("pickup")}
                >PICK UP</button>
                <button
                  className={`don-food-mode-btn${schedule.mode === "delivery" ? " don-food-mode-active" : ""}`}
                  onClick={() => setMode("delivery")}
                >DELIVERY</button>
              </div>

              {/* Address field */}
              {schedule.mode === "delivery" ? (
                <div className="don-food-sched-field">
                  <label className="don-food-sched-label">Drop-off Address</label>
                  <div className="don-food-warehouse-addr-row">
                    <span className="material-symbols-rounded don-food-warehouse-icon">warehouse</span>
                    <p className="don-food-warehouse-addr">{WAREHOUSE.address}</p>
                  </div>
                  <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>
                    Please bring your donation to this address on your selected date and time.
                  </p>
                </div>
              ) : (
                <div className="don-food-sched-field">
                  <label className="don-food-sched-label">Pickup Address</label>
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={(ref) => (autocompleteRef.current = ref)}
                      onPlaceChanged={onPlaceChanged}
                      options={{ componentRestrictions: { country: "ph" } }}
                      style={{ width: "100%" }}
                    >
                      <input
                        className={`don-food-sched-input${sErr("pickup_address") ? " don-food-sched-input-err" : ""}`}
                        type="text"
                        placeholder="Enter your pickup address"
                        value={schedule.pickup_address}
                        style={{ width: "100%", boxSizing: "border-box" }}
                        onChange={(e) => {
                          setSchedule((prev) => ({ ...prev, pickup_address: e.target.value }));
                          if (scheduleErrs.pickup_address)
                            setScheduleErrs((p) => ({ ...p, pickup_address: null }));
                        }}
                      />
                    </Autocomplete>
                  ) : (
                    <input
                      className="don-food-sched-input"
                      type="text"
                      placeholder="Loading map..."
                      disabled
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  )}
                  {sErr("pickup_address") && (
                    <span className="don-food-sched-err">{sErr("pickup_address")}</span>
                  )}
                </div>
              )}

              {/* Map */}
              <div className="don-food-map-placeholder">
                {loadError && (
                  <div className="don-food-map-placeholder-badge">
                    <span className="material-symbols-rounded">error</span> Failed to load map
                  </div>
                )}
                {!loadError && !isLoaded && (
                  <div className="don-food-map-placeholder-badge">
                    <span className="material-symbols-rounded">map</span> Loading map…
                  </div>
                )}
                {!loadError && isLoaded && (
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={mapCenter}
                    zoom={markerPos ? 16 : 12}
                    onLoad={onMapLoad}
                    options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                  >
                    {markerPos && (
                      <Marker
                        position={markerPos}
                        draggable={schedule.mode === "pickup"}
                        onDragEnd={onMarkerDragEnd}
                        title={schedule.mode === "pickup" ? "Drag to adjust pickup location" : "Drop-off warehouse location"}
                      />
                    )}
                  </GoogleMap>
                )}
                {isLoaded && !markerPos && (
                  <div className="don-food-map-placeholder-badge">
                    <span className="material-symbols-rounded">map</span>
                    {schedule.mode === "pickup" ? "Enter an address to see it on the map" : "Loading warehouse location…"}
                  </div>
                )}
              </div>

              {isLoaded && markerPos && schedule.mode === "pickup" && (
                <p style={{ fontSize: 11, color: "#888", margin: "-4px 0 4px", textAlign: "center" }}>
                  📍 Drag the pin to fine-tune your pickup location
                </p>
              )}

              {/* Preferred Date */}
              <div className="don-food-sched-field">
                <label className="don-food-sched-label">Preferred Date</label>
                <input
                  className={`${schedInp("preferred_date")} don-food-sched-date-input-green`}
                  type="date"
                  name="preferred_date"
                  value={schedule.preferred_date}
                  onChange={schedChange}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", boxSizing: "border-box", color: "#1b5e20" }}
                />
                {sErr("preferred_date") && (
                  <span className="don-food-sched-err">{sErr("preferred_date")}</span>
                )}
              </div>

              {/* Time Slot */}
              <div className="don-food-sched-field">
                <label className="don-food-sched-label">Time Slot</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>From</label>
                    <input
                      className={`${schedInp("time_slot_start")} don-food-time-input`}
                      type="time"
                      name="time_slot_start"
                      value={schedule.time_slot_start}
                      onChange={schedChange}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                    {sErr("time_slot_start") && (
                      <span className="don-food-sched-err">{sErr("time_slot_start")}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>To</label>
                    <input
                      className={`${schedInp("time_slot_end")} don-food-time-input`}
                      type="time"
                      name="time_slot_end"
                      value={schedule.time_slot_end}
                      onChange={schedChange}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                    {sErr("time_slot_end") && (
                      <span className="don-food-sched-err">{sErr("time_slot_end")}</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
            {/* end sched-card */}

            {/* Action buttons */}
            <div
              className="don-food-submit-row"
              style={{ flexShrink: 0, gap: "10px", margin: 0 }}
            >
              <button
                className="don-food-cancel-btn"
                onClick={() => navigate("/donor/donate")}
                disabled={status === "loading"}
                style={{ flex: 1, padding: "13px 0" }}
              >
                Cancel
              </button>
              <button
                className="don-food-submit-btn"
                onClick={handleSubmit}
                disabled={status === "loading" || status === "success"}
                style={{ flex: 2, padding: "13px 0" }}
              >
                {status === "loading" ? "Submitting…" : status === "success" ? "Submitted ✓" : "Submit"}
              </button>
            </div>

          </div>
          {/* end RIGHT */}

        </div>
        {/* end BODY */}

      </main>

      {/* ── FEEDBACK POPUP ── */}
      {showPopup && (
        <div className="don-food-popup-overlay" onClick={() => setShowPopup(false)}>
          <div
            className={`don-food-popup-box${status === "success" ? " don-food-popup-success" : " don-food-popup-error"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="don-food-popup-icon">
              {status === "success" ? "✓" : "✕"}
            </div>
            <div className="don-food-popup-content">
              <p className="don-food-popup-title">
                {status === "success" ? "Submission Successful!" : "Submission Failed"}
              </p>
              <p className="don-food-popup-msg">
                {status === "success"
                  ? "Your food donation has been submitted. It is now under staff review."
                  : "Something went wrong. Please try again."}
              </p>
            </div>
            <button className="don-food-popup-close" onClick={() => setShowPopup(false)}>✕</button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── FOOD ITEM CARD ────────────────────────────────────────────────────────────
function FoodItemCard({
  item, index, total, isActive, errors,
  onActivate, onUpdate, onPhotoChange, onRemovePhoto, onRemove, itemInp,
}) {
  const photoRef = useRef(null);

  // ── INACTIVE card ──
  if (!isActive) {
    return (
      <div
        className="don-food-item-card"
        style={{
          background: "#f4f4f0",
          boxShadow: "none",
          border: "2px dashed #ccc",
          opacity: 0.65,
          transition: "opacity 0.25s, border-color 0.25s",
        }}
        onFocus={() => onActivate()}
      >
        <div className="don-food-item-card-header">
          <span className="don-food-item-card-num" style={{ color: "#aaa" }}>
            Item #{index + 1}
          </span>
          {total > 1 && (
            <button
              className="don-food-item-remove"
              onClick={() => onRemove(item.id)}
              title="Remove this item"
              style={{ background: "rgba(0,0,0,0.06)", color: "#aaa" }}
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          )}
        </div>

        {/* Row 1 */}
        <div className="don-food-item-row">

          <div className="don-food-item-field don-food-item-field-name">
            <label className="don-food-item-label" style={{ color: "#bbb" }}>Food Item Name</label>
            <input
              className="don-food-input"
              type="text"
              placeholder="e.g., Canned vegetables, Fresh fruits"
              value={item.food_name}
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "#999", background: "transparent" }}
              onChange={(e) => onUpdate(item.id, "food_name", e.target.value)}
            />
          </div>

          <div className="don-food-item-field don-food-item-field-qty">
            <label className="don-food-item-label" style={{ color: "#bbb" }}>Quantity</label>
            <input
              className="don-food-input"
              type="number"
              min="1"
              placeholder="##"
              value={item.quantity}
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "#999", background: "transparent" }}
              onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
            />
          </div>

          <div className="don-food-item-field don-food-item-field-unit">
            <label className="don-food-item-label" style={{ color: "#bbb" }}>Units</label>
            <select
              className="don-food-input don-food-item-select"
              value={item.unit}
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "#999", background: "transparent" }}
              onChange={(e) => onUpdate(item.id, "unit", e.target.value)}
            >
              <option value="" disabled>–</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="don-food-item-field don-food-item-field-cat">
            <label className="don-food-item-label" style={{ color: "#bbb" }}>Category</label>
            <select
              className="don-food-input don-food-item-select"
              value={item.category}
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "#999", background: "transparent" }}
              onChange={(e) => onUpdate(item.id, "category", e.target.value)}
            >
              <option value="" disabled>Select</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="don-food-item-field don-food-item-field-exp">
            <label className="don-food-item-label" style={{ color: "#bbb" }}>Expiration Date</label>
            <input
              className="don-food-input don-food-exp-date-input-white"
              type="date"
              value={item.expiration_date}
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "#999", background: "transparent" }}
              onChange={(e) => onUpdate(item.id, "expiration_date", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

        </div>

        {/* Row 2 */}
        <div className="don-food-item-row don-food-item-row2">

          <div className="don-food-item-field don-food-item-field-notes">
            <label className="don-food-item-label" style={{ color: "#bbb" }}>
              Special Notes <span className="don-food-item-label-opt">(optional)</span>
            </label>
            <textarea
              className="don-food-input don-food-textarea-fixed"
              placeholder="Allergies, storage requirements, etc."
              value={item.special_notes}
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "#999", background: "transparent", resize: "vertical", minHeight: "80px" }}
              onChange={(e) => onUpdate(item.id, "special_notes", e.target.value)}
            />
          </div>

          <div className="don-food-item-field don-food-item-field-photo">
            <label className="don-food-item-label" style={{ color: "#bbb" }}>
              Photo <span className="don-food-item-label-opt">(optional)</span>
            </label>
            <div
              className="don-food-photo-box"
              onClick={() => { onActivate(); photoRef.current?.click(); }}
              style={{ opacity: 0.5, minHeight: "80px" }}
              title="Upload item photo"
            >
              {item.photo_preview ? (
                <img src={item.photo_preview} alt="Preview" className="don-food-photo-preview" />
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
          </div>

        </div>
      </div>
    );
  }

  // ── ACTIVE card ───────────────────────────────────────────────────────────
  return (
    <div className="don-food-item-card">

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

      {/* Row 1 */}
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
          {errors.food_name && <span className="don-food-item-err">{errors.food_name}</span>}
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
          {errors.quantity && <span className="don-food-item-err">{errors.quantity}</span>}
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
          {errors.unit && <span className="don-food-item-err">{errors.unit}</span>}
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
          {errors.category && <span className="don-food-item-err">{errors.category}</span>}
        </div>

        <div className="don-food-item-field don-food-item-field-exp">
          <label className="don-food-item-label">Expiration Date</label>
          <input
            className={`${itemInp(item.id, "expiration_date")} don-food-exp-date-input-white`}
            type="date"
            value={item.expiration_date}
            onChange={(e) => onUpdate(item.id, "expiration_date", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.expiration_date && (
            <span className="don-food-item-err">{errors.expiration_date}</span>
          )}
        </div>

      </div>

      {/* Row 2 */}
      <div className="don-food-item-row don-food-item-row2">

        <div className="don-food-item-field don-food-item-field-notes">
          <label className="don-food-item-label">
            Special Notes <span className="don-food-item-label-opt">(optional)</span>
          </label>
          <textarea
            className="don-food-input don-food-textarea-fixed"
            placeholder="Allergies, storage requirements, etc."
            value={item.special_notes}
            onChange={(e) => onUpdate(item.id, "special_notes", e.target.value)}
            style={{ resize: "vertical", minHeight: "80px" }}
          />
        </div>

        <div className="don-food-item-field don-food-item-field-photo">
          <label className="don-food-item-label">
            Photo <span className="don-food-item-label-opt">(optional)</span>
          </label>
          <div
            className={`don-food-photo-box${item.photo ? " don-food-photo-has-file" : ""}`}
            onClick={() => photoRef.current?.click()}
            title="Upload item photo"
            style={{ minHeight: "80px" }}
          >
            {item.photo_preview ? (
              <img src={item.photo_preview} alt="Preview" className="don-food-photo-preview" />
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
