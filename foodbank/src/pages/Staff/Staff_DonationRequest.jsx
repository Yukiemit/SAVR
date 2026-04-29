import { useState, useEffect, useMemo } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL FOOD TYPES
// Keep in sync with the backend/inventory food_type enum.
// ─────────────────────────────────────────────────────────────────────────────
const FOOD_TYPES = [
    "Meat",
    "Protein Alternatives",
    "Fruits",
    "Vegetables",
    "Grains & Cereals",
    "Dairy",
    "Fats & Oils",
    "Sugars & Sweets",
    "Canned Goods",
    "Dry Goods",
];

// Inventory is fetched from the real API inside FoodAllocationPanel

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if expiration_date is tomorrow (next calendar day). */
function isExpiringSoon(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const exp = new Date(dateStr);
    exp.setHours(0, 0, 0, 0);
    return exp.getTime() === tomorrow.getTime();
}

/**
 * "Good For" filter — keeps items whose expiration_date falls within
 * the window starting from today:
 *   "day"   → expires within 1 day  (today or tomorrow)
 *   "week"  → expires within 7 days
 *   "month" → expires within 30 days
 *   ""      → no filter, show all
 */
function isGoodFor(dateStr, period) {
    if (!period || !dateStr) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return false;
    if (period === "day")   return diffDays <= 1;
    if (period === "week")  return diffDays <= 7;
    if (period === "month") return diffDays <= 30;
    return true;
}

/** GOOD_FOR_OPTIONS — labels for the dropdown */
const GOOD_FOR_OPTIONS = [
    { value: "",        label: "Good For…"  },
    { value: "day",     label: "A Whole-Day" },
    { value: "week",    label: "A Week"      },
    { value: "month",   label: "A Month"     },
];

// ─────────────────────────────────────────────────────────────────────────────
// FOOD ALLOCATION PANEL (right-side of the modal for food requests)
// ─────────────────────────────────────────────────────────────────────────────
// Maps beneficiary food_type values → one or more inventory category names.
// "Any Meals" / null → show everything.
const FOOD_TYPE_MAP = {
    "Fresh Produce":   ["Fruits", "Vegetables"],
    "Dairy Products":  ["Dairy"],
    "Meats & Fish":    ["Meat"],
    "Any Meals":       null,   // null = match all
};

function resolveInventoryTypes(primaryFoodType) {
    if (!primaryFoodType) return null;
    if (primaryFoodType in FOOD_TYPE_MAP) return FOOD_TYPE_MAP[primaryFoodType];
    return [primaryFoodType]; // exact match (e.g. "Canned Goods")
}

function FoodAllocationPanel({ selected, allocations, setAllocations }) {
    // "selected" is the donation request; food_type is the primary filter
    const primaryFoodType = selected?.food_type || "";         // e.g. "Fresh Produce"
    const resolvedTypes   = resolveInventoryTypes(primaryFoodType); // e.g. ["Fruits","Vegetables"]

    const [viewAll,      setViewAll]      = useState(false);   // toggle "View Other Food Types"
    const [search,       setSearch]       = useState("");
    const [goodFor,      setGoodFor]      = useState("");
    const [typeFilter,   setTypeFilter]   = useState("");

    // ── Real inventory from API (only items with stock > 0) ──
    const [inventory, setInventory] = useState([]);
    useEffect(() => {
        api.get("/staff/inventory/food")
            .then((r) => setInventory(r.data.filter((it) => it.stock > 0)))
            .catch(console.error);
    }, []);

    // Use the canonical food type list (not derived from inventory)
    const allFoodTypes = FOOD_TYPES;

    // Filter inventory rows
    const visible = useMemo(() => {
        return inventory.filter((item) => {
            let matchType;
            if (viewAll) {
                // "View Other Food Types" mode — respect the type chip filter
                matchType = typeFilter ? item.food_type === typeFilter : true;
            } else {
                // Default mode — show items matching the resolved inventory categories
                matchType = resolvedTypes === null
                    ? true
                    : resolvedTypes.includes(item.food_type);
            }
            const matchSearch  = !search || item.food_name.toLowerCase().includes(search.toLowerCase());
            const matchGoodFor = isGoodFor(item.expiration_date, goodFor);
            return matchType && matchSearch && matchGoodFor;
        });
    }, [inventory, viewAll, typeFilter, resolvedTypes, search, goodFor]);

    // qty helpers
    const getQty = (id) => allocations[id]?.qty ?? 0;

    const setQty = (item, val) => {
        const qty = Math.max(0, Math.min(item.stock, Number(val) || 0));
        setAllocations((prev) => ({
            ...prev,
            [item.id]: { ...item, qty },
        }));
    };

    const increment = (item) => setQty(item, getQty(item.id) + 1);
    const decrement = (item) => setQty(item, getQty(item.id) - 1);

    const title = viewAll
        ? "Food Allocation: All Items"
        : `Food Allocation: ${primaryFoodType || "Food"}`;

    return (
        <div className="fa-panel">
            {/* Panel header */}
            <div className="fa-panel-header">
                <span className="fa-panel-title">
                    <strong>Food Allocation:</strong>&nbsp;
                    <span className="fa-panel-food-type">
                        {viewAll ? "All Items" : (primaryFoodType || "Food")}
                    </span>
                </span>
                <button
                    className="fa-view-other-btn"
                    onClick={() => {
                        setViewAll((v) => !v);
                        setTypeFilter("");
                    }}
                >
                    {viewAll ? "← Back to " + primaryFoodType : "View Other Food Types"}
                </button>
            </div>

            {/* Toolbar */}
            <div className="fa-toolbar">
                {/* Good For dropdown */}
                <div className="fa-goodfor-wrap">
                    <span className="material-symbols-rounded fa-goodfor-icon">restaurant</span>
                    <select
                        className="fa-goodfor-select"
                        value={goodFor}
                        onChange={(e) => setGoodFor(e.target.value)}
                    >
                        {GOOD_FOR_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Search */}
                <div className="fa-search-wrap">
                    <input
                        className="fa-search"
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="material-symbols-rounded fa-search-icon">search</span>
                </div>
            </div>

            {/* Table */}
            <div className="fa-table-wrap">
                <table className="fa-table">
                    <thead>
                        <tr>
                            <th style={{ width: 120 }}># OF STOCK</th>
                            {viewAll && <th>FOOD TYPE</th>}
                            <th>FOOD NAME</th>
                            <th style={{ width: 110 }}>EXP. DATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={viewAll ? 4 : 3} className="fa-empty">
                                    No inventory items found.
                                </td>
                            </tr>
                        ) : (
                            visible.map((item) => {
                                const qty     = getQty(item.id);
                                const expSoon = isExpiringSoon(item.expiration_date);
                                return (
                                    <tr key={item.id} className={qty > 0 ? "fa-row-selected" : ""}>
                                        {/* Qty stepper */}
                                        <td>
                                            <div className="fa-stepper">
                                                <button
                                                    className="fa-stepper-btn"
                                                    onClick={() => decrement(item)}
                                                    disabled={qty <= 0}
                                                    aria-label="Decrease"
                                                >−</button>
                                                <input
                                                    className="fa-stepper-input"
                                                    type="number"
                                                    min={0}
                                                    max={item.stock}
                                                    value={qty}
                                                    onChange={(e) => setQty(item, e.target.value)}
                                                />
                                                <button
                                                    className="fa-stepper-btn"
                                                    onClick={() => increment(item)}
                                                    disabled={qty >= item.stock}
                                                    aria-label="Increase"
                                                >+</button>
                                                <span className="fa-stock-max">/ {item.stock.toLocaleString()}</span>
                                            </div>
                                        </td>

                                        {/* Food Type column — only when viewing all */}
                                        {viewAll && (
                                            <td>
                                                <span className="fa-type-label">{item.food_type}</span>
                                            </td>
                                        )}

                                        {/* Food Name */}
                                        <td className="fa-food-name">{item.food_name}</td>

                                        {/* Exp Date */}
                                        <td>
                                            <span className={`fa-exp-date ${expSoon ? "fa-exp-soon" : ""}`}>
                                                {item.expiration_date}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* "View All" type filter row — shown when viewAll is active */}
            {viewAll && (
                <div className="fa-type-filter-row">
                    <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Filter by Type:</span>
                    {allFoodTypes.map((t) => (
                        <button
                            key={t}
                            className={`fa-type-chip ${typeFilter === t ? "fa-type-chip-active" : ""}`}
                            onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            {/* Allocation summary */}
            {Object.values(allocations).some((a) => a.qty > 0) && (
                <div className="fa-summary">
                    <span className="material-symbols-rounded fa-summary-icon">inventory_2</span>
                    <span className="fa-summary-text">
                        {Object.values(allocations)
                            .filter((a) => a.qty > 0)
                            .map((a) => `${a.food_name} ×${a.qty}`)
                            .join(", ")}
                    </span>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Staff_DonationRequest() {

    const [requests,      setRequests]      = useState([]);
    const [stats,         setStats]         = useState({ pending: 0, allocated: 0 });
    const [filter,        setFilter]        = useState("all");
    const [search,        setSearch]        = useState("");
    const [loading,       setLoading]       = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [showModal,    setShowModal]    = useState(false);
    const [selected,     setSelected]     = useState(null);
    const [driveForm,    setDriveForm]    = useState({ drive_title: "", goal: "", start_date: "", end_date: "" });
    const [modalError,   setModalError]   = useState("");
    const [saving,       setSaving]       = useState(false);

    // Food allocations: { [inventoryItemId]: { ...item, qty: number } }
    const [allocations, setAllocations] = useState({});

    // Reject confirmation modal
    const [rejectTarget,  setRejectTarget]  = useState(null);
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

    const goalSuffix = req.type === "food"
        ? ` for ${req.food_type}`
        : "";

    setDriveForm({ drive_title: "", goal: goalSuffix, start_date: "", end_date: "" });
    setAllocations({});
    setModalError("");
    setShowModal(true);
};

    const handleAllocate = async () => {
        if (!driveForm.drive_title || !driveForm.goal || !driveForm.start_date || !driveForm.end_date) {
            setModalError("Please fill in all required fields.");
            return;
        }

        // For food requests, at least one item must have a quantity selected
        const food_allocations = selected?.type === "food"
            ? Object.values(allocations)
                .filter((a) => a.qty > 0)
                .map((a) => ({ inventory_id: a.id, qty: a.qty }))
            : [];

        if (selected?.type === "food" && food_allocations.length === 0) {
            setModalError("Please select at least one food item to allocate.");
            return;
        }

        setSaving(true);

        try {
            await api.post(`/staff/beneficiary-requests/${selected.id}/allocate`, {
                ...driveForm,
                food_allocations,
            });
            setShowModal(false);
            fetchAll();
        } catch (err) {
            setModalError(err.response?.data?.message || "Failed to allocate.");
        } finally {
            setSaving(false);
        }
    };

    const handleReject = (req) => setRejectTarget(req);

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

    const isFood = selected?.type === "food";

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
                                            <td><span className="dd-drive-title-text">{r.request_name || "—"}</span></td>
                                            <td>
                                                <span className="dd-drive-type-badge" style={{ color: type.color, background: type.bg }}>
                                                    {type.label}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13, color: "#555" }}>{details}</td>
                                            <td>{r.population?.toLocaleString() || "—"}</td>
                                            <td style={{ whiteSpace: "nowrap" }}>{r.age_min}–{r.age_max} yrs</td>
                                            <td>{r.city || "—"}</td>
                                            <td>
                                                {r.request_date
                                                    ? <span className="dd-drive-date-badge">{r.request_date}</span>
                                                    : "—"
                                                }
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: urgency.color, background: urgency.bg,
                                                    borderRadius: 20, padding: "4px 16px",
                                                    fontSize: 12, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap",
                                                }}>
                                                    {urgency.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: 13 }}>
                                                    <div style={{ fontWeight: 600 }}>{r.contact_name || "—"}</div>
                                                    <div style={{ color: "#888", fontSize: 12 }}>{r.email || ""}</div>
                                                </div>
                                            </td>
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

            {/* ── REJECT CONFIRMATION MODAL ─────────────────────────────────────── */}
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

            {/* ── ALLOCATE MODAL ────────────────────────────────────────────────── */}
            {showModal && selected && (
                <div className="adm-modal-overlay">
                    {/*
                      Wide modal: left side = drive form, right side = food allocation panel (food only)
                    */}
                    <div className={`adm-modal alloc-modal ${isFood ? "alloc-modal-wide" : ""}`}>

                        {/* Close button */}
                        <button className="adm-modal-close" onClick={() => setShowModal(false)}>
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        {/* ── Left column: drive form ── */}
                        <div className="alloc-form-col">
                            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>
                                Allocate to Donation Drive
                            </h2>
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
                                onChange={(e) => {
                                    const suffix = selected?.type === "food" ? ` for ${selected.food_type}` : "";
                                    const raw = e.target.value;
                                    // Prevent deleting the auto-filled suffix
                                    if (suffix && !raw.endsWith(suffix)) {
                                        const numPart = raw.replace(suffix, "").trim();
                                        setDriveForm({ ...driveForm, goal: numPart + suffix });
                                    } else {
                                        setDriveForm({ ...driveForm, goal: raw });
                                    }
                                }}
                                placeholder={selected?.type === "financial"
                                    ? `e.g. ₱${Number(selected?.amount || 0).toLocaleString()}`
                                    : `e.g. ${selected?.quantity} ${selected?.unit} of ${selected?.food_type}`}
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

                        {/* ── Right column: Food Allocation Panel (food requests only) ── */}
                        {isFood && (
                            <div className="alloc-fa-col">
                                <FoodAllocationPanel
                                    selected={selected}
                                    allocations={allocations}
                                    setAllocations={setAllocations}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
