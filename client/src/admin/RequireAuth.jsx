import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
  let storedAdmin = null;
  try {
    const raw = localStorage.getItem("neel_admin_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if ((parsed.role === 'admin' || parsed.role === 'super_admin') && parsed.is_admin === true) {
        storedAdmin = parsed;
      }
    }
  } catch (e) {}

  const activeUser = user || storedAdmin;
  const location = useLocation();

  // If no user or token, redirect to home with needsLogin
  if (!activeUser || !token) {
    return <Navigate to="/" state={{ from: location, needsLogin: true }} replace />;
  }

  // Strict admin check: user must explicitly have role 'admin'/'super_admin' AND is_admin == true
  const isRealAdmin = Boolean(
    (activeUser.role === 'admin' || activeUser.role === 'super_admin') &&
    activeUser.is_admin === true
  );

  if (!isRealAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
