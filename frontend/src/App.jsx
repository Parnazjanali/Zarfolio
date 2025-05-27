// src/App.jsx
// ... (imports بدون تغییر)
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
      // رنگ پس‌زمینه اصلی صفحات داخلی از App.css (.main-content-area) یا index.css (body) کنترل می‌شود.
      // document.body.style.backgroundColor = '#FAF8F3'; // این خط دیگر اینجا ضروری نیست
    }
    return () => {
      document.body.classList.remove('login-page-background');
      // document.body.style.backgroundColor = ''; // این هم
    };
  }, [location.pathname]);
  return null;
}

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// MainLayout کمی تغییر کرد تا کلاس sidebar-is-collapsed-globally را به والدش بدهد
function MainLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') === 'true' // خواندن حالت اولیه از localStorage
  );

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed); // ذخیره حالت در localStorage
    // اضافه یا حذف کلاس به body یا یک المان والد دیگر اگر لازم است استایل‌های سراسری تغییر کنند
    if (isSidebarCollapsed) {
      document.documentElement.classList.add('sidebar-is-collapsed-for-global-styles');
    } else {
      document.documentElement.classList.remove('sidebar-is-collapsed-for-global-styles');
    }
  }, [isSidebarCollapsed]);

  return (
    // کلاس sidebar-is-collapsed-globally برای اعمال margin صحیح به main-content-area استفاده می‌شود
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
  return (
    <>
      <BackgroundManager />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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

        <Route
          path="/"
          element={<Navigate to={localStorage.getItem('authToken') ? "/dashboard" : "/login"} replace />}
        />
        <Route path="*" element={<Navigate to={localStorage.getItem('authToken') ? "/dashboard" : "/login"} replace />} />
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