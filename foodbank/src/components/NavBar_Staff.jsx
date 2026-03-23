import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import api from "../services/api";

const navItems = [
  { label: "Dashboard", path: "/staff/dashboard" },
  {
    label: "Donations",
    children: [
      { label: "Drive", path: "/staff/donations/drive" },
      { label: "Request", path: "/staff/donations/request" },
    ],
  },
  {
    label: "Operations",
    children: [
      { label: "Journey Tracker", path: "/staff/operations/journey-tracker" },
      { label: "Truck Optimization", path: "/staff/operations/truck-optimization" },
    ],
  },
  {
    label: "Inventory",
    children: [
      { label: "Service", path: "/staff/inventory/service" },
      { label: "Raw Ingr.", path: "/staff/inventory/raw-ingredients" },
      { label: "Prep. Meal", path: "/staff/inventory/prepared-meals" },
    ],
  },
  { label: "Reports", path: "/staff/reports" },
];

export default function NavBar_Staff() {
  const [openMenu, setOpenMenu] = useState(null);
  const [staffName, setStaffName] = useState("Staff Name");
  const location = useLocation();

  // ── Fetch staff name ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/staff/profile");
        setStaffName(res.data.name);
      } catch (_) {}
    };
    fetchProfile();
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await api.post("/logout"); } catch (_) {}
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const isParentActive = (children) =>
    children?.some((child) => location.pathname.startsWith(child.path));

  return (
    <nav className="user-navbar">

      {/* LOGO */}
      <div className="user-navbar-logo">
        <img src="/images/logobrown.png" alt="FoodBank Logo" />
      </div>

      {/* NAV ITEMS */}
      <ul className="user-nav-list">
        {navItems.map((item) => {
          const hasChildren = !!item.children;
          const parentActive = hasChildren && isParentActive(item.children);

          return (
            <li
              key={item.label}
              className="user-nav-item"
              onMouseEnter={() => hasChildren && setOpenMenu(item.label)}
              onMouseLeave={() => hasChildren && setOpenMenu(null)}
            >
              {hasChildren ? (
                <span
                  className={`user-nav-link ${
                    parentActive || openMenu === item.label ? "user-nav-active" : ""
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `user-nav-link ${isActive ? "user-nav-active" : ""}`
                  }
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

      {/* STAFF NAME + LOGOUT */}
      <div className="user-navbar-user">
        <span className="material-symbols-rounded user-navbar-avatar">account_circle</span>
        <span className="user-navbar-name">{staffName}</span>
        <button className="user-navbar-logout" onClick={handleLogout} title="Logout">
          <span className="material-symbols-rounded">logout</span>
        </button>
      </div>

    </nav>
  );
}
