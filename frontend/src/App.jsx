// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import NewInvoicePage from './pages/NewInvoicePage.jsx'; //  کامپوننت جدید را ایمپورت کنید
import InventoryPage from './pages/InventoryPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';
import AccountSettingsPage from './pages/AccountSettingsPage.jsx';
import EtiketPage from './pages/EtiketPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './App.css';


function BackgroundManager() {
  const location = useLocation();
  useEffect(() => {
    const authPaths = ['/login', '/request-password-reset', '/reset-password'];
    if (authPaths.includes(location.pathname)) {
      document.body.classList.add('login-page-background');
    } else {
      document.body.classList.remove('login-page-background');
    }
    return () => {
      document.body.classList.remove('login-page-background');
    };
  }, [location.pathname]);
  return null;
}

function MainLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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
}

function App() {
  const isAuthenticated = !!localStorage.getItem('authToken');

  return (
    <>
      <BackgroundManager />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />

        {/* تغییر مسیر InvoicesPage به یک مسیر پایه برای لیست فاکتورها */}
        <Route path="/invoices" element={<ProtectedRoute><MainLayout><InvoicesPage /></MainLayout></ProtectedRoute>} />
        {/* مسیر جدید برای ایجاد فاکتور */}
        <Route path="/invoices/new" element={<ProtectedRoute><MainLayout><NewInvoicePage /></MainLayout></ProtectedRoute>} />
        {/* اگر مسیرهای دیگری مانند /invoices/:id دارید، باید بعد از /invoices/new تعریف شوند */}
        {/* مثال: <Route path="/invoices/:id" element={<ProtectedRoute><MainLayout><InvoiceDetailPage /></MainLayout></ProtectedRoute>} /> */}


        <Route path="/inventory" element={<ProtectedRoute><MainLayout><InventoryPage /></MainLayout></ProtectedRoute>} />
        <Route path="/customers/*" element={<ProtectedRoute><MainLayout><CustomersPage /></MainLayout></ProtectedRoute>} />
        <Route path="/etiket" element={<ProtectedRoute><MainLayout><EtiketPage /></MainLayout></ProtectedRoute>} />
        <Route path="/reports/*" element={<ProtectedRoute><MainLayout><ReportsPage /></MainLayout></ProtectedRoute>} />

        <Route
          path="/account/settings"
          element={<ProtectedRoute><MainLayout><AccountSettingsPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/settings/system"
          element={<ProtectedRoute><MainLayout><SystemSettingsPage /></MainLayout></ProtectedRoute>}
        />

        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
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