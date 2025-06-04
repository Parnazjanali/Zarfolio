// frontend/src/pages/AccountManagementPage.jsx
import React, { useState } from 'react';
import './AuthForms.css'; // Reusing some auth form styles
import { FaUserEdit, FaLock, FaKey, FaSpinner } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

function AccountManagementPage() {
  // State for Change Username
  const [newUsername, setNewUsername] = useState('');
  const [currentPasswordForUsername, setCurrentPasswordForUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);

  // State for Change Password
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const getAuthToken = () => localStorage.getItem('authToken');

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    setIsUsernameLoading(true);
    setUsernameMessage('');
    setUsernameError('');

    if (!newUsername || !currentPasswordForUsername) {
      setUsernameError('لطفاً نام کاربری جدید و رمز عبور فعلی را وارد کنید.');
      setIsUsernameLoading(false);
      return;
    }
    if (newUsername.length < 3) {
      setUsernameError('نام کاربری جدید باید حداقل ۳ کاراکتر باشد.');
      setIsUsernameLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/change-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          new_username: newUsername,
          current_password: currentPasswordForUsername,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setUsernameMessage(data.message || 'نام کاربری با موفقیت تغییر کرد.');
        setNewUsername('');
        setCurrentPasswordForUsername('');
        // Potentially update username in localStorage if stored there, or force re-login/token refresh
      } else {
        setUsernameError(data.message || 'خطا در تغییر نام کاربری.');
      }
    } catch (err) {
      console.error('Change username error:', err);
      setUsernameError('خطا در ارتباط با سرور.');
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPasswordForPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('لطفاً تمام فیلدهای رمز عبور را پر کنید.');
      setIsPasswordLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('رمز عبور جدید و تکرار آن یکسان نیستند.');
      setIsPasswordLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
      setIsPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          current_password: currentPasswordForPassword,
          new_password: newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordMessage(data.message || 'رمز عبور با موفقیت تغییر کرد.');
        setCurrentPasswordForPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordError(data.message || 'خطا در تغییر رمز عبور.');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError('خطا در ارتباط با سرور.');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Basic container styling, can be enhanced with a dedicated CSS file or more specific classes
  const pageStyles = {
    padding: '20px',
    maxWidth: '700px',
    margin: '40px auto',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };
  const sectionStyles = {
    marginBottom: '40px',
    paddingBottom: '30px',
    borderBottom: '1px solid #eee',
  };
   const h2Styles = {
    marginBottom: '20px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  };
  const iconStyles = {
    marginRight: '10px',
    color: 'var(--primary-color)', // Using CSS variable from AuthForms.css
  }


  return (
    <div style={pageStyles}>
      <h1 style={{textAlign: 'center', marginBottom: '40px', color: '#333'}}>تنظیمات حساب کاربری</h1>

      {/* Change Username Section */}
      <section style={sectionStyles}>
        <h2 style={h2Styles}><FaUserEdit style={iconStyles} /> تغییر نام کاربری</h2>
        <form onSubmit={handleChangeUsername} className="auth-form" style={{padding:0, boxShadow:'none'}}>
          <div className="form-group">
            <label htmlFor="newUsername">نام کاربری جدید</label>
            <input
              type="text"
              id="newUsername"
              className="form-control"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="currentPasswordForUsername">رمز عبور فعلی</label>
            <input
              type="password"
              id="currentPasswordForUsername"
              className="form-control"
              value={currentPasswordForUsername}
              onChange={(e) => setCurrentPasswordForUsername(e.target.value)}
              required
            />
          </div>
          {usernameMessage && <div className="message-banner success visible">{usernameMessage}</div>}
          {usernameError && <div className="message-banner error visible">{usernameError}</div>}
          <button type="submit" className="auth-button" disabled={isUsernameLoading}>
            {isUsernameLoading ? <FaSpinner className="spinner-sm" /> : 'تغییر نام کاربری'}
          </button>
        </form>
      </section>

      {/* Change Password Section */}
      <section>
        <h2 style={h2Styles}><FaKey style={iconStyles} /> تغییر رمز عبور</h2>
        <form onSubmit={handleChangePassword} className="auth-form" style={{padding:0, boxShadow:'none'}}>
          <div className="form-group">
            <label htmlFor="currentPasswordForPassword">رمز عبور فعلی</label>
            <input
              type="password"
              id="currentPasswordForPassword"
              className="form-control"
              value={currentPasswordForPassword}
              onChange={(e) => setCurrentPasswordForPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">رمز عبور جدید</label>
            <input
              type="password"
              id="newPassword"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmNewPassword">تکرار رمز عبور جدید</label>
            <input
              type="password"
              id="confirmNewPassword"
              className="form-control"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>
          {passwordMessage && <div className="message-banner success visible">{passwordMessage}</div>}
          {passwordError && <div className="message-banner error visible">{passwordError}</div>}
          <button type="submit" className="auth-button" disabled={isPasswordLoading}>
            {isPasswordLoading ? <FaSpinner className="spinner-sm" /> : 'تغییر رمز عبور'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AccountManagementPage;
