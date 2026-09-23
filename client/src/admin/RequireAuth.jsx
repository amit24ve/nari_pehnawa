import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
  let storedUser = null;
  try {
    const raw = localStorage.getItem("neel_admin_user");
    if (raw) storedUser = JSON.parse(raw);
  } catch (e) {}

  const activeUser = user || storedUser;
  const location = useLocation();

  // If no user is logged in, redirect to home page
  if (!activeUser && !token) {
    return <Navigate to="/" state={{ from: location, needsLogin: true }} replace />;
  }

  // Check if user is admin
  if (activeUser && activeUser.role !== 'admin' && !activeUser.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
