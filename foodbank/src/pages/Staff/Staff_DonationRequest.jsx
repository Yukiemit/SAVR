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
    Pending:   { label: "Pending",   color: "#333",  bg: "transparent", border: "#999"    },
    Allocated: { label: "Allocated", color: "#fff",  bg: "#f4b942",     border: "#f4b942" },
    Rejected:  { label: "Rejected",  color: "#fff",  bg: "#e74c3c",     border: "#e74c3c" },
};

const TYPE_CONFIG = {
    food:      { label: "Food",      color: "#6d4c41", bg: "#efebe9" },
    financial: { label: "Financial", color: "#555",    bg: "#ececec" },
};

export default function Staff_DonationRequest() {

    const [requests,      setRequests]      = useState([]);
    const [stats,         setStats]         = useState({ pending: 0, allocated: 0 });
    const [filter,        setFilter]        = useState("all");
    const [search,        setSearch]        = useState("");
    const [loading,       setLoading]       = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [showModal,  setShowModal]  = useState(false);
    const [selected,   setSelected]   = useState(null);
    const [driveForm,  setDriveForm]  = useState({ drive_title: "", goal: "", start_date: "", end_date: "" });
    const [modalError, setModalError] = useState("");
    const [saving,     setSaving]     = useState(false);

    // ── Reject confirmation modal ─────────────────────────────────────────────
    const [rejectTarget,  setRejectTarget]  = useState(null); // request being rejected
    const [rejectSaving,  setRejectSaving]  = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [reqRes, statsRes] = await Promise.all([
                api.get("/staff/beneficiary-requests"),
                api.get("/staff/beneficiary-requests/stats"),
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
            filter === "all"       ? true :
            filter === "urgent"    ? ["high", "critical"].includes(urgencyLower) :
            filter === "pending"   ? r.status === "Pending" :
            filter === "allocated" ? r.status === "Allocated" :
            true;

        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            r.request_name?.toLowerCase().includes(q) ||
            r.contact_name?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q)        ||
            r.city?.toLowerCase().includes(q)         ||
            r.address?.toLowerCase().includes(q);

        return matchFilter && matchSearch;
    });

    // ── Actions ───────────────────────────────────────────────────────────────
    const openAllocate = (req) => {
        setSelected(req);
        setDriveForm({ drive_title: "", goal: "", start_date: "", end_date: "" });
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
            await api.post(`/staff/beneficiary-requests/${selected.id}/allocate`, driveForm);
            setShowModal(false);
            fetchAll();
        } catch (err) {
            setModalError(err.response?.data?.message || "Failed to allocate.");
        } finally {
            setSaving(false);
        }
    };

    const handleReject = (req) => {
        setRejectTarget(req);
    };

    const confirmReject = async () => {
        if (!rejectTarget) return;
        setRejectSaving(true);
        try {
            await api.post(`/staff/beneficiary-requests/${rejectTarget.id}/reject`);
            setRejectTarget(null);
            fetchAll();
        } catch (err) {
            console.error("Reject error:", err);
        } finally {
            setRejectSaving(false);
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
                    <h1 className="dr-heading">Donation Requests</h1>
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
                        {[
                            { key: "all",       label: "All"       },
                            { key: "urgent",    label: "Urgent"    },
                            { key: "pending",   label: "Pending"   },
                            { key: "allocated", label: "Allocated" },
                        ].map((f) => (
                            <button
                                key={f.key}
                                className={`dr-filter-tab ${filter === f.key ? "dr-filter-active" : ""}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
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
                                <th>REQUEST NAME</th>
                                <th>TYPE</th>
                                <th>DETAILS</th>
                                <th>POPULATION</th>
                                <th>AGE RANGE</th>
                                <th>CITY</th>
                                <th>DATE</th>
                                <th>URGENCY</th>
                                <th>CONTACT</th>
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
                                    const urgency = URGENCY_LABEL[r.urgency?.toLowerCase()] ?? URGENCY_LABEL.low;
                                    const status  = STATUS_LABEL[r.status] ?? STATUS_LABEL.Pending;
                                    const type    = TYPE_CONFIG[r.type]    ?? TYPE_CONFIG.food;
                                    const busy    = actionLoading === r.id;

                                    const details = r.type === "food"
                                        ? `${r.food_type || "—"} · ${r.quantity ?? "—"} ${r.unit || ""}`
                                        : `₱${Number(r.amount || 0).toLocaleString()}`;

                                    return (
                                        <tr key={r.id}>
                                            {/* STATUS */}
                                            <td>
                                                <span style={{
                                                    color: status.color, background: status.bg,
                                                    border: `1.5px solid ${status.border}`,
                                                    borderRadius: 20, padding: "4px 14px",
                                                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block",
                                                }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            {/* REQUEST NAME */}
                                            <td><span className="dd-drive-title-text">{r.request_name || "—"}</span></td>
                                            {/* TYPE */}
                                            <td>
                                                <span className="dd-drive-type-badge" style={{ color: type.color, background: type.bg }}>
                                                    {type.label}
                                                </span>
                                            </td>
                                            {/* DETAILS */}
                                            <td style={{ fontSize: 13, color: "#555" }}>{details}</td>
                                            {/* POPULATION */}
                                            <td>{r.population?.toLocaleString() || "—"}</td>
                                            {/* AGE RANGE */}
                                            <td style={{ whiteSpace: "nowrap" }}>{r.age_min}–{r.age_max} yrs</td>
                                            {/* CITY */}
                                            <td>{r.city || "—"}</td>
                                            {/* DATE */}
                                            <td>
                                                {r.request_date
                                                    ? <span className="dd-drive-date-badge">{r.request_date}</span>
                                                    : "—"
                                                }
                                            </td>
                                            {/* URGENCY */}
                                            <td>
                                                <span style={{
                                                    color: urgency.color, background: urgency.bg,
                                                    borderRadius: 20, padding: "4px 16px",
                                                    fontSize: 12, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap",
                                                }}>
                                                    {urgency.label}
                                                </span>
                                            </td>
                                            {/* CONTACT */}
                                            <td>
                                                <div style={{ fontSize: 13 }}>
                                                    <div style={{ fontWeight: 600 }}>{r.contact_name || "—"}</div>
                                                    <div style={{ color: "#888", fontSize: 12 }}>{r.email || ""}</div>
                                                </div>
                                            </td>
                                            {/* ACTIONS */}
                                            <td className="dd-drive-actions-cell">
                                                <div className="dd-drive-row-actions">
                                                    {r.status === "Pending" ? (
                                                        <>
                                                            <button
                                                                className="dd-drive-save-btn"
                                                                onClick={() => openAllocate(r)}
                                                                disabled={busy}
                                                            >
                                                                Allocate
                                                            </button>
                                                            <button
                                                                className="dd-drive-cancel-btn"
                                                                onClick={() => handleReject(r)}
                                                                disabled={busy}
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>
                                                            {r.status}
                                                        </span>
                                                    )}
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

            {/* REJECT CONFIRMATION MODAL */}
            {rejectTarget && (
                <div className="adm-modal-overlay">
                    <div className="adm-modal" style={{ maxWidth: 420, textAlign: "center" }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 52, color: "#e74c3c", display: "block", marginBottom: 12 }}>
                            cancel
                        </span>
                        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>Reject Request?</h2>
                        <p style={{ color: "#666", fontSize: 14, margin: "0 0 6px" }}>
                            You are about to reject the request:
                        </p>
                        <p style={{ color: "#333", fontWeight: 700, fontSize: 15, margin: "0 0 24px" }}>
                            "{rejectTarget.request_name}"
                        </p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={() => setRejectTarget(null)}
                                disabled={rejectSaving}
                                style={{ flex: 1, padding: "10px", borderRadius: 999, background: "#fff", color: "#333", border: "1.5px solid #ccc", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={rejectSaving}
                                style={{ flex: 2, padding: "10px", borderRadius: 999, background: "#e74c3c", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: rejectSaving ? 0.7 : 1 }}
                            >
                                {rejectSaving ? "Rejecting…" : "Yes, Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ALLOCATE MODAL */}
            {showModal && selected && (
                <div className="adm-modal-overlay">
                    <div className="adm-modal" style={{ maxWidth: 500 }}>
                        <button className="adm-modal-close" onClick={() => setShowModal(false)}>
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>Allocate to Donation Drive</h2>
                        <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                            Creating a drive for <strong>{selected.request_name}</strong>
                        </p>

                        {/* Request summary */}
                        <div style={{ background: "#f5f5f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#555", marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                            <p style={{ margin: 0 }}><strong>Type:</strong> {selected.type === "food" ? "Food" : "Financial"}</p>
                            {selected.type === "food" && (
                                <p style={{ margin: 0 }}><strong>Food Details:</strong> {selected.food_type} · {selected.quantity} {selected.unit}</p>
                            )}
                            {selected.type === "financial" && (
                                <p style={{ margin: 0 }}><strong>Amount Needed:</strong> ₱{Number(selected.amount || 0).toLocaleString()}</p>
                            )}
                            <p style={{ margin: 0 }}><strong>Population:</strong> {selected.population?.toLocaleString()}</p>
                            <p style={{ margin: 0 }}><strong>Address:</strong> {selected.address}</p>
                            <p style={{ margin: 0 }}><strong>Submitted by:</strong> {selected.contact_name} ({selected.email})</p>
                        </div>

                        <label style={labelStyle}>Drive Title *</label>
                        <input
                            value={driveForm.drive_title}
                            onChange={(e) => setDriveForm({ ...driveForm, drive_title: e.target.value })}
                            placeholder="e.g. Poblacion Food Drive"
                            style={inputStyle}
                        />

                        <label style={labelStyle}>Goal *</label>
                        <input
                            value={driveForm.goal}
                            onChange={(e) => setDriveForm({ ...driveForm, goal: e.target.value })}
                            placeholder={selected.type === "financial"
                                ? `e.g. ₱${Number(selected.amount || 0).toLocaleString()}`
                                : `e.g. ${selected.quantity} ${selected.unit} of ${selected.food_type}`}
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
                                {saving ? "Allocating…" : "Confirm Allocate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
