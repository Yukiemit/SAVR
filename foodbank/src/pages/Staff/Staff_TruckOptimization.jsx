import { useState, useEffect, useCallback, useRef } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const URGENCY_CONFIG = {
  High:   { color: "#fff", bg: "#e74c3c", border: "#e74c3c" },
  Medium: { color: "#fff", bg: "#f4b942", border: "#f4b942" },
  Low:    { color: "#fff", bg: "#2e7d32", border: "#2e7d32" },
};

const VEHICLE_TYPES = [
  "Refrigerated Truck",
  "Delivery Van",
  "Pickup Truck",
  "Motorcycle",
  "Van / Minivan",
  "Box Truck",
  "Flatbed Truck",
];

const FOOD_CATEGORIES = [
  "Dry Goods",
  "Canned Goods",
  "Fresh Produce",
  "Frozen Foods",
  "Dairy",
  "Meat / Poultry",
  "Beverages",
  "Bakery",
  "Condiments",
  "Grains & Cereals",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function computeUrgency(prefDate) {
  if (!prefDate) return "Low";
  const today = new Date();
  today.setHours(0,0,0,0);
  const pref  = new Date(prefDate);
  pref.setHours(0,0,0,0);
  const diffDays = Math.ceil((pref - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1)  return "High";
  if (diffDays <= 3)  return "Medium";
  return "Low";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", { year:"numeric", month:"2-digit", day:"2-digit" });
}

function fmtTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ── Get min date for date picker (today) ─────────────────────────────────────
function getMinDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// ── Operating window constants ───────────────────────────────────────────────
const OPERATING_START = "07:00"; // 7:00 AM
const OPERATING_END   = "21:00"; // 9:00 PM

// ── Get current time rounded up to next 30 minutes, clamped to operating window
function getCurrentTimeRounded() {
  const now = new Date();
  let hours   = now.getHours();
  let minutes = now.getMinutes();

  // Round up to next 30-minute interval
  if (minutes > 0 && minutes <= 30) {
    minutes = 30;
  } else if (minutes > 30) {
    minutes = 0;
    hours += 1;
  }

  // Clamp to operating window
  if (hours < 7)  { hours = 7;  minutes = 0; }
  if (hours >= 21){ hours = 21; minutes = 0; }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// ── Generate time options: 7:00 AM – 9:00 PM (30-min intervals) ─────────────
function generateTimeOptions(minTime = null) {
  const options = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minute of [0, 30]) {
      if (hour === 21 && minute === 30) continue; // cap at 21:00
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const isDisabled = minTime && timeString < minTime;
      options.push({ value: timeString, disabled: isDisabled });
    }
  }
  return options;
}


const EMPTY_TRUCK_FORM = {
  vehicle_type: "Refrigerated Truck",
  capacity: "",
  current_address: "",
  categories: [],
  unit_number: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// TIME SELECT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function TimeSelect({ value, onChange, minTime, placeholder }) {
  const timeOptions = generateTimeOptions(minTime);
  
  return (
    <select 
      className="to-time-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {timeOptions.map(option => (
        <option 
          key={option.value} 
          value={option.value}
          disabled={option.disabled}
          style={option.disabled ? { color: '#ccc', backgroundColor: '#f5f5f5' } : {}}
        >
          {fmtTime(option.value)}
        </option>
      ))}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN MODAL — assign a pending stop to a truck
// ─────────────────────────────────────────────────────────────────────────────
function AssignModal({ stop, trucks, onAssign, onClose }) {
  const [selectedTruck, setSelectedTruck] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!selectedTruck) return;
    setSaving(true);
    await onAssign(stop.id, selectedTruck);
    setSaving(false);
  };

  return (
    <div className="to-overlay" onClick={onClose}>
      <div className="to-modal" onClick={e => e.stopPropagation()}>
        <div className="to-modal-header">
          <h3 className="to-modal-title">Assign to Truck</h3>
          <button className="to-modal-close" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        <hr className="to-modal-divider" />
        <div className="to-modal-body">
          <div className="to-assign-stop-info">
            <span className={`to-stop-pill to-stop-pill-${stop.type}`}>
              {stop.type === "pickup" ? "PICKUP" : "DELIVER"}
            </span>
            <div>
              <p className="to-assign-name">{stop.name}</p>
              <p className="to-assign-addr">{stop.address}</p>
              <p className="to-assign-meta">{fmtDate(stop.pref_date)} · {fmtTime(stop.time_slot_start)} – {fmtTime(stop.time_slot_end)}</p>
            </div>
          </div>
          <label className="to-form-label" style={{ marginTop: 16 }}>Select Truck</label>
          <div className="to-truck-select-list">
            {trucks.map(t => (
              <button
                key={t.id}
                className={`to-truck-select-item${selectedTruck == t.id ? " to-truck-select-active" : ""}`}
                onClick={() => setSelectedTruck(t.id)}
              >
                <span className="to-truck-select-unit">{t.unit_number}</span>
                <span className="to-truck-select-type">{t.vehicle_type} · {t.capacity} kg</span>
                <span className="to-truck-select-addr">{t.current_address}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="to-modal-footer">
          <button className="to-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="to-btn-save"
            disabled={!selectedTruck || saving}
            onClick={handleAssign}
          >
            {saving ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD TRUCK MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddTruckModal({ onSave, onClose }) {
  const [form, setForm]     = useState(EMPTY_TRUCK_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const toggleCat = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const handleSave = async () => {
    if (!form.vehicle_type || !form.capacity || !form.current_address) {
      setErr("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="to-overlay" onClick={onClose}>
      <div className="to-modal to-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="to-modal-header">
          <h3 className="to-modal-title">Add New Truck</h3>
          <button className="to-modal-close" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        <hr className="to-modal-divider" />
        <div className="to-modal-body">
          <div className="to-form-row">
            <div className="to-form-field">
              <label className="to-form-label">Unit Number</label>
              <input
                className="to-form-input"
                placeholder="e.g. TR03"
                value={form.unit_number}
                onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))}
              />
            </div>
            <div className="to-form-field">
              <label className="to-form-label">Type of Vehicle *</label>
              <select
                className="to-form-input to-form-select"
                value={form.vehicle_type}
                onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
              >
                {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="to-form-field to-form-field-sm">
              <label className="to-form-label">Capacity (kg) *</label>
              <input
                className="to-form-input"
                type="number"
                placeholder="1200"
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
              />
            </div>
          </div>
          <div className="to-form-field" style={{ marginTop: 14 }}>
            <label className="to-form-label">Current Address *</label>
            <input
              className="to-form-input"
              placeholder="e.g. Pasay Taft Ave, Manila"
              value={form.current_address}
              onChange={e => setForm(f => ({ ...f, current_address: e.target.value }))}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="to-form-label">Food Categories Allowed</label>
            <div className="to-cat-pill-grid">
              {FOOD_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`to-cat-pill${form.categories.includes(cat) ? " to-cat-pill-active" : ""}`}
                  onClick={() => toggleCat(cat)}
                  type="button"
                >
                  {form.categories.includes(cat) && (
                    <span style={{ fontSize: 11, fontWeight: 900, marginRight: 3 }}>✓</span>
                  )}
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {err && <p style={{ color: "#e74c3c", fontSize: 12, marginTop: 10 }}>⚠ {err}</p>}
        </div>
        <div className="to-modal-footer">
          <button className="to-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="to-btn-save" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Add Truck"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUCK OCCUPANCY CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
function TruckCalendar({ trucks, occupancy }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth  = getDaysInMonth(year, month);
  const firstDayOfWk = getFirstDayOfMonth(year, month);

  // Build occupancy map: "YYYY-MM-DD" → [truck unit numbers]
  const dayMap = {};
  trucks.forEach(truck => {
    const occ = occupancy[truck.id] || [];
    occ.forEach(dateStr => {
      if (!dayMap[dateStr]) dayMap[dateStr] = [];
      dayMap[dateStr].push(truck.unit_number);
    });
  });

  const cells = [];
  for (let i = 0; i < firstDayOfWk; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <section className="to-calendar-section">
      <h2 className="to-section-title">
        <span className="material-symbols-rounded" style={{ fontSize: 22, verticalAlign: "middle", marginRight: 6 }}>calendar_month</span>
        Truck Occupancy Calendar
      </h2>

      <div className="to-cal-nav">
        <button className="to-cal-nav-btn" onClick={prevMonth}>
          <span className="material-symbols-rounded">chevron_left</span>
        </button>
        <span className="to-cal-month-label">{MONTHS[month]} {year}</span>
        <button className="to-cal-nav-btn" onClick={nextMonth}>
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      </div>

      <div className="to-calendar-grid">
        {DAYS_SHORT.map(d => (
          <div key={d} className="to-cal-day-header">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="to-cal-cell to-cal-cell-empty" />;
          const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const occupied = dayMap[key] || [];
          const isToday  = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
          return (
            <div key={key} className={`to-cal-cell${isToday ? " to-cal-today" : ""}${occupied.length ? " to-cal-busy" : ""}`}>
              <span className="to-cal-day-num">{day}</span>
              {occupied.length > 0 ? (
                <div className="to-cal-tags">
                  {occupied.map(unit => (
                    <span key={unit} className="to-cal-tag">{unit}</span>
                  ))}
                </div>
              ) : (
                <span className="to-cal-available">Available</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STOP ROW (inside truck schedule — manual mode allows drag/reorder)
// ─────────────────────────────────────────────────────────────────────────────
function StopRow({ stop, isManual, onMoveUp, onMoveDown, onRemove, isFirst, isLast }) {
  return (
    <div className="to-stop-row">
      <span className={`to-stop-pill to-stop-pill-${stop.stop_type === "PICKUP" ? "pickup" : "deliver"}`}>
        {stop.stop_type}
      </span>
      <div className="to-stop-info">
        <span className="to-stop-name">{stop.name}</span>
        <span className="to-stop-meta">
          ( {stop.address} · {fmtDate(stop.date)} · {fmtTime(stop.time_slot_start)} )
        </span>
        <span className="to-stop-items">
          {stop.food_type} | {stop.food_name} | {stop.qty} · {stop.unit}
        </span>
      </div>
      {isManual && (
        <div className="to-stop-actions">
          <button className="to-stop-action-btn" onClick={onMoveUp} disabled={isFirst} title="Move Up">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_upward</span>
          </button>
          <button className="to-stop-action-btn" onClick={onMoveDown} disabled={isLast} title="Move Down">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_downward</span>
          </button>
          <button className="to-stop-action-btn to-stop-action-remove" onClick={onRemove} title="Remove">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUCK CARD
// ─────────────────────────────────────────────────────────────────────────────
function TruckCard({ truck, isManual, onScheduleChange, onRemoveTruck }) {
  const moveStop = (idx, dir) => {
    const newSched = [...truck.schedule];
    const target = idx + dir;
    if (target < 0 || target >= newSched.length) return;
    [newSched[idx], newSched[target]] = [newSched[target], newSched[idx]];
    onScheduleChange(truck.id, newSched);
  };

  const removeStop = (idx) => {
    const newSched = truck.schedule.filter((_, i) => i !== idx);
    onScheduleChange(truck.id, newSched);
  };

  return (
    <div className="to-truck-card">
      <div className="to-truck-card-header">
        <div className="to-truck-header-left">
          <h3 className="to-truck-unit">{truck.unit_number || "Unit #"}</h3>
          <span className="to-truck-type-label">( {truck.vehicle_type} | {truck.capacity} kg )</span>
        </div>
        <div className="to-truck-header-right">
          <span className="to-truck-current-addr">
            <span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: "middle", color: "#c96a2e", marginRight: 3 }}>location_on</span>
            Current: {truck.current_address}
          </span>
          {isManual && (
            <button className="to-truck-remove-btn" onClick={() => onRemoveTruck(truck.id)} title="Remove Truck">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="to-truck-stops">
        {truck.schedule.length === 0 ? (
          <p className="to-truck-empty">No stops scheduled.</p>
        ) : (
          truck.schedule.map((stop, idx) => (
            <StopRow
              key={stop.id || idx}
              stop={stop}
              isManual={isManual}
              isFirst={idx === 0}
              isLast={idx === truck.schedule.length - 1}
              onMoveUp={() => moveStop(idx, -1)}
              onMoveDown={() => moveStop(idx, 1)}
              onRemove={() => removeStop(idx)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHILIPPINES MAP (Leaflet)
// ─────────────────────────────────────────────────────────────────────────────
const TRUCK_COLORS = ["#2563eb","#7c3aed","#0891b2","#0d9488","#1d4ed8","#6d28d9"];

function TruckMap({ trucks, pending }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const linesRef   = useRef([]);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet from CDN once
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }

    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Init map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || leafletRef.current) return;
    const L = window.L;
    const map = L.map("truck-map", { center: [14.5995, 120.9842], zoom: 11 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    leafletRef.current = map;
  }, [leafletReady]);

  // Re-draw markers and routes whenever data changes
  useEffect(() => {
    if (!leafletRef.current || !leafletReady) return;
    const L   = window.L;
    const map = leafletRef.current;

    // Clear old markers and lines
    markersRef.current.forEach(m => m.remove());
    linesRef.current.forEach(l => l.remove());
    markersRef.current = [];
    linesRef.current   = [];

    // Helper: create colored circle marker
    const dot = (lat, lng, color, label) =>
      L.circleMarker([lat, lng], {
        radius: 10, fillColor: color, color: "#fff",
        weight: 2, opacity: 1, fillOpacity: 0.9,
      }).bindPopup(`<b>${label}</b>`);

    // Draw trucks (current position = last stop or base coords)
    trucks.forEach((truck, idx) => {
      const color   = TRUCK_COLORS[idx % TRUCK_COLORS.length];
      const lastStop = truck.schedule[truck.schedule.length - 1];
      const tLat = lastStop?.lat ?? truck.lat;
      const tLng = lastStop?.lng ?? truck.lng;

      if (tLat && tLng) {
        // Truck base/current marker
        const truckIcon = L.divIcon({
          html: `<div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">${truck.unit_number}</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const m = L.marker([tLat, tLng], { icon: truckIcon })
          .bindPopup(`<b>${truck.unit_number}</b><br>${truck.vehicle_type}<br>${truck.current_address}`)
          .addTo(map);
        markersRef.current.push(m);
      }

      // Draw route line through all stops that have coords
      const routeCoords = truck.schedule
        .filter(s => s.lat && s.lng)
        .map(s => [s.lat, s.lng]);

      if (tLat && tLng && routeCoords.length) {
        const line = L.polyline([[tLat, tLng], ...routeCoords], {
          color, weight: 3, opacity: 0.7, dashArray: "6,4",
        }).addTo(map);
        linesRef.current.push(line);
      }

      // Stop markers along the route
      truck.schedule.forEach((stop, si) => {
        if (!stop.lat || !stop.lng) return;
        const stopColor = stop.stop_type === "PICKUP" ? "#16a34a" : "#dc2626";
        const sm = dot(stop.lat, stop.lng, stopColor,
          `${si + 1}. ${stop.stop_type} — ${stop.name}<br>${stop.address}<br>${stop.date ?? ""}`)
          .addTo(map);
        markersRef.current.push(sm);
      });
    });

    // Pending stop markers (no truck assigned yet)
    pending.forEach(p => {
      if (!p.lat || !p.lng) return;
      const color = p.type === "pickup" ? "#16a34a" : "#dc2626";
      const pm = L.circleMarker([p.lat, p.lng], {
        radius: 8, fillColor: color, color: "#fff",
        weight: 2, opacity: 1, fillOpacity: 0.6,
        dashArray: "4,4",
      }).bindPopup(`<b>[Unassigned] ${p.type.toUpperCase()}</b><br>${p.name}<br>${p.address}`).addTo(map);
      markersRef.current.push(pm);
    });

  }, [trucks, pending, leafletReady]);

  return (
    <section className="to-calendar-section" style={{ marginTop: 32 }}>
      <h2 className="to-section-title">
        <span className="material-symbols-rounded" style={{ fontSize: 22, verticalAlign: "middle", marginRight: 6 }}>map</span>
        Philippines Route Map
      </h2>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
        <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", background:"#16a34a", marginRight:4 }} />Pick Up &nbsp;
        <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", background:"#dc2626", marginRight:4 }} />Deliver &nbsp;
        <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", background:"#888", marginRight:4, opacity:.4 }} />Unassigned (dashed border)
      </p>
      <div
        id="truck-map"
        ref={mapRef}
        style={{ width: "100%", height: 520, borderRadius: 12, border: "1.5px solid #e0d5c5", overflow: "hidden" }}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Staff_TruckOptimization() {
  const [mode,        setMode]        = useState("automated");
  const [pending,     setPending]     = useState([]);
  const [trucks,      setTrucks]      = useState([]);
  const [occupancy,   setOccupancy]   = useState({});
  const [loading,     setLoading]     = useState(true);

  const [filterType,  setFilterType]  = useState("All");
  const [search,      setSearch]      = useState("");

  const [assignStop,  setAssignStop]  = useState(null);
  const [showAddTruck, setShowAddTruck] = useState(false);

  const [toast, setToast] = useState(null);

  const [editableDates, setEditableDates] = useState({});
  const [editableTimes, setEditableTimes] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pendRes, truckRes, occRes] = await Promise.allSettled([
      api.get("/staff/truck-optimization/pending-stops"),
      api.get("/staff/truck-optimization/trucks"),
      api.get("/staff/truck-optimization/occupancy"),
    ]);
    if (pendRes.status  === "fulfilled") setPending(pendRes.value.data);
    if (truckRes.status === "fulfilled") setTrucks(truckRes.value.data);
    if (occRes.status   === "fulfilled") setOccupancy(occRes.value.data);
    if (pendRes.status  === "rejected")  console.error("pending-stops failed:",  pendRes.reason);
    if (truckRes.status === "rejected")  console.error("trucks failed:",          truckRes.reason);
    if (occRes.status   === "rejected")  console.error("occupancy failed:",       occRes.reason);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
  };

  const runAutomation = async () => {
    try {
      const res = await api.post("/staff/truck-optimization/auto-assign");
      setTrucks(res.data.trucks);
      setPending(res.data.remaining_pending || []);
      showToast("Routes optimized successfully!", "success");
    } catch {
      showToast("Auto-optimization failed. Try again.", "error");
    }
  };

  const handleAssign = async (stopId, truckId) => {
    try {
      const res = await api.post("/staff/truck-optimization/assign-stop", { stop_id: stopId, truck_id: truckId });
      setTrucks(res.data.trucks);
      setPending(prev => prev.filter(p => p.id !== stopId));
      showToast("Stop assigned successfully.", "success");
    } catch {
      const stop = pending.find(p => p.id === stopId);
      if (!stop) return;
      const newStop = {
        id: Date.now(),
        stop_type: stop.type === "pickup" ? "PICKUP" : "DELIVER",
        name: stop.name,
        address: stop.address,
        date: stop.pref_date,
        time_slot_start: stop.time_slot_start,
        time_slot_end: stop.time_slot_end,
        food_type: stop.food_items?.split("|")[2]?.trim() || "—",
        food_name: stop.food_items?.split("|")[0]?.trim() || "—",
        qty:       stop.food_items?.split("|")[1]?.trim()?.split(" ")[0] || "—",
        unit:      stop.food_items?.split("|")[1]?.trim()?.split(" ")[1] || "—",
      };
      setTrucks(prev => prev.map(t =>
        t.id == truckId ? { ...t, schedule: [...t.schedule, newStop] } : t
      ));
      setPending(prev => prev.filter(p => p.id !== stopId));
      showToast("Stop assigned.", "success");
    }
    setAssignStop(null);
  };

  const handleScheduleChange = async (truckId, newSchedule) => {
    setTrucks(prev => prev.map(t => t.id === truckId ? { ...t, schedule: newSchedule } : t));
    try {
      await api.put(`/staff/truck-optimization/trucks/${truckId}/schedule`, { schedule: newSchedule });
    } catch { }
  };

  const handleAddTruck = async (form) => {
    try {
      const res = await api.post("/staff/truck-optimization/trucks", form);
      setTrucks(prev => [...prev, res.data]);
      showToast("Truck added successfully.", "success");
    } catch {
      const newTruck = {
        id: Date.now(),
        unit_number: form.unit_number || `TR0${trucks.length + 1}`,
        vehicle_type: form.vehicle_type,
        capacity: form.capacity,
        current_address: form.current_address,
        categories: form.categories,
        source: "manual",
        schedule: [],
      };
      setTrucks(prev => [...prev, newTruck]);
      showToast("Truck added.", "success");
    }
    setShowAddTruck(false);
  };

  const handleRemoveTruck = async (truckId) => {
    if (!window.confirm("Remove this truck from the schedule?")) return;
    try {
      await api.delete(`/staff/truck-optimization/trucks/${truckId}`);
    } catch { }
    setTrucks(prev => prev.filter(t => t.id !== truckId));
    showToast("Truck removed.", "success");
  };

  const handleDateChange = (stopId, newDate) => {
    setEditableDates(prev => ({ ...prev, [stopId]: newDate }));
  };

  const handleTimeChange = (stopId, field, newTime) => {
    setEditableTimes(prev => ({
      ...prev,
      [stopId]: { ...prev[stopId], [field]: newTime }
    }));
  };

  // Get min time: always at least 07:00; if today, also at least current time
  const getMinTimeForDate = (dateStr) => {
    const today = getMinDate();
    if (dateStr === today) {
      const current = getCurrentTimeRounded();
      return current > OPERATING_START ? current : OPERATING_START;
    }
    return OPERATING_START;
  };

  const filteredPending = pending.filter(p => {
    const urgency  = computeUrgency(p.pref_date);
    const matchTab =
      filterType === "All"         ? true :
      filterType === "Donor"       ? p.type === "pickup"  :
      filterType === "Beneficiary" ? p.type === "deliver" :
      filterType === "High"        ? urgency === "High"   : true;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.food_items?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div className="to-wrapper">
      <NavBar_Staff />

      {toast && (
        <div className={`to-toast to-toast-${toast.type}`}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
            {toast.type === "success" ? "check_circle" : "cancel"}
          </span>
          {toast.msg}
        </div>
      )}

      <main className="to-main">
        <div className="to-page-header">
          <div>
            <h1 className="to-page-title">Truck Optimization</h1>
            <p className="to-page-sub">to monitor and optimize truck's route and direction.</p>
          </div>
          <div className="to-mode-toggle">
            <button
              className={`to-mode-btn${mode === "manual" ? " to-mode-btn-active" : ""}`}
              onClick={() => handleModeSwitch("manual")}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span>
              Manual Mode
            </button>
            <button
              className={`to-mode-btn to-mode-btn-auto${mode === "automated" ? " to-mode-btn-auto-active" : ""}`}
              onClick={() => handleModeSwitch("automated")}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>bolt</span>
              Automated Mode
            </button>
          </div>
        </div>

        <section className="to-pending-section">
          <div className="to-pending-toolbar">
            <div className="to-filter-tabs">
              {["All","Donor","Beneficiary","High"].map(f => (
                <button
                  key={f}
                  className={`to-filter-tab${filterType === f ? " to-filter-tab-active" : ""}`}
                  onClick={() => setFilterType(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="to-search-wrap">
              <input
                className="to-search"
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="material-symbols-rounded to-search-icon">search</span>
            </div>
          </div>

          <div className="to-table-wrap">
            <table className="to-table">
              <thead>
                <tr>
                  <th>UNIT NUMBER</th>
                  <th>NAME</th>
                  <th>ADDRESS</th>
                  <th>URGENCY</th>
                  <th>{mode === "automated" ? "PREF. DATE" : "DATE"}</th>
                  <th>TIME SLOT</th>
                  {mode === "manual" && <th></th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"#aaa", fontStyle:"italic" }}>Loading…</td></tr>
                ) : filteredPending.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"#aaa", fontStyle:"italic" }}>No pending stops.</td></tr>
                ) : (
                  filteredPending.map(p => {
                    const urgency = computeUrgency(p.pref_date);
                    const ucfg    = URGENCY_CONFIG[urgency];
                    const currentDate = editableDates[p.id] !== undefined ? editableDates[p.id] : p.pref_date;
                    const minTime = getMinTimeForDate(currentDate);
                    const currentStartTime = editableTimes[p.id]?.start !== undefined ? editableTimes[p.id].start : p.time_slot_start;
                    const currentEndTime = editableTimes[p.id]?.end !== undefined ? editableTimes[p.id].end : p.time_slot_end;
                    
                    return (
                      <tr key={p.id}>
                        <td>
                          {mode === "automated" ? (
                            <span className="to-table-unit">—</span>
                          ) : (
                            <div className="to-unit-select-wrap">
                              <span className="to-unit-select-label">Select Unit</span>
                              <span className="material-symbols-rounded" style={{ fontSize: 16, color:"#888" }}>expand_more</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`to-name-badge to-name-badge-${p.type}`}>
                            {p.name}
                          </span>
                        </td>
                        <td className="to-td-addr">{p.address}</td>
                        <td>
                          <span className="to-urgency-badge" style={{ background: ucfg.bg, color: ucfg.color }}>
                            {urgency}
                          </span>
                        </td>
                        <td>
                          {mode === "automated" ? (
                            <span>{fmtDate(p.pref_date)}</span>
                          ) : (
                            <div className="to-date-input-wrap">
                              <input
                                className="to-date-input"
                                type="date"
                                min={getMinDate()}
                                value={currentDate}
                                onChange={(e) => handleDateChange(p.id, e.target.value)}
                              />
                            </div>
                          )}
                        </td>
                        <td>
                          {mode === "automated" ? (
                            <span className="to-timeslot">{fmtTime(p.time_slot_start)} – {fmtTime(p.time_slot_end)}</span>
                          ) : (
                            <div className="to-timeslot-input-wrap">
                              <TimeSelect 
                                value={currentStartTime}
                                onChange={(newTime) => handleTimeChange(p.id, 'start', newTime)}
                                minTime={minTime}
                              />
                              <span className="to-time-sep">–</span>
                              <TimeSelect 
                                value={currentEndTime}
                                onChange={(newTime) => handleTimeChange(p.id, 'end', newTime)}
                                minTime={null}
                              />
                            </div>
                          )}
                        </td>
                        {mode === "manual" && (
                          <td>
                            <button
                              className="to-assign-btn"
                              onClick={() => setAssignStop(p)}
                            >
                              Assign
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {mode === "automated" && (
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
              <button className="to-auto-run-btn" onClick={runAutomation}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>bolt</span>
                Run Auto-Optimization
              </button>
            </div>
          )}
        </section>

        <div className="to-section-divider" />

        <section className="to-scheduling-section">
          <div className="to-scheduling-header">
            <h2 className="to-section-title">
              <span className="material-symbols-rounded" style={{ fontSize: 24, verticalAlign: "middle", marginRight: 8 }}>local_shipping</span>
              Truck Scheduling
            </h2>
            {mode === "manual" && (
              <button className="to-add-truck-btn" onClick={() => setShowAddTruck(true)}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>local_shipping</span>
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color:"#aaa", fontStyle:"italic" }}>Loading trucks…</p>
          ) : trucks.length === 0 ? (
            <p style={{ color:"#aaa", fontStyle:"italic" }}>No trucks registered.</p>
          ) : (
            <div className="to-trucks-list">
              {trucks.map(truck => (
                <TruckCard
                  key={truck.id}
                  truck={truck}
                  isManual={mode === "manual"}
                  onScheduleChange={handleScheduleChange}
                  onRemoveTruck={handleRemoveTruck}
                />
              ))}
            </div>
          )}
        </section>

        <div className="to-section-divider" />

        <TruckMap trucks={trucks} pending={pending} />

        <div className="to-section-divider" />

        <TruckCalendar trucks={trucks} occupancy={occupancy} />
      </main>

      {assignStop && (
        <AssignModal
          stop={assignStop}
          trucks={trucks}
          onAssign={handleAssign}
          onClose={() => setAssignStop(null)}
        />
      )}

      {showAddTruck && (
        <AddTruckModal
          onSave={handleAddTruck}
          onClose={() => setShowAddTruck(false)}
        />
      )}
    </div>
  );
}