// frontend/src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './AuthForms.css'; // Reuse existing auth form styles
import { FaLock, FaKey, FaEye, FaEyeSlash, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError('توکن بازنشانی نامعتبر یا موجود نیست. لطفاً دوباره درخواست دهید.');
      // Consider redirecting to login or request page if no token
      // navigate('/login');
    }
  }, [location.search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (!password || !confirmPassword) {
      setError('لطفاً رمز عبور جدید و تکرار آن را وارد کنید.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن یکسان نیستند.');
      setIsLoading(false);
      return;
    }

    // Basic password strength check (e.g., min length) - can be enhanced
    if (password.length < 8) {
        setError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
        setIsLoading(false);
        return;
    }

    if (!token) {
        setError('توکن بازنشانی نامعتبر است. لطفاً از طریق لینک ارسال شده به ایمیل خود اقدام کنید.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }), // Ensure field name matches backend
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'رمز عبور شما با موفقیت بازنشانی شد. اکنون می‌توانید با رمز جدید وارد شوید.');
        // Optionally redirect to login page after a delay
        setTimeout(() => {
          navigate('/login', { state: { successMessage: 'رمز عبور با موفقیت بازنشانی شد.' } });
        }, 2000);
      } else {
        setError(data.message || 'خطا در بازنشانی رمز عبور. ممکن است توکن نامعتبر یا منقضی شده باشد.');
      }
    } catch (err) {
      console.error('Reset Password error:', err);
      setError('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card" style={{ maxWidth: '480px' }}>
        <div className="login-form-section">
          <div className="auth-container">
            <header className="auth-header">
              <span className="auth-header-icon"><FaKey /></span>
              <h2>تنظیم رمز عبور جدید</h2>
            </header>
            <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
              یک رمز عبور جدید برای حساب خود انتخاب کنید.
            </p>

            {!token && error && ( // Show only critical error if token is missing
                 <div className="message-banner error visible" style={{marginTop:'10px', marginBottom:'10px'}}>{error}</div>
            )}

            {token && (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="new-password"><FaLock /> رمز عبور جدید</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="new-password"
                      className="form-control"
                      placeholder="رمز عبور جدید خود را وارد کنید"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-new-password"><FaLock /> تکرار رمز عبور جدید</label>
                   <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-new-password"
                      className="form-control"
                      placeholder="رمز عبور جدید را مجدداً وارد کنید"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                     <button
                      type="button"
                      className="toggle-password-visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {message && <div className="message-banner success visible" style={{marginTop:'10px', marginBottom:'10px'}}>{message}</div>}
                {error && <div className="message-banner error visible" style={{marginTop:'10px', marginBottom:'10px'}}>{error}</div>}

                <button type="submit" className="auth-button" disabled={isLoading || !token} style={{ marginTop: '15px' }}>
                  {isLoading ? <span className="spinner-sm"></span> : <FaKey />}
                  {isLoading ? 'در حال بازنشانی...' : 'بازنشانی رمز عبور'}
                </button>
              </form>
            )}

            <div className="auth-toggle-section" style={{ marginTop: '25px' }}>
              <Link to="/login" className="toggle-auth-button">
                 <FaArrowLeft style={{ marginLeft: '5px' }} /> بازگشت به صفحه ورود
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
