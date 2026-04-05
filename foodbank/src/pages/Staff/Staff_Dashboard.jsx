import { useState, useEffect } from "react";
import NavBar_Staff from "../../components/NavBar_Staff";
import api from "../../services/api";

const STAT_CARDS = [
  {
    key: "total_donations",
    label: "TOTAL DONATIONS MADE",
    icon: "/images/Glass_Donor.png",
    prefix: "₱",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key: "total_drives",
    label: "TOTAL DONATION DRIVES",
    icon: "/images/Glass_FoodDonation.png",
    prefix: "",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key: "total_amount_donated",
    label: "TOTAL AMOUNT DONATED",
    icon: "/images/Glass_Financial.png",
    prefix: "₱",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key: "approved_requests",
    label: "TOTAL APPROVED REQUEST",
    icon: "/images/Glass_Request.png",
    prefix: "",
    format: (v) => Number(v).toLocaleString(),
  },
];

export default function Staff_Dashboard() {
  const [stats, setStats] = useState({
    total_donations:      0,
    total_drives:         0,
    total_amount_donated: 0,
    approved_requests:    0,
  });
  const [staffName, setStaffName] = useState("First Name, Last Name");
  const [staffDept, setStaffDept] = useState("Department");
  const [staffRole, setStaffRole] = useState("Role");
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, profileRes] = await Promise.all([
          api.get("/staff/dashboard/stats"),
          api.get("/staff/profile"),
        ]);
        setStats(statsRes.data);
        setStaffName(profileRes.data.name       ?? "First Name, Last Name");
        setStaffDept(profileRes.data.department ?? "Department");
        setStaffRole(profileRes.data.role       ?? "Role");
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="sd-wrapper">
      <NavBar_Staff />

      <main className="sd-main">

        {/* ── HERO BANNER ── */}
        <div className="sd-banner">
          {/* swap src for your own background photo */}
          <img
            src="/images/Background2.png"
            alt="banner background"
            className="sd-banner-bg"
          />
          <div className="sd-banner-overlay" />
          <div className="sd-banner-content">
            <p className="sd-banner-greeting">Good day!</p>
            <h1 className="sd-banner-name">{staffName}</h1>
            <p className="sd-banner-meta">{staffDept} | {staffRole}</p>
            <p className="sd-banner-sub">
              Here&apos;s your staff dashboard – keep up the good work!
            </p>
          </div>
        </div>

        {/* ── STAT CARDS 2×2 GRID ── */}
        <div className="sd-cards">
          {STAT_CARDS.map((card) => (
            <div className="sd-glass-card" key={card.key}>
              {/* swap each icon src inside STAT_CARDS array above */}
              <img
                src={card.icon}
                alt={card.label}
                className="sd-glass-card-icon"
              />
              <div className="sd-glass-card-info">
                <p className="sd-glass-card-value">
                  {loading
                    ? "—"
                    : `${card.prefix}${card.prefix ? " " : ""}${card.format(stats[card.key])}`}
                </p>
                <p className="sd-glass-card-label">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
