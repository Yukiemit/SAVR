import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import api from "../services/api";

const navItems = [
  { label: "Dashboard", path: "/staff/dashboard" },
  {
    label: "Donations",
    children: [
      { label: "Drive",   path: "/staff/donations/drive" },
      { label: "Request", path: "/staff/donations/request" },
    ],
  },
  {
    label: "Operations",
    children: [
      { label: "Journey Tracker",     path: "/staff/operations/journey-tracker" },
      { label: "Service Approval",   path: "/staff/operations/service-approval" },
      { label: "Truck Optimization",  path: "/staff/operations/truck-optimization" },
    ],
  },
  {
    label: "Inventory",
    children: [
      { label: "Service",          path: "/staff/inventory/service" },
      { label: "Food",        path: "/staff/inventory/food" },
    ],
  },
  { label: "Reports", path: "/staff/reports" },
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

export default function NavBar_Staff() {
  const [openMenu,       setOpenMenu]       = useState(null);
  const [staffName,      setStaffName]      = useState("Staff Name");
  const [bellOpen,       setBellOpen]       = useState(false);
  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [notifLoading,   setNotifLoading]   = useState(false);
  const location  = useLocation();
  const bellRef   = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/staff/profile");
        setStaffName(res.data.name);
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

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking on a dropdown trigger
      const isTrigger = e.target.closest('.user-nav-link');
      if (!isTrigger) {
        setOpenMenu(null);
      }
    };
    
    if (openMenu) {
      // Use setTimeout to avoid immediate close on click
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenu]);

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

  const isParentActive = (children) =>
    children?.some((child) => location.pathname.startsWith(child.path));

  const toggleDropdown = (label) => {
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <nav className="user-navbar">

      {/* LOGO */}
      <div className="user-navbar-logo">
        <img src="/images/logobrown.png" alt="FoodBank Logo" />
      </div>

      {/* NAV ITEMS */}
      <ul className="user-nav-list">
        {navItems.map((item) => {
          const hasChildren  = !!item.children;
          const parentActive = hasChildren && isParentActive(item.children);

          return (
            <li
              key={item.label}
              className="user-nav-item"
            >
              {hasChildren ? (
                <span 
                  className={`user-nav-link ${parentActive ? "user-nav-active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(item.label);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {item.label}
                </span>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `user-nav-link ${isActive ? "user-nav-active" : ""}`}
                >
                  {item.label}
                </NavLink>
              )}

              {hasChildren && openMenu === item.label && (
                <ul className="user-dropdown">
                  {item.children.map((child) => (
                    <li key={child.label}>
                      <NavLink
                        to={child.path}
                        className={({ isActive }) =>
                          `user-dropdown-item ${isActive ? "user-dropdown-active" : ""}`
                        }
                        onClick={() => setOpenMenu(null)}
                      >
                        {child.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
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

        {/* STAFF NAME + LOGOUT */}
        <div className="user-navbar-user">
          <span className="material-symbols-rounded user-navbar-avatar">account_circle</span>
          <span className="user-navbar-name">{staffName}</span>
          <button className="user-navbar-logout" onClick={handleLogout} title="Logout">
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
}