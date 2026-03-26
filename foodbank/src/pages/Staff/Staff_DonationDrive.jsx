import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ── DUMMY DATA (remove once backend is connected) ─────────────────────────────
const DUMMY_DRIVES = [
  {
    id: 1,
    status: "pending",
    title: "Poblacion Drive",
    type: "financial",
    goal: 100000,
    goal_label: "₱ 100,000",
    start_date: "2026-06-30",
    end_date: "2026-07-13",
    address: "132 Grand Caloocan, City",
    contact_person: "Maria Vernice",
    contact_number: "0923 432 3245",
    contact_email: "mvernice@gmail.com",
  },
  {
    id: 2,
    status: "done",
    title: "Fire Save Food",
    type: "food",
    goal: 500,
    goal_label: "500 Meals",
    start_date: "2026-06-30",
    end_date: "2026-07-13",
    address: "Makati Elementary High",
    contact_person: "Ella Patricia",
    contact_number: "0923 452 3557",
    contact_email: "elapat@gmail.com",
  },
  {
    id: 3,
    status: "ongoing",
    title: "Together We Thrive",
    type: "food",
    goal: 900,
    goal_label: "900 Meals",
    start_date: "2026-06-30",
    end_date: "2026-07-13",
    address: "SM Bicutan",
    contact_person: "Antony Martizen",
    contact_number: "0967 454 6582",
    contact_email: "amart@gmail.com",
  },
  {
    id: 4,
    status: "cancelled",
    title: "Awit Foundation",
    type: "financial",
    goal: 100000,
    goal_label: "₱ 100,000",
    start_date: "2026-06-30",
    end_date: "2026-07-13",
    address: "342 Novaliches City",
    contact_person: "Harry Mercado",
    contact_number: "0935 456 3467",
    contact_email: "hm@gmail.com",
  },
];

// ── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#555",    bg: "#f0f0f0",  border: "#ccc"    },
  ongoing:   { label: "OnGoing",   color: "#f4b942", bg: "#fef3e2",  border: "#f4b942" },
  done:      { label: "Done",      color: "#2e7d32", bg: "#e8f5e9",  border: "#2e7d32" },
  cancelled: { label: "Cancelled", color: "#e74c3c", bg: "#fdecea",  border: "#e74c3c" },
};

// ── TYPE CONFIG ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  financial: { label: "Financial", color: "#888",    bg: "#ececec" },
  food:      { label: "Food",      color: "#6d4c41", bg: "#efebe9" },
  service:   { label: "Service",   color: "#1565c0", bg: "#e3f2fd" },
};

// ── EMPTY ROW TEMPLATE ────────────────────────────────────────────────────────
const EMPTY_ROW = {
  id: null,
  status: "pending",
  title: "",
  type: "financial",
  goal_label: "",
  start_date: "",
  end_date: "",
  address: "",
  contact_person: "",
  contact_number: "",
  contact_email: "",
  isNew: true,
};

export default function Staff_DonationDrive() {

  // ── State ─────────────────────────────────────────────────────────────────
  const [drives, setDrives]               = useState([]);
  const [filter, setFilter]               = useState("all");
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [savingId, setSavingId]           = useState(null);
  const [editingRow, setEditingRow]       = useState(null); // id of row being edited

  // ── Fetch drives ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        // ── BACKEND READY: uncomment below and remove setDrives(DUMMY_DRIVES) ──
        // const res = await api.get("/staff/donation-drives");
        // setDrives(res.data);

        // ── DUMMY DATA ──
        setDrives(DUMMY_DRIVES);
      } catch (err) {
        console.error("Fetch error:", err);
        setDrives(DUMMY_DRIVES);
      } finally {
        setLoading(false);
      }
    };
    fetchDrives();
  }, []);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const pendingCount = drives.filter(d => d.status === "pending" && !d.isNew).length;
  const ongoingCount = drives.filter(d => d.status === "ongoing" && !d.isNew).length;

  // ── Filtered + searched list ───────────────────────────────────────────────
  const visible = drives.filter((d) => {
    const matchFilter = filter === "all" ? true : d.status === filter || d.isNew;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.title?.toLowerCase().includes(q) ||
      d.address?.toLowerCase().includes(q) ||
      d.contact_person?.toLowerCase().includes(q) ||
      d.contact_email?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // ── Add new empty row ──────────────────────────────────────────────────────
  const handleAddRow = () => {
    const tempId = `new-${Date.now()}`;
    const newRow = { ...EMPTY_ROW, id: tempId };
    setDrives(prev => [newRow, ...prev]);
    setEditingRow(tempId);
  };

  // ── Update a field in a row ────────────────────────────────────────────────
  const handleFieldChange = (id, field, value) => {
    setDrives(prev =>
      prev.map(d => d.id === id ? { ...d, [field]: value } : d)
    );
  };

  // ── Save new row to backend ────────────────────────────────────────────────
  const handleSaveRow = async (id) => {
    const row = drives.find(d => d.id === id);
    if (!row.title || !row.start_date || !row.end_date) {
      alert("Please fill in at least Drive Title and Duration Dates.");
      return;
    }
    setSavingId(id);
    try {
      // ── BACKEND READY: uncomment below ──
      // const res = await api.post("/staff/donation-drives", row);
      // setDrives(prev => prev.map(d => d.id === id ? { ...res.data, isNew: false } : d));

      // ── DUMMY: just mark as saved ──
      setDrives(prev =>
        prev.map(d => d.id === id ? { ...d, isNew: false, id: Date.now() } : d)
      );
      setEditingRow(null);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSavingId(null);
    }
  };

  // ── Cancel adding new row ──────────────────────────────────────────────────
  const handleCancelRow = (id) => {
    setDrives(prev => prev.filter(d => d.id !== id));
    setEditingRow(null);
  };

  // ── Update status ──────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    try {
      // ── BACKEND READY: uncomment below ──
      // await api.patch(`/staff/donation-drives/${id}/status`, { status: newStatus });
      setDrives(prev =>
        prev.map(d => d.id === id ? { ...d, status: newStatus } : d)
      );
    } catch (err) {
      console.error("Status change error:", err);
    }
  };

  return (
    <div className="dd-drive-wrapper">

      {/* ── NAVBAR ── */}
      <NavBar_Staff />

      <main className="dd-drive-main">

        {/* ── PAGE HEADER ── */}
        <div className="dd-drive-header">
          <h1 className="dd-drive-heading">Donation Drive</h1>

          <div className="dr-counters">
            <div className="dr-counter dr-counter-pending">
              <span className="material-symbols-rounded dr-counter-icon">schedule</span>
              <span className="dr-counter-num">{pendingCount}</span>
              <span className="dr-counter-label">Pending</span>
            </div>
            <div className="dr-counter dr-counter-allocated">
              <span className="material-symbols-rounded dr-counter-icon">check_circle</span>
              <span className="dr-counter-num">{ongoingCount}</span>
              <span className="dr-counter-label">OnGoing</span>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="dr-toolbar">
          <div className="dr-filters">
            {["all", "pending", "ongoing", "cancelled", "done"].map((f) => (
              <button
                key={f}
                className={`dr-filter-tab ${filter === f ? "dr-filter-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "ongoing" ? "OnGoing" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="dd-drive-toolbar-right">
            <button className="dd-drive-add-btn" onClick={handleAddRow}>
              <span className="material-symbols-rounded">add</span>
              Add New Item
            </button>
            <div className="dr-search-wrap">
              <input
                className="dr-search"
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="material-symbols-rounded dr-search-icon">search</span>
            </div>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="dd-drive-table-wrap">
          <table className="dd-drive-table">
            <thead>
              <tr>
                <th>STATUS</th>
                <th>DRIVE TITLE</th>
                <th>TYPE</th>
                <th>GOAL</th>
                <th>DURATION DATE</th>
                <th>ADDRESS</th>
                <th>CONTACT PERSON</th>
                <th>NUMBER</th>
                <th>EMAIL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="dd-drive-empty">Loading…</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={10} className="dd-drive-empty">No drives found.</td></tr>
              ) : (
                visible.map((d) => {
                  const isNew     = d.isNew;
                  const isEditing = editingRow === d.id;
                  const statusCfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pending;
                  const typeCfg   = TYPE_CONFIG[d.type]     ?? TYPE_CONFIG.financial;
                  const busy      = savingId === d.id;

                  return (
                    <tr key={d.id} className={isNew ? "dd-drive-row-new" : ""}>

                      {/* STATUS */}
                      <td>
                        {isNew ? (
                          <select
                            className="dd-drive-input dd-drive-select-sm"
                            value={d.status}
                            onChange={(e) => handleFieldChange(d.id, "status", e.target.value)}
                          >
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        ) : (
                          <select
                            className="dd-drive-status-select"
                            value={d.status}
                            style={{
                              color: statusCfg.color,
                              background: statusCfg.bg,
                              borderColor: statusCfg.border,
                            }}
                            onChange={(e) => handleStatusChange(d.id, e.target.value)}
                          >
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* DRIVE TITLE */}
                      <td>
                        {isNew ? (
                          <input
                            className="dd-drive-input"
                            type="text"
                            placeholder="Drive Title"
                            value={d.title}
                            onChange={(e) => handleFieldChange(d.id, "title", e.target.value)}
                          />
                        ) : (
                          <span className="dd-drive-title-text">{d.title}</span>
                        )}
                      </td>

                      {/* TYPE */}
                      <td>
                        {isNew ? (
                          <select
                            className="dd-drive-input dd-drive-select-sm"
                            value={d.type}
                            onChange={(e) => handleFieldChange(d.id, "type", e.target.value)}
                          >
                            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="dd-drive-type-badge"
                            style={{ color: typeCfg.color, background: typeCfg.bg }}
                          >
                            {typeCfg.label}
                          </span>
                        )}
                      </td>

                      {/* GOAL */}
                      <td>
                        {isNew ? (
                          <input
                            className="dd-drive-input"
                            type="text"
                            placeholder="e.g. ₱ 100,000"
                            value={d.goal_label}
                            onChange={(e) => handleFieldChange(d.id, "goal_label", e.target.value)}
                          />
                        ) : (
                          d.goal_label
                        )}
                      </td>

                      {/* DURATION DATE */}
                      <td>
                        {isNew ? (
                          <div className="dd-drive-date-row">
                            <input
                              className="dd-drive-input"
                              type="date"
                              value={d.start_date}
                              onChange={(e) => handleFieldChange(d.id, "start_date", e.target.value)}
                            />
                            <span className="dd-drive-date-sep">|</span>
                            <input
                              className="dd-drive-input"
                              type="date"
                              value={d.end_date}
                              onChange={(e) => handleFieldChange(d.id, "end_date", e.target.value)}
                            />
                          </div>
                        ) : (
                          <span className="dd-drive-date-badge">
                            {d.start_date} | {d.end_date}
                          </span>
                        )}
                      </td>

                      {/* ADDRESS */}
                      <td>
                        {isNew ? (
                          <input
                            className="dd-drive-input"
                            type="text"
                            placeholder="Address"
                            value={d.address}
                            onChange={(e) => handleFieldChange(d.id, "address", e.target.value)}
                          />
                        ) : (
                          d.address
                        )}
                      </td>

                      {/* CONTACT PERSON */}
                      <td>
                        {isNew ? (
                          <input
                            className="dd-drive-input"
                            type="text"
                            placeholder="Contact Person"
                            value={d.contact_person}
                            onChange={(e) => handleFieldChange(d.id, "contact_person", e.target.value)}
                          />
                        ) : (
                          d.contact_person
                        )}
                      </td>

                      {/* NUMBER */}
                      <td>
                        {isNew ? (
                          <input
                            className="dd-drive-input"
                            type="text"
                            placeholder="Number"
                            value={d.contact_number}
                            onChange={(e) => handleFieldChange(d.id, "contact_number", e.target.value)}
                          />
                        ) : (
                          d.contact_number
                        )}
                      </td>

                      {/* EMAIL */}
                      <td>
                        {isNew ? (
                          <input
                            className="dd-drive-input"
                            type="email"
                            placeholder="Email"
                            value={d.contact_email}
                            onChange={(e) => handleFieldChange(d.id, "contact_email", e.target.value)}
                          />
                        ) : (
                          <span className="dd-drive-email">{d.contact_email}</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="dd-drive-actions-cell">
                        {isNew ? (
                          <div className="dd-drive-row-actions">
                            <button
                              className="dd-drive-save-btn"
                              onClick={() => handleSaveRow(d.id)}
                              disabled={busy}
                            >
                              {busy ? "Saving…" : "Save"}
                            </button>
                            <button
                              className="dd-drive-cancel-btn"
                              onClick={() => handleCancelRow(d.id)}
                              disabled={busy}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : null}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
