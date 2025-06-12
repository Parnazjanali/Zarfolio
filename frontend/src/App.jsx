// src/App.jsx

// STEP 1: 'lazy' و 'Suspense' از کتابخانه react وارد می‌شوند
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { ConfigProvider, theme, FloatButton } from 'antd'; // Changed Button to FloatButton
import { PlusOutlined } from '@ant-design/icons';
import { FaFileInvoiceDollar, FaUserPlus, FaTags } from 'react-icons/fa'; // Added FaTags

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

// Remove currentTheme and setCurrentTheme from MainLayout props
function MainLayout({ children, isSidebarCollapsed, setIsSidebarCollapsed }) {
  const navigate = useNavigate(); // Instantiate useNavigate

  return (
    <div className={`main-layout ${isSidebarCollapsed ? 'sidebar-is-collapsed-globally' : ''}`}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed}
        // currentTheme and setCurrentTheme removed from Sidebar props
      />
      <main className="main-content-area">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            // currentTheme removed from being passed to children
            // @ts-ignore
            return React.cloneElement(child, { isSidebarCollapsed });
          }
          return child;
        })}
      </main>
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{
          bottom: 30,
          left: 30, // RTL context: bottom-left
          // boxShadow is usually handled by FloatButton component itself
        }}
        icon={<PlusOutlined />}
        tooltip="ثبت جدید"
      >
        <FloatButton 
          icon={<FaTags />} 
          tooltip={{ title: "افزودن اتیکت", placement: "right" }}
          onClick={() => navigate('/etiket')} 
        />
        <FloatButton 
          icon={<FaFileInvoiceDollar />} 
          tooltip={{ title: "فاکتور جدید", placement: "right" }}
          onClick={() => navigate('/invoices/new')} 
        />
        <FloatButton 
          icon={<FaUserPlus />} 
          tooltip={{ title: "مخاطب جدید", placement: "right" }}
          onClick={() => navigate('/customers/new')}
        />
      </FloatButton.Group>
    </div>
  );
}

function App() {
  const isAuthenticated = !!localStorage.getItem('authToken');
  // Remove currentTheme and setCurrentTheme state
  // const [currentTheme, setCurrentTheme] = useState('light'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Define a fixed theme for the app, or use Ant Design's default (light)
  // If the whole app should be dark, use: theme: { algorithm: theme.darkAlgorithm }
  // For default light theme for app content (sidebar is separately dark):
  const antdAppTheme = {
    algorithm: theme.defaultAlgorithm, // Or remove theme prop entirely for default light
    components: {
      Button: {
        // Example of component-level customization if needed
      },
    },
  };

  return (
    <ConfigProvider theme={antdAppTheme}>
      <BackgroundManager />
      <Suspense fallback={<div className="page-loading-fallback">در حال بارگذاری...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/2fa-verify" element={<TwoFAVerifyPage />} />
          <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout 
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
                // currentTheme and setCurrentTheme removed
              >
                <Routes>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/new" element={<NewInvoicePage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="customers/new" element={<NewCustomerPage />} />
                  <Route path="etiket" element={<EtiketPage />} />
                  <Route path="reports/*" element={<ReportsPage />} />
                  <Route path="account/settings" element={<AccountManagementPage />} />
                  <Route path="settings/system" element={<SystemSettingsPage />} />
                  {/* Default redirect for authenticated users inside the layout */}
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }/>
          
          {/* Fallback for non-authenticated users or unmatched routes */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          {/* A global catch-all for any other unmatched paths might be useful, or rely on individual routing structures */}
          {/* <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} /> */}
        </Routes>
      </Suspense>
    </ConfigProvider>
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