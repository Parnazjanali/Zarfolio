// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css';
<<<<<<< HEAD
<<<<<<< HEAD
import loginPageImage from '../assets/login.jpg'; // Assuming your image is at src/assets/login.jpg
=======
>>>>>>> a0c457fcc9f4770fe83ca040921b7f15e882437c
=======
import loginPageImage from '../assets/login.jpg'; // Ensure this path is correct
import { FaInstagram, FaTelegramPlane, FaWhatsapp, FaHeart } from 'react-icons/fa';
>>>>>>> main

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const [hoveredSocial, setHoveredSocial] = useState(null);

  const socialLinks = [
    { platform: 'instagram', icon: <FaInstagram />, text: '@YourInstaID', color: '#E1306C', hoverColor: '#c13584' },
    { platform: 'telegram', icon: <FaTelegramPlane />, text: '@YourTelegramID', color: '#0088cc', hoverColor: '#0077b5' },
    { platform: 'whatsapp', icon: <FaWhatsapp />, text: '+989120000000', color: '#25D366', hoverColor: '#1DA851' },
  ];

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  useEffect(() => {
    // Redirect if already logged in (and not by the temporary admin)
    const token = localStorage.getItem('authToken');
    // Avoid redirecting if it's the dummy token and we just logged in with admin
    // This specific useEffect for redirecting if already logged in might be better handled
    // by the Router in App.jsx for the /login route.
    if (token && token !== 'dummy-admin-token') { // Be careful with this logic if real tokens can be 'dummy-admin-token'
      navigate('/dashboard', { replace: true });
    } else if (token === 'dummy-admin-token' && !localStorage.getItem('showReleaseNotes')) {
      // If it's a dummy token but we are not meant to show release notes (meaning we already passed that stage)
      // navigate('/dashboard', { replace: true }); // This might be too aggressive
    }
  }, [navigate]);


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
<<<<<<< HEAD
      localStorage.setItem('authToken', 'dummy-admin-token'); // Set a dummy token for admin
=======
>>>>>>> a0c457fcc9f4770fe83ca040921b7f15e882437c
=======
      localStorage.setItem('authToken', 'dummy-admin-token');
      localStorage.setItem('showReleaseNotes', 'true'); // Flag to show release notes on dashboard
>>>>>>> main
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
          localStorage.setItem('showReleaseNotes', 'true'); // Also show for real login
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

  const handleSocialMouseEnter = (platform) => {
    setHoveredSocial(platform);
  };

  const handleSocialMouseLeave = () => {
    setHoveredSocial(null);
  };

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <div className="login-page-container">
=======
    <div className="login-card">
>>>>>>> main
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
          {message && (
            <div
              className={`message-display ${isError ? 'error-message' : 'success-message'} ${showMessage ? 'show' : ''}`}
            >
              {message}
            </div>
          )}

          <div className="contact-us-section">
            <h4 className="contact-us-title">ارتباط با ما</h4>
            <div className="social-buttons-container">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href="#" // Replace with actual links
                  className={`social-button ${social.platform} ${hoveredSocial === social.platform ? 'hovered' : ''}`}
                  onMouseEnter={() => handleSocialMouseEnter(social.platform)}
                  onMouseLeave={handleSocialMouseLeave}
                  style={{
                    '--social-color': social.color,
                    '--social-hover-color': social.hoverColor
                  }}
                  aria-label={social.platform}
                >
                  <span className="social-icon">{social.icon}</span>
                  <span className="social-text">
                    {hoveredSocial === social.platform ? social.text : ''}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="made-with-love">
            MADE WITH <FaHeart className="heart-icon" />{'\u00A0\u00A0'}BY PARNAZ
          </div>
          <div className="app-version">
            نسخه 0.0.2 beta
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