import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

const URGENCY_LABEL = {
    low:      { label: "Low",      color: "#27ae60", bg: "#eafaf1" },
    medium:   { label: "Medium",   color: "#e67e22", bg: "#fef3e2" },
    high:     { label: "High",     color: "#e74c3c", bg: "#fdecea" },
    critical: { label: "Critical", color: "#922b21", bg: "#fadbd8" },
};

const STATUS_LABEL = {
    Pending:   { label: "Pending",   color: "#e67e22", bg: "#fef3e2" },
    Allocated: { label: "Allocated", color: "#2e7d32", bg: "#e8f5e9" },
    Declined:  { label: "Declined",  color: "#c62828", bg: "#ffebee" },
    Done:      { label: "Done",      color: "#1565c0", bg: "#e3f2fd" },
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

    useEffect(() => { fetchAll(); }, []); // ✅ fetch once only

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
                            <span className="material-symbols-rounded dr-counter-icon">schedule</span>
                            <span className="dr-counter-num">{stats.pending}</span>
                            <span className="dr-counter-label">Pending</span>
                        </div>
                        <div className="dr-counter dr-counter-allocated">
                            <span className="material-symbols-rounded dr-counter-icon">check_circle</span>
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

                {/* CARDS GRID */}
                {loading ? (
                    <p className="dr-empty">Loading requests…</p>
                ) : visible.length === 0 ? (
                    <p className="dr-empty">No requests found.</p>
                ) : (
                    <div className="dr-grid">
                        {visible.map((r) => {
                            const urgency = URGENCY_LABEL[r.urgency?.toLowerCase()] ?? URGENCY_LABEL.medium;
                            const status  = STATUS_LABEL[r.status] ?? STATUS_LABEL.Pending;
                            const busy    = actionLoading === r.id;

                            return (
                                <div className="dr-card" key={r.id}>
                                    <div className="dr-card-header">
                                        <span className="dr-card-name">{r.name}</span>
                                        <span className="dr-card-badge" style={{ color: urgency.color, background: urgency.bg }}>
                                            {urgency.label}
                                        </span>
                                    </div>
                                    <div className="dr-card-contact">
                                        <span>{r.email}</span>
                                        <span>{r.contact}</span>
                                    </div>
                                    <p className="dr-card-address">{r.address}</p>
                                    <div className="dr-card-reason">
                                        <p>"{r.reason}"</p>
                                    </div>
                                    <div className="dr-card-status-row">
                                        <span className="dr-card-status" style={{ color: status.color, background: status.bg }}>
                                            {status.label}
                                        </span>
                                        <span className="dr-card-pax">{r.pax} pax</span>
                                    </div>
                                    <div className="dr-card-actions">
                                        {r.status === "Allocated" ? (
                                            <button className="dr-btn dr-btn-unallocate" onClick={() => handleUnallocate(r.id)} disabled={busy}>
                                                Unallocate
                                            </button>
                                        ) : (
                                            <button className="dr-btn dr-btn-allocate" onClick={() => openAllocate(r)} disabled={busy || r.status === "Declined" || r.status === "Done"}>
                                                Allocate
                                            </button>
                                        )}
                                        <button className="dr-btn dr-btn-decline" onClick={() => handleDecline(r.id)} disabled={busy || r.status === "Declined" || r.status === "Done"}>Decline</button>
                                        <button className="dr-btn dr-btn-done"    onClick={() => handleDone(r.id)}    disabled={busy || r.status === "Done"}>Done</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ALLOCATE MODAL */}
            {showModal && selected && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                        <h2 style={{ marginBottom: 4 }}>Allocate Request</h2>
                        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
                            Creating a donation drive for <strong>{selected.name}</strong>
                        </p>
                        <div style={{ background: "#f5f5f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#555", marginBottom: 20 }}>
                            <p><strong>Contact Person:</strong> {selected.name}</p>
                            <p><strong>Address:</strong> {selected.address}</p>
                            <p><strong>Contact:</strong> {selected.contact}</p>
                            <p><strong>Email:</strong> {selected.email}</p>
                        </div>

                        <label style={labelStyle}>Drive Title *</label>
                        <input value={driveForm.drive_title} onChange={(e) => setDriveForm({ ...driveForm, drive_title: e.target.value })} placeholder="e.g. Poblacion Drive" style={inputStyle} />

                        <label style={labelStyle}>Type *</label>
                        <select value={driveForm.type} onChange={(e) => setDriveForm({ ...driveForm, type: e.target.value })} style={inputStyle}>
                            <option value="Food">Food</option>
                            <option value="Financial">Financial</option>
                        </select>

                        <label style={labelStyle}>Goal *</label>
                        <input value={driveForm.goal} onChange={(e) => setDriveForm({ ...driveForm, goal: e.target.value })} placeholder="e.g. 500 Meals or ₱100,000" style={inputStyle} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Start Date *</label>
                                <input type="date" value={driveForm.start_date} onChange={(e) => setDriveForm({ ...driveForm, start_date: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>End Date *</label>
                                <input type="date" value={driveForm.end_date} onChange={(e) => setDriveForm({ ...driveForm, end_date: e.target.value })} style={inputStyle} />
                            </div>
                        </div>

                        {modalError && <p style={{ color: "red", fontSize: 13, marginTop: 8 }}>⚠️ {modalError}</p>}

                        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 999, background: "#fff", color: "#333", border: "1px solid #ccc", fontWeight: 600, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={handleAllocate} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 999, background: "#2e7d32", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
                                {saving ? "Allocating..." : "Confirm Allocate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}