import { useState, useEffect, useRef } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ── DUMMY DATA ────────────────────────────────────────────────────────────────
const DUMMY_SERVICES = [
  {
    id: 1,
    service_type: "Transportation",
    donor_name: "Juan dela Cruz",
    quantity: 2,
    frequency: "Monthly",
    date: "2026-08-08",
    starts_at: "08:00",
    ends_at: "17:00",
    all_day: false,
    address: "Caloocan City",
    vehicle_type: "Cargo Van",
    capacity: 3,
    max_distance: 50,
    transport_categories: ["No Liquid Foods", "No Frozen Foods"],
    first_name: "Juan",
    last_name: "dela Cruz",
    email: "juan@email.com",
    notes: "Available on weekdays only.",
    status: "active",
  },
  {
    id: 2,
    service_type: "Volunteer Work",
    donor_name: "Maria Santos",
    quantity: null,
    headcount: 10,
    frequency: "Weekly",
    date: "Thursday",
    starts_at: "13:00",
    ends_at: "18:00",
    all_day: false,
    address: "Quezon City",
    preferred_work: "Packing / Sorting",
    skill_categories: ["Heavy Liftings", "Physical Stamina"],
    first_name: "Maria",
    last_name: "Santos",
    email: "maria@email.com",
    notes: "College volunteers available every Thursday.",
    status: "active",
  },
  {
    id: 3,
    service_type: "Volunteer Work",
    donor_name: "Cebu Helps NGO",
    quantity: null,
    headcount: 5,
    frequency: "One-Time",
    date: "2026-10-03",
    starts_at: null,
    ends_at: null,
    all_day: true,
    address: "Cebu City",
    preferred_work: "Delivery / Distribution",
    skill_categories: ["Driving", "Communication"],
    first_name: "Liza",
    last_name: "Gomez",
    email: "cebuhelps@email.com",
    notes: "One-time event for community fair.",
    status: "active",
  },
  {
    id: 4,
    service_type: "Transportation",
    donor_name: "ABC Logistics",
    quantity: 1,
    frequency: "One-Time",
    date: "2026-07-15",
    starts_at: "08:00",
    ends_at: "12:00",
    all_day: false,
    address: "Quezon City",
    vehicle_type: "Van / Minivan",
    capacity: 1,
    max_distance: 30,
    transport_categories: ["No Raw Meat / Poultry", "No Raw Seafood / Fish"],
    first_name: "Carlo",
    last_name: "Reyes",
    email: "carlo@abc.com",
    notes: "",
    status: "inactive",
  },
];

const FREQUENCY_COLORS = {
  Monthly:    "#2e7d32",
  Weekly:     "#1565c0",
  "One-Time": "#c96a2e",
  Daily:      "#6a1b9a",
};

function formatDate(dateStr) {
  if (!dateStr || dateStr === "–") return "–";
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  if (days.includes(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatTime(startsAt, endsAt, allDay) {
  if (allDay) return "All Day";
  if (!startsAt) return "–";
  const fmt = (t) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  if (endsAt) return `${fmt(startsAt)} – ${fmt(endsAt)}`;
  return fmt(startsAt);
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Staff_InventoryService() {
  const [services, setServices]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [filter, setFilter]                   = useState("All");
  const [search, setSearch]                   = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [cancelLoading, setCancelLoading]     = useState(false);

  const [statusConfirm, setStatusConfirm] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [toast, setToast]   = useState(null);
  const toastTimer          = useRef(null);

  const modalRef   = useRef(null);
  const confirmRef = useRef(null);

  // ── Fetch ──
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/staff/inventory/services");
        setServices(res.data);
      } catch {
        setServices(DUMMY_SERVICES);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Close More Details on outside click
  useEffect(() => {
    const h = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) setSelectedService(null);
    };
    if (selectedService) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [selectedService]);

  // Close confirm dialog on outside click
  useEffect(() => {
    const h = (e) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target)) setStatusConfirm(null);
    };
    if (statusConfirm) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [statusConfirm]);

  // ── Toast helper ──
  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  // ── Filter ──
  const filtered = services.filter((s) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Active Service" && s.status === "active") ||
      s.service_type === filter;
    const q = search.toLowerCase();
    const contactName = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
    const matchesSearch =
      !q ||
      s.service_type?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.frequency?.toLowerCase().includes(q) ||
      contactName.includes(q);
    return matchesFilter && matchesSearch;
  });

  const activeCount = services.filter((s) => s.status === "active").length;

  // ── Status click ──
  const handleStatusClick = (s, e) => {
    e.stopPropagation();
    const newStatus = s.status === "active" ? "inactive" : "active";
    const contactName = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.service_type || "this service";
    setStatusConfirm({ id: s.id, currentStatus: s.status, newStatus, donorName: contactName });
  };

  // ── Confirm toggle ──
  const handleStatusConfirm = async () => {
    if (!statusConfirm) return;
    setStatusLoading(true);
    const { id, newStatus, donorName } = statusConfirm;

    const applyChange = () => {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      setSelectedService((prev) => prev?.id === id ? { ...prev, status: newStatus } : prev);
      showToast(
        `"${donorName}" is now ${newStatus === "active" ? "Active" : "Inactive"}.`,
        "success"
      );
    };

    try {
      await api.patch(`/staff/inventory/services/${id}/status`, { status: newStatus });
      applyChange();
    } catch {
      applyChange();
    } finally {
      setStatusLoading(false);
      setStatusConfirm(null);
    }
  };

  // ── Cancel service ──
  const handleCancel = async (id) => {
    setCancelLoading(true);
    try {
      await api.patch(`/staff/inventory/services/${id}/cancel`);
    } catch { /* local fallback */ } finally {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: "inactive" } : s)));
      setSelectedService(null);
      showToast("Service has been cancelled.", "success");
      setCancelLoading(false);
    }
  };

  const now = new Date();
  const lastUpdated =
    now.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) +
    " " + now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  // ── Helpers for modal ──
  const isTransport = (s) => s.service_type === "Transportation";
  const isVolunteer = (s) => s.service_type === "Volunteer Work";

  return (
    <div className="sis-wrapper">
      <NavBar_Staff />

      <main className="sis-main">

        {/* ── PAGE HEADER ── */}
        <div className="sis-page-header">
          <div>
            <h1 className="sis-page-title">Service Donation Inventory</h1>
            <p className="sis-page-sub">Identify, track, and have a list of services from donors</p>
          </div>
          <div className="sis-active-badge">
            <span className="material-symbols-rounded sis-active-icon">schedule</span>
            <span className="sis-active-count">{activeCount}</span>
            <span className="sis-active-label">Active Service</span>
          </div>
        </div>

        <hr className="sis-divider" />

        {/* ── TOOLBAR ── */}
        <div className="sis-toolbar">
          <div className="sis-filters">
            {["All", "Transportation", "Volunteer Work", "Active Service"].map((f) => (
              <button
                key={f}
                className={`sis-filter-tab${filter === f ? " sis-filter-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="sis-search-wrap">
            <input
              type="text"
              className="sis-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="material-symbols-rounded sis-search-icon">search</span>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="sis-table-wrap">
          <table className="sis-table">
            <thead>
              <tr>
                <th>SERVICE TYPE</th>
                <th style={{ textAlign: "center" }}>QUANTITY</th>
                <th>FREQUENCY</th>
                <th>DATE</th>
                <th>TIME</th>
                <th>ADDRESS</th>
                <th>CONTACT PERSON</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="sis-empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="sis-empty">No service donations found.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className={s.status === "inactive" ? "sis-row-inactive" : ""}>
                    <td>
                      <span className="sis-type-badge">{s.service_type}</span>
                    </td>

                    {/* Quantity — center-aligned; Volunteer Work uses headcount */}
                    <td className="sis-td-center">
                      {isTransport(s) ? (s.quantity ?? "–") : (s.headcount ?? "–")}
                    </td>

                    <td>
                      <span
                        className="sis-freq-text"
                        style={{ color: FREQUENCY_COLORS[s.frequency] || "#333" }}
                      >
                        {s.frequency}
                      </span>
                    </td>
                    <td>{formatDate(s.date)}</td>
                    <td>{formatTime(s.starts_at, s.ends_at, s.all_day)}</td>
                    <td>{s.address || "–"}</td>

                    {/* Contact Person column */}
                    <td>
                      {s.first_name || s.last_name
                        ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim()
                        : "–"}
                    </td>

                    <td>
                      <button
                        className={`sis-status-badge sis-status-${s.status} sis-status-clickable`}
                        onClick={(e) => handleStatusClick(s, e)}
                        title={`Click to mark as ${s.status === "active" ? "Inactive" : "Active"}`}
                      >
                        <span className="sis-status-label">
                          {s.status === "active" ? "Active" : "Inactive"}
                        </span>
                        <span className="material-symbols-rounded sis-status-toggle-icon">
                          swap_horiz
                        </span>
                      </button>
                    </td>
                    <td>
                      <button
                        className="sis-details-btn"
                        onClick={() => setSelectedService(s)}
                      >
                        More Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── FOOTER BAR ── */}
        <div className="sis-footer-bar">
          <span>
            <span className="material-symbols-rounded sis-footer-clock">schedule</span>
            Last updated: {lastUpdated}
          </span>
          <span className="sis-footer-total">Total Items: {filtered.length}</span>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════
          STATUS CONFIRM DIALOG
      ══════════════════════════════════════════════════════════ */}
      {statusConfirm && (
        <div className="sis-confirm-overlay">
          <div className="sis-confirm-dialog" ref={confirmRef}>
            <div className={`sis-confirm-icon-wrap sis-confirm-icon-${statusConfirm.newStatus}`}>
              <span className="material-symbols-rounded sis-confirm-icon">
                {statusConfirm.newStatus === "active" ? "check_circle" : "pause_circle"}
              </span>
            </div>

            <h3 className="sis-confirm-title">
              {statusConfirm.newStatus === "active" ? "Mark as Active?" : "Mark as Inactive?"}
            </h3>

            <p className="sis-confirm-desc">
              You are about to mark <strong>"{statusConfirm.donorName}"</strong> as{" "}
              <strong>{statusConfirm.newStatus === "active" ? "Active" : "Inactive"}</strong>.{" "}
              {statusConfirm.newStatus === "inactive"
                ? "This service will no longer be counted as active."
                : "This service will be listed as available."}
            </p>

            <div className="sis-confirm-actions">
              <button
                className="sis-confirm-cancel-btn"
                onClick={() => setStatusConfirm(null)}
                disabled={statusLoading}
              >
                Cancel
              </button>
              <button
                className={`sis-confirm-ok-btn sis-confirm-ok-${statusConfirm.newStatus}`}
                onClick={handleStatusConfirm}
                disabled={statusLoading}
              >
                {statusLoading
                  ? "Saving..."
                  : statusConfirm.newStatus === "active"
                  ? "Yes, Activate"
                  : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MORE DETAILS MODAL
      ══════════════════════════════════════════════════════════ */}
      {selectedService && (
        <div className="sis-modal-overlay">
          <div className="sis-modal" ref={modalRef}>
            <div className="sis-modal-header">
              <div className="sis-modal-header-left">
                <span className="sis-type-badge sis-modal-type-badge">
                  {selectedService.service_type}
                </span>
                <h2 className="sis-modal-donor">
                  {`${selectedService.first_name ?? ""} ${selectedService.last_name ?? ""}`.trim() || "—"}
                </h2>
              </div>
              <button className="sis-modal-close" onClick={() => setSelectedService(null)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <hr className="sis-modal-divider" />

            <div className="sis-modal-body">
              <div className="sis-modal-grid">

                {/* ── Shared fields ── */}
                <span className="sis-modal-key">Address / Coverage:</span>
                <span className="sis-modal-val">{selectedService.address || "–"}</span>

                <span className="sis-modal-key">Frequency:</span>
                <span
                  className="sis-modal-val sis-modal-freq"
                  style={{ color: FREQUENCY_COLORS[selectedService.frequency] || "#333" }}
                >
                  {selectedService.frequency}
                </span>

                <span className="sis-modal-key">Date:</span>
                <span className="sis-modal-val">{formatDate(selectedService.date)}</span>

                <span className="sis-modal-key">Time:</span>
                <span className="sis-modal-val">
                  {formatTime(selectedService.starts_at, selectedService.ends_at, selectedService.all_day)}
                </span>

                {/* ── Transportation-specific ── */}
                {isTransport(selectedService) && (
                  <>
                    <span className="sis-modal-key">Quantity:</span>
                    <span className="sis-modal-val">{selectedService.quantity ?? "–"}</span>

                    <span className="sis-modal-key">Vehicle Type:</span>
                    <span className="sis-modal-val">{selectedService.vehicle_type || "–"}</span>

                    <span className="sis-modal-key">Capacity:</span>
                    <span className="sis-modal-val">
                      {selectedService.capacity != null ? `${selectedService.capacity} tons` : "–"}
                    </span>

                    <span className="sis-modal-key">Max Distance:</span>
                    <span className="sis-modal-val">
                      {selectedService.max_distance != null ? `${selectedService.max_distance} km` : "–"}
                    </span>
                  </>
                )}

                {/* ── Volunteer Work-specific ── */}
                {isVolunteer(selectedService) && (
                  <>
                    <span className="sis-modal-key">Headcount:</span>
                    <span className="sis-modal-val">{selectedService.headcount ?? "–"}</span>

                    <span className="sis-modal-key">Preferred Work:</span>
                    <span className="sis-modal-val">{selectedService.preferred_work || "–"}</span>
                  </>
                )}

                {/* ── Contact Person ── */}
                <span className="sis-modal-key">Contact Person:</span>
                <span className="sis-modal-val">
                  {`${selectedService.first_name ?? ""} ${selectedService.last_name ?? ""}`.trim() || "–"}
                </span>

                <span className="sis-modal-key">Email:</span>
                <span className="sis-modal-val">{selectedService.email || "–"}</span>
              </div>

              <div className="sis-modal-notes-box">
                {/* Categories — Transportation uses transport_categories, Volunteer uses skill_categories */}
                <p className="sis-modal-notes-label">
                  {isTransport(selectedService) ? "Categories:" : "Skill Categories:"}
                </p>
                <div className="sis-modal-categories">
                  {(() => {
                    const cats = isTransport(selectedService)
                      ? selectedService.transport_categories
                      : selectedService.skill_categories;
                    return cats?.length > 0
                      ? cats.map((c) => (
                          <span key={c} className="sis-category-pill">{c}</span>
                        ))
                      : <span className="sis-modal-empty-text">None specified</span>;
                  })()}
                </div>

                <p className="sis-modal-notes-label" style={{ marginTop: 12 }}>Extra Notes:</p>
                <p className="sis-modal-notes-text">
                  {selectedService.notes || "No additional notes."}
                </p>
              </div>
            </div>

            <div className="sis-modal-footer">
              <button
                className="sis-modal-cancel-btn"
                onClick={() => handleCancel(selectedService.id)}
                disabled={cancelLoading || selectedService.status === "inactive"}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Service"}
              </button>
              <button
                className="sis-modal-close-btn"
                onClick={() => setSelectedService(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TOAST NOTIFICATION
      ══════════════════════════════════════════════════════════ */}
      {toast && (
        <div className={`sis-toast sis-toast-${toast.type}`}>
          <span className="material-symbols-rounded sis-toast-icon">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="sis-toast-msg">{toast.message}</span>
          <button className="sis-toast-close" onClick={() => setToast(null)}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
