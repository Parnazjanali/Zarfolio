// frontend/src/pages/AccountManagementPage.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import './AuthForms.css'; // Reusing some auth form styles
import { FaUserEdit, FaLock, FaKey, FaSpinner, FaShieldAlt, FaQrcode, FaMobileAlt, FaUserShield, FaListOl } from 'react-icons/fa'; // Additional icons
import QRCode from 'qrcode.react'; // For displaying QR codes

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

  // State for 2FA Management
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false); // Initial assumption, fetch actual status
  const [twoFASecret, setTwoFASecret] = useState(''); // Raw secret for manual entry display
  const [qrCodeUrl, setQrCodeUrl] = useState('');   // For QR code image
  const [totpCode, setTotpCode] = useState('');     // For user to enter during enable
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [passwordFor2FADisable, setPasswordFor2FADisable] = useState('');

  const [twoFAMessage, setTwoFAMessage] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [isTwoFALoading, setIsTwoFALoading] = useState(false); // General loading for 2FA section
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [twoFASetupStage, setTwoFASetupStage] = useState('initial'); // 'initial', 'generated', 'enabled'

  const getAuthToken = () => localStorage.getItem('authToken');

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
        try {
            const userData = JSON.parse(storedUserData);
            if (userData && typeof userData.is_two_fa_enabled === 'boolean') {
                setIsTwoFAEnabled(userData.is_two_fa_enabled);
                if (userData.is_two_fa_enabled) {
                    setTwoFASetupStage('enabled');
                }
            } else {
                 // If not in userData, ideally fetch from a /me or /account/status endpoint
                 // For now, assume false if not present.
                 console.warn("is_two_fa_enabled not found in userData, defaulting to false.");
                 setIsTwoFAEnabled(false);
            }
        } catch (e) {
            console.error("Failed to parse userData for 2FA status:", e);
            // Fallback or fetch from API
        }
    }
    // TODO: Consider a dedicated API call to get current user details including 2FA status
    // if not reliably available or to ensure freshness.
  }, []);

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

  const handleGenerate2FASecret = async () => {
    setIsTwoFALoading(true);
    setTwoFAError('');
    setTwoFAMessage('');
    setQrCodeUrl('');
    setTwoFASecret('');
    setRecoveryCodes([]);
    setShowRecoveryCodes(false);

    try {
        const response = await fetch(`${API_BASE_URL}/account/2fa/generate-secret`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        });
        const data = await response.json();
        if (response.ok) {
            setQrCodeUrl(data.qr_code_url);
            setTwoFASecret(data.secret); // For manual entry display
            setTwoFASetupStage('generated');
        } else {
            setTwoFAError(data.message || 'خطا در تولید اطلاعات 2FA.');
        }
    } catch (err) {
        setTwoFAError('خطا در ارتباط با سرور برای تولید اطلاعات 2FA.');
    } finally {
        setIsTwoFALoading(false);
    }
  };

  const handleVerifyAndEnable2FA = async (e) => {
    e.preventDefault();
    setIsTwoFALoading(true);
    setTwoFAError('');
    setTwoFAMessage('');
    setRecoveryCodes([]);

    if (!totpCode) {
        setTwoFAError('کد تایید 2FA را وارد کنید.');
        setIsTwoFALoading(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/account/2fa/enable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ totp_code: totpCode }),
        });
        const data = await response.json();
        if (response.ok) {
            setIsTwoFAEnabled(true);
            setRecoveryCodes(data.recovery_codes || []);
            setShowRecoveryCodes(true); // Show recovery codes immediately
            setTwoFAMessage('2FA با موفقیت فعال شد! کدهای بازیابی خود را ذخیره کنید.');
            setTwoFASetupStage('enabled');
            setTotpCode(''); // Clear TOTP input
            // Update localStorage userData
            const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            storedUserData.is_two_fa_enabled = true;
            localStorage.setItem('userData', JSON.stringify(storedUserData));

        } else {
            setTwoFAError(data.message || 'خطا در فعال‌سازی 2FA. کد ممکن است نامعتبر باشد.');
        }
    } catch (err) {
        setTwoFAError('خطا در ارتباط با سرور برای فعال‌سازی 2FA.');
    } finally {
        setIsTwoFALoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setIsTwoFALoading(true);
    setTwoFAError('');
    setTwoFAMessage('');

    if (!passwordFor2FADisable) {
        setTwoFAError('برای غیرفعال‌سازی 2FA، رمز عبور فعلی خود را وارد کنید.');
        setIsTwoFALoading(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/account/2fa/disable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ current_password: passwordFor2FADisable }),
        });
        const data = await response.json();
        if (response.ok) {
            setIsTwoFAEnabled(false);
            setTwoFAMessage(data.message || '2FA با موفقیت غیرفعال شد.');
            setQrCodeUrl('');
            setTwoFASecret('');
            setRecoveryCodes([]);
            setShowRecoveryCodes(false);
            setPasswordFor2FADisable('');
            setTwoFASetupStage('initial');
             // Update localStorage userData
            const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            storedUserData.is_two_fa_enabled = false;
            localStorage.setItem('userData', JSON.stringify(storedUserData));
        } else {
            setTwoFAError(data.message || 'خطا در غیرفعال‌سازی 2FA. رمز عبور ممکن است نادرست باشد.');
        }
    } catch (err) {
        setTwoFAError('خطا در ارتباط با سرور برای غیرفعال‌سازی 2FA.');
    } finally {
        setIsTwoFALoading(false);
    }
  };

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
      <section style={{ ...sectionStyles /* Apply sectionStyles here too */ }}>
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
