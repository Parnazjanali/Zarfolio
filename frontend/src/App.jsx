// src/App.jsx
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider, theme, FloatButton, Layout, Switch } from 'antd';
import { PlusOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { FaFileInvoiceDollar, FaUserPlus, FaTags } from 'react-icons/fa';

import LoginPage from './pages/LoginPage.jsx';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import TwoFAVerifyPage from './pages/TwoFAVerifyPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './App.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage.jsx'));
const NewInvoicePage = lazy(() => import('./pages/NewInvoicePage.jsx'));
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
const CustomersPage = lazy(() => import('./pages/CustomersPage.jsx'));
const NewCustomerPage = lazy(() => import('./pages/NewCustomerPage.jsx'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage.jsx'));
const AccountManagementPage = lazy(() => import('./pages/AccountManagementPage.jsx'));
const EtiketPage = lazy(() => import('./pages/EtiketPage.jsx'));
const TasksBoardPage = lazy(() => import('./pages/TasksBoardPage.jsx'));
const BankCardsPage = lazy(() => import('./pages/BankCardsPage.jsx'));
const BankAccountsPage = lazy(() => import('./pages/BankAccountsPage.jsx'));
const NewBankAccountPage = lazy(() => import('./pages/NewBankAccountPage.jsx'));
const BankAccountDetailPage = lazy(() => import('./pages/BankAccountDetailPage.jsx'));

const FundsPage = lazy(() => import('./pages/FundsPage.jsx'));
const ChequesPage = lazy(() => import('./pages/ChequesPage.jsx'));
const TransfersPage = lazy(() => import('./pages/TransfersPage.jsx'));
const BankAccountStatementPage = lazy(() => import('./pages/BankAccountStatementPage.jsx'));


const BusinessSettings = lazy(() => import('./pages/settings/BusinessSettings.jsx'));
const UserRolls = lazy(() => import('./pages/settings/UserRolls.jsx'));
const UserPermissions = lazy(() => import('./pages/settings/UserPermissions.jsx'));
const PrintSettings = lazy(() => import('./pages/settings/PrintSettings.jsx'));
const TaxSettings = lazy(() => import('./pages/settings/TaxSettings.jsx'));
const AvatarSettings = lazy(() => import('./pages/settings/AvatarSettings.jsx'));
const LogsViewer = lazy(() => import('./pages/settings/LogsViewer.jsx'));
const ExtraCurrencies = lazy(() => import('./pages/settings/ExtraCurrencies.jsx'));

function BackgroundManager() {
  const location = useLocation();
  useEffect(() => {
    const authPaths = ['/login', '/request-password-reset', '/reset-password', '/2fa-verify'];
    if (authPaths.includes(location.pathname)) { document.body.classList.add('login-page-background'); }
    else { document.body.classList.remove('login-page-background'); }
    return () => { document.body.classList.remove('login-page-background'); };
  }, [location.pathname]);
  return null;
}

function MainLayout({ children, isSidebarCollapsed, setIsSidebarCollapsed, onThemeChange, currentTheme }) {
  const navigate = useNavigate();
  return (
    <Layout style={{ minHeight: '100vh', direction: 'rtl' }}>
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <Layout className="site-layout">
        <Layout.Header style={{ padding: '0 24px', background: currentTheme === 'dark' ? '#141414' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid', borderColor: currentTheme === 'dark' ? '#303030' : '#f0f0f0' }}>
            <Switch checkedChildren={<SunOutlined />} unCheckedChildren={<MoonOutlined />} onChange={(checked) => onThemeChange(checked ? 'light' : 'dark')} checked={currentTheme === 'light'} />
        </Layout.Header>
        <Layout.Content style={{ margin: '16px', overflow: 'initial' }}> {children} </Layout.Content>
      </Layout>
      <FloatButton.Group trigger="click" type="primary" style={{ bottom: 30, left: 30 }} icon={<PlusOutlined />} tooltip="ثبت جدید" >
        <FloatButton icon={<FaTags />} tooltip={{ title: "افزودن اتیکت", placement: "right" }} onClick={() => navigate('/etiket')} />
        <FloatButton icon={<FaFileInvoiceDollar />} tooltip={{ title: "فاکتور جدید", placement: "right" }} onClick={() => navigate('/invoices/new')} />
        <FloatButton icon={<FaUserPlus />} tooltip={{ title: "مخاطب جدید", placement: "right" }} onClick={() => navigate('/customers/new')} />
      </FloatButton.Group>
    </Layout>
  );
}

function App() {
  const isAuthenticated = !!localStorage.getItem('authToken');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => { const savedState = localStorage.getItem('sidebarCollapsed'); return savedState !== null ? JSON.parse(savedState) : false; });
  const [currentTheme, setCurrentTheme] = useState(() => { return localStorage.getItem('appTheme') || 'light'; });

  useEffect(() => { localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed)); }, [isSidebarCollapsed]);
  useEffect(() => { localStorage.setItem('appTheme', currentTheme); document.body.setAttribute('data-theme', currentTheme); }, [currentTheme]);

  const antdAppTheme = { algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm, };

  return (
    <ConfigProvider theme={antdAppTheme} direction="rtl">
      <BackgroundManager />
      <Suspense fallback={<div className="page-loading-fallback">در حال بارگذاری...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/2fa-verify" element={<TwoFAVerifyPage />} />
          <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} onThemeChange={setCurrentTheme} currentTheme={currentTheme} >
                <Routes>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="customers/new" element={<NewCustomerPage />} />
                  <Route path="customer/:customerId" element={<CustomerDetailPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/new" element={<NewInvoicePage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="etiket" element={<EtiketPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="tasks" element={<TasksBoardPage />} />
                  <Route path="account/settings" element={<AccountManagementPage />} />
                  <Route path="settings/system" element={<SystemSettingsPage />} />
                  <Route path="settings/business" element={<BusinessSettings />} />
                  <Route path="settings/users" element={<UserRolls />} />
                  <Route path="settings/users/permissions/:email" element={<UserPermissions />} />
                  <Route path="settings/print" element={<PrintSettings />} />
                  <Route path="settings/tax" element={<TaxSettings />} />
                  <Route path="settings/avatar" element={<AvatarSettings />} />
                  <Route path="settings/logs" element={<LogsViewer />} />
                  <Route path="settings/currencies" element={<ExtraCurrencies />} />
                  <Route path="bank-accounts" element={<BankAccountsPage />} />
                  <Route path="bank-accounts/new" element={<NewBankAccountPage />} />
                  <Route path="bank-accounts/edit/:id" element={<NewBankAccountPage />} />
                  <Route path="bank-accounts/detail/:id" element={<BankAccountDetailPage />} />
                  <Route path="bank-cards" element={<BankCardsPage />} />

                  {/* مسیرهای تنخواه گردان از اینجا حذف شد */}
                  
                  <Route path="funds" element={<FundsPage />} />
                  <Route path="cheques" element={<ChequesPage />} />
                  <Route path="transfers" element={<TransfersPage />} />
                  <Route path="reports/bank-statement" element={<BankAccountStatementPage />} />
                  <Route path="reports/bank-statement/:code" element={<BankAccountStatementPage />} />
                  
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }/>
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Suspense>
    </ConfigProvider>
  );
}

function AppWrapper() { return ( <Router> <App /> </Router> ); }
export default AppWrapper;