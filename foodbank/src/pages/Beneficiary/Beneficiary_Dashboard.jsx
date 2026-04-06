import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar_Beneficiary from "../../components/NavBar_Beneficiary";

// ── DUMMY DATA — delete when backend is connected ─────────────────────────────
// TODO (backend): replace with real API calls
const DUMMY_RECENT = [
  { id: 1,  date: "Jan 15, 2025", type: "Financial", amount_items: "₱ 5,000",    status: "completed"  },
  { id: 2,  date: "Jan 15, 2025", type: "Food",      amount_items: "10 kg rice", status: "completed"  },
  { id: 3,  date: "Jan 16, 2025", type: "Financial", amount_items: "₱ 10,000",   status: "completed"  },
  { id: 4,  date: "Jan 20, 2025", type: "Food",      amount_items: "5 kg flour",  status: "accepted"   },
  { id: 5,  date: "Feb 01, 2025", type: "Financial", amount_items: "₱ 2,500",    status: "pending"    },
  { id: 6,  date: "Feb 10, 2025", type: "Food",      amount_items: "20 kg corn", status: "pending"    },
  { id: 7,  date: "Feb 14, 2025", type: "Financial", amount_items: "₱ 7,000",    status: "rejected"   },
  { id: 8,  date: "Mar 01, 2025", type: "Food",      amount_items: "8 kg beans", status: "completed"  },
  { id: 9,  date: "Mar 10, 2025", type: "Financial", amount_items: "₱ 3,000",    status: "accepted"   },
  { id: 10, date: "Mar 22, 2025", type: "Food",      amount_items: "12 kg rice", status: "pending"    },
];

const STATUS_STYLE = {
  completed: { bg: "#e8f5e9", color: "#2e7d32", icon: "check_circle",    label: "Completed"  },
  accepted:  { bg: "#e3f2fd", color: "#1565c0", icon: "thumb_up",         label: "Accepted"   },
  pending:   { bg: "#fff3e0", color: "#e65100", icon: "schedule",         label: "Pending"    },
  rejected:  { bg: "#fdecea", color: "#c62828", icon: "cancel",           label: "Rejected"   },
};

export default function Beneficiary_Dashboard() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [beneficiaryName,  setBeneficiaryName]  = useState("First Name, Last Name");
  const [totalRequests,    setTotalRequests]    = useState(0);
  const [activeCount,      setActiveCount]      = useState(0);
  const [pendingCount,     setPendingCount]     = useState(0);
  const [recentRequests,   setRecentRequests]   = useState([]);
  const [showAll,          setShowAll]          = useState(false);
  const [loading,          setLoading]          = useState(true);

  // ── Fetch dashboard data ──────────────────────────────────────────────────
  // TODO (backend): GET /api/beneficiary/dashboard
  // Returns: {
  //   name: string,
  //   total_requests: number,
  //   active_count: number,
  //   pending_count: number,
  //   recent_requests: [{ id, date, type, amount_items, status }]
  // }
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // const res = await api.get("/beneficiary/dashboard");
        // setBeneficiaryName(res.data.name);
        // setTotalRequests(res.data.total_requests);
        // setActiveCount(res.data.active_count);
        // setPendingCount(res.data.pending_count);
        // setRecentRequests(res.data.recent_requests);

        // ── DUMMY fallback — delete when backend is ready ──
        setBeneficiaryName("First Name, Last Name");
        setTotalRequests(18);
        setActiveCount(1);
        setPendingCount(3);
        setRecentRequests(DUMMY_RECENT);
      } catch (_) {
        // fallback to dummy on error
        setBeneficiaryName("First Name, Last Name");
        setTotalRequests(18);
        setActiveCount(1);
        setPendingCount(3);
        setRecentRequests(DUMMY_RECENT);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const displayedRows = showAll ? recentRequests : recentRequests.slice(0, 3);

  return (
    <div className="ben-wrapper">
      <NavBar_Beneficiary />

      <main className="ben-main">

        {/* ── HERO BANNER ── */}
        <div className="ben-banner">
          <img
            src="/images/1Home_Header.png"
            alt="banner background"
            className="ben-banner-bg"
          />
          <div className="ben-banner-overlay" />
          <div className="ben-banner-content">
            <p className="ben-banner-greeting">Good day!</p>
            <h1 className="ben-banner-name">{beneficiaryName}</h1>
            <p className="ben-banner-sub">Here's your beneficiary dashboard</p>
          </div>

          {/* TOTAL REQUESTS CARD inside banner */}
          <div className="ben-banner-stat">
            <span className="ben-banner-stat-num">{loading ? "—" : totalRequests}</span>
            <span className="ben-banner-stat-label">Total Requests Made</span>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="ben-cards-row">

          {/* ACTIVE REQUEST */}
          <div className="ben-stat-card">
            <div className="ben-stat-card-left">
              <span
                className="material-symbols-rounded ben-stat-icon"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
              >
                task_alt
              </span>
            </div>
            <div className="ben-stat-card-right">
              <span className="ben-stat-num">{loading ? "—" : activeCount}</span>
              <span className="ben-stat-label">ACTIVE REQUEST</span>
              <button
                className="ben-stat-btn"
                onClick={() => navigate("/beneficiary/create-request")}
              >
                Request Now
              </button>
            </div>
          </div>

          {/* PENDING REQUEST */}
          <div className="ben-stat-card">
            <div className="ben-stat-card-left">
              <span
                className="material-symbols-rounded ben-stat-icon"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
              >
                schedule
              </span>
            </div>
            <div className="ben-stat-card-right">
              <span className="ben-stat-num">{loading ? "—" : pendingCount}</span>
              <span className="ben-stat-label">PENDING REQUEST</span>
              <button
                className="ben-stat-btn"
                onClick={() => navigate("/beneficiary/track-request")}
              >
                Track Now
              </button>
            </div>
          </div>

        </div>

        {/* ── RECENT REQUEST ACTIVITY ── */}
        <div className="ben-recent-section">

          {/* Section header */}
          <div className="ben-recent-header">
            <div className="ben-recent-title-wrap">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 28, color: "#2e7d32", fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                fact_check
              </span>
              <h2 className="ben-recent-title">Recent Request Activity</h2>
            </div>
            <button
              className="ben-see-all-btn"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show Less" : "See All"}
            </button>
          </div>

          {/* Table */}
          <div className="ben-table-wrap">
            <table className="ben-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>AMOUNT / ITEMS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="ben-table-loading">Loading…</td>
                  </tr>
                ) : displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="ben-table-loading">No requests yet.</td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    const s = STATUS_STYLE[row.status] || STATUS_STYLE.pending;
                    return (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.type}</td>
                        <td>{row.amount_items}</td>
                        <td>
                          <span
                            className="ben-status-badge"
                            style={{ background: s.bg, color: s.color }}
                          >
                            <span
                              className="material-symbols-rounded"
                              style={{
                                fontSize: 13,
                                fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                              }}
                            >
                              {s.icon}
                            </span>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}

/*
================================================================================
  SQL SCHEMA — for backend developers
================================================================================

-- beneficiaries table (users table with role = 'beneficiary' is also acceptable)
CREATE TABLE beneficiaries (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT UNSIGNED NOT NULL,           -- FK → users.id
  organization     VARCHAR(255),
  address          VARCHAR(500),
  contact_number   VARCHAR(20),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- donation_requests table
CREATE TABLE donation_requests (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  beneficiary_id   BIGINT UNSIGNED NOT NULL,           -- FK → beneficiaries.id
  request_name     VARCHAR(255) NOT NULL,
  type             ENUM('food', 'financial') NOT NULL,
  -- food-specific
  food_type        VARCHAR(100),
  quantity         DECIMAL(10,2),
  unit             VARCHAR(50),
  -- financial-specific
  amount           DECIMAL(12,2),
  -- shared
  population       INT,
  age_range_min    TINYINT,
  age_range_max    TINYINT,
  street           VARCHAR(255),
  barangay         VARCHAR(255),
  city             VARCHAR(255),
  zip_code         VARCHAR(10),
  request_date     DATE,
  urgency          ENUM('low', 'medium', 'high') NOT NULL,
  status           ENUM('pending','accepted','completed','rejected','cancelled') DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX idx_donation_requests_beneficiary_id ON donation_requests(beneficiary_id);
CREATE INDEX idx_donation_requests_status         ON donation_requests(status);
CREATE INDEX idx_donation_requests_created_at     ON donation_requests(created_at DESC);

================================================================================
  LARAVEL ROUTES — for backend developers
================================================================================

  GET    /api/beneficiary/dashboard    → BeneficiaryDashboardController@index
  GET    /api/beneficiary/profile      → BeneficiaryProfileController@show
  PUT    /api/beneficiary/profile      → BeneficiaryProfileController@update

  POST   /api/beneficiary/requests           → DonationRequestController@store
  GET    /api/beneficiary/requests           → DonationRequestController@index  (paginated)
  GET    /api/beneficiary/requests/{id}      → DonationRequestController@show
  DELETE /api/beneficiary/requests/{id}      → DonationRequestController@cancel  (pending only)

  GET    /api/notifications                  → NotificationController@index
  POST   /api/notifications/mark-all-read   → NotificationController@markAllRead
  POST   /api/notifications/{id}/mark-read  → NotificationController@markRead

================================================================================
*/
