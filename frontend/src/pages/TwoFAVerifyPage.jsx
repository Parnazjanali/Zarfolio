import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from 'antd'; // ایمپورت کامپوننت Button از Ant Design
import { ArrowLeftOutlined } from '@ant-design/icons'; // ایمپورت آیکون از Ant Design
import './TwoFAVerifyPage.css';
import loginPageImage from '../assets/lock.jpg';
import { FaShieldAlt } from 'react-icons/fa';

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

      if (data.token && data.user) {
        setSuccessMessage('تایید با موفقیت انجام شد. در حال انتقال به داشبورد...');
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.removeItem('2fa_user_id');
        
        login();

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
          <Button
            className="back-button"
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            بازگشت
          </Button>
          <div className="login-form-container">
            <h2 className="form-title">تایید دو مرحله‌ای</h2>
            <p className="form-subtitle">
              کد 6 رقمی ایجاد شده در برنامه احراز هویت خود را وارد کنید تا هویت شما تایید شود.
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