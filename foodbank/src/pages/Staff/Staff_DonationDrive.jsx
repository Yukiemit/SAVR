import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

const STATUS_CONFIG = {
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
    address: "", contact_person: "", email: "", status: "OnGoing",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the numeric portion out of a goal string like "300 for Dry Goods"
 * Returns the number, or 0 if not found.
 */
function parseGoalNumber(goalStr) {
    if (!goalStr) return 0;
    const match = goalStr.match(/^(\d+(\.\d+)?)/);
    return match ? Number(match[1]) : 0;
}

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

    // ── Status confirmation ───────────────────────────────────────────────────
    const [confirmStatus, setConfirmStatus] = useState(null);
    const [confirmSaving, setConfirmSaving] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [drivesRes, statsRes] = await Promise.all([
                api.get("/staff/donation-drives"),
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

    useEffect(() => { fetchAll(); }, []);

    // ── Client-side filter + search ───────────────────────────────────────────
    const visible = drives.filter((d) => {
        const matchFilter = filter === "all" ? true : d.status === filter;
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

        const suffix = drive.type === "Food" && drive.food_type
            ? ` for ${drive.food_type}`
            : "";

        const existingNum = drive.goal
            ? drive.goal.split(" for ")[0]
            : "";

        setForm({
            drive_title:    drive.drive_title    || "",
            type:           drive.type           || "Food",
            goal:           existingNum + suffix,
            start_date:     drive.start_date     || "",
            end_date:       drive.end_date       || "",
            address:        drive.address        || "",
            contact_person: drive.contact_person || "",
            email:          drive.email          || "",
            status:         drive.status         || "OnGoing",
        });
        setModalError("");
        setShowModal(true);
    };

    const handleGoalChange = (raw) => {
        const suffix = editTarget?.type === "Food" && editTarget?.food_type
            ? ` for ${editTarget.food_type}`
            : "";

        if (!suffix) {
            setForm((f) => ({ ...f, goal: raw }));
            return;
        }

        const numPart = raw.includes(suffix)
            ? raw.substring(0, raw.indexOf(suffix))
            : raw.replace(suffix, "");

        setForm((f) => ({ ...f, goal: numPart + suffix }));
    };

    // When food_type changes, re-attach new suffix to existing number portion
    const handleFoodTypeChange = (newFoodType) => {
        const currentNum = form.goal.split(" for ")[0] || "";
        const newSuffix  = newFoodType ? ` for ${newFoodType}` : "";
        setForm((f) => ({ ...f, food_type: newFoodType, goal: currentNum + newSuffix }));
    };

    // When type switches away from Food, clear the suffix
    const handleTypeChange = (newType) => {
        if (newType !== "Food") {
            const currentNum = form.goal.split(" for ")[0] || "";
            setForm((f) => ({ ...f, type: newType, food_type: "", goal: currentNum }));
        } else {
            setForm((f) => ({ ...f, type: newType }));
        }
    };

    // ── Save ──────────────────────────────────────────────────────────────────
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
            fetchAll();
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
            fetchAll();
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    // ── Status change ─────────────────────────────────────────────────────────
    const requestStatusChange = (id, oldStatus, newStatus) => {
        if (newStatus === oldStatus) return;
        setConfirmStatus({ id, oldStatus, newStatus });
    };

    const confirmStatusChange = async () => {
        if (!confirmStatus) return;
        setConfirmSaving(true);
        try {
            await api.put(`/staff/donation-drives/${confirmStatus.id}`, { status: confirmStatus.newStatus });
            setDrives(prev => prev.map(d =>
                d.id === confirmStatus.id ? { ...d, status: confirmStatus.newStatus } : d
            ));
            const statsRes = await api.get("/staff/donation-drives/stats");
            setStats(statsRes.data);
            setConfirmStatus(null);
        } catch (err) {
            console.error("Status change error:", err);
        } finally {
            setConfirmSaving(false);
        }
    };

    const cancelStatusChange = () => setConfirmStatus(null);

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
                        {["all", "OnGoing", "Cancelled", "Done"].map((f) => (
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
                                <th>EMAIL</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="dd-drive-empty">Loading…</td></tr>
                            ) : visible.length === 0 ? (
                                <tr><td colSpan={9} className="dd-drive-empty">No drives found.</td></tr>
                            ) : (
                                visible.map((d) => {
                                    const statusCfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.OnGoing;
                                    const typeCfg   = TYPE_CONFIG[d.type]     ?? TYPE_CONFIG.Food;

                                    // ── Goal progress: current_amount comes from API (donations collected)
                                    // d.current_amount is the sum of donations collected so far
                                    const goalNum     = parseGoalNumber(d.goal);
                                    const currentAmt  = d.current_amount ?? 0;
                                    const progressPct = goalNum > 0
                                        ? Math.min(100, Math.round((currentAmt / goalNum) * 100))
                                        : 0;

                                    return (
                                        <tr key={d.id}>
                                            {/* STATUS — inline dropdown */}
                                            <td>
                                                <select
                                                    className="dd-drive-status-select"
                                                    value={d.status}
                                                    style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
                                                    onChange={(e) => requestStatusChange(d.id, d.status, e.target.value)}
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

                                            {/* GOAL with progress */}
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                                                    <span style={{ fontSize: 13 }}>{d.goal}</span>
                                                    {goalNum > 0 && (
                                                        <>
                                                            {/* Progress bar */}
                                                            <div style={{ height: 6, borderRadius: 99, background: "#e0e0e0", overflow: "hidden" }}>
                                                                <div style={{
                                                                    height: "100%",
                                                                    width: `${progressPct}%`,
                                                                    background: progressPct >= 100 ? "#2e7d32" : "#f4b942",
                                                                    borderRadius: 99,
                                                                    transition: "width 0.3s",
                                                                }} />
                                                            </div>
                                                            {/* current / goal label */}
                                                            <span style={{ fontSize: 11, color: "#888" }}>
                                                                {currentAmt.toLocaleString()} / {goalNum.toLocaleString()}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <span className="dd-drive-date-badge">
                                                    {d.start_date} — {d.end_date}
                                                </span>
                                            </td>

                                            <td>{d.address}</td>
                                            <td>{d.contact_person}</td>
                                            {/* NUMBER column removed */}
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

            {/* STATUS CONFIRMATION MODAL */}
            {confirmStatus && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "32px 36px", width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center" }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 48, color: "#f4b942", marginBottom: 12, display: "block" }}>
                            swap_horiz
                        </span>
                        <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>Change Status?</h2>
                        <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
                            Are you sure you want to change the status from{" "}
                            <strong style={{ color: STATUS_CONFIG[confirmStatus.oldStatus]?.color || "#333" }}>
                                {confirmStatus.oldStatus}
                            </strong>{" "}
                            to{" "}
                            <strong style={{ color: STATUS_CONFIG[confirmStatus.newStatus]?.color || "#333" }}>
                                {confirmStatus.newStatus}
                            </strong>
                            ?
                        </p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={cancelStatusChange}
                                disabled={confirmSaving}
                                style={{ flex: 1, padding: "10px", borderRadius: 999, background: "#fff", color: "#333", border: "1.5px solid #ccc", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                disabled={confirmSaving}
                                style={{ flex: 2, padding: "10px", borderRadius: 999, background: "#2e7d32", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: confirmSaving ? 0.7 : 1 }}
                            >
                                {confirmSaving ? "Saving…" : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                        <h2 style={{ marginBottom: 20 }}>{editTarget ? "Edit Donation Drive" : "Add New Donation Drive"}</h2>

                        <label style={labelStyle}>Drive Title *</label>
                        <input
                            value={form.drive_title}
                            onChange={(e) => setForm({ ...form, drive_title: e.target.value })}
                            placeholder="Drive Title"
                            style={inputStyle}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Type *</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="Food">Food</option>
                                    <option value="Financial">Financial</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    style={inputStyle}
                                >
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Food Type field — only shown when type is Food */}
                        {form.type === "Food" && (
                            <>
                                <label style={labelStyle}>Food Type</label>
                                <input
                                    value={form.food_type}
                                    onChange={(e) => handleFoodTypeChange(e.target.value)}
                                    placeholder="e.g. Dry Goods, Canned Goods"
                                    style={inputStyle}
                                />
                            </>
                        )}

                        <label style={labelStyle}>Goal *</label>
                        <input
                            value={form.goal}
                            onChange={(e) => handleGoalChange(e.target.value)}
                            placeholder={
                                editTarget?.type === "Food"
                                    ? `e.g. 300 for ${editTarget?.food_type || "Food Type"}`
                                    : "e.g. ₱100,000"
                            }
                            style={inputStyle}
                        />
                        {/* Read-only preview of the locked suffix */}
                        {form.type === "Food" && form.food_type && (
                            <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0 2px" }}>
                                Suffix <strong>for {form.food_type}</strong> is auto-locked to the goal.
                            </p>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Start Date *</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>End Date *</label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <label style={labelStyle}>Address</label>
                        <input
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="Address"
                            style={inputStyle}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Contact Person</label>
                                <input
                                    value={form.contact_person}
                                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                    placeholder="Contact Person"
                                    style={inputStyle}
                                />
                            </div>
                            {/* Contact Number field removed */}
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@example.com"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {modalError && <p style={{ color: "red", fontSize: 13, marginTop: 8 }}>⚠️ {modalError}</p>}

                        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: "10px", borderRadius: 999, background: "#fff", color: "#333", border: "1px solid #ccc", fontWeight: 600, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{ flex: 2, padding: "10px", borderRadius: 999, background: "#2e7d32", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                            >
                                {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Drive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
