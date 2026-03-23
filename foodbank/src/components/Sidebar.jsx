import { useState, useEffect } from "react";
import api from "../services/api";

/**
 * Sidebar — reusable for any dashboard.
 *
 * Props:
 *   apiEndpoint {string} — the notifications API route for this user type
 *                          e.g. "/staff/notifications" or "/donor/notifications"
 */
export default function Sidebar({ apiEndpoint }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  // ── Fetch notifications for whoever is logged in ───────────────────────────
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get(apiEndpoint);
        setNotifications(res.data);
      } catch (err) {
        console.error("Sidebar fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, [apiEndpoint]);

  // ── Icon color based on notification type ─────────────────────────────────
  const notifIconColor = (type) => {
    if (type === "financial") return "#f4b942";
    return "#2e7d32";
  };

  return (
    <aside className="sidebar">
      <div className="notif-section">

        <h3 className="notif-title">Notifications &amp; Recent Activities</h3>

        <ul className="notif-list">
          {loading ? (
            <li className="notif-loading">Loading…</li>
          ) : notifications.length === 0 ? (
            <li className="notif-empty">No recent activity.</li>
          ) : (
            notifications.map((notif) => (
              <li className="notif-item" key={notif.id}>

                {/* ICON DOT */}
                <span
                  className="notif-dot"
                  style={{ background: notifIconColor(notif.type) }}
                >
                  <span className="material-symbols-rounded">
                    {notif.type === "financial" ? "payments" : "local_shipping"}
                  </span>
                </span>

                {/* CONTENT */}
                <div className="notif-body">
                  <p className="notif-name">{notif.title}</p>
                  <p className="notif-desc">{notif.message}</p>
                  <p className="notif-time">{notif.time_ago}</p>
                </div>

              </li>
            ))
          )}
        </ul>

      </div>
    </aside>
  );
}
