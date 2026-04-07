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
  const [items,    setItems]    = useState([newItem()]);
  const [itemErrs, setItemErrs] = useState({});

  // ── Schedule ─────────────────────────────────────────────────────────────
  const [schedule,     setSchedule]     = useState(EMPTY_SCHEDULE);
  const [scheduleErrs, setScheduleErrs] = useState({});

  // ── Submit status ────────────────────────────────────────────────────────
  const [status, setStatus] = useState(null);

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
          const addr = results[0].formatted_address;
          setSchedule((prev) => ({ ...prev, pickup_address: addr }));
        }
      });
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  // ── Food item helpers ────────────────────────────────────────────────────
  const updateItem = (id, field, value) => {
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
    if (mode === "delivery") {
      // ✅ Show fixed warehouse location on map
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
    // ✅ Pickup address only required for pickup mode
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
    )
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

      // ✅ For delivery, send the fixed warehouse address
      if (schedule.mode === "delivery") {
        fd.append("delivery_address", WAREHOUSE.address);
      }

      // Strip photo blobs from JSON payload, send files separately
      const itemsPayload = items.map(({ photo, photo_preview, ...rest }) => rest);
      fd.append("items", JSON.stringify(itemsPayload));
      items.forEach((it, idx) => {
        if (it.photo) fd.append(`photo_${idx}`, it.photo);
      });

      // ✅ Correct endpoint
      await api.post("/donor/donations/food", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Cleanup object URLs
      items.forEach((it) => {
        if (it.photo_preview) URL.revokeObjectURL(it.photo_preview);
      });

      setStatus("success");
      setItems([newItem()]);
      setSchedule(EMPTY_SCHEDULE);
      setMarkerPos(null);
      setMapCenter(DEFAULT_CENTER);

    } catch {
      setStatus("error");
    }
  };

  // ── CSS helpers ──────────────────────────────────────────────────────────
  const iErr     = (id, field) => itemErrs[id]?.[field];
  const sErr     = (field)     => scheduleErrs[field];
  const itemInp  = (id, field) =>
    `don-food-input${iErr(id, field) ? " don-food-input-err" : ""}`;
  const schedInp = (field) =>
    `don-food-sched-input${sErr(field) ? " don-food-sched-input-err" : ""}`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="don-food-wrapper">
      <NavBar_Donor />

      <main className="don-food-main">

        {/* PAGE HEADER */}
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

        {/* BODY */}
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

              {/* ✅ DELIVERY — show fixed warehouse address, no input needed */}
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
                // ✅ PICKUP — donor enters their address
                <div className="don-food-sched-field">
                  <label className="don-food-sched-label">Pickup Address</label>
                  <div className="don-food-addr-input-wrap">
                    <span className="material-symbols-rounded don-food-addr-icon">location_on</span>
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={(ref) => (autocompleteRef.current = ref)}
                        onPlaceChanged={onPlaceChanged}
                        options={{ componentRestrictions: { country: "ph" } }}
                        style={{ width: "100%" }}
                      >
                        <input
                          className={schedInp("pickup_address") + " don-food-addr-input"}
                          type="text"
                          placeholder="Enter your pickup address"
                          value={schedule.pickup_address}
                          onChange={(e) => {
                            setSchedule((prev) => ({ ...prev, pickup_address: e.target.value }));
                            if (scheduleErrs.pickup_address)
                              setScheduleErrs((p) => ({ ...p, pickup_address: null }));
                          }}
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        className={schedInp("pickup_address") + " don-food-addr-input"}
                        type="text"
                        placeholder="Loading map..."
                        disabled
                      />
                    )}
                  </div>
                  {sErr("pickup_address") && (
                    <span className="don-food-sched-err">{sErr("pickup_address")}</span>
                  )}
                </div>
              )}

              {/* GOOGLE MAP */}
              <div className="don-food-map-placeholder">
                {loadError && (
                  <div className="don-food-map-placeholder-badge">
                    <span className="material-symbols-rounded">error</span>
                    Failed to load map
                  </div>
                )}
                {!loadError && !isLoaded && (
                  <div className="don-food-map-placeholder-badge">
                    <span className="material-symbols-rounded">map</span>
                    Loading map…
                  </div>
                )}
                {!loadError && isLoaded && (
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={mapCenter}
                    zoom={markerPos ? 16 : 12}
                    onLoad={onMapLoad}
                    options={{
                      streetViewControl:  false,
                      mapTypeControl:     false,
                      fullscreenControl:  false,
                    }}
                  >
                    {markerPos && (
                      <Marker
                        position={markerPos}
                        // ✅ Only draggable in pickup mode
                        draggable={schedule.mode === "pickup"}
                        onDragEnd={onMarkerDragEnd}
                        title={
                          schedule.mode === "pickup"
                            ? "Drag to adjust pickup location"
                            : "Drop-off warehouse location"
                        }
                      />
                    )}
                  </GoogleMap>
                )}
                {isLoaded && !markerPos && (
                  <div className="don-food-map-placeholder-badge">
                    <span className="material-symbols-rounded">map</span>
                    {schedule.mode === "pickup"
                      ? "Enter an address to see it on the map"
                      : "Loading warehouse location…"}
                  </div>
                )}
              </div>

              {/* Drag hint — pickup only */}
              {isLoaded && markerPos && schedule.mode === "pickup" && (
                <p style={{ fontSize: 11, color: "#888", margin: "-4px 0 8px", textAlign: "center" }}>
                  📍 Drag the pin to fine-tune your pickup location
                </p>
              )}

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
                    min={new Date().toISOString().split("T")[0]}
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

        {/* STATUS MESSAGES */}
        {status === "success" && (
          <p className="don-food-status don-food-status-success">
            ✓ Donation submitted! It is now under staff review and will be added to inventory once approved.
          </p>
        )}
        {status === "error" && (
          <p className="don-food-status don-food-status-error">
            ✗ Something went wrong. Please try again.
          </p>
        )}

        {/* ACTION BUTTONS */}
        <div className="don-food-submit-row">
          <button
            className="don-food-cancel-btn"
            onClick={() => navigate("/donor/donate")}
            disabled={status === "loading"}
          >
            Cancel
          </button>
          <button
            className="don-food-submit-btn"
            onClick={handleSubmit}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? "Submitting…" : status === "success" ? "Submitted ✓" : "Submit"}
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
            className={itemInp(item.id, "expiration_date")}
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

      <div className="don-food-item-row don-food-item-row2">

        <div className="don-food-item-field don-food-item-field-notes">
          <label className="don-food-item-label">
            Special Notes <span className="don-food-item-label-opt">(optional)</span>
          </label>
          <input
            className="don-food-input"
            type="text"
            placeholder="Allergies, storage requirements, etc."
            value={item.special_notes}
            onChange={(e) => onUpdate(item.id, "special_notes", e.target.value)}
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