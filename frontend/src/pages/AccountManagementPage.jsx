// frontend/src/pages/AccountManagementPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import './AuthForms.css'; // Reusing some auth form styles
import './AccountManagementPage.css'; // Import dedicated CSS
import { FaUserEdit, FaLock, FaKey, FaSpinner, FaShieldAlt, FaQrcode, FaMobileAlt, FaUserShield, FaListOl, FaCamera, FaUserCircle as DefaultUserIcon, FaEnvelope, FaIdCard, FaUserTag } from 'react-icons/fa'; // FaUserTag اضافه شد
import { QRCodeSVG } from 'qrcode.react'; //
import { TabsContainer, Tab, TabPanel } from '../components/Tabs'; //

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'; //

function AccountManagementPage() {
  // New state variables for profile section
  const [profileImageFile, setProfileImageFile] = useState(null); //
  const [preview, setPreview] = useState(null); //
  const fileInputRef = useRef(null); //
  const [firstName, setFirstName] = useState(''); //
  const [lastName, setLastName] = useState(''); //
  const [email, setEmail] = useState(''); //
  const [userRole, setUserRole] = useState(''); // ✅ **متغیر جدید برای نقش کاربری**
  const [userAccountCode, setUserAccountCode] = useState('ZF-12345678'); // Static for now
  const [isSavingProfile, setIsSavingProfile] = useState(false); // New state for profile save button

  // State for Change Username (Existing)
  const [newUsername, setNewUsername] = useState(''); //
  const [currentPasswordForUsername, setCurrentPasswordForUsername] = useState(''); //
  const [usernameMessage, setUsernameMessage] = useState(''); //
  const [usernameError, setUsernameError] = useState(''); //
  const [isUsernameLoading, setIsUsernameLoading] = useState(false); //

  // State for Change Password (Existing)
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState(''); //
  const [newPassword, setNewPassword] = useState(''); //
  const [confirmNewPassword, setConfirmNewPassword] = useState(''); //
  const [passwordMessage, setPasswordMessage] = useState(''); //
  const [passwordError, setPasswordError] = useState(''); //
  const [isPasswordLoading, setIsPasswordLoading] = useState(false); //

  // State for 2FA Management (Existing)
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false); //
  const [twoFASecret, setTwoFASecret] = useState(''); //
  const [qrCodeUrl, setQrCodeUrl] = useState(''); //
  const [totpCode, setTotpCode] = useState(''); //
  const [recoveryCodes, setRecoveryCodes] = useState([]); //
  const [passwordFor2FADisable, setPasswordFor2FADisable] = useState(''); //
  const [totpCodeForDisable, setTotpCodeForDisable] = useState(''); //
  const [twoFAMessage, setTwoFAMessage] = useState(''); //
  const [twoFAError, setTwoFAError] = useState(''); //
  const [isTwoFALoading, setIsTwoFALoading] = useState(false); //
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false); //
  const [twoFASetupStage, setTwoFASetupStage] = useState('initial'); //

  const getAuthToken = () => localStorage.getItem('authToken'); //

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData'); //
    if (storedUserData) {
        try {
            const userData = JSON.parse(storedUserData); //
            // Initialize 2FA status
            if (userData && typeof userData.is_two_fa_enabled !== 'undefined') { //
                const twoFAStatus = userData.is_two_fa_enabled; //
                setIsTwoFAEnabled(twoFAStatus); //
                if (twoFAStatus) {
                    setTwoFASetupStage('enabled'); //
                }
            }
            // Initialize new profile fields
            if (userData?.fullName) { //
              const parts = userData.fullName.split(' '); //
              setFirstName(parts[0] || ''); //
              setLastName(parts.slice(1).join(' ') || ''); //
            } else if (userData?.username) { // Fallback to username for firstName
              setFirstName(userData.username); //
              setLastName(''); //
            }
            setEmail(userData?.email || ''); //
            setUserRole(userData?.role || 'نقش تعریف نشده'); // ✅ **خواندن نقش کاربر از localStorage**
            setPreview(userData?.profilePictureUrl || null); // Initialize preview with existing pic
            // userAccountCode is static for now, but could be set from userData.id if available
            // setUserAccountCode(userData?.id || 'ZF-12345678'); 
        } catch (e) {
            console.error("خطا در خواندن اطلاعات کاربر از localStorage: ", e); //
        }
    }
  }, []); //

  const handleFileChange = (event) => {
    const file = event.target.files[0]; //
    if (file && file.type.startsWith('image/')) { //
      setProfileImageFile(file); //
      const reader = new FileReader(); //
      reader.onloadend = () => {
        setPreview(reader.result); //
      };
      reader.readAsDataURL(file); //
    } else {
      setProfileImageFile(null); //
      // Optionally clear preview or show error
    }
  };

  const handleSaveProfileChanges = async () => {
    setIsSavingProfile(true);
    let profileUpdated = false;
    let pictureUpdated = false;

    // TODO: Implement actual API call for updating text profile data (firstName, lastName, email)
    // For now, we simulate it and update localStorage as before.
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (storedUserData.fullName !== `${firstName} ${lastName}`.trim() || storedUserData.email !== email) {
      storedUserData.fullName = `${firstName} ${lastName}`.trim();
      storedUserData.email = email;
      profileUpdated = true;
    }

    if (profileImageFile) {
      const formData = new FormData();
      formData.append('profile_picture', profileImageFile);

      try {
        const response = await fetch(`${API_BASE_URL}/account/profile-picture`, {
          method: 'POST',
          headers: {
            // 'Content-Type' is not set; browser does it for FormData
            'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message || 'عکس پروفایل با موفقیت آپلود شد.');
          if (data.profile_picture_url) {
            setPreview(data.profile_picture_url); // Update preview with the new URL from server
            storedUserData.profilePictureUrl = data.profile_picture_url; // Update localStorage
          }
          setProfileImageFile(null); // Clear the file input after successful upload
          pictureUpdated = true;
        } else {
          alert(`خطا در آپلود عکس: ${data.message || response.statusText}`);
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('خطای شبکه در هنگام آپلود عکس پروفایل.');
      }
    }

    if (profileUpdated || pictureUpdated) {
      localStorage.setItem('userData', JSON.stringify(storedUserData));
      if (profileUpdated && !pictureUpdated && !profileImageFile) { // Only text data was changed
        alert('اطلاعات پروفایل (متنی) به‌روزرسانی شد.');
      }
      // If pictureUpdated, alert was already shown.
      // If both, the picture alert is likely more specific.
    } else if (!profileImageFile) {
      alert('تغییری برای ذخیره وجود ندارد.');
    }

    setIsSavingProfile(false);
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault(); //
    setIsUsernameLoading(true); //
    setUsernameMessage(''); //
    setUsernameError(''); //

    if (!newUsername || !currentPasswordForUsername) { //
      setUsernameError('لطفاً نام کاربری جدید و رمز عبور فعلی را وارد کنید.'); //
      setIsUsernameLoading(false); //
      return;
    }
    if (newUsername.length < 3) { //
      setUsernameError('نام کاربری جدید باید حداقل ۳ کاراکتر باشد.'); //
      setIsUsernameLoading(false); //
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/change-username`, { //
        method: 'POST', //
        headers: {
          'Content-Type': 'application/json', //
          'Authorization': `Bearer ${getAuthToken()}`, //
        },
        body: JSON.stringify({ //
          new_username: newUsername, //
          current_password: currentPasswordForUsername, //
        }),
      });
      const data = await response.json(); //
      if (response.ok) { //
        setUsernameMessage(data.message || 'نام کاربری با موفقیت تغییر کرد.'); //
        setNewUsername(''); //
        setCurrentPasswordForUsername(''); //
      } else {
        setUsernameError(data.message || 'خطا در تغییر نام کاربری.'); //
      }
    } catch (err) {
      console.error('Change username error:', err); //
      setUsernameError('خطا در ارتباط با سرور.'); //
    } finally {
      setIsUsernameLoading(false); //
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); //
    setIsPasswordLoading(true); //
    setPasswordMessage(''); //
    setPasswordError(''); //

    if (!currentPasswordForPassword || !newPassword || !confirmNewPassword) { //
      setPasswordError('لطفاً تمام فیلدهای رمز عبور را پر کنید.'); //
      setIsPasswordLoading(false); //
      return;
    }
    if (newPassword !== confirmNewPassword) { //
      setPasswordError('رمز عبور جدید و تکرار آن یکسان نیستند.'); //
      setIsPasswordLoading(false); //
      return;
    }
    if (newPassword.length < 8) { //
      setPasswordError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.'); //
      setIsPasswordLoading(false); //
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/account/change-password`, { //
        method: 'POST', //
        headers: {
          'Content-Type': 'application/json', //
          'Authorization': `Bearer ${getAuthToken()}`, //
        },
        body: JSON.stringify({ //
          current_password: currentPasswordForPassword, //
          new_password: newPassword, //
        }),
      });
      const data = await response.json(); //
      if (response.ok) { //
        setPasswordMessage(data.message || 'رمز عبور با موفقیت تغییر کرد.'); //
        setCurrentPasswordForPassword(''); //
        setNewPassword(''); //
        setConfirmNewPassword(''); //
      } else {
        setPasswordError(data.message || 'خطا در تغییر رمز عبور.'); //
      }
    } catch (err) {
      console.error('Change password error:', err); //
      setPasswordError('خطا در ارتباط با سرور.'); //
    } finally {
      setIsPasswordLoading(false); //
    }
  };

  const handleGenerate2FASecret = async () => {
    setIsTwoFALoading(true); //
    setTwoFAError(''); //
    setTwoFAMessage(''); //
    setQrCodeUrl(''); //
    setTwoFASecret(''); //
    setRecoveryCodes([]); //
    setShowRecoveryCodes(false); //

    try {
        const response = await fetch(`${API_BASE_URL}/account/2fa/generate-secret`, { //
            method: 'POST', //
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }, //
        });
        const data = await response.json(); //
        if (response.ok) { //
            setQrCodeUrl(data.qr_code_url); //
            setTwoFASecret(data.secret); //
            setTwoFASetupStage('generated'); //
        } else {
            setTwoFAError(data.message || 'خطا در تولید اطلاعات 2FA.'); //
        }
    } catch (err) {
        setTwoFAError('خطا در ارتباط با سرور برای تولید اطلاعات 2FA.'); //
    } finally {
        setIsTwoFALoading(false); //
    }
  };

  const handleVerifyAndEnable2FA = async (e) => {
    e.preventDefault(); //
    setIsTwoFALoading(true); //
    setTwoFAError(''); //
    setTwoFAMessage(''); //
    setRecoveryCodes([]); //

    if (!totpCode) { //
        setTwoFAError('کد تایید 2FA را وارد کنید.'); //
        setIsTwoFALoading(false); //
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/account/2fa/enable`, { //
            method: 'POST', //
            headers: {
                'Content-Type': 'application/json', //
                'Authorization': `Bearer ${getAuthToken()}`, //
            },
            body: JSON.stringify({ totp_code: totpCode }), //
        });
        const data = await response.json(); //
        if (response.ok) { //
            setIsTwoFAEnabled(true); //
            setRecoveryCodes(data.recovery_codes || []); //
            setShowRecoveryCodes(true); //
            setTwoFAMessage('2FA با موفقیت فعال شد! کدهای بازیابی خود را ذخیره کنید.'); //
            setTwoFASetupStage('enabled'); //
            setTotpCode(''); //
            const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}'); //
            storedUserData.is_two_fa_enabled = true; //
            localStorage.setItem('userData', JSON.stringify(storedUserData)); //
        } else {
            setTwoFAError(data.message || 'خطا در فعال‌سازی 2FA. کد ممکن است نامعتبر باشد.'); //
        }
    } catch (err) {
        setTwoFAError('خطا در ارتباط با سرور برای فعال‌سازی 2FA.'); //
    } finally {
        setIsTwoFALoading(false); //
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault(); //
    setIsTwoFALoading(true); //
    setTwoFAError(''); //
    setTwoFAMessage(''); //

    if (!passwordFor2FADisable || !totpCodeForDisable) { //
        setTwoFAError('برای غیرفعال‌سازی، رمز عبور و کد تایید ۶ رقمی الزامی است.'); //
        setIsTwoFALoading(false); //
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/account/2fa/disable`, { //
            method: 'POST', //
            headers: {
                'Content-Type': 'application/json', //
                'Authorization': `Bearer ${getAuthToken()}`, //
            },
            body: JSON.stringify({ 
              current_password: passwordFor2FADisable, //
              totp_code: totpCodeForDisable, //
            }),
        });
        const data = await response.json(); //
        if (response.ok) { //
            setIsTwoFAEnabled(false); //
            setTwoFAMessage(data.message || '2FA با موفقیت غیرفعال شد.'); //
            setQrCodeUrl(''); //
            setTwoFASecret(''); //
            setRecoveryCodes([]); //
            setShowRecoveryCodes(false); //
            setPasswordFor2FADisable(''); //
            setTotpCodeForDisable(''); //
            setTwoFASetupStage('initial'); //
            const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}'); //
            storedUserData.is_two_fa_enabled = false; //
            localStorage.setItem('userData', JSON.stringify(storedUserData)); //
        } else {
            setTwoFAError(data.message || 'خطا در غیرفعال‌سازی 2FA. رمز عبور یا کد تایید ممکن است نادرست باشد.'); //
        }
    } catch (err) {
        setTwoFAError('خطا در ارتباط با سرور برای غیرفعال‌سازی 2FA.'); //
    } finally {
        setIsTwoFALoading(false); //
    }
  };
  
  return (
    <div className="account-management-container">
      <h1 className="page-title">تنظیمات حساب کاربری</h1>
      <div className="account-management-layout">
        <TabsContainer initialActiveTabId="profile" layout="vertical">
          <Tab tabId="profile" label="اطلاعات پایه" icon={<FaUserEdit />} />
          <Tab tabId="security" label="تنظیمات امنیتی" icon={<FaUserShield />} />

          <TabPanel tabId="profile">
            <section className="account-section">
                <h2 className="section-title"><FaUserEdit className="section-icon" /> اطلاعات پایه پروفایل</h2>
                <div className="profile-content-wrapper">
                    <div className="profile-picture-section">
                      <div className="profile-picture-preview-container">
                        {preview ? (
                          <img src={preview} alt="پیش‌نمایش پروفایل" className="profile-picture-preview" />
                        ) : (
                          <DefaultUserIcon size={100} className="default-avatar-icon" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        id="profilePictureInput"
                      />
                      <button
                        type="button"
                        className="auth-button secondary"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      >
                        <FaCamera style={{marginRight: '8px'}} /> ویرایش عکس
                      </button>
                    </div>
                    <div className="form-group">
                      <label htmlFor="userAccountCode"><FaIdCard className="form-icon"/> کد حساب کاربری</label>
                      <input
                        type="text"
                        id="userAccountCode"
                        className="form-control"
                        value={userAccountCode}
                        readOnly
                      />
                    </div>
                    {/* ✅ **بخش جدید اضافه شده برای نمایش نقش** */}
                    <div className="form-group">
                      <label htmlFor="userRole"><FaUserTag className="form-icon"/> نقش کاربری</label>
                      <input
                        type="text"
                        id="userRole"
                        className="form-control"
                        value={userRole}
                        readOnly
                      />
                    </div>
                    {/* ✅ **پایان بخش جدید** */}
                    <div className="form-group">
                      <label htmlFor="firstName"><FaUserEdit className="form-icon"/> نام</label>
                      <input
                        type="text"
                        id="firstName"
                        className="form-control"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName"><FaUserEdit className="form-icon"/> نام خانوادگی</label>
                      <input
                        type="text"
                        id="lastName"
                        className="form-control"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email"><FaEnvelope className="form-icon"/> ایمیل</label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="auth-button"
                      onClick={handleSaveProfileChanges}
                      disabled={isSavingProfile}
                      style={{marginTop: '10px'}}
                    >
                      {isSavingProfile ? <FaSpinner className="spinner-sm" /> : 'ذخیره تغییرات پروفایل'}
                    </button>
                </div>
            </section>
          </TabPanel>

          <TabPanel tabId="security">
            <div className="security-forms-row">
              <section className="account-section">
                <h2 className="section-title"><FaUserEdit className="section-icon" /> تغییر نام کاربری</h2>
                <form onSubmit={handleChangeUsername} className="auth-form no-shadow">
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

              <section className="account-section">
                <h2 className="section-title"><FaKey className="section-icon" /> تغییر رمز عبور</h2>
                <form onSubmit={handleChangePassword} className="auth-form no-shadow">
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
            
            <section className="account-section last-section">
              <h2 className="section-title"><FaUserShield className="section-icon" /> مدیریت تایید دو مرحله‌ای (2FA)</h2>
              {twoFAMessage && <div className="message-banner success visible">{twoFAMessage}</div>}
              {twoFAError && <div className="message-banner error visible">{twoFAError}</div>}

              {!isTwoFAEnabled && twoFASetupStage === 'initial' && (
                <button onClick={handleGenerate2FASecret} className="auth-button" disabled={isTwoFALoading}>
                  {isTwoFALoading ? <FaSpinner className="spinner-sm" /> : <><FaQrcode className="button-icon"/> فعال‌سازی 2FA</>}
                </button>
              )}

              {twoFASetupStage === 'generated' && !isTwoFAEnabled && qrCodeUrl && (
                <div className="two-fa-setup">
                  <p>۱. برنامه Authenticator خود را باز کنید (مانند Google Authenticator, Authy).</p>
                  <p>۲. کد QR زیر را اسکن کنید یا کلید مخفی را دستی وارد نمایید:</p>
                  <div style={{ margin: '20px 0', display: 'inline-block', border: '1px solid #ccc', padding: '10px' }}>
                    <QRCodeSVG value={qrCodeUrl} size={200} level="H" />
                  </div>
                  <p><strong>کلید مخفی (برای ورود دستی):</strong></p>
                  <p style={{ fontFamily: 'monospace', fontSize: '1.1em', padding: '10px', backgroundColor: '#f5f5f5', display: 'inline-block', borderRadius: '4px', border: '1px solid #ddd', userSelect: 'all' }}>
                    {twoFASecret}
                  </p>
                  <p style={{marginTop: '15px'}}>۳. کد ۶ رقمی نمایش داده شده در برنامه Authenticator را وارد کنید:</p>
                  <form onSubmit={handleVerifyAndEnable2FA} className="auth-form no-shadow totp-form">
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
                  <p className="two-fa-enabled-message"><FaShieldAlt className="enabled-icon"/> تایید دو مرحله‌ای (2FA) برای حساب شما فعال است.</p>

                  {showRecoveryCodes && recoveryCodes.length > 0 && (
                    <div className="recovery-codes-section">
                      <h3><FaListOl className="recovery-icon"/> کدهای بازیابی (یکبار مصرف):</h3>
                      <p>این کدها را در مکانی امن ذخیره کنید. اگر به برنامه Authenticator خود دسترسی نداشته باشید، می‌توانید از این کدها برای ورود استفاده کنید. <strong>این کدها دیگر نمایش داده نخواهند شد.</strong></p>
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
                      <label htmlFor="passwordFor2FADisable">رمز عبور فعلی (برای غیرفعال‌سازی)</label>
                      <input
                        type="password"
                        id="passwordFor2FADisable"
                        className="form-control"
                        value={passwordFor2FADisable}
                        onChange={(e) => setPasswordFor2FADisable(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="totpCodeForDisable">کد تایید ۶ رقمی (برای غیرفعال‌سازی)</label>
                      <input
                        type="text"
                        id="totpCodeForDisable"
                        className="form-control"
                        value={totpCodeForDisable}
                        onChange={(e) => setTotpCodeForDisable(e.target.value)}
                        placeholder="کد ۶ رقمی"
                        maxLength={6}
                        required
                        style={{textAlign: 'center', letterSpacing: '0.2em'}}
                      />
                    </div>
                    <button type="submit" className="auth-button danger" disabled={isTwoFALoading}>
                      {isTwoFALoading ? <FaSpinner className="spinner-sm" /> : 'غیرفعال‌سازی 2FA'}
                    </button>
                  </form>
                </div>
              )}
            </section>
          </TabPanel>
        </TabsContainer>
      </div>
    </div>
  );
}

export default AccountManagementPage;