// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import './App.css';

function BackgroundManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === '/login') {
      document.body.classList.add('login-page-background');
      document.body.style.backgroundColor = ''; // Clear default body background
    } else {
      document.body.classList.remove('login-page-background');
      document.body.style.backgroundColor = '#FAF8F3'; // Set cream background for other pages
    }
    return () => {
      document.body.classList.remove('login-page-background');
      document.body.style.backgroundColor = '';
    };
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <BackgroundManager />
      <div className="app-container">
        <div className="content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;