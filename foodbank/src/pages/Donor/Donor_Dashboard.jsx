import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

// ── BADGE DEFINITIONS ────────────────────────────────────────────────────────
const FINANCIAL_BADGES = [
  { key: "kind_hearted",         label: "Kind Hearted",         threshold: 5000,    icon: "/images/badge_kind_hearted.png" },
  { key: "helping_hand",         label: "Helping Hand",         threshold: 10000,   icon: "/images/badge_helping_hand.png" },
  { key: "silver_supporter",     label: "Silver Supporter",     threshold: 25000,   icon: "/images/badge_silver_supporter.png" },
  { key: "golden_givers",        label: "Golden Givers",        threshold: 50000,   icon: "/images/badge_golden_givers.png" },
  { key: "champion_of_change",   label: "Champion of Change",   threshold: 100000,  icon: "/images/badge_champion_of_change.png" },
  { key: "philanthropy_partner", label: "Philanthropy Partner", threshold: 250000,  icon: "/images/badge_philanthropy_partner.png" },
  { key: "visionary_patron",     label: "Visionary Patron",     threshold: 500000,  icon: "/images/badge_visionary_patron.png" },
  { key: "legacy_builder",       label: "Legacy Builder",       threshold: 1000000, icon: "/images/badge_legacy_builder.png" },
];

const COUNT_BADGES = [
  { key: "pantry_pal",          label: "Pantry Pal",          threshold: 5,  icon: "/images/badge_pantry_pal.png" },
  { key: "community_nourisher", label: "Community Nourisher", threshold: 10, icon: "/images/badge_community_nourisher.png" },
  { key: "food_angel",          label: "Food Angel",          threshold: 20, icon: "/images/badge_food_angel.png" },
];

const formatPeso = (v) => `₱ ${Number(v).toLocaleString()}`;

// ── Get the current scale range based on total donations ─────────────────────
// Returns { min, max, label } for the current bracket the donor is in
const getCurrentRange = (total) => {
  // All thresholds as bracket boundaries: 0, 5000, 10000, ... 1000000
  const boundaries = [0, ...FINANCIAL_BADGES.map(b => b.threshold)];

  // If donor has reached the max, stay at the last bracket
  if (total >= boundaries[boundaries.length - 1]) {
    const min = boundaries[boundaries.length - 2];
    const max = boundaries[boundaries.length - 1];
    return { min, max };
  }

  // Find the bracket the donor is currently in
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (total >= boundaries[i] && total < boundaries[i + 1]) {
      return { min: boundaries[i], max: boundaries[i + 1] };
    }
  }

  // Fallback
  return { min: 0, max: 5000 };
};

export default function Donor_Dashboard() {
  const navigate = useNavigate();

  const [donor, setDonor]                   = useState({ name: "Donor Name", badges: [] });
  const [totalDonations, setTotalDonations] = useState(0);
  const [donationCount, setDonationCount]   = useState(0);
  const [notifications, setNotifications]   = useState([]);
  const [loading, setLoading]               = useState(true);

  const [filterType, setFilterType]       = useState("All");
  const [filterRange, setFilterRange]     = useState("all_time");
  const [customFrom, setCustomFrom]       = useState("");
  const [customTo, setCustomTo]           = useState("");
  const [donations, setDonations]         = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [newBadge, setNewBadge] = useState(null);
  const prevTotalRef = useRef(0);
  const prevCountRef = useRef(0);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, statsRes, notifsRes, donationsRes] = await Promise.all([
          api.get("/donor/profile"),
          api.get("/donor/stats"),
          api.get("/donor/notifications"),
          api.get("/donor/donations"),
        ]);
        setDonor(profileRes.data);
        setTotalDonations(statsRes.data.total_financial);
        setDonationCount(statsRes.data.total_count);
        setNotifications(notifsRes.data);
        setDonations(donationsRes.data);
        prevTotalRef.current = statsRes.data.total_financial;
        prevCountRef.current = statsRes.data.total_count;
      } catch (err) {
        console.error("Donor dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Badge pop-up trigger ───────────────────────────────────────────────────
  const checkNewBadges = (newTotal, newCount) => {
    for (const badge of FINANCIAL_BADGES) {
      if (prevTotalRef.current < badge.threshold && newTotal >= badge.threshold) {
        setNewBadge(badge);
        setTimeout(() => setNewBadge(null), 5000);
        break;
      }
    }
    for (const badge of COUNT_BADGES) {
      if (prevCountRef.current < badge.threshold && newCount >= badge.threshold) {
        setNewBadge(badge);
        setTimeout(() => setNewBadge(null), 5000);
        break;
      }
    }
    prevTotalRef.current = newTotal;
    prevCountRef.current = newCount;
  };

  // ── Apply report filters ───────────────────────────────────────────────────
  const handleApplyFilters = async () => {
    setReportLoading(true);
    try {
      const params = {
        type: filterType,
        range: filterRange,
        ...(filterRange === "custom" && { from: customFrom, to: customTo }),
      };
      const res = await api.get("/donor/donations", { params });
      setDonations(res.data);
    } catch (err) {
      console.error("Filter error:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const params = {
        type: filterType,
        range: filterRange,
        ...(filterRange === "custom" && { from: customFrom, to: customTo }),
      };
      const res = await api.get("/donor/donations/export-pdf", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "donation_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExportLoading(false);
    }
  };

  const notifIconColor = (type) => type === "financial" ? "#f4b942" : "#2e7d32";
  const statusColor    = (s)    => s === "Completed" ? "#2e7d32" : s === "Pending" ? "#f4b942" : "#c96a2e";

  const earnedFinancial = FINANCIAL_BADGES.filter(b => totalDonations >= b.threshold);
  const earnedCount     = COUNT_BADGES.filter(b => donationCount >= b.threshold);
  const earnedBadges    = [...earnedFinancial, ...earnedCount];

  // ── Compute current range & fill % ────────────────────────────────────────
  const { min, max } = getCurrentRange(totalDonations);
  const fillPct = Math.min(((totalDonations - min) / (max - min)) * 100, 100);

  // Find the badge for the next milestone (max of current range)
  const nextBadge = FINANCIAL_BADGES.find(b => b.threshold === max);

  return (
    <div className="dd-wrapper">

      {/* ── BADGE POP-UP (5 seconds) ── */}
      {newBadge && (
        <div className="dd-badge-popup">
          <div className="dd-badge-popup-inner">
            <img src={newBadge.icon} alt={newBadge.label} className="dd-badge-popup-img" />
            <p className="dd-badge-popup-earned">🎉 New Badge Earned!</p>
            <p className="dd-badge-popup-name">{newBadge.label}</p>
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <NavBar_Donor />

      <div className="sd-layout">

        {/* ════ MAIN CONTENT ════ */}
        <main className="sd-main">

          {/* WELCOME HEADER */}
          <div className="dd-header">
            <p className="dd-welcome">Welcome back,</p>
            <div className="dd-name-row">
              <h1 className="dd-name">{loading ? "—" : donor.name}</h1>
              <div className="dd-name-badges">
                {earnedBadges.map((badge) => (
                  <img
                    key={badge.key}
                    src={badge.icon}
                    alt={badge.label}
                    className="dd-name-badge-img"
                    title={badge.label}
                  />
                ))}
              </div>
            </div>
            <p className="dd-subtitle">
              Here's the <strong>donor dashboard</strong> activity overview
            </p>
          </div>

          {/* DONATE NOW */}
          <button className="dd-donate-btn" onClick={() => navigate("/donate")}>
            <span className="material-symbols-rounded dd-donate-icon">volunteer_activism</span>
            DONATE NOW
          </button>

          {/* ── TOTAL DONATIONS SCALE ── */}
          <div className="dd-scale-card">
            <div className="dd-scale-header">
              <span className="material-symbols-rounded dd-scale-icon">payments</span>
              <span className="dd-scale-title">Total Donations Made</span>
            </div>
            <p className="dd-scale-amount">{loading ? "—" : formatPeso(totalDonations)}</p>

            {/* PROGRESS BAR — fills from min to max of current bracket */}
            <div className="dd-scale-bar-track">
              <div
                className="dd-scale-bar-fill"
                style={{ width: `${fillPct}%` }}
              />
            </div>

            {/* START / END LABELS — only two labels, current min and next milestone */}
            <div className="dd-scale-range-labels">
              <span className="dd-scale-range-min">{formatPeso(min)}</span>
              <span className="dd-scale-range-max">
                {formatPeso(max)}
                {nextBadge && (
                  <span className="dd-scale-range-badge-hint"> · {nextBadge.label}</span>
                )}
              </span>
            </div>
          </div>

          <hr className="dd-divider" />

          {/* REPORTS & ANALYTICS */}
          <h2 className="dd-section-heading">Reports &amp; Analytics</h2>

          {/* FILTER CARD */}
          <div className="dd-filter-card">
            <div className="dd-filter-header">
              <span className="material-symbols-rounded dd-filter-icon">filter_alt</span>
              <span className="dd-filter-title">Reports Filters</span>
              <button
                className="dd-filter-btn"
                onClick={handleApplyFilters}
                disabled={reportLoading}
              >
                {reportLoading ? "Loading…" : "Apply Filters"}
              </button>
            </div>

            <div className="dd-filter-row">
              <div className="dd-filter-group">
                <label className="dd-filter-label">Type</label>
                <select
                  className="dd-filter-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Food Donation">Food Donation</option>
                  <option value="Financial Donation">Financial Donation</option>
                  <option value="Service Donation">Service Donation</option>
                </select>
              </div>

              <div className="dd-filter-group">
                <label className="dd-filter-label">Date Range</label>
                <select
                  className="dd-filter-select"
                  value={filterRange}
                  onChange={(e) => setFilterRange(e.target.value)}
                >
                  <option value="all_time">All Time</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="this_year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filterRange === "custom" && (
                <>
                  <div className="dd-filter-group">
                    <label className="dd-filter-label">From</label>
                    <input
                      type="date"
                      className="dd-filter-select"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div className="dd-filter-group">
                    <label className="dd-filter-label">To</label>
                    <input
                      type="date"
                      className="dd-filter-select"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DONATIONS SUMMARY TABLE */}
          <div className="dd-table-header-row">
            <span className="material-symbols-rounded dd-table-icon">description</span>
            <h3 className="dd-table-title">Donations Summary</h3>
          </div>

          <div className="dd-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>AMOUNT/ITEMS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {reportLoading ? (
                  <tr><td colSpan={4} className="dd-table-loading">Loading…</td></tr>
                ) : donations.length === 0 ? (
                  <tr><td colSpan={4} className="dd-table-loading">No donations found.</td></tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id}>
                      <td>{d.date}</td>
                      <td>{d.type}</td>
                      <td>{d.amount_items}</td>
                      <td style={{ color: statusColor(d.status), fontWeight: 700 }}>
                        ✓ {d.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* EXPORT PDF */}
          <div className="dd-export-row">
            <button
              className="dd-export-btn"
              onClick={handleExportPDF}
              disabled={exportLoading}
            >
              <span className="material-symbols-rounded">download</span>
              {exportLoading ? "Exporting…" : "Export Full Report (PDF)"}
            </button>
          </div>

        </main>

        {/* ════ SIDEBAR ════ */}
        <Sidebar apiEndpoint="/donor/notifications" />

      </div>
    </div>
  );
}
