// frontend/src/pages/AccountSettingsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import './AccountSettingsPage.css'; // برای استایل‌های این صفحه
import { FaUserEdit, FaKey, FaCamera, FaSave, FaSpinner, FaUserCircle } from 'react-icons/fa';

// کامپوننت‌های داخلی یا فرم‌ها را می‌توان جدا کرد
const ProfileInfoForm = ({ userData, onUpdate, isLoading }) => {
  // Initialize state directly from the userData prop
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [username, setUsername] = useState(userData?.username || '');
  const [email, setEmail] = useState(userData?.email || '');
  const userAccountCode = 'ZF-12345678'; // Static value for now

  // Effect to update local state if userData prop changes
  useEffect(() => {
    setFirstName(userData?.firstName || '');
    setLastName(userData?.lastName || '');
    setUsername(userData?.username || '');
    setEmail(userData?.email || '');
  }, [userData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ firstName, lastName, username, email });
  };

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <h3><FaUserEdit /> اطلاعات پروفایل</h3>
      <div className="form-group">
        <label htmlFor="userAccountCode">کد حساب کاربری</label>
        <input type="text" id="userAccountCode" value={userAccountCode} readOnly />
      </div>
      <div className="form-group">
        <label htmlFor="firstName">نام</label>
        <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="lastName">نام خانوادگی</label>
        <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="username">نام کاربری</label>
        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="email">ایمیل</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? <FaSpinner className="spinner" /> : <FaSave />} ذخیره اطلاعات
      </button>
    </form>
  );
};

const ChangePasswordForm = ({ onChangePassword, isLoading }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }
    if (newPassword.length < 6) { // مثال: حداقل طول رمز
        setError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
        return;
    }
    // اینجا باید onChangePassword یک تابع async باشد که به API متصل می‌شود
    const result = await onChangePassword({ currentPassword, newPassword });
    if (result.success) {
        setSuccess("رمز عبور با موفقیت تغییر کرد.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } else {
        setError(result.message || "خطا در تغییر رمز عبور.");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <h3><FaKey /> تغییر رمز عبور</h3>
      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}
      <div className="form-group">
        <label htmlFor="currentPassword">رمز عبور فعلی</label>
        <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="newPassword">رمز عبور جدید</label>
        <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="confirmPassword">تکرار رمز عبور جدید</label>
        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      </div>
      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? <FaSpinner className="spinner" /> : <FaSave />} تغییر رمز
      </button>
    </form>
  );
};

const ProfilePictureUpload = ({ currentPictureUrl, setProfileImageFile, profileImageFile }) => {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profileImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(profileImageFile);
    } else {
      setPreview(currentPictureUrl);
    }
  }, [profileImageFile, currentPictureUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setProfileImageFile(file); // Pass the file object to the parent
    } else {
      // Optionally, handle non-image file selection error
      console.log("فایل انتخاب شده تصویر نیست.");
      setProfileImageFile(null); // Clear if a non-image was selected then cancelled
    }
  };

  return (
    <div className="settings-form profile-picture-section">
      <h3><FaCamera /> عکس پروفایل</h3>
      <div className="profile-picture-preview-container">
        {preview ? (
          <img 
              src={preview}
              alt="پیش‌نمایش پروفایل" 
              className="profile-picture-preview" 
          />
        ) : (
          <FaUserCircle size={100} className="default-avatar-icon" /> // Default icon
        )}
      </div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        id="profilePictureInput" // Added id for label association
      />
      <div className="profile-picture-actions">
        <button 
          type="button" 
          className="secondary-btn" 
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          ویرایش عکس
        </button>
      </div>
    </div>
  );
};


const AccountSettingsPage = () => {
  // این اطلاعات باید از API یا context خوانده شوند
  const [userData, setUserData] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [formData, setFormData] = useState({}); // Centralized state for form data
  const [isLoadingProfile, setIsLoadingProfile] = useState(false); // For ProfileInfoForm internal button
  const [isSavingAll, setIsSavingAll] = useState(false); // For the main save button
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          // Initialize formData with userData
          const initialFirstName = parsedData.fullName ? parsedData.fullName.split(' ')[0] : '';
          const initialLastName = parsedData.fullName ? parsedData.fullName.split(' ').slice(1).join(' ') : '';
          setFormData({
            firstName: initialFirstName,
            lastName: initialLastName,
            username: parsedData.username || '',
            email: parsedData.email || '',
            userAccountCode: 'ZF-12345678' // Assuming this is static or derived elsewhere if needed in formData
          });
        } else {
          console.log("اطلاعات کاربر یافت نشد، نیاز به لاگین مجدد یا واکشی از API");
          // Set default formData if no userData
          setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            userAccountCode: 'ZF-12345678'
          });
        }
      } catch (e) {
        console.error("خطا در خواندن اطلاعات کاربر:", e);
        // Set default formData on error
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          userAccountCode: 'ZF-12345678'
        });
      }
    };
    fetchUserData();
  }, []);

  // Called by ProfileInfoForm to update the central formData state
  const handleProfileInfoChange = (profileUpdates) => {
    setFormData(prevFormData => ({ ...prevFormData, ...profileUpdates }));
    // No alert here, alert will be on main save
  };
  
  const handleSaveChangesClick = async () => {
    setIsSavingAll(true);
    console.log("داده‌های ذخیره شده:", {
      ...formData,
      profileImageFile: profileImageFile // Log the File object itself, or null
    });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Example of updating userData in localStorage after a successful save
    // This part would ideally come from an API response
    const updatedUserDataForLocalStorage = {
        ...userData, // keep other userData properties
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        username: formData.username,
        email: formData.email,
        // profilePictureUrl might be updated if profileImageFile was uploaded and a new URL was returned
    };
    // If there's a new profile image, you might want to generate a temporary URL for display
    // or wait for the actual upload and new URL from server.
    // For now, if profileImageFile exists, we can assume it's "uploaded" and update userData for local reflection.
    if (profileImageFile) {
        updatedUserDataForLocalStorage.profilePictureUrl = URL.createObjectURL(profileImageFile);
    }
    
    localStorage.setItem('userData', JSON.stringify(updatedUserDataForLocalStorage));
    setUserData(updatedUserDataForLocalStorage); // Update state to reflect changes

    setIsSavingAll(false);
    alert("تغییرات با موفقیت ذخیره شد!");
  };

  const handleChangePassword = async (passwordData) => {
    setIsLoadingPassword(true);
    console.log("تغییر رمز عبور:", passwordData);
    // TODO: API call for password change
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoadingPassword(false);
    // return { success: true };
    return { success: false, message: "رمز عبور فعلی صحیح نیست (مثال خطا)." };
  };

  if (!userData && !Object.keys(formData).length) { // Wait for initial data load
    // یا یک صفحه لودینگ بهتر نمایش دهید
    return <div className="page-container"><div className="loading-spinner-container"><FaSpinner className="spinner" /> در حال بارگذاری اطلاعات کاربر...</div></div>;
  }

  return (
    <div className="page-container account-settings-page">
      <header className="page-header">
        <h1>تنظیمات حساب کاربری</h1>
        <p>اطلاعات شخصی، رمز عبور و عکس پروفایل خود را مدیریت کنید.</p>
      </header>
      
      {/* New layout structure */}
      <div className="settings-content-grid">
        <div className="profile-picture-column">
          <ProfilePictureUpload 
              currentPictureUrl={userData?.profilePictureUrl} 
              profileImageFile={profileImageFile}
              setProfileImageFile={setProfileImageFile}
          />
        </div>
        <div className="profile-info-column">
          <ProfileInfoForm 
              userData={formData} // Pass formData for controlled inputs
              onUpdate={handleProfileInfoChange} // Renamed for clarity
              isLoading={isLoadingProfile} // This can be removed if ProfileInfoForm's button is removed
          />
        </div>
        <div className="change-password-column">
          <ChangePasswordForm 
              onChangePassword={handleChangePassword} 
              isLoading={isLoadingPassword} 
          />
        </div>
      </div>

      <div className="main-save-button-container">
        <button 
          type="button" 
          className="submit-btn main-save-btn" 
          onClick={handleSaveChangesClick}
          disabled={isSavingAll}
        >
          {isSavingAll ? <FaSpinner className="spinner" /> : <FaSave />} ذخیره تغییرات
        </button>
      </div>
      {/* می‌توانید بخش‌های دیگری مانند تنظیمات نوتیفیکیشن و ... را اینجا اضافه کنید */}
    </div>
  );
};

export default AccountSettingsPage;