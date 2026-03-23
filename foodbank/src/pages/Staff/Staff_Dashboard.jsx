import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

// ── Stat card data (icons are local PNGs — swap src as needed) ──────────────
const STAT_CARDS = [
  {
    key: "total_donations",
    label: "Total Donations Made",
    icon: "../images/Staff_Dash.DonMade.png",
    prefix: "₱",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key: "total_drives",
    label: "Total Donation Drives",
    icon: "../images/Staff_Dash.DonDrives.png",
    prefix: "",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key: "pending_requests",
    label: "Pending Request",
    icon: "../images/Staff_Dash.PendingReq.png",
    prefix: "",
    format: (v) => v,
  },
  {
    key: "approved_requests",
    label: "Approved Request",
    icon: "../images/Staff_Dash.ApprovedReq.png",
    prefix: "",
    format: (v) => v,
  },
];

export default function Staff_Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total_donations: 0,
    total_drives: 0,
    pending_requests: 0,
    approved_requests: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [staffName, setStaffName] = useState("Staff Name");
  const [loading, setLoading] = useState(true);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Adjust endpoints to match your Laravel routes
        const [statsRes, notifsRes, profileRes] = await Promise.all([
          api.get("/staff/dashboard/stats"),
          api.get("/staff/notifications"),
          api.get("/staff/profile"),
        ]);
        setStats(statsRes.data);
        setNotifications(notifsRes.data);
        setStaffName(profileRes.data.name);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (_) {}
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // ── Notification icon color helper ────────────────────────────────────────
  const notifIconColor = (type) => {
    if (type === "financial") return "#f4b942";
    return "#2e7d32";
  };

  return (
    <div className="sd-wrapper">
      {/* ── NAVBAR ── */}
      <NavBar_Staff />

      {/* ── MAIN LAYOUT ── */}
      <div className="sd-layout">

        {/* ════ LEFT / MAIN CONTENT ════ */}
        <main className="sd-main">
          <h1 className="sd-heading">Staff Dashboard</h1>

          {/* ── STAT CARDS ── */}
          <div className="sd-cards">
            {STAT_CARDS.map((card) => (
              <div className="sd-card" key={card.key}>
                <img
                  src={card.icon}
                  alt={card.label}
                  className="sd-card-icon"
                />
                <p className="sd-card-label">{card.label}</p>
                <p className="sd-card-value">
                  {loading
                    ? "—"
                    : `${card.prefix} ${card.format(stats[card.key])}`}
                </p>
              </div>
            ))}
          </div>
        </main>

        {/* ════ RIGHT / SIDEBAR ════ */}
        <Sidebar apiEndpoint="/staff/notifications" />
      </div>
    </div>
  );
}
