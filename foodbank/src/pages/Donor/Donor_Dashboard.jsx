import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import api from "../../services/api";

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

const DUMMY_STATS = { total_financial: 30000, total_food_count: 50, total_count: 7 };

const DUMMY_DONATIONS = [
  { id: 1, date: "Jan 15, 2025", type: "Financial", amount_items: "₱ 5,000",    status: "Completed" },
  { id: 2, date: "Jan 15, 2025", type: "Food",      amount_items: "10 kg Rice", status: "Completed" },
  { id: 3, date: "Jan 16, 2025", type: "Financial", amount_items: "₱ 10,000",   status: "Completed" },
  { id: 4, date: "Feb 03, 2025", type: "Food",      amount_items: "5 kg Corn",  status: "Pending"   },
  { id: 5, date: "Feb 20, 2025", type: "Service",   amount_items: "Transport",  status: "Completed" },
  { id: 6, date: "Mar 01, 2025", type: "Financial", amount_items: "₱ 15,000",   status: "Completed" },
  { id: 7, date: "Apr 01, 2025", type: "Food",      amount_items: "3 cans",     status: "Pending"   },
];

const formatPeso = (v) => `₱ ${Number(v).toLocaleString()}`;

const getCurrentRange = (total) => {
  const boundaries = [0, ...FINANCIAL_BADGES.map(b => b.threshold)];
  if (total >= boundaries[boundaries.length - 1])
    return { min: boundaries[boundaries.length - 2], max: boundaries[boundaries.length - 1] };
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (total >= boundaries[i] && total < boundaries[i + 1])
      return { min: boundaries[i], max: boundaries[i + 1] };
  }
  return { min: 0, max: 5000 };
};

const statusColor = (s) =>
  s === "Completed" ? "#2e7d32" : s === "Pending" ? "#f4b942" : "#c96a2e";

export default function Donor_Dashboard() {
  const navigate = useNavigate();

  const [donor,          setDonor]          = useState({ name: "—", badges: [] });
  const [totalFinancial, setTotalFinancial] = useState(0);
  const [totalFoodCount, setTotalFoodCount] = useState(0);
  const [donationCount,  setDonationCount]  = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [filterType,     setFilterType]     = useState("All");
  const [filterRange,    setFilterRange]    = useState("all_time");
  const [customFrom,     setCustomFrom]     = useState("");
  const [customTo,       setCustomTo]       = useState("");
  const [donations,      setDonations]      = useState([]);
  const [reportLoading,  setReportLoading]  = useState(false);
  const [exportLoading,  setExportLoading]  = useState(false);
  const [newBadge,       setNewBadge]       = useState(null);
  const prevFinancialRef                    = useRef(0);
  const prevCountRef                        = useRef(0);

  useEffect(() => {
    const init = async () => {
      // ✅ READ NAME FROM localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      setDonor({ name: user?.name || "—", badges: [] });

      try {
        const [statsRes, donationsRes] = await Promise.all([
          api.get("/donor/stats"),
          api.get("/donor/donations"),
        ]);
        setTotalFinancial(statsRes.data.total_financial  ?? DUMMY_STATS.total_financial);
        setTotalFoodCount(statsRes.data.total_food_count ?? DUMMY_STATS.total_food_count);
        setDonationCount(statsRes.data.total_count       ?? DUMMY_STATS.total_count);
        setDonations(donationsRes.data                   || DUMMY_DONATIONS);
        prevFinancialRef.current = statsRes.data.total_financial ?? DUMMY_STATS.total_financial;
        prevCountRef.current     = statsRes.data.total_count     ?? DUMMY_STATS.total_count;
      } catch {
        setTotalFinancial(DUMMY_STATS.total_financial);
        setTotalFoodCount(DUMMY_STATS.total_food_count);
        setDonationCount(DUMMY_STATS.total_count);
        setDonations(DUMMY_DONATIONS);
        prevFinancialRef.current = DUMMY_STATS.total_financial;
        prevCountRef.current     = DUMMY_STATS.total_count;
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleApplyFilters = async () => {
    setReportLoading(true);
    try {
      const params = { type: filterType, range: filterRange, ...(filterRange === "custom" && { from: customFrom, to: customTo }) };
      const res = await api.get("/donor/donations", { params });
      setDonations(res.data || DUMMY_DONATIONS);
    } catch { setDonations(DUMMY_DONATIONS); }
    finally { setReportLoading(false); }
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const params = { type: filterType, range: filterRange, ...(filterRange === "custom" && { from: customFrom, to: customTo }) };
      const res  = await api.get("/donor/donations/export-pdf", { params, responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", "donation_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error("Export error:", err); }
    finally { setExportLoading(false); }
  };

  const earnedFinancial = FINANCIAL_BADGES.filter(b => totalFinancial >= b.threshold);
  const earnedCount     = COUNT_BADGES.filter(b => donationCount >= b.threshold);
  const earnedBadges    = [...earnedFinancial, ...earnedCount];
  const { min, max }    = getCurrentRange(totalFinancial);
  const fillPct         = max > min ? Math.min(((totalFinancial - min) / (max - min)) * 100, 100) : 100;
  const remaining       = Math.max(max - totalFinancial, 0);
  const nextBadge       = FINANCIAL_BADGES.find(b => b.threshold === max);

  return (
    <div className="dd-wrapper">

      {newBadge && (
        <div className="dd-badge-popup">
          <div className="dd-badge-popup-inner">
            <img src={newBadge.icon} alt={newBadge.label} className="dd-badge-popup-img" />
            <p className="dd-badge-popup-earned">🎉 New Badge Earned!</p>
            <p className="dd-badge-popup-name">{newBadge.label}</p>
          </div>
        </div>
      )}

      <NavBar_Donor />

      <main className="sd-main">

        {/* WELCOME BANNER */}
        <div className="sd-banner" style={{ marginBottom: 28 }}>
          <img src="/images/background.png" alt="" className="sd-banner-bg" />
          <div className="sd-banner-overlay" />
          <div className="sd-banner-content" style={{ flex: 1 }}>
            <p className="sd-banner-greeting">Good day!</p>
            <h1 className="sd-banner-name">{loading ? "—" : donor.name}</h1>
            <p className="sd-banner-sub">Here's your donor dashboard — keep making an impact!</p>
          </div>
          <div style={{ position: "relative", zIndex: 2, marginRight: 40, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700, letterSpacing: 1, margin: "0 0 4px", textAlign: "right" }}>
              Achievement Badges
            </p>
            {earnedBadges.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontStyle: "italic" }}>No badges yet</p>
            ) : (
              earnedBadges.slice(0, 3).map(badge => (
                <div key={badge.key} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 30, padding: "8px 18px 8px 10px", minWidth: 200 }}>
                  <img src={badge.icon} alt={badge.label} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: "50%" }} />
                  <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{badge.label}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "flex", gap: 24, marginBottom: 28 }}>
          <div className="sd-glass-card" style={{ flex: 1 }}>
            <img src="/images/Donor_Financial.png" alt="Financial Donation" className="sd-glass-card-icon" />
            <div className="sd-glass-card-info">
              <p className="sd-glass-card-value">{loading ? "—" : `₱ ${Number(totalFinancial).toLocaleString()}`}</p>
              <p className="sd-glass-card-label">Total Financial<br />Donation</p>
            </div>
          </div>
          <div className="sd-glass-card" style={{ flex: 1 }}>
            <img src="/images/Donor_Food.png" alt="Food Donation" className="sd-glass-card-icon" />
            <div className="sd-glass-card-info">
              <p className="sd-glass-card-value">{loading ? "—" : totalFoodCount}</p>
              <p className="sd-glass-card-label">Total Food<br />Donation</p>
            </div>
          </div>
        </div>

        {/* PROGRESS + PERCENTAGE */}
        <div style={{ display: "flex", gap: 24, marginBottom: 28 }}>
          <div className="dd-scale-card" style={{ flex: 2 }}>
            <div className="dd-scale-header">
              <span className="material-symbols-rounded dd-scale-icon">payments</span>
              <span className="dd-scale-title">Total Donations Made</span>
            </div>
            <p className="dd-scale-amount">{loading ? "—" : formatPeso(totalFinancial)}</p>
            <div className="dd-scale-bar-track">
              <div className="dd-scale-bar-fill" style={{ width: `${fillPct}%` }} />
            </div>
            <div className="dd-scale-range-labels">
              <span className="dd-scale-range-min">{formatPeso(min)}</span>
              <span className="dd-scale-range-max">
                {formatPeso(max)}
                {nextBadge && <span className="dd-scale-range-badge-hint"> · {nextBadge.label}</span>}
              </span>
            </div>
          </div>
          <div className="dd-scale-card" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <p style={{ fontSize: 52, fontWeight: 900, color: "#c96a2e", margin: 0, lineHeight: 1 }}>
              {max > 0 ? `${Math.round(fillPct)}%` : "100%"}
            </p>
            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{formatPeso(remaining)} remaining</p>
          </div>
        </div>

        {/* DONATE NOW */}
        <button className="dd-donate-btn" onClick={() => navigate("/donor/donate")}>
          <span className="material-symbols-rounded dd-donate-icon">volunteer_activism</span>
          DONATE NOW
        </button>

        <hr className="dd-divider" />

        {/* RECENT ACTIVITY */}
        <div className="dd-table-header-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-rounded dd-table-icon" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>receipt_long</span>
            <h3 className="dd-table-title">Recent Donation Activity</h3>
          </div>
          <button onClick={() => navigate("/donor/reports")} style={{ background: "#c96a2e", color: "white", border: "none", borderRadius: 20, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            See All
          </button>
        </div>
        <div className="dd-table-wrap" style={{ marginBottom: 28 }}>
          <table className="dd-table">
            <thead><tr><th>DATE</th><th>TYPE</th><th>AMOUNT/ITEMS</th><th>STATUS</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="dd-table-loading">Loading…</td></tr>
              ) : donations.length === 0 ? (
                <tr><td colSpan={4} className="dd-table-loading">No donations found.</td></tr>
              ) : (
                donations.slice(0, 5).map((d) => (
                  <tr key={d.id}>
                    <td>{d.date}</td><td>{d.type}</td><td>{d.amount_items}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: statusColor(d.status) + "18", color: statusColor(d.status), fontWeight: 700, fontSize: 12, padding: "5px 14px", borderRadius: 20 }}>
                        ✓ {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <hr className="dd-divider" />

        {/* REPORTS & ANALYTICS */}
        <h2 className="dd-section-heading">Reports &amp; Analytics</h2>
        <div className="dd-filter-card">
          <div className="dd-filter-header">
            <span className="material-symbols-rounded dd-filter-icon">filter_alt</span>
            <span className="dd-filter-title">Reports Filters</span>
            <button className="dd-filter-btn" onClick={handleApplyFilters} disabled={reportLoading}>
              {reportLoading ? "Loading…" : "Apply Filters"}
            </button>
          </div>
          <div className="dd-filter-row">
            <div className="dd-filter-group">
              <label className="dd-filter-label">Type</label>
              <select className="dd-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">All</option>
                <option value="Food Donation">Food Donation</option>
                <option value="Financial Donation">Financial Donation</option>
                <option value="Service Donation">Service Donation</option>
              </select>
            </div>
            <div className="dd-filter-group">
              <label className="dd-filter-label">Date Range</label>
              <select className="dd-filter-select" value={filterRange} onChange={(e) => setFilterRange(e.target.value)}>
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
                  <input type="date" className="dd-filter-select" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div className="dd-filter-group">
                  <label className="dd-filter-label">To</label>
                  <input type="date" className="dd-filter-select" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="dd-table-header-row">
          <span className="material-symbols-rounded dd-table-icon">description</span>
          <h3 className="dd-table-title">Donations Summary</h3>
        </div>
        <div className="dd-table-wrap">
          <table className="dd-table">
            <thead><tr><th>DATE</th><th>TYPE</th><th>AMOUNT/ITEMS</th><th>STATUS</th></tr></thead>
            <tbody>
              {reportLoading ? (
                <tr><td colSpan={4} className="dd-table-loading">Loading…</td></tr>
              ) : donations.length === 0 ? (
                <tr><td colSpan={4} className="dd-table-loading">No donations found.</td></tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id}>
                    <td>{d.date}</td><td>{d.type}</td><td>{d.amount_items}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: statusColor(d.status) + "18", color: statusColor(d.status), fontWeight: 700, fontSize: 12, padding: "5px 14px", borderRadius: 20 }}>
                        ✓ {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dd-export-row">
          <button className="dd-export-btn" onClick={handleExportPDF} disabled={exportLoading}>
            <span className="material-symbols-rounded">download</span>
            {exportLoading ? "Exporting…" : "Export Full Report (PDF)"}
          </button>
        </div>

      </main>
    </div>
  );
}