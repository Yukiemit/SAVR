// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = localStorage.getItem("role");

  // ✅ NOT LOGGED IN — redirect to login
  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  // ✅ WRONG ROLE — redirect to login
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}