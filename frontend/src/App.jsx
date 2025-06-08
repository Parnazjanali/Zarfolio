// src/App.jsx

// STEP 1: 'lazy' و 'Suspense' از کتابخانه react وارد می‌شوند
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// --- START: کامپوننت‌هایی که برای بارگذاری اولیه نیاز هستند ---
// این کامپوننت‌ها چون بلافاصله نیاز هستند، به صورت عادی وارد می‌شوند
import LoginPage from './pages/LoginPage.jsx';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import TwoFAVerifyPage from './pages/TwoFAVerifyPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './App.css';
// --- END: کامپوننت‌های بارگذاری اولیه ---


// --- START: کامپوننت‌های صفحات که به صورت Lazy (تنبل) بارگذاری می‌شوند ---
// به جای وارد کردن مستقیم، از تابع lazy برای وارد کردن داینامیک استفاده می‌کنیم
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage.jsx'));
const NewInvoicePage = lazy(() => import('./pages/NewInvoicePage.jsx'));
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
const CustomersPage = lazy(() => import('./pages/CustomersPage.jsx'));
const NewCustomerPage = lazy(() => import('./pages/NewCustomerPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage.jsx'));
const AccountManagementPage = lazy(() => import('./pages/AccountManagementPage.jsx'));
const EtiketPage = lazy(() => import('./pages/EtiketPage.jsx'));
// --- END: کامپوننت‌های Lazy ---


function BackgroundManager() {
  const location = useLocation();
  useEffect(() => {
    // مسیر جدید 2fa-verify به لیست مسیرهای احراز هویت اضافه شد
    const authPaths = ['/login', '/request-password-reset', '/reset-password', '/2fa-verify'];
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
      {/* STEP 2: تمام مسیرها داخل کامپوننت Suspense قرار می‌گیرند */}
      {/* fallback یک کامپوننت یا JSX است که تا زمان بارگذاری کد صفحه جدید نمایش داده می‌شود */}
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>در حال بارگذاری...</div>}>
        <Routes>
          {/* مسیرهای احراز هویت */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/2fa-verify" element={<TwoFAVerifyPage />} />
          <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* مسیرهای اصلی برنامه که به صورت lazy لود می‌شوند */}
          <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
          
          <Route path="/invoices" element={<ProtectedRoute><MainLayout><InvoicesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/invoices/new" element={<ProtectedRoute><MainLayout><NewInvoicePage /></MainLayout></ProtectedRoute>} />
          
          <Route path="/inventory" element={<ProtectedRoute><MainLayout><InventoryPage /></MainLayout></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><MainLayout><CustomersPage /></MainLayout></ProtectedRoute>} />
          <Route path="/customers/new" element={<ProtectedRoute><MainLayout><NewCustomerPage /></MainLayout></ProtectedRoute>} />
          <Route path="/etiket" element={<ProtectedRoute><MainLayout><EtiketPage /></MainLayout></ProtectedRoute>} />
          <Route path="/reports/*" element={<ProtectedRoute><MainLayout><ReportsPage /></MainLayout></ProtectedRoute>} />

          <Route
            path="/account/settings"
            element={<ProtectedRoute><MainLayout><AccountManagementPage /></MainLayout></ProtectedRoute>}
          />
          <Route
            path="/settings/system"
            element={<ProtectedRoute><MainLayout><SystemSettingsPage /></MainLayout></ProtectedRoute>}
          />

          {/* مسیرهای پیش‌فرض و ریدایرکت */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Suspense>
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