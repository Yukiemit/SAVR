import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

// ── DUMMY DATA (remove once backend is connected) ─────────────────────────────
const DUMMY_REQUESTS = [
    {
        id: 1,
        name: "Mira K.",
        email: "mirak@gmail.com",
        contact: "09022323246",
        address: "313 B. Mabini St. Caloocan City",
        urgency: "urgent",
        pax: 5,
        reason: "Post-surgery recovery, need help with medication & physio. any amount lifts us.",
        status: "pending",
    },
    {
        id: 2,
        name: "Jose R.",
        email: "joser@gmail.com",
        contact: "09171234567",
        address: "22 Rizal Ave. Manila",
        urgency: "normal",
        pax: 3,
        reason: "Single parent of 3, recently lost job, need food assistance for the week.",
        status: "allocated",
    },
    {
        id: 3,
        name: "Ana T.",
        email: "anat@gmail.com",
        contact: "09281112233",
        address: "55 Burgos St. Quezon City",
        urgency: "urgent",
        pax: 8,
        reason: "Flood victims in our community, urgent need for relief goods and food packs.",
        status: "pending",
    },
    {
        id: 4,
        name: "Ben L.",
        email: "benl@gmail.com",
        contact: "09093334455",
        address: "10 Maharlika St. Pasig City",
        urgency: "normal",
        pax: 2,
        reason: "Elderly couple with no immediate family support, need weekly food supply.",
        status: "pending",
    },
    {
        id: 5,
        name: "Luz M.",
        email: "luzm@gmail.com",
        contact: "09156667788",
        address: "88 Del Monte Ave. Quezon City",
        urgency: "urgent",
        pax: 10,
        reason: "Community kitchen serving street children, running low on supplies.",
        status: "allocated",
    },
    {
        id: 6,
        name: "Rico P.",
        email: "ricop@gmail.com",
        contact: "09209998877",
        address: "4 Tandang Sora, Quezon City",
        urgency: "normal",
        pax: 4,
        reason: "Family displaced after fire, currently in evacuation center.",
        status: "pending",
    },
];

// ── URGENCY CONFIG ────────────────────────────────────────────────────────────
const URGENCY_LABEL = {
    urgent:   { label: "Urgent",   color: "#e74c3c", bg: "#fdecea" },
    high:     { label: "High",     color: "#e67e22", bg: "#fef3e2" },
    medium:   { label: "Medium",   color: "#f4b942", bg: "#fefae3" },
    normal:   { label: "Normal",   color: "#aaa",    bg: "#f0f0f0" },
    low:      { label: "Low",      color: "#aaa",    bg: "#f0f0f0" },
    critical: { label: "Critical", color: "#c0392b", bg: "#fdecea" },
};

const STATUS_LABEL = {
    pending:   { label: "Pending",   color: "#e67e22", bg: "#fef3e2" },
    allocated: { label: "Allocated", color: "#2e7d32", bg: "#e8f5e9" },
};

export default function Staff_DonationRequest() {

    // ── State ─────────────────────────────────────────────────────────────────
    const [requests, setRequests]           = useState([]);
    const [filter, setFilter]               = useState("all");
    const [search, setSearch]               = useState("");
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // ── Fetch requests ─────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                // ── BACKEND READY: uncomment below and remove setRequests(DUMMY_REQUESTS) ──
                // const res = await api.get("/staff/donation-requests");
                // setRequests(res.data);

                // ── DUMMY DATA (remove when backend is connected) ──
                setRequests(DUMMY_REQUESTS);
            } catch (err) {
                console.error("Fetch error:", err);
                setRequests(DUMMY_REQUESTS);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const pendingCount   = requests.filter(r => r.status === "pending").length;
    const allocatedCount = requests.filter(r => r.status === "allocated").length;

    const visible = requests.filter((r) => {
        const matchFilter =
        filter === "all"         ? true :
        filter === "urgent"      ? (r.urgency === "urgent" || r.urgency === "critical") :
        filter === "unallocated" ? r.status === "pending" :
        filter === "allocated"   ? r.status === "allocated" :
        true;

        const q = search.toLowerCase();
        const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);

        return matchFilter && matchSearch;
    });

    // ── ALLOCATE / UNALLOCATE  ───────────────────────────────────────────
    const handleAllocate = async (id) => {
        const current = requests.find(r => r.id === id);
        const newStatus = current.status === "allocated" ? "pending" : "allocated";
        setActionLoading(id);
        try {
            // ── BACKEND READY: uncomment below ──
            // await api.patch(`/staff/donation-requests/${id}/allocate`, { status: newStatus });
            setRequests(prev =>
                prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
            );
        } catch (err) {
            console.error("Allocate toggle error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // ── DECLINE ────────────────────────────────────────────
    const handleDecline = async (id) => {
        setActionLoading(id);
        try {
            // ── BACKEND READY: uncomment below ──
            // await api.patch(`/staff/donation-requests/${id}/decline`);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Decline error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // ── DONE — sends email to requester, removes from list ────────────────────
    const handleDone = async (id) => {
        setActionLoading(id);
        try {
            // ── BACKEND READY: uncomment below ──
            // await api.patch(`/staff/donation-requests/${id}/done`);
            // Backend should send email notification to r.email
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Done error:", err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="dr-wrapper">

            {/* ── NAVBAR ── */}
            <NavBar_Staff />

            <main className="dr-main">

                {/* ── PAGE HEADER ── */}
                <div className="dr-header">
                    <h1 className="dr-heading">Donation Request</h1>
                    {/* PENDING + ALLOCATED COUNTERS */}
                    <div className="dr-counters">
                        <div className="dr-counter dr-counter-pending">
                            <span className="material-symbols-rounded dr-counter-icon">schedule</span>
                            <span className="dr-counter-num">{pendingCount}</span>
                            <span className="dr-counter-label">Pending</span>
                        </div>
                        <div className="dr-counter dr-counter-allocated">
                            <span className="material-symbols-rounded dr-counter-icon">check_circle</span>
                            <span className="dr-counter-num">{allocatedCount}</span>
                            <span className="dr-counter-label">Allocated</span>
                        </div>
                    </div>
                </div>

                {/* ── FILTER + SEARCH BAR ── */}
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

                {/* ── REQUEST CARDS GRID ── */}
                {loading ? (
                    <p className="dr-empty">Loading requests…</p>
                ) : visible.length === 0 ? (
                    <p className="dr-empty">No requests found.</p>
                ) : (
                <div className="dr-grid">
                    {visible.map((r) => {
                    const urgency = URGENCY_LABEL[r.urgency] ?? URGENCY_LABEL.normal;
                    const status  = STATUS_LABEL[r.status]   ?? STATUS_LABEL.pending;
                    const busy    = actionLoading === r.id;

                    return (
                        <div className="dr-card" key={r.id}>

                            {/* CARD HEADER */}
                            <div className="dr-card-header">
                                <span className="dr-card-name">{r.name}</span>
                                <span
                                    className="dr-card-badge"
                                    style={{ color: urgency.color, background: urgency.bg }}
                                >
                                {urgency.label}
                                </span>
                            </div>
                            {/* CONTACT ROW */}
                            <div className="dr-card-contact">
                                <span>{r.email}</span>
                                <span>{r.contact}</span>
                            </div>
                            {/* ADDRESS */}
                            <p className="dr-card-address">{r.address}</p>
                            {/* REASON BOX */}
                            <div className="dr-card-reason">
                                <p>"{r.reason}"</p>
                            </div>
                            {/* STATUS TAG + PAX */}
                            <div className="dr-card-status-row">
                                <span
                                className="dr-card-status"
                                style={{ color: status.color, background: status.bg }}
                                >
                                {status.label}
                                </span>
                                <span className="dr-card-pax">{r.pax} pax</span>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="dr-card-actions">
                                <button
                                    className={`dr-btn ${r.status === "allocated" ? "dr-btn-unallocate" : "dr-btn-allocate"}`}
                                    onClick={() => handleAllocate(r.id)}
                                    disabled={busy}
                                >
                                    {r.status === "allocated" ? "Unallocate" : "Allocate"}
                                </button>
                                <button
                                    className="dr-btn dr-btn-decline"
                                    onClick={() => handleDecline(r.id)}
                                    disabled={busy}
                                >
                                    Decline
                                </button>
                                <button
                                    className="dr-btn dr-btn-done"
                                    onClick={() => handleDone(r.id)}
                                    disabled={busy}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
                )}
            </main>
        </div>
    );
}
