// frontend/src/pages/AccountManagementPage.jsx
import React, { useState, useEffect } from 'react';
import './AuthForms.css'; // Reusing some auth form styles
import { FaUserEdit, FaLock, FaKey, FaSpinner, FaShieldAlt, FaQrcode, FaMobileAlt, FaUserShield, FaListOl, FaCamera, FaUserCircle as DefaultUserIcon } from 'react-icons/fa'; // Added FaCamera, DefaultUserIcon
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

  // State for Profile Picture
  const [currentProfilePictureURL, setCurrentProfilePictureURL] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreviewURL, setProfilePicturePreviewURL] = useState('');
  const [profilePictureMessage, setProfilePictureMessage] = useState('');
  const [profilePictureError, setProfilePictureError] = useState('');
  const [isProfilePictureLoading, setIsProfilePictureLoading] = useState(false);

  const getAuthToken = () => localStorage.getItem('authToken');

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
        try {
            const userData = JSON.parse(storedUserData);
            if (userData) {
                if (typeof userData.is_two_fa_enabled === 'boolean') {
                    setIsTwoFAEnabled(userData.is_two_fa_enabled);
                    if (userData.is_two_fa_enabled) {
                        setTwoFASetupStage('enabled');
                    }
                } else {
                    console.warn("is_two_fa_enabled not found in userData, defaulting to false.");
                    setIsTwoFAEnabled(false);
                }
                if (userData.profile_picture_url) {
                    // Assuming profile_picture_url is the full relative path from apiGateway's perspective
                    setCurrentProfilePictureURL(userData.profile_picture_url);
                }
            }
        } catch (e) {
            console.error("Failed to parse userData: ", e);
        }
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setProfilePictureError('فایل انتخاب شده بزرگتر از ۲ مگابایت است.');
            setProfilePictureFile(null);
            setProfilePicturePreviewURL('');
            return;
        }
        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setProfilePictureError('نوع فایل معتبر نیست. فقط JPG و PNG مجاز است.');
            setProfilePictureFile(null);
            setProfilePicturePreviewURL('');
            return;
        }
        setProfilePictureFile(file);
        setProfilePicturePreviewURL(URL.createObjectURL(file));
        setProfilePictureError(''); // Clear previous error
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePictureFile) {
        setProfilePictureError('لطفاً ابتدا یک فایل عکس انتخاب کنید.');
        return;
    }
    setIsProfilePictureLoading(true);
    setProfilePictureMessage('');
    setProfilePictureError('');

    const formData = new FormData();
    formData.append('profile_picture', profilePictureFile);

    try {
        const response = await fetch(`${API_BASE_URL}/account/profile-picture`, {
            method: 'POST',
            headers: {
                // 'Content-Type': 'multipart/form-data' // Browser sets this with boundary
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: formData,
        });
        const data = await response.json();
        if (response.ok) {
            setProfilePictureMessage(data.message || 'عکس پروفایل با موفقیت آپلود شد.');
            const newImageURL = data.profile_picture_url;
            setCurrentProfilePictureURL(newImageURL);

            const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            storedUserData.profile_picture_url = newImageURL;
            localStorage.setItem('userData', JSON.stringify(storedUserData));

            setProfilePictureFile(null);
            setProfilePicturePreviewURL('');
        } else {
            setProfilePictureError(data.message || 'خطا در آپلود عکس پروفایل.');
        }
    } catch (err) {
        console.error('Profile picture upload error:', err);
        setProfilePictureError('خطا در ارتباط با سرور هنگام آپلود عکس.');
    } finally {
        setIsProfilePictureLoading(false);
    }
  };

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

      {/* Profile Picture Section */}
      <section style={sectionStyles}>
        <h2 style={h2Styles}><FaCamera style={iconStyles} /> عکس پروفایل</h2>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {currentProfilePictureURL ? (
            <img
              src={currentProfilePictureURL}
              alt="Profile"
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }}
              onError={(e) => { e.target.style.display='none'; /* Hide if broken */ }}
            />
          ) : (
            <DefaultUserIcon size={100} style={{ color: '#ccc', border: '2px solid #ddd', borderRadius: '50%', padding: '10px' }} />
          )}
        </div>
        <div className="form-group">
          <label htmlFor="profilePictureInput">انتخاب عکس جدید (JPG, PNG, حداکثر ۲مگابایت)</label>
          <input
            type="file"
            id="profilePictureInput"
            className="form-control"
            accept="image/jpeg, image/png"
            onChange={handleFileChange}
          />
        </div>
        {profilePicturePreviewURL && (
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <p>پیش‌نمایش:</p>
            <img src={profilePicturePreviewURL} alt="Preview" style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '4px', border: '1px solid #eee' }} />
          </div>
        )}
        {profilePictureMessage && <div className="message-banner success visible">{profilePictureMessage}</div>}
        {profilePictureError && <div className="message-banner error visible">{profilePictureError}</div>}
        <button
          onClick={handleProfilePictureUpload}
          className="auth-button"
          disabled={isProfilePictureLoading || !profilePictureFile}
          style={{marginTop: '10px'}}
        >
          {isProfilePictureLoading ? <FaSpinner className="spinner-sm" /> : 'آپلود عکس'}
        </button>
      </section>

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
      <section style={sectionStyles}> {/* Restore border-bottom if it's not the last section anymore */}
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

      {/* 2FA Management Section - Re-adding from Subtask 17 plan */}
      <section style={{ ...sectionStyles, borderBottom: 'none' }}>
        <h2 style={h2Styles}><FaUserShield style={iconStyles} /> مدیریت تایید دو مرحله‌ای (2FA)</h2>

        {twoFAMessage && <div className="message-banner success visible">{twoFAMessage}</div>}
        {twoFAError && <div className="message-banner error visible">{twoFAError}</div>}

        {!isTwoFAEnabled && twoFASetupStage === 'initial' && (
          <button onClick={handleGenerate2FASecret} className="auth-button" disabled={isTwoFALoading}>
            {isTwoFALoading ? <FaSpinner className="spinner-sm" /> : <><FaQrcode style={{marginRight:'5px'}}/> فعال‌سازی 2FA</>}
          </button>
        )}

        {twoFASetupStage === 'generated' && !isTwoFAEnabled && qrCodeUrl && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <p>1. برنامه Authenticator خود را باز کنید (مانند Google Authenticator, Authy).</p>
            <p>2. کد QR زیر را اسکن کنید یا کلید مخفی را دستی وارد نمایید:</p>
            <div style={{ margin: '20px 0', display: 'inline-block', border: '1px solid #ccc', padding: '10px' }}>
              <QRCode value={qrCodeUrl} size={200} level="H" />
            </div>
            <p><strong>کلید مخفی (برای ورود دستی):</strong></p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.1em', padding: '10px', backgroundColor: '#f5f5f5', display: 'inline-block', borderRadius: '4px', border: '1px solid #ddd', userSelect: 'all' }}>
              {twoFASecret}
            </p>
            <p style={{marginTop: '15px'}}>3. کد ۶ رقمی نمایش داده شده در برنامه Authenticator را وارد کنید:</p>
            <form onSubmit={handleVerifyAndEnable2FA} className="auth-form" style={{padding:0, boxShadow:'none', maxWidth:'300px', margin:'10px auto'}}>
              <div className="form-group">
                <label htmlFor="totpCode"><FaMobileAlt /> کد تایید 2FA</label>
                <input
                  type="text"
                  id="totpCode"
                  className="form-control"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="کد ۶ رقمی"
                  maxLength={6}
                  required
                  style={{textAlign:'center', letterSpacing: '0.2em'}}
                />
              </div>
              <button type="submit" className="auth-button" disabled={isTwoFALoading}>
                {isTwoFALoading ? <FaSpinner className="spinner-sm" /> : 'تایید و فعال‌سازی نهایی'}
              </button>
            </form>
          </div>
        )}

        {isTwoFAEnabled && twoFASetupStage === 'enabled' && (
          <div>
            <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center' }}><FaShieldAlt style={{marginRight:'8px', color:'green'}}/> تایید دو مرحله‌ای (2FA) برای حساب شما فعال است.</p>

            {showRecoveryCodes && recoveryCodes.length > 0 && (
              <div className="recovery-codes-section" style={{border:'1px solid orange', padding:'15px', borderRadius:'5px', backgroundColor:'#fff9e6', marginBottom:'20px'}}> {/* Corrected #naranja to orange */}
                <h3 style={{display:'flex', alignItems:'center', color:'#c67800'}}><FaListOl style={{marginRight:'8px'}}/> کدهای بازیابی (یکبار مصرف):</h3>
                <p style={{color:'#c67800'}}>این کدها را در مکانی امن ذخیره کنید. اگر به برنامه Authenticator خود دسترسی نداشته باشید، می‌توانید از این کدها برای ورود استفاده کنید. <strong>این کدها دیگر نمایش داده نخواهند شد.</strong></p>
                <ul style={{listStyleType:'none', paddingLeft:0, columns: 2, columnGap: '20px'}}>
                  {recoveryCodes.map((code, index) => (
                    <li key={index} style={{fontFamily:'monospace', fontSize:'1.1em', padding:'5px 0', borderBottom:'1px dashed #eee'}}>{code}</li>
                  ))}
                </ul>
                <button onClick={() => setShowRecoveryCodes(false)} className="auth-button minimal" style={{marginTop:'10px', backgroundColor:'transparent', color:'var(--primary-color)'}}>پنهان کردن کدها</button>
              </div>
            )}

            <form onSubmit={handleDisable2FA} className="auth-form" style={{padding:0, boxShadow:'none', marginTop: '20px'}}>
              <div className="form-group">
                <label htmlFor="passwordFor2FADisable">رمز عبور فعلی (برای غیرفعال‌سازی 2FA)</label>
                <input
                  type="password"
                  id="passwordFor2FADisable"
                  className="form-control"
                  value={passwordFor2FADisable}
                  onChange={(e) => setPasswordFor2FADisable(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-button danger" disabled={isTwoFALoading} style={{backgroundColor:'var(--error-text)'}}>
                {isTwoFALoading ? <FaSpinner className="spinner-sm" /> : 'غیرفعال‌سازی 2FA'}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

export default AccountManagementPage;
