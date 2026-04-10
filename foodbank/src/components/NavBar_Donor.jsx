import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import api from "../services/api";

const navItems = [
  { label: "Dashboard", path: "/donor/dashboard" },
  { label: "Donate",    path: "/donor/donate"    },
  { label: "Report",    path: "/donor/reports"   },
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
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const storedName = storedUser?.name || "Donor Name";

  const [donorName,     setDonorName]     = useState(storedName);
  const [bellOpen,      setBellOpen]      = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const bellRef    = useRef(null);
  const profileRef = useRef(null);

  // ── Fetch donor profile from API to keep name fresh ──────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res  = await api.get("/donor/profile");
        const name = res.data.name
          || res.data.org_name
          || `${res.data.first_name ?? ""} ${res.data.last_name ?? ""}`.trim()
          || storedName;
        setDonorName(name);
        localStorage.setItem("user", JSON.stringify({ ...storedUser, name }));
      } catch (_) {}
    };
    fetchProfile();
  }, []);

  // ── Fetch notifications ───────────────────────────────────────────────────
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

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handleOutside = (e) => {
      if (bellRef.current    && !bellRef.current.contains(e.target))    setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Bell click ────────────────────────────────────────────────────────────
  const handleBellClick = async () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (profileOpen) setProfileOpen(false);
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

  // ── Mark single read ──────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark-read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) {}
  };

  // ── Profile navigation — role-based ──────────────────────────────────────
  const handleProfileClick = () => {
    const role = localStorage.getItem("role");
    if (role === "donor_organization") {
      window.location.href = "/donor/profile/organization";
    } else {
      window.location.href = "/donor/profile/individual";
    }
    setProfileOpen(false);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await api.post("/logout"); } catch (_) {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  // ── Role label ────────────────────────────────────────────────────────────
  const role     = localStorage.getItem("role");
  const roleLabel = role === "donor_organization" ? "Organization Donor" : "Individual Donor";

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
              className={({ isActive }) => `user-nav-link ${isActive ? "user-nav-active" : ""}`}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* RIGHT SIDE */}
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
              <span className="notif-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
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
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: "white", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
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

        {/* PROFILE DROPDOWN */}
        <div className="notif-bell-wrap" ref={profileRef}>
          <button
            className={`notif-bell-btn ${profileOpen ? "notif-bell-active" : ""}`}
            onClick={() => { setProfileOpen((p) => !p); setBellOpen(false); }}
            aria-label="Profile"
          >
            <span
              className="material-symbols-rounded notif-bell-icon"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              account_circle
            </span>
          </button>

          {profileOpen && (
            <div className="notif-panel" style={{ minWidth: 220 }}>
              <div className="notif-panel-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#222" }}>{donorName}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>{roleLabel}</p>
              </div>
              <ul className="notif-panel-list" style={{ padding: "6px 0" }}>

                {/* MY PROFILE */}
                <li
                  className="notif-panel-item"
                  onClick={handleProfileClick}
                  style={{ cursor: "pointer" }}
                >
                  <div className="notif-panel-dot" style={{ background: "#2e7d32" }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: "white", fontVariationSettings: "'FILL' 1" }}>
                      manage_accounts
                    </span>
                  </div>
                  <div className="notif-panel-body">
                    <p className="notif-panel-name">My Profile</p>
                    <p className="notif-panel-desc">View and edit your details</p>
                  </div>
                </li>

                {/* LOGOUT */}
                <li
                  className="notif-panel-item"
                  onClick={handleLogout}
                  style={{ cursor: "pointer" }}
                >
                  <div className="notif-panel-dot" style={{ background: "#c0392b" }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: "white", fontVariationSettings: "'FILL' 1" }}>
                      logout
                    </span>
                  </div>
                  <div className="notif-panel-body">
                    <p className="notif-panel-name" style={{ color: "#c0392b" }}>Logout</p>
                    <p className="notif-panel-desc">Sign out of your account</p>
                  </div>
                </li>

              </ul>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
