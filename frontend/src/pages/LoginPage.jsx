// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css';
<<<<<<< HEAD
import loginPageImage from '../assets/login.jpg'; // Assuming your image is at src/assets/login.jpg
=======
>>>>>>> a0c457fcc9f4770fe83ca040921b7f15e882437c

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (message) {
      setShowMessage(true);
    } else {
      setShowMessage(false);
    }
  }, [message]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!username || !password) {
      setMessage('نام کاربری و رمز عبور نمی‌توانند خالی باشند.');
      setIsError(true);
      return;
    }

    if (username === 'admin' && password === 'admin') {
      setMessage('ورود موقت ادمین موفقیت‌آمیز بود!');
      setIsError(false);
<<<<<<< HEAD
      localStorage.setItem('authToken', 'dummy-admin-token'); // Set a dummy token for admin
=======
>>>>>>> a0c457fcc9f4770fe83ca040921b7f15e882437c
      console.log('Temporary admin login successful');
      setTimeout(() => navigate('/dashboard'), 1500);
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
        setIsError(false);
        setMessage(data.message || 'ورود موفقیت‌آمیز بود!');
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          console.log('JWT Token received:', data.token);
        }
        setTimeout(() => navigate('/dashboard'), 2000);
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
<<<<<<< HEAD
    <div className="login-page-container">
      <div className="login-form-section">
        <div className="auth-container">
          <h2 className="auth-title">ورود به سیستم حسابداری زرفولیو</h2>
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
          <div
            className={`message-display ${isError ? 'error-message' : 'success-message'} ${showMessage ? 'show' : ''}`}
          >
            {message}
          </div>
        </div>
      </div>
      <div className="login-image-section">
        <img src={loginPageImage} alt="نمای کلی برنامه زرفولیو" />
=======
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
      <div
        className={`message-display ${isError ? 'error-message' : 'success-message'} ${showMessage ? 'show' : ''}`}
      >
        {message}
>>>>>>> a0c457fcc9f4770fe83ca040921b7f15e882437c
      </div>
    </div>
  );
}

export default LoginPage;