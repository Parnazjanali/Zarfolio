import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css'; // برای استایل‌دهی فرم

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  // آدرس پایه API را از متغیرهای محیطی می‌خوانیم
  // اگر از Vite استفاده می‌کنید:
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // اگر از Create React App (CRA) استفاده می‌کنید:
  // const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleLogin = async (e) => {
    e.preventDefault(); // جلوگیری از رفرش صفحه هنگام سابمیت فرم
    setMessage(''); // پاک کردن پیام‌های قبلی
    setIsError(false); // ریست کردن وضعیت خطا

    if (!username || !password) {
      setMessage('نام کاربری و رمز عبور نمی‌توانند خالی باشند.');
      setIsError(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'ورود موفقیت‌آمیز بود!');
        // اگر توکن از بک‌اند دریافت شد، آن را در localStorage ذخیره می‌کنیم
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          console.log('JWT Token received:', data.token);
        }
        // بعد از ورود موفق، به صفحه داشبورد یا اصلی سیستم طلا و جواهر هدایت می‌کنیم
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setMessage(data.message || 'نام کاربری یا رمز عبور اشتباه است.');
        setIsError(true);
      }
    } catch (error) {
      console.error('خطا در هنگام ورود:', error);
      setMessage('خطای شبکه یا سرور در دسترس نیست.');
      setIsError(true);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">ورود به سیستم حسابداری طلا و جواهر</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">نام کاربری:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-label="نام کاربری"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">رمز عبور:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="رمز عبور"
          />
        </div>
        <button type="submit" className="submit-button">ورود</button>
      </form>
      {message && (
        <p className={isError ? 'error-message' : 'success-message'}>
          {message}
        </p>
      )}
    </div>
  );
}

export default LoginPage;