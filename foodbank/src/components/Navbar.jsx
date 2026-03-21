import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive
      ? "px-4 py-2 rounded-full bg-yellow-400 text-black"
      : "px-4 py-2 rounded-full border border-white text-white hover:bg-white hover:text-black transition";

  return (
    <div className="navbar">

      {/* LOGO */}
      <div className="logo"></div>

      {/* NAV LINKS */}
      <div className="nav-links flex gap-3">

        <NavLink to="/home" className={linkClass}>
          Home
        </NavLink>

        <NavLink to="/about" className={linkClass}>
          About
        </NavLink>

        <NavLink to="/partners" className={linkClass}>
          Partners
        </NavLink>

        <NavLink to="/mediapg" className={linkClass}>
          Media
        </NavLink>

        <NavLink to="/contact" className={linkClass}>
          Contact
        </NavLink>

        <NavLink to="/login" className={linkClass}>
          Login
        </NavLink>

        <NavLink to="/register" className={linkClass}>
          Register
        </NavLink>

      </div>
    </div>
  );
}