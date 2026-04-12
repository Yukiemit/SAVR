import { useState, useEffect } from "react";
import NavBar_Beneficiary from "../../components/NavBar_Beneficiary";
import api from "../../services/api";


const URGENCY_STYLE = {
  low:      { bg: "#2e7d32", color: "white" },
  medium:   { bg: "#c96a2e", color: "white" },
  high:     { bg: "#e53935", color: "white" },
};

// backend status map: Pending → pending, Allocated → accepted, Rejected → rejected
const STATUS_GROUPS = ["pending", "accepted", "rejected"];

const STATUS_LABELS = {
  pending:  "Pending",
  accepted: "Allocated / Accepted",
  rejected: "Rejected / Cancelled",
};

const FILTER_TABS = ["All", "Pending", "Accepted", "Rejected"];

export default function Beneficiary_TrackRequest() {
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterTab,     setFilterTab]     = useState("All");
  const [expandedGroups, setExpandedGroups] = useState({ pending: true });
  const [cancelling,    setCancelling]    = useState(null);  // id being cancelled

  // ── Fetch requests ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await api.get("/beneficiary/requests");
        // Backend returns: status as lowercase "pending" | "allocated" | "rejected"
        // Map "allocated" → "accepted" for display
        const mapped = res.data.map((r) => ({
          ...r,
          status: r.status === "allocated" ? "accepted" : r.status,
        }));
        setRequests(mapped);
      } catch (_) {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // ── Cancel request ────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    setCancelling(id);
    try {
      await api.delete(`/beneficiary/requests/${id}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (_) {
      alert("Failed to cancel. Please try again.");
    } finally {
      setCancelling(null);
    }
  };

  // ── Toggle group ──────────────────────────────────────────────────────────
  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredRequests = filterTab === "All"
    ? requests
    : requests.filter((r) => r.status === filterTab.toLowerCase().replace("accepted", "accepted"));

  const countByStatus = (status) =>
    requests.filter((r) => r.status === status).length;

  const groupedByStatus = (status) =>
    filteredRequests.filter((r) => r.status === status);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  return (
    <div className="ben-wrapper">
      <NavBar_Beneficiary />

      <main className="ben-track-main">

        {/* ── PAGE HEADING ── */}
        <div className="ben-req-heading">
          <span
            className="material-symbols-rounded ben-req-heading-icon"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
          >
            fact_check
          </span>
          <h1 className="ben-req-title">Track Request</h1>
        </div>
        <hr className="ben-req-divider" />

        {/* ── FILTER TABS ── */}
        <div className="ben-track-filter-wrap">
          <div className="ben-track-filters">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`ben-track-filter-btn ${filterTab === tab ? "ben-track-filter-active" : ""}`}
                onClick={() => setFilterTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── GROUPS ── */}
        {loading ? (
          <p className="ben-track-empty">Loading…</p>
        ) : (
          STATUS_GROUPS.map((status) => {
            const items    = groupedByStatus(status);
            const expanded = !!expandedGroups[status];
            const count    = countByStatus(status);

            // hide group when filtered to a different status
            if (filterTab !== "All" && filterTab.toLowerCase() !== status) return null;

            return (
              <div key={status} className="ben-track-group">

                {/* Group header */}
                <div className="ben-track-group-header">
                  <span className="ben-track-group-title">
                    {STATUS_LABELS[status]}
                    <span className="ben-track-group-count"> | {count}</span>
                  </span>
                  <button
                    className="ben-track-toggle-btn"
                    onClick={() => toggleGroup(status)}
                    aria-label={expanded ? "Collapse" : "Expand"}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: "white" }}>
                      {expanded ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                </div>

                {/* Group items */}
                {expanded && (
                  <div className="ben-track-group-body">
                    {items.length === 0 ? (
                      <p className="ben-track-empty-group">No {status} requests.</p>
                    ) : (
                      items.map((req) => {
                        const urg = URGENCY_STYLE[req.urgency] || URGENCY_STYLE.low;
                        return (
                          <div key={req.id} className="ben-track-item">

                            {/* Urgency badge */}
                            <div
                              className="ben-track-urgency"
                              style={{ background: urg.bg, color: urg.color }}
                            >
                              {req.urgency?.toUpperCase()}
                            </div>

                            {/* Request info */}
                            <div className="ben-track-info">
                              <div className="ben-track-info-top">
                                <span className="ben-track-name">{req.request_name}</span>
                                <span className="ben-track-sep">|</span>
                                <span className="ben-track-type">
                                  {req.food_type || (req.type === "financial" ? "Financial Aid" : req.type)}
                                </span>
                              </div>
                              <div className="ben-track-info-bottom">
                                <span>{req.population?.toLocaleString()} Beneficiaries</span>
                                <span>{req.age_range_min}–{req.age_range_max} Years Old</span>
                                <span>{formatDate(req.request_date)}</span>
                                <span>{req.city} - {req.zip_code}</span>
                              </div>
                            </div>

                            {/* Cancel button — only for pending */}
                            {req.status === "pending" && (
                              <button
                                className="ben-track-cancel-btn"
                                onClick={() => handleCancel(req.id)}
                                disabled={cancelling === req.id}
                              >
                                {cancelling === req.id ? "…" : "Cancel"}
                              </button>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

      </main>
    </div>
  );
}
