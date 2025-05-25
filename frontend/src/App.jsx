// src/App.jsx
<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import './App.css';

function BackgroundManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === '/login') {
      document.body.classList.add('login-page-background');
      document.body.style.backgroundColor = ''; // Clear default body background
    } else {
      document.body.classList.remove('login-page-background');
      document.body.style.backgroundColor = '#FAF8F3'; // Set cream background
    }
    return () => {
      document.body.classList.remove('login-page-background');
      document.body.style.backgroundColor = ''; // Reset on unmount (optional)
    };
  }, [location.pathname]);
  return null;
}

function MainLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`main-layout ${isSidebarCollapsed ? 'sidebar-is-collapsed-globally' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <main className="main-content-area">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            // @ts-ignore
            return React.cloneElement(child, { isSidebarCollapsed });
          }
          return child;
        })}
      </main>
    </div>
  );
=======
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
>>>>>>> a0c457f (refactor: Improve UI/UX, implement full Persian localization, and update dashboard layout)
}

function App() {
  // For simplicity, assuming user is logged in if not on /login
  // Replace with actual authentication logic
  const location = useLocation(); // For conditional rendering of MainLayout
  const isLoggedIn = location.pathname !== '/login'; // Example auth check

  return (
<<<<<<< HEAD
    <> {/* Use Fragment to avoid unnecessary div if App itself is not the main flex container */}
      <BackgroundManager />
      <Routes>
        <Route path="/login" element={<div className="login-page-wrapper"><LoginPage /></div>} />

        <Route
          path="/dashboard"
          element={isLoggedIn ? <MainLayout><DashboardPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/invoices"
          element={isLoggedIn ? <MainLayout><InvoicesPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/inventory"
          element={isLoggedIn ? <MainLayout><InventoryPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/customers"
          element={isLoggedIn ? <MainLayout><CustomersPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/reports"
          element={isLoggedIn ? <MainLayout><ReportsPage /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={isLoggedIn ? <MainLayout><SettingsPage /></MainLayout> : <Navigate to="/login" replace />}
        />

        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
=======
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
>>>>>>> a0c457f (refactor: Improve UI/UX, implement full Persian localization, and update dashboard layout)
  );
}

// Wrap App with Router if it's not already the top-level Router provider
function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}

export default AppWrapper; // Export AppWrapper if Router is here, otherwise export App