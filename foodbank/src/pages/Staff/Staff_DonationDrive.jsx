import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

const STATUS_CONFIG = {
    Pending:   { label: "Pending",   color: "#555",    bg: "#f0f0f0",  border: "#ccc"    },
    OnGoing:   { label: "OnGoing",   color: "#f4b942", bg: "#fef3e2",  border: "#f4b942" },
    Done:      { label: "Done",      color: "#2e7d32", bg: "#e8f5e9",  border: "#2e7d32" },
    Cancelled: { label: "Cancelled", color: "#e74c3c", bg: "#fdecea",  border: "#e74c3c" },
};

const TYPE_CONFIG = {
    Financial: { label: "Financial", color: "#888",    bg: "#ececec" },
    Food:      { label: "Food",      color: "#6d4c41", bg: "#efebe9" },
};

const EMPTY_FORM = {
    drive_title: "", type: "Food", goal: "", start_date: "", end_date: "",
    address: "", contact_person: "", contact: "", email: "", status: "Pending",
};

export default function Staff_DonationDrive() {

    const [drives, setDrives]         = useState([]);
    const [stats, setStats]           = useState({ pending: 0, ongoing: 0 });
    const [filter, setFilter]         = useState("all");
    const [search, setSearch]         = useState("");
    const [loading, setLoading]       = useState(true);

    const [showModal, setShowModal]   = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [modalError, setModalError] = useState("");
    const [saving, setSaving]         = useState(false);

    // ── Fetch all once, filter client-side ────────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [drivesRes, statsRes] = await Promise.all([
                api.get("/staff/donation-drives"),  // ✅ no params
                api.get("/staff/donation-drives/stats"),
            ]);
            setDrives(drivesRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []); // ✅ fetch once only

    // ── Client-side filter + search ───────────────────────────────────────────
    const visible = drives.filter((d) => {
        const matchFilter =
            filter === "all" ? true :
            d.status === filter;

        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            d.drive_title?.toLowerCase().includes(q)    ||
            d.address?.toLowerCase().includes(q)        ||
            d.contact_person?.toLowerCase().includes(q) ||
            d.email?.toLowerCase().includes(q);

        return matchFilter && matchSearch;
    });

    // ── Open Add modal ────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModalError("");
        setShowModal(true);
    };

    // ── Open Edit modal ───────────────────────────────────────────────────────
    const openEdit = (drive) => {
        setEditTarget(drive);
        setForm({
            drive_title:    drive.drive_title    || "",
            type:           drive.type           || "Food",
            goal:           drive.goal           || "",
            start_date:     drive.start_date     || "",
            end_date:       drive.end_date       || "",
            address:        drive.address        || "",
            contact_person: drive.contact_person || "",
            contact:        drive.contact        || "",
            email:          drive.email          || "",
            status:         drive.status         || "Pending",
        });
        setModalError("");
        setShowModal(true);
    };

    // ── Save (create or update) ───────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.drive_title || !form.goal || !form.start_date || !form.end_date) {
            setModalError("Please fill in all required fields.");
            return;
        }
        setSaving(true);
        try {
            if (editTarget) {
                await api.put(`/staff/donation-drives/${editTarget.id}`, form);
            } else {
                await api.post("/staff/donation-drives", form);
            }
            setShowModal(false);
            fetchAll(); // ✅ refresh after save
        } catch (err) {
            setModalError(err.response?.data?.message || "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!confirm("Delete this donation drive?")) return;
        try {
            await api.delete(`/staff/donation-drives/${id}`);
            fetchAll(); // ✅ refresh after delete
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    // ── Status change inline ──────────────────────────────────────────────────
    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/staff/donation-drives/${id}`, { status: newStatus });
            // ✅ update local state immediately so UI reflects change instantly
            setDrives(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
            // ✅ refresh stats too
            const statsRes = await api.get("/staff/donation-drives/stats");
            setStats(statsRes.data);
        } catch (err) {
            console.error("Status change error:", err);
        }
    };

    const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, marginTop: 12 };
    const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14, boxSizing: "border-box" };

    return (
        <div className="dd-drive-wrapper">

            <NavBar_Staff />

            <main className="dd-drive-main">

                {/* PAGE HEADER */}
                <div className="dd-drive-header">
                    <h1 className="dd-drive-heading">Donation Drive</h1>
                    <div className="dr-counters">
                        <div className="dr-counter dr-counter-pending">
                            <span className="material-symbols-rounded dr-counter-icon">schedule</span>
                            <span className="dr-counter-num">{stats.pending}</span>
                            <span className="dr-counter-label">Pending</span>
                        </div>
                        <div className="dr-counter dr-counter-allocated">
                            <span className="material-symbols-rounded dr-counter-icon">check_circle</span>
                            <span className="dr-counter-num">{stats.ongoing}</span>
                            <span className="dr-counter-label">OnGoing</span>
                        </div>
                    </div>
                </div>

                {/* TOOLBAR */}
                <div className="dr-toolbar">
                    <div className="dr-filters">
                        {["all", "Pending", "OnGoing", "Cancelled", "Done"].map((f) => (
                            <button
                                key={f}
                                className={`dr-filter-tab ${filter === f ? "dr-filter-active" : ""}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === "all" ? "All" : f}
                            </button>
                        ))}
                    </div>
                    <div className="dd-drive-toolbar-right">
                        <button className="dd-drive-add-btn" onClick={openAdd}>
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

                {/* TABLE */}
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
                                    const statusCfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.Pending;
                                    const typeCfg   = TYPE_CONFIG[d.type]     ?? TYPE_CONFIG.Food;

                                    return (
                                        <tr key={d.id}>
                                            {/* STATUS — inline dropdown */}
                                            <td>
                                                <select
                                                    className="dd-drive-status-select"
                                                    value={d.status}
                                                    style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
                                                    onChange={(e) => handleStatusChange(d.id, e.target.value)}
                                                >
                                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                                        <option key={k} value={k}>{v.label}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td><span className="dd-drive-title-text">{d.drive_title}</span></td>

                                            <td>
                                                <span className="dd-drive-type-badge" style={{ color: typeCfg.color, background: typeCfg.bg }}>
                                                    {typeCfg.label}
                                                </span>
                                            </td>

                                            <td>{d.goal}</td>

                                            <td>
                                                <span className="dd-drive-date-badge">
                                                    {d.start_date} — {d.end_date}
                                                </span>
                                            </td>

                                            <td>{d.address}</td>
                                            <td>{d.contact_person}</td>
                                            <td>{d.contact}</td>
                                            <td><span className="dd-drive-email">{d.email}</span></td>

                                            {/* EDIT / DELETE */}
                                            <td className="dd-drive-actions-cell">
                                                <div className="dd-drive-row-actions">
                                                    <button className="dd-drive-save-btn"   onClick={() => openEdit(d)}>Edit</button>
                                                    <button className="dd-drive-cancel-btn" onClick={() => handleDelete(d.id)}>Delete</button>
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

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                        <h2 style={{ marginBottom: 20 }}>{editTarget ? "Edit Donation Drive" : "Add New Donation Drive"}</h2>

                        <label style={labelStyle}>Drive Title *</label>
                        <input value={form.drive_title} onChange={(e) => setForm({ ...form, drive_title: e.target.value })} placeholder="Drive Title" style={inputStyle} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Type *</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                                    <option value="Food">Food</option>
                                    <option value="Financial">Financial</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label style={labelStyle}>Goal *</label>
                        <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="e.g. 500 Meals or ₱100,000" style={inputStyle} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Start Date *</label>
                                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>End Date *</label>
                                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
                            </div>
                        </div>

                        <label style={labelStyle}>Address</label>
                        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" style={inputStyle} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Contact Person</label>
                                <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Contact Person" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Contact Number</label>
                                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="09XXXXXXXXX" style={inputStyle} />
                            </div>
                        </div>

                        <label style={labelStyle}>Email</label>
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" style={inputStyle} />

                        {modalError && <p style={{ color: "red", fontSize: 13, marginTop: 8 }}>⚠️ {modalError}</p>}

                        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 999, background: "#fff", color: "#333", border: "1px solid #ccc", fontWeight: 600, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 999, background: "#2e7d32", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
                                {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Drive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}