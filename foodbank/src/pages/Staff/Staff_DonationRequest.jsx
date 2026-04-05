import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

const URGENCY_LABEL = {
    low:      { label: "Low",      color: "#fff", bg: "#27ae60" },
    medium:   { label: "Medium",   color: "#fff", bg: "#e67e22" },
    high:     { label: "High",     color: "#fff", bg: "#e74c3c" },
    critical: { label: "Critical", color: "#fff", bg: "#922b21" },
};

const STATUS_LABEL = {
    Pending:   { label: "Unallocated", color: "#333",    bg: "transparent", border: "#999"    },
    Allocated: { label: "Allocated",   color: "#fff",    bg: "#f4b942",     border: "#f4b942" },
    Declined:  { label: "Declined",    color: "#fff",    bg: "#e74c3c",     border: "#e74c3c" },
    Done:      { label: "Done",        color: "#fff",    bg: "#1565c0",     border: "#1565c0" },
};

const TYPE_CONFIG = {
    Financial:    { label: "Financial",    color: "#555",    bg: "#ececec" },
    Food:         { label: "Food",         color: "#6d4c41", bg: "#efebe9" },
    "Cooked Meal":{ label: "Cooked Meal",  color: "#4a235a", bg: "#f3e5f5" },
    "Packed Goods":{ label: "Packed Goods",color: "#1a3a2a", bg: "#e0f2e9" },
};

export default function Staff_DonationRequest() {

    const [requests, setRequests]           = useState([]);
    const [stats, setStats]                 = useState({ pending: 0, allocated: 0 });
    const [filter, setFilter]               = useState("all");
    const [search, setSearch]               = useState("");
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [showModal, setShowModal]   = useState(false);
    const [selected, setSelected]     = useState(null);
    const [driveForm, setDriveForm]   = useState({
        drive_title: "", type: "Food", goal: "", start_date: "", end_date: "",
    });
    const [modalError, setModalError] = useState("");
    const [saving, setSaving]         = useState(false);

    // ── Fetch all once ────────────────────────────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [reqRes, statsRes] = await Promise.all([
                api.get("/staff/donation-requests"),
                api.get("/staff/donation-requests/stats"),
            ]);
            setRequests(reqRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // ── Client-side filter + search ───────────────────────────────────────────
    const visible = requests.filter((r) => {
        const urgencyLower = r.urgency?.toLowerCase();

        const matchFilter =
            filter === "all"         ? true :
            filter === "urgent"      ? ["high", "critical"].includes(urgencyLower) :
            filter === "unallocated" ? r.status === "Pending" :
            filter === "allocated"   ? r.status === "Allocated" :
            true;

        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            r.name?.toLowerCase().includes(q)    ||
            r.email?.toLowerCase().includes(q)   ||
            r.address?.toLowerCase().includes(q) ||
            r.reason?.toLowerCase().includes(q);

        return matchFilter && matchSearch;
    });

    const openAllocate = (req) => {
        setSelected(req);
        setDriveForm({ drive_title: "", type: "Food", goal: "", start_date: "", end_date: "" });
        setModalError("");
        setShowModal(true);
    };

    const handleAllocate = async () => {
        if (!driveForm.drive_title || !driveForm.goal || !driveForm.start_date || !driveForm.end_date) {
            setModalError("Please fill in all required fields.");
            return;
        }
        setSaving(true);
        try {
            await api.post(`/staff/donation-requests/${selected.id}/allocate`, driveForm);
            setShowModal(false);
            fetchAll();
        } catch (err) {
            setModalError(err.response?.data?.message || "Failed to allocate.");
        } finally {
            setSaving(false);
        }
    };

    const handleUnallocate = async (id) => {
        setActionLoading(id);
        try {
            await api.post(`/staff/donation-requests/${id}/unallocate`);
            fetchAll();
        } catch (err) {
            console.error("Unallocate error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (id) => {
        if (!confirm("Decline this request?")) return;
        setActionLoading(id);
        try {
            await api.post(`/staff/donation-requests/${id}/decline`);
            fetchAll();
        } catch (err) {
            console.error("Decline error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDone = async (id) => {
        setActionLoading(id);
        try {
            await api.post(`/staff/donation-requests/${id}/done`);
            fetchAll();
        } catch (err) {
            console.error("Done error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, marginTop: 12 };
    const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14, boxSizing: "border-box" };

    return (
        <div className="dr-wrapper">
            <NavBar_Staff />
            <main className="dr-main">

                {/* PAGE HEADER */}
                <div className="dr-header">
                    <h1 className="dr-heading">Donation Request</h1>
                    <div className="dr-counters">
                        <div className="dr-counter dr-counter-pending">
                            <span className="material-symbols-rounded">schedule</span>
                            <span className="dr-counter-num">{stats.pending}</span>
                            <span className="dr-counter-label">Pending</span>
                        </div>
                        <div className="dr-counter dr-counter-allocated">
                            <span className="material-symbols-rounded">check_circle</span>
                            <span className="dr-counter-num">{stats.allocated}</span>
                            <span className="dr-counter-label">Allocated</span>
                        </div>
                    </div>
                </div>

                {/* FILTER + SEARCH */}
                <div className="dr-toolbar">
                    <div className="dr-filters">
                        {["all", "urgent", "unallocated", "allocated"].map((f) => (
                            <button
                                key={f}
                                className={`dr-filter-tab ${filter === f ? "dr-filter-active" : ""}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
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

                {/* TABLE */}
                <div className="dd-drive-table-wrap">
                    <table className="dd-drive-table" id="dr-table">
                        <thead>
                            <tr>
                                <th>STATUS</th>
                                <th>DRIVE TITLE</th>
                                <th>TYPE</th>
                                <th>GOAL</th>
                                <th>URGENCY</th>
                                <th>DATE</th>
                                <th>ADDRESS</th>
                                <th>CONTACT PERSON</th>
                                <th>NUMBER</th>
                                <th>EMAIL</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={11} className="dd-drive-empty">Loading requests…</td></tr>
                            ) : visible.length === 0 ? (
                                <tr><td colSpan={11} className="dd-drive-empty">No requests found.</td></tr>
                            ) : (
                                visible.map((r) => {
                                    const urgency = URGENCY_LABEL[r.urgency?.toLowerCase()] ?? URGENCY_LABEL.medium;
                                    const status  = STATUS_LABEL[r.status]  ?? STATUS_LABEL.Pending;
                                    const type    = TYPE_CONFIG[r.type]     ?? TYPE_CONFIG.Food;
                                    const busy    = actionLoading === r.id;

                                    return (
                                        <tr key={r.id} id={`dr-row-${r.id}`}>

                                            {/* STATUS BADGE */}
                                            <td>
                                                <span
                                                    className="dr-table-status-badge"
                                                    style={{
                                                        color:       status.color,
                                                        background:  status.bg,
                                                        border:      `1.5px solid ${status.border}`,
                                                        borderRadius: 20,
                                                        padding:     "4px 14px",
                                                        fontSize:    12,
                                                        fontWeight:  700,
                                                        whiteSpace:  "nowrap",
                                                        display:     "inline-block",
                                                    }}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>

                                            {/* DRIVE TITLE */}
                                            <td>
                                                <span className="dd-drive-title-text">{r.drive_title || "—"}</span>
                                            </td>

                                            {/* TYPE */}
                                            <td>
                                                <span
                                                    className="dd-drive-type-badge"
                                                    style={{ color: type.color, background: type.bg }}
                                                >
                                                    {r.type || "—"}
                                                </span>
                                            </td>

                                            {/* GOAL */}
                                            <td>{r.goal || "—"}</td>

                                            {/* URGENCY */}
                                            <td>
                                                <span
                                                    className="dr-table-urgency-badge"
                                                    style={{
                                                        color:        urgency.color,
                                                        background:   urgency.bg,
                                                        borderRadius: 20,
                                                        padding:      "4px 16px",
                                                        fontSize:     12,
                                                        fontWeight:   700,
                                                        display:      "inline-block",
                                                        whiteSpace:   "nowrap",
                                                    }}
                                                >
                                                    {urgency.label}
                                                </span>
                                            </td>

                                            {/* DATE */}
                                            <td>
                                                {r.date
                                                    ? <span className="dd-drive-date-badge">{r.date}</span>
                                                    : "—"
                                                }
                                            </td>

                                            {/* ADDRESS */}
                                            <td>{r.address || "—"}</td>

                                            {/* CONTACT PERSON */}
                                            <td>{r.name || "—"}</td>

                                            {/* NUMBER */}
                                            <td>{r.contact || "—"}</td>

                                            {/* EMAIL */}
                                            <td>
                                                <span className="dd-drive-email">{r.email || "—"}</span>
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="dd-drive-actions-cell">
                                                <div className="dd-drive-row-actions">
                                                    {r.status === "Allocated" ? (
                                                        <button
                                                            className="dd-drive-cancel-btn"
                                                            onClick={() => handleUnallocate(r.id)}
                                                            disabled={busy}
                                                        >
                                                            Unallocate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="dd-drive-save-btn"
                                                            onClick={() => openAllocate(r)}
                                                            disabled={busy || r.status === "Declined" || r.status === "Done"}
                                                        >
                                                            Allocate
                                                        </button>
                                                    )}
                                                    <button
                                                        className="dd-drive-cancel-btn"
                                                        onClick={() => handleDecline(r.id)}
                                                        disabled={busy || r.status === "Declined" || r.status === "Done"}
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        className="dd-drive-save-btn"
                                                        style={{ background: "#1565c0" }}
                                                        onClick={() => handleDone(r.id)}
                                                        disabled={busy || r.status === "Done"}
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </main>

            {/* ALLOCATE MODAL */}
            {showModal && selected && (
                <div className="adm-modal-overlay">
                    <div className="adm-modal" style={{ maxWidth: 500 }}>

                        <button className="adm-modal-close" onClick={() => setShowModal(false)}>
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>Allocate Request</h2>
                        <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                            Creating a donation drive for <strong>{selected.name}</strong>
                        </p>

                        {/* Request summary */}
                        <div style={{ background: "#f5f5f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#555", marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                            <p style={{ margin: 0 }}><strong>Contact Person:</strong> {selected.name}</p>
                            <p style={{ margin: 0 }}><strong>Address:</strong> {selected.address}</p>
                            <p style={{ margin: 0 }}><strong>Contact:</strong> {selected.contact}</p>
                            <p style={{ margin: 0 }}><strong>Email:</strong> {selected.email}</p>
                        </div>

                        <label style={labelStyle}>Drive Title *</label>
                        <input
                            value={driveForm.drive_title}
                            onChange={(e) => setDriveForm({ ...driveForm, drive_title: e.target.value })}
                            placeholder="e.g. Poblacion Drive"
                            style={inputStyle}
                        />

                        <label style={labelStyle}>Type *</label>
                        <select
                            value={driveForm.type}
                            onChange={(e) => setDriveForm({ ...driveForm, type: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="Food">Food</option>
                            <option value="Financial">Financial</option>
                        </select>

                        <label style={labelStyle}>Goal *</label>
                        <input
                            value={driveForm.goal}
                            onChange={(e) => setDriveForm({ ...driveForm, goal: e.target.value })}
                            placeholder="e.g. 500 Meals or ₱100,000"
                            style={inputStyle}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Start Date *</label>
                                <input
                                    type="date"
                                    value={driveForm.start_date}
                                    onChange={(e) => setDriveForm({ ...driveForm, start_date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>End Date *</label>
                                <input
                                    type="date"
                                    value={driveForm.end_date}
                                    onChange={(e) => setDriveForm({ ...driveForm, end_date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {modalError && (
                            <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>⚠️ {modalError}</p>
                        )}

                        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: "10px", borderRadius: 999, background: "#fff", color: "#333", border: "1px solid #ccc", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAllocate}
                                disabled={saving}
                                style={{ flex: 2, padding: "10px", borderRadius: 999, background: "#2e7d32", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}
                            >
                                {saving ? "Allocating..." : "Confirm Allocate"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
