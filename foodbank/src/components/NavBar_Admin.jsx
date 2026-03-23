import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import api from "../services/api";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Accounts",  path: "/admin/accounts"  },
  { label: "Reports",   path: "/admin/reports"   },
];

export default function NavBar_Admin() {
  const [adminName, setAdminName] = useState("Admin Name");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/admin/profile");
        setAdminName(res.data.name);
      } catch (_) {}
    };
    fetchProfile();
  }, []);

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

      {/* ADMIN NAME + LOGOUT */}
      <div className="user-navbar-user">
        <span className="material-symbols-rounded user-navbar-avatar">account_circle</span>
        <span className="user-navbar-name">{adminName}</span>
        <button className="user-navbar-logout" onClick={handleLogout} title="Logout">
          <span className="material-symbols-rounded">logout</span>
        </button>
      </div>

    </nav>
  );
}
