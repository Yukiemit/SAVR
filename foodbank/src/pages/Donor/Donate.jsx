import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Donor from "../../components/NavBar_Donor";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

// ── DUMMY PICKUPS (delete these once backend is connected) ───────────────────
const DUMMY_PICKUPS = [
  {
    id: 1,
    date: "11 / 18 / 2026",
    time_start: "10:00 AM",
    time_end: "12:00 PM",
    address: "123 Main Street",
    contact_name: "John Doe",
    contact_number: "09064082424",
  },
  {
    id: 2,
    date: "11 / 18 / 2026",
    time_start: "10:00 AM",
    time_end: "12:00 PM",
    address: "123 Main Street",
    contact_name: "John Doe",
    contact_number: "09064082424",
  },
  {
    id: 3,
    date: "11 / 25 / 2026",
    time_start: "02:00 PM",
    time_end: "04:00 PM",
    address: "456 Rizal Avenue",
    contact_name: "Maria Santos",
    contact_number: "09171234567",
  },
  {
    id: 4,
    date: "12 / 01 / 2026",
    time_start: "09:00 AM",
    time_end: "11:00 AM",
    address: "789 Quezon Blvd",
    contact_name: "Pedro Cruz",
    contact_number: "09209876543",
  },
  {
    id: 5,
    date: "12 / 05 / 2026",
    time_start: "01:00 PM",
    time_end: "03:00 PM",
    address: "321 Mabini Street",
    contact_name: "Ana Reyes",
    contact_number: "09181122334",
  },
];

// ── DONATION TYPE CARDS ──────────────────────────────────────────────────────
const DONATION_TYPES = [
  {
    key: "financial",
    label: "Financial Donation",
    icon: "/images/Donor_Financial.png",
    path: "/donate/financial",
  },
  {
    key: "food",
    label: "Food Donation",
    icon: "/images/Donor_Food.png",
    path: "/donate/food",
  },
  {
    key: "service",
    label: "Service Donation",
    icon: "/images/Donor_Service.png",
    path: "/donate/service",
  },
];

export default function Donate() {
  const navigate = useNavigate();

  const [pickups, setPickups]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAll, setShowAll]         = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  // ── Fetch upcoming pickups ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const res = await api.get("/donor/pickups");
        setPickups(res.data);
      } catch (_) {
        // Fallback to dummy data if API not ready
        setPickups(DUMMY_PICKUPS);
      } finally {
        setLoading(false);
      }
    };
    fetchPickups();
  }, []);

  // ── Delete pickup ──────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pickup schedule?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/donor/pickups/${id}`);
      setPickups((prev) => prev.filter((p) => p.id !== id));
    } catch (_) {
      // Optimistic delete for dummy data
      setPickups((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const visiblePickups = showAll ? pickups : pickups.slice(0, 2);

  return (
    <div className="donate-wrapper">

      {/* ── NAVBAR ── */}
      <NavBar_Donor />

      <div className="sd-layout">

        {/* ════ MAIN CONTENT ════ */}
        <main className="sd-main donate-main">

          {/* PAGE TITLE */}
          <div className="donate-title-section">
            <h1 className="donate-page-title">Donation Type</h1>
            <hr className="donate-title-divider" />
          </div>

          {/* ── DONATION TYPE CARDS ── */}
          <div className="donate-cards-row">
            {DONATION_TYPES.map((type) => (
              <button
                key={type.key}
                className={`donate-type-card ${hoveredCard === type.key ? "donate-type-card-hovered" : ""}`}
                onClick={() => navigate(type.path)}
                onMouseEnter={() => setHoveredCard(type.key)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="donate-type-icon-wrap">
                  <img
                    src={type.icon}
                    alt={type.label}
                    className="donate-type-icon-img"
                  />
                </div>
                <span className="donate-type-label">{type.label}</span>
              </button>
            ))}
          </div>

          <hr className="donate-section-divider" />

          {/* ── UPCOMING PICKUPS ── */}
          <div className="donate-pickups-header">
            <h2 className="donate-pickups-title">Upcoming Pickups</h2>
            {!showAll && pickups.length > 2 && (
              <button
                className="donate-viewall-btn"
                onClick={() => setShowAll(true)}
              >
                View All
              </button>
            )}
            {showAll && (
              <button
                className="donate-viewall-btn donate-viewall-collapse"
                onClick={() => setShowAll(false)}
              >
                Show Less
              </button>
            )}
          </div>

          <div className="donate-pickups-list">
            {loading ? (
              <p className="donate-pickups-loading">Loading pickups…</p>
            ) : pickups.length === 0 ? (
              <p className="donate-pickups-empty">No upcoming pickups scheduled.</p>
            ) : (
              visiblePickups.map((pickup) => (
                <div className="donate-pickup-item" key={pickup.id}>
                  <div className="donate-pickup-left">
                    <p className="donate-pickup-datetime">
                      {pickup.date}&nbsp;&nbsp;|&nbsp;&nbsp;
                      {pickup.time_start} - {pickup.time_end}
                    </p>
                    <p className="donate-pickup-info">
                      Address: {pickup.address}
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      Contact: {pickup.contact_name} ({pickup.contact_number})
                    </p>
                  </div>
                  <div className="donate-pickup-actions">
                    <button
                      className="donate-pickup-action-btn donate-pickup-cancel"
                      onClick={() => handleDelete(pickup.id)}
                      disabled={deletingId === pickup.id}
                    >
                      {deletingId === pickup.id ? "…" : "cancel"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>

        {/* ════ SIDEBAR ════ */}
        <Sidebar apiEndpoint="/donor/notifications" />

      </div>
    </div>
  );
}
