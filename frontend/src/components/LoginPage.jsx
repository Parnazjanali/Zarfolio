import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css'; // برای استایل‌دهی فرم

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  // آدرس پایه API را از متغیرهای محیطی می‌خوانیم
  // اگر از Vite استفاده می‌کنید:
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; // یک مقدار پیش‌فرض برای تست محلی
  // اگر از Create React App (CRA) استفاده می‌کنید:
  // const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


  useEffect(() => {
    if (message) {
      setShowMessage(true);
      // برای محو شدن خودکار پیام پس از مدتی (اختیاری)
      /*
      const timer = setTimeout(() => {
        setShowMessage(false);
        // اگر می‌خواهید خود پیام هم پاک شود تا فضای اشغال نکند:
        // setMessage('');
      }, 5000); // پیام بعد از 5 ثانیه محو می‌شود
      return () => clearTimeout(timer);
      */
    } else {
      setShowMessage(false);
    }
  }, [message]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(''); // این باعث اجرای useEffect و مخفی شدن پیام قبلی می‌شود
    setIsError(false);
    // setShowMessage(false); // اطمینان از بسته بودن پیام قبل از ارسال جدید

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
        setIsError(false); // اطمینان از اینکه isError برای پیام موفقیت false است
        setMessage(data.message || 'ورود موفقیت‌آمیز بود!');
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          console.log('JWT Token received:', data.token);
        }
        setTimeout(() => navigate('/dashboard'), 2000); // تاخیر برای نمایش پیام موفقیت
      } else {
        setIsError(true);
        setMessage(data.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch (error) {
      console.error('خطا در هنگام ورود:', error);
      setIsError(true);
      setMessage('خطای شبکه یا سرور در دسترس نیست. لطفاً بعداً تلاش کنید.');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">ورود به سیستم حسابداری طلا و جواهر</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">:نام کاربری</label>
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
          <label htmlFor="password">:رمز عبور</label>
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
      <div
        className={`message-display ${isError ? 'error-message' : 'success-message'} ${showMessage ? 'show' : ''}`}
      >
        {message}
      </div>
    </div>
  );
}

export default LoginPage;
