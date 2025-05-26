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
      document.body.style.backgroundColor = '';
    } else {
      document.body.classList.remove('login-page-background');
      document.body.style.backgroundColor = '#FAF8F3';
    }
    return () => {
      document.body.classList.remove('login-page-background');
      document.body.style.backgroundColor = '';
    };
  }, [location.pathname]);
  return null;
}

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // User not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  return children;
};

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
>>>>>>> a0c457fcc9f4770fe83ca040921b7f15e882437c
}

function App() {
  // isLoggedIn will now be determined by ProtectedRoute
  // We might need a way to refresh app state on login/logout if using a global auth context

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <> {/* Use Fragment to avoid unnecessary div if App itself is not the main flex container */}
=======
    <>
>>>>>>> main
      <BackgroundManager />
      <Routes>
        <Route path="/login" element={<LoginPage />} /> {/* LoginPage handles its own redirection if already logged in */}

        {/* Protected Routes wrapped with MainLayout */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/invoices"
          element={<ProtectedRoute><MainLayout><InvoicesPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/inventory"
          element={<ProtectedRoute><MainLayout><InventoryPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/customers"
          element={<ProtectedRoute><MainLayout><CustomersPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/reports"
          element={<ProtectedRoute><MainLayout><ReportsPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>}
        />

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to={localStorage.getItem('authToken') ? "/dashboard" : "/login"} replace />}
        />
        {/* Fallback for any other route */}
        <Route path="*" element={<Navigate to={localStorage.getItem('authToken') ? "/dashboard" : "/login"} replace />} />
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
>>>>>>> a0c457fcc9f4770fe83ca040921b7f15e882437c
  );
}

function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}

export default AppWrapper;