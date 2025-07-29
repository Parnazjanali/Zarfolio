// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  // روش بررسی توکن شما ممکن است متفاوت باشد
  const isAuthenticated = !!localStorage.getItem('authToken'); 

  if (!isAuthenticated) {
    // اگر کاربر احراز هویت نشده باشد، او را به صفحه لاگین هدایت کن
    // state: { from: location } برای بازگشت به صفحه فعلی پس از لاگین است
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // اگر احراز هویت شده باشد، کامپوننت فرزند (صفحه محافظت شده) را رندر کن
  return children;
};

export default ProtectedRoute;