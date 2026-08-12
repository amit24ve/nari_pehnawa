import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If no user is logged in, redirect to home page
  if (!user) {
    return <Navigate to="/" state={{ from: location, needsLogin: true }} replace />;
  }

  // Check if user is admin
  if (user.role !== 'admin' && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
