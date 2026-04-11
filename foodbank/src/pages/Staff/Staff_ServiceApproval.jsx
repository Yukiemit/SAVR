import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ── DUMMY DATA (remove when backend is ready) ─────────────────────────────────
const DUMMY_SERVICES = [
  {
    id: 1,
    donor_name: "Juan Dela Cruz",
    service_tab: "Transportation",
    address: "Quezon City, Metro Manila",
    quantity: 2,
    frequency: "Weekly",
    date: "Saturday",
    starts_at: "08:00",
    ends_at: "17:00",
    all_day: false,
    vehicle_type: "Van / Minivan",
    capacity: 500,
    max_distance: 30,
    transport_categories: ["No Raw Meat / Poultry", "No Frozen Foods"],
    preferred_work: null,
    skill_categories: [],
    first_name: "Juan",
    last_name: "Dela Cruz",
    email: "juan@example.com",
    notes: "Available every Saturday morning.",
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    donor_name: "Maria Santos",
    service_tab: "Volunteer Work",
    address: "Makati City, Metro Manila",
    quantity: null,
    frequency: "Monthly",
    date: "2025-08-10",
    starts_at: null,
    ends_at: null,
    all_day: true,
    vehicle_type: null,
    capacity: null,
    max_distance: null,
    transport_categories: [],
    preferred_work: "Cook / Food Prep",
    skill_categories: ["Cooking", "Allergen Awareness", "Communication"],
    headcount: 5,
    first_name: "Maria",
    last_name: "Santos",
    email: "maria@example.com",
    notes: "",
    status: "pending",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    donor_name: "Roberto Reyes",
    service_tab: "Transportation",
    address: "Pasig City, Metro Manila",
    quantity: 1,
    frequency: "One-Time",
    date: "2025-08-15",
    starts_at: "09:00",
    ends_at: "13:00",
    all_day: false,
    vehicle_type: "Pickup Truck",
    capacity: 800,
    max_distance: 50,
    transport_categories: ["No Glass Containers", "No Bottled Beverages"],
    preferred_work: null,
    skill_categories: [],
    first_name: "Roberto",
    last_name: "Reyes",
    email: "roberto@example.com",
    notes: "Can carry heavy loads.",
    status: "accepted",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 4,
    donor_name: "Ana Lim",
    service_tab: "Volunteer Work",
    address: "Taguig City, Metro Manila",
    quantity: null,
    frequency: "Weekly",
    date: "Wednesday",
    starts_at: "13:00",
    ends_at: "18:00",
    all_day: false,
    vehicle_type: null,
    capacity: null,
    max_distance: null,
    transport_categories: [],
    preferred_work: "Packing / Sorting",
    skill_categories: ["Physical Stamina", "Heavy Liftings"],
    headcount: 3,
    first_name: "Ana",
    last_name: "Lim",
    email: "ana@example.com",
    notes: "",
    status: "declined",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];
// ── END DUMMY DATA ────────────────────────────────────────────────────────────

const STATUS_FILTER_TABS = ["All", "Pending", "Accepted", "Declined"];
const TYPE_FILTER_TABS   = ["All", "Transportation", "Volunteer Work"];

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const formatTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
};

const statusStyle = (s) => {
  if (s === "accepted") return { bg: "#e8f5e9", color: "#2e7d32", label: "Accepted" };
  if (s === "declined") return { bg: "#fdecea", color: "#c0392b", label: "Declined" };
  return { bg: "#fff8e1", color: "#f4b942", label: "Pending" };
};

const typeStyle = (t) => {
  if (t === "Transportation") return { bg: "#2e7d32", color: "white" };
  return { bg: "#c96a2e", color: "white" };
};

export default function Staff_ServiceApproval() {
  const [services,     setServices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusTab,    setStatusTab]    = useState("All");
  const [typeTab,      setTypeTab]      = useState("All");
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState(null);   // card detail modal
  const [actionLoading, setActionLoading] = useState(null); // id being actioned
  const [toast,        setToast]        = useState(null);   // { msg, type }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/staff/service-donations");
      setServices(res.data);
    } catch {
      // ── DUMMY fallback (remove when backend is ready) ──
      setServices(DUMMY_SERVICES);
    } finally {
      setLoading(false);
    }
  };

  // ── Action: Accept / Decline ───────────────────────────────────────────────
  const handleAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      await api.post(`/staff/service-donations/${id}/${action}`);
      setServices((prev) =>
        prev.map((s) => s.id === id ? { ...s, status: action === "accept" ? "accepted" : "declined" } : s)
      );
      if (selected?.id === id) setSelected((prev) => ({ ...prev, status: action === "accept" ? "accepted" : "declined" }));
      showToast(action === "accept" ? "Service donation accepted." : "Service donation declined.", action === "accept" ? "success" : "error");
    } catch {
      // ── DUMMY local update (remove when backend is ready) ──
      setServices((prev) =>
        prev.map((s) => s.id === id ? { ...s, status: action === "accept" ? "accepted" : "declined" } : s)
      );
      if (selected?.id === id) setSelected((prev) => ({ ...prev, status: action === "accept" ? "accepted" : "declined" }));
      showToast(action === "accept" ? "Service donation accepted." : "Service donation declined.", action === "accept" ? "success" : "error");
    } finally {
      setActionLoading(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = services.filter((s) => {
    const matchStatus = statusTab === "All" || s.status === statusTab.toLowerCase();
    const matchType   = typeTab   === "All" || s.service_tab === typeTab;
    const q = search.toLowerCase();
    const matchSearch = !q
      || s.donor_name?.toLowerCase().includes(q)
      || s.address?.toLowerCase().includes(q)
      || s.email?.toLowerCase().includes(q)
      || s.service_tab?.toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  // ── Counters ───────────────────────────────────────────────────────────────
  const counts = {
    pending:  services.filter((s) => s.status === "pending").length,
    accepted: services.filter((s) => s.status === "accepted").length,
    declined: services.filter((s) => s.status === "declined").length,
  };

  return (
    <div className="ssa-wrapper">
      <NavBar_Staff />

      {/* ── TOAST ── */}
      {toast && (
        <div className={`ssa-toast ${toast.type === "success" ? "ssa-toast-success" : "ssa-toast-error"}`}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
            {toast.type === "success" ? "check_circle" : "cancel"}
          </span>
          {toast.msg}
        </div>
      )}

      <main className="ssa-main">

        {/* ── PAGE HEADER ── */}
        <div className="ssa-page-header">
          <div>
            <h1 className="ssa-page-title">Service Donation Approval</h1>
            <p className="ssa-page-sub">Review and manage incoming service donation requests</p>
          </div>

          {/* COUNTERS */}
          <div className="ssa-counters">
            <div className="ssa-counter ssa-counter-pending">
              <span className="ssa-counter-num">{counts.pending}</span>
              <span className="ssa-counter-label">Pending</span>
            </div>
            <div className="ssa-counter ssa-counter-accepted">
              <span className="ssa-counter-num">{counts.accepted}</span>
              <span className="ssa-counter-label">Accepted</span>
            </div>
            <div className="ssa-counter ssa-counter-declined">
              <span className="ssa-counter-num">{counts.declined}</span>
              <span className="ssa-counter-label">Declined</span>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="ssa-toolbar">

          {/* STATUS TABS */}
          <div className="ssa-filter-group">
            <p>status</p>
            {STATUS_FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`ssa-filter-tab ${statusTab === tab ? "ssa-filter-tab-active" : ""}`}
                onClick={() => setStatusTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ width: 50 }}>  </div> {/* spacer */}

          {/* TYPE TABS */}
          <div className="ssa-filter-group">
            <p>type</p>
            {TYPE_FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`ssa-filter-tab ${typeTab === tab ? "ssa-filter-tab-type" : ""}`}
                onClick={() => setTypeTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className="ssa-search-wrap">
            <input
              className="ssa-search"
              placeholder="Search donor, address, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="material-symbols-rounded ssa-search-icon">search</span>
          </div>
        </div>

        {/* ── CARDS GRID ── */}
        {loading ? (
          <p className="ssa-empty">Loading service donations…</p>
        ) : filtered.length === 0 ? (
          <p className="ssa-empty">No service donations found.</p>
        ) : (
          <div className="ssa-grid">
            {filtered.map((s) => {
              const st  = statusStyle(s.status);
              const tt  = typeStyle(s.service_tab);
              const isT = s.service_tab === "Transportation";
              return (
                <div
                  key={s.id}
                  className={`ssa-card ${s.status === "pending" ? "ssa-card-pending" : ""}`}
                  onClick={() => setSelected(s)}
                >
                  {/* CARD HEADER */}
                  <div className="ssa-card-header">
                    <h3 className="ssa-card-name">{s.donor_name || `${s.first_name} ${s.last_name}`}</h3>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="ssa-type-badge" style={{ background: tt.bg, color: tt.color }}>
                        {isT ? "Transpo" : "Volunteer"}
                      </span>
                      <span className="ssa-status-badge" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  {/* CARD META */}
                  <div className="ssa-card-meta">
                    <div className="ssa-card-row">
                      <span className="ssa-card-key">Address:</span>
                      <span className="ssa-card-val">{s.address || "—"}</span>
                    </div>
                    {isT && (
                      <div className="ssa-card-row">
                        <span className="ssa-card-key">Qty:</span>
                        <span className="ssa-card-val">{s.quantity ?? "—"}</span>
                        <span className="ssa-card-key" style={{ marginLeft: 12 }}>Freq:</span>
                        <span className="ssa-card-val">{s.frequency || "—"}</span>
                      </div>
                    )}
                    {!isT && (
                      <div className="ssa-card-row">
                        <span className="ssa-card-key">Headcount:</span>
                        <span className="ssa-card-val">{s.headcount ?? "—"}</span>
                        <span className="ssa-card-key" style={{ marginLeft: 12 }}>Freq:</span>
                        <span className="ssa-card-val">{s.frequency || "—"}</span>
                      </div>
                    )}
                    <div className="ssa-card-row">
                      <span className="ssa-card-key">Date:</span>
                      <span className="ssa-card-val">{s.date || "—"}</span>
                      <span className="ssa-card-key" style={{ marginLeft: 12 }}>Time:</span>
                      <span className="ssa-card-val">
                        {s.all_day ? "All Day" : `${formatTime(s.starts_at)} – ${formatTime(s.ends_at)}`}
                      </span>
                    </div>
                    {isT && (
                      <>
                        <div className="ssa-card-row">
                          <span className="ssa-card-key">Type:</span>
                          <span className="ssa-card-val">{s.vehicle_type || "—"}</span>
                        </div>
                        <div className="ssa-card-row">
                          <span className="ssa-card-key">Capacity:</span>
                          <span className="ssa-card-val">{s.capacity ? `${s.capacity} kg` : "—"}</span>
                          <span className="ssa-card-key" style={{ marginLeft: 12 }}>Max Dist:</span>
                          <span className="ssa-card-val">{s.max_distance ? `${s.max_distance} km` : "—"}</span>
                        </div>
                      </>
                    )}
                    {!isT && (
                      <div className="ssa-card-row">
                        <span className="ssa-card-key">Work:</span>
                        <span className="ssa-card-val">{s.preferred_work || "—"}</span>
                      </div>
                    )}
                    <div className="ssa-card-row">
                      <span className="ssa-card-key">Contact Person:</span>
                      <span className="ssa-card-val">{s.first_name} {s.last_name}</span>
                    </div>
                    <div className="ssa-card-row">
                      <span className="ssa-card-key">Email:</span>
                      <span className="ssa-card-val">{s.email || "—"}</span>
                    </div>
                  </div>

                  {/* CATEGORIES BOX */}
                  <div className="ssa-card-categories-box">
                    <p className="ssa-card-categories-label">
                      {isT ? "Categories:" : "Skills:"}
                    </p>
                    <div className="ssa-card-categories-pills">
                      {(isT ? s.transport_categories : s.skill_categories).length === 0 ? (
                        <span className="ssa-card-categories-empty">None specified</span>
                      ) : (
                        (isT ? s.transport_categories : s.skill_categories).map((c) => (
                          <span key={c} className="ssa-category-pill">{c}</span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* NOTES BOX */}
                  <div className="ssa-card-notes-box">
                    <p className="ssa-card-categories-label">Extra Notes:</p>
                    <p className="ssa-card-notes-text">{s.notes || "—"}</p>
                  </div>

                  {/* FOOTER: TIME + ACTIONS */}
                  <div className="ssa-card-footer" onClick={(e) => e.stopPropagation()}>
                    <span className="ssa-card-time">{timeAgo(s.created_at)}</span>
                    <div className="ssa-card-actions">
                      <button
                        className="ssa-decline-btn"
                        disabled={s.status !== "pending" || actionLoading !== null}
                        onClick={(e) => { e.stopPropagation(); handleAction(s.id, "decline"); }}
                      >
                        {actionLoading === s.id + "decline" ? "…" : "Decline"}
                      </button>
                      <button
                        className="ssa-accept-btn"
                        disabled={s.status !== "pending" || actionLoading !== null}
                        onClick={(e) => { e.stopPropagation(); handleAction(s.id, "accept"); }}
                      >
                        {actionLoading === s.id + "accept" ? "…" : "Accept"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div className="ssa-overlay" onClick={() => setSelected(null)}>
          <div className="ssa-modal" onClick={(e) => e.stopPropagation()}>

            {/* MODAL HEADER */}
            <div className="ssa-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  className="ssa-modal-type-icon"
                  style={{ background: typeStyle(selected.service_tab).bg }}
                >
                  <span className="material-symbols-rounded" style={{ color: "white", fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                    {selected.service_tab === "Transportation" ? "local_shipping" : "volunteer_activism"}
                  </span>
                </div>
                <div>
                  <h2 className="ssa-modal-title">{selected.donor_name || `${selected.first_name} ${selected.last_name}`}</h2>
                  <p className="ssa-modal-sub">{selected.service_tab} · {selected.frequency}</p>
                </div>
              </div>
              <button className="ssa-modal-close" onClick={() => setSelected(null)}>
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <hr className="ssa-modal-divider" />

            {/* MODAL BODY */}
            <div className="ssa-modal-body">

              <div className="ssa-modal-section-title">Donation Details</div>
              <div className="ssa-modal-grid">
                <ModalRow label="Service Type"   value={selected.service_tab} />
                <ModalRow label="Address"        value={selected.address} />
                <ModalRow label="Frequency"      value={selected.frequency} />
                <ModalRow label="Date"           value={selected.date || "—"} />
                <ModalRow label="Time"           value={selected.all_day ? "All Day" : `${formatTime(selected.starts_at)} – ${formatTime(selected.ends_at)}`} />

                {selected.service_tab === "Transportation" ? (
                  <>
                    <ModalRow label="Quantity"     value={selected.quantity} />
                    <ModalRow label="Vehicle Type" value={selected.vehicle_type} />
                    <ModalRow label="Capacity"     value={selected.capacity ? `${selected.capacity} kg` : "—"} />
                    <ModalRow label="Max Distance" value={selected.max_distance ? `${selected.max_distance} km` : "—"} />
                  </>
                ) : (
                  <>
                    <ModalRow label="Headcount"     value={selected.headcount} />
                    <ModalRow label="Preferred Work" value={selected.preferred_work} />
                  </>
                )}
              </div>

              {/* CATEGORIES / SKILLS */}
              <div className="ssa-modal-section-title" style={{ marginTop: 16 }}>
                {selected.service_tab === "Transportation" ? "Categories" : "Skill Categories"}
              </div>
              <div className="ssa-card-categories-pills" style={{ marginBottom: 16 }}>
                {(selected.service_tab === "Transportation"
                  ? selected.transport_categories
                  : selected.skill_categories
                ).length === 0 ? (
                  <span className="ssa-card-categories-empty">None specified</span>
                ) : (
                  (selected.service_tab === "Transportation"
                    ? selected.transport_categories
                    : selected.skill_categories
                  ).map((c) => (
                    <span key={c} className="ssa-category-pill">{c}</span>
                  ))
                )}
              </div>

              {/* CONTACT */}
              <div className="ssa-modal-section-title">Contact Person</div>
              <div className="ssa-modal-grid">
                <ModalRow label="Name"  value={`${selected.first_name} ${selected.last_name}`} />
                <ModalRow label="Email" value={selected.email} />
              </div>

              {/* NOTES */}
              {selected.notes && (
                <>
                  <div className="ssa-modal-section-title" style={{ marginTop: 16 }}>Extra Notes</div>
                  <p className="ssa-modal-notes">{selected.notes}</p>
                </>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="ssa-modal-footer">
              <span
                className="ssa-status-badge"
                style={{ ...(() => { const s = statusStyle(selected.status); return { background: s.bg, color: s.color }; })(), fontSize: 13, padding: "6px 18px" }}
              >
                {statusStyle(selected.status).label}
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="ssa-decline-btn"
                  disabled={selected.status !== "pending" || actionLoading !== null}
                  onClick={() => handleAction(selected.id, "decline")}
                >
                  {actionLoading === selected.id + "decline" ? "Declining…" : "Decline"}
                </button>
                <button
                  className="ssa-accept-btn"
                  disabled={selected.status !== "pending" || actionLoading !== null}
                  onClick={() => handleAction(selected.id, "accept")}
                >
                  {actionLoading === selected.id + "accept" ? "Accepting…" : "Accept"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MODAL ROW HELPER ──────────────────────────────────────────────────────────
function ModalRow({ label, value }) {
  return (
    <>
      <span className="ssa-modal-key">{label}</span>
      <span className="ssa-modal-val">{value ?? "—"}</span>
    </>
  );
}
