// frontend/src/pages/RequestPasswordResetPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthForms.css'; // Reuse existing auth form styles
import { FaEnvelope, FaPaperPlane, FaSignInAlt, FaArrowLeft } from 'react-icons/fa'; // Added FaArrowLeft

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (!email) {
      setError('لطفاً ایمیل خود را وارد کنید.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/password/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (response.ok) {
        // Backend should return a generic success message to prevent email enumeration
        setMessage(data.message || 'اگر ایمیل شما در سیستم ما موجود باشد، یک لینک بازنشانی رمز عبور برایتان ارسال خواهد شد.');
        setEmail(''); // Clear the input field on success
      } else {
        // Handle errors from backend (e.g. validation, internal server error)
        setError(data.message || 'خطایی در ارسال درخواست رخ داد. لطفاً دوباره تلاش کنید.');
      }
    } catch (err) {
      console.error('Request Password Reset error:', err);
      setError('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container"> {/* Reusing login-page-container for centering */}
      <div className="login-card" style={{ maxWidth: '450px' }}> {/* Reusing login-card for structure */}
        <div className="login-form-section"> {/* Reusing login-form-section */}
          <div className="auth-container">
            <header className="auth-header">
              <span className="auth-header-icon"><FaEnvelope /></span>
              <h2>بازیابی رمز عبور</h2>
            </header>
            <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
              ایمیل حساب کاربری خود را وارد کنید تا لینک بازنشانی رمز عبور را برایتان ارسال کنیم.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email"><FaEnvelope /> ایمیل</label>
                <input
                  type="email"
                  id="reset-email"
                  className="form-control"
                  placeholder="ایمیل خود را وارد کنید"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {message && <div className="message-banner success visible" style={{marginTop:'10px', marginBottom:'10px'}}>{message}</div>}
              {error && <div className="message-banner error visible" style={{marginTop:'10px', marginBottom:'10px'}}>{error}</div>}

              <button type="submit" className="auth-button" disabled={isLoading} style={{ marginTop: '15px' }}>
                {isLoading ? <span className="spinner-sm"></span> : <FaPaperPlane />}
                {isLoading ? 'در حال ارسال...' : 'ارسال لینک بازنشانی'}
              </button>
            </form>

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

export default RequestPasswordResetPage;
