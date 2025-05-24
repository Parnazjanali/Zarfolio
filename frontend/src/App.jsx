import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import './App.css'; // برای استایل‌های کلی (اختیاری)

// یک کامپوننت ساده برای داشبورد (که بعداً تکمیل می‌شود)
function DashboardPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>به سیستم حسابداری طلا و جواهر خوش آمدید!</h1>
      <p>شما با موفقیت وارد شدید.</p>
      {/* اینجا می‌توانید دکمه خروج یا لینک به بخش‌های دیگر اضافه کنید */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* نوار ناوبری را حذف کردیم چون فعلا فقط صفحه لاگین داریم */}
        {/* <nav className="navbar">
          <Link to="/login" className="nav-link">Login</Link>
        </nav> */}
        <div className="content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* مسیر پیش‌فرض را به صفحه لاگین هدایت می‌کنیم */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;