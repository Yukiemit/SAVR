import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import api from "../services/api";

const navItems = [
  { label: "Dashboard", path: "/donor/dashboard" },
  { label: "Donate",    path: "/donor/donate"           },
  { label: "Report",    path: "/donor/reports"    },
];

const iconConfig = (type) => {
  switch (type) {
    case "financial": return { icon: "payments",       bg: "#f4b942" };
    case "pickup":    return { icon: "local_shipping",  bg: "#2e7d32" };
    case "request":   return { icon: "assignment",      bg: "#c96a2e" };
    case "system":    return { icon: "info",            bg: "#1565c0" };
    default:          return { icon: "notifications",   bg: "#2e7d32" };
  }
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString();
};

export default function NavBar_Donor() {
  const [donorName,     setDonorName]     = useState("Donor Name");
  const [bellOpen,      setBellOpen]      = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/donor/profile");
        setDonorName(res.data.name);
      } catch (_) {}
    };
    fetchProfile();
  }, []);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read_at).length);
    } catch (_) {}
    finally { setNotifLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    if (bellOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [bellOpen]);

  const handleBellClick = async () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (opening && unreadCount > 0) {
      try {
        await api.post("/notifications/mark-all-read");
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        );
      } catch (_) {}
    }
  };

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark-read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const handleLogout = async () => {
    try { await api.post("/logout"); } catch (_) {}
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <nav className="user-navbar">

      {/* LOGO */}
      <div className="user-navbar-logo">
        <img src="/images/logobrown.png" alt="FoodBank Logo" />
      </div>

      {/* NAV ITEMS */}
      <ul className="user-nav-list">
        {navItems.map((item) => (
          <li key={item.label} className="user-nav-item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `user-nav-link ${isActive ? "user-nav-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* RIGHT SIDE: BELL + USER */}
      <div className="user-navbar-right">

        {/* NOTIFICATION BELL */}
        <div className="notif-bell-wrap" ref={bellRef}>
          <button
            className={`notif-bell-btn ${bellOpen ? "notif-bell-active" : ""}`}
            onClick={handleBellClick}
            aria-label="Notifications"
          >
            <span className="material-symbols-rounded notif-bell-icon">
              {unreadCount > 0 ? "notifications_active" : "notifications"}
            </span>
            {unreadCount > 0 && (
              <span className="notif-bell-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="notif-panel">

              <div className="notif-panel-header">
                <h3 className="notif-panel-title">Notifications &amp; Recent Activities</h3>
                {unreadCount === 0 && notifications.length > 0 && (
                  <span className="notif-panel-all-read">All caught up ✓</span>
                )}
              </div>

              <ul className="notif-panel-list">
                {notifLoading ? (
                  <li className="notif-panel-empty">Loading…</li>
                ) : notifications.length === 0 ? (
                  <li className="notif-panel-empty">No notifications yet.</li>
                ) : (
                  notifications.map((n) => {
                    const cfg    = iconConfig(n.type);
                    const unread = !n.read_at;
                    return (
                      <li
                        key={n.id}
                        className={`notif-panel-item ${unread ? "notif-panel-item-unread" : ""}`}
                        onClick={() => unread && markRead(n.id)}
                      >
                        <div className="notif-panel-dot" style={{ background: cfg.bg }}>
                          <span
                            className="material-symbols-rounded"
                            style={{
                              fontSize: 16,
                              color: "white",
                              fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                            }}
                          >
                            {cfg.icon}
                          </span>
                        </div>
                        <div className="notif-panel-body">
                          <p className="notif-panel-name">{n.title}</p>
                          <p className="notif-panel-desc">{n.message}</p>
                          <p className="notif-panel-time">{timeAgo(n.created_at)}</p>
                        </div>
                        {unread && <span className="notif-panel-unread-dot" />}
                      </li>
                    );
                  })
                )}
              </ul>

              {notifications.length > 0 && (
                <div className="notif-panel-footer">
                  <button
                    className="notif-panel-clear-btn"
                    onClick={async () => {
                      try {
                        await api.post("/notifications/mark-all-read");
                        setUnreadCount(0);
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
                        );
                      } catch (_) {}
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* DONOR NAME + LOGOUT */}
        <div className="user-navbar-user">
          <span className="material-symbols-rounded user-navbar-avatar">account_circle</span>
          <span className="user-navbar-name">{donorName}</span>
          <button className="user-navbar-logout" onClick={handleLogout} title="Logout">
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
}
