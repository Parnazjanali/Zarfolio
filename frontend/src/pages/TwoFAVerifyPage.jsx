import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TwoFAVerifyPage.css'; // ایمپورت کردن فایل CSS اختصاصی
import loginPageImage from '../assets/login.jpg'; // ایمپورت تصویر برای نمایش در کنار فرم
import { FaShieldAlt } from 'react-icons/fa';

// آدرس پایه API از متغیرهای محیطی خوانده می‌شود
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const TwoFAVerifyPage = () => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
      setError('لطفاً یک کد ۶ رقمی معتبر وارد کنید.');
      return;
    }

    setIsLoading(true);
    const userId = localStorage.getItem('2fa_user_id');

    if (!userId) {
      setError('خطایی رخ داد: شناسه کاربر یافت نشد. لطفاً دوباره وارد شوید.');
      setIsLoading(false);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, totp_code: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'کد تایید نامعتبر است.');
      }

      // اگر تایید موفقیت آمیز بود، توکن نهایی و اطلاعات کاربر دریافت می‌شود
      if (data.token && data.user) {
        setSuccessMessage('تایید با موفقیت انجام شد. در حال انتقال به داشبورد...');
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.removeItem('2fa_user_id'); // حذف شناسه موقت
        
        login(); // به‌روزرسانی وضعیت احراز هویت در کل برنامه

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
          throw new Error('پاسخ سرور نامعتبر است.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-container">
        <div className="login-form-section">
          <div className="login-form-container">
            <h2 className="form-title">تایید دو مرحله‌ای</h2>
            <p className="form-subtitle">
              کد ۶ رقمی ایجاد شده توسط برنامه Authenticator خود را وارد کنید.
            </p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <FaShieldAlt className="input-icon" />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength="6"
                  placeholder="کد تایید"
                  required
                  className="auth-input"
                  disabled={isLoading}
                  style={{ textAlign: 'center', letterSpacing: '0.5em' }}
                />
              </div>

              {error && <p className="error-message">{error}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? 'در حال بررسی...' : 'تایید و ورود'}
              </button>
            </form>
          </div>
        </div>
        <div className="login-image-section">
          <img src={loginPageImage} alt="تایید هویت" />
        </div>
      </div>
    </div>
  );
};

export default TwoFAVerifyPage;