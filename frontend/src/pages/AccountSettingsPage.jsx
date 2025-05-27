// frontend/src/pages/AccountSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import './AccountSettingsPage.css'; // برای استایل‌های این صفحه
import { FaUserEdit, FaKey, FaCamera, FaSave, FaSpinner } from 'react-icons/fa';

// کامپوننت‌های داخلی یا فرم‌ها را می‌توان جدا کرد
const ProfileInfoForm = ({ userData, onUpdate, isLoading }) => {
  const [name, setName] = useState(userData?.fullName || '');
  const [username, setUsername] = useState(userData?.username || '');
  const [email, setEmail] = useState(userData?.email || '');

  useEffect(() => {
    setName(userData?.fullName || '');
    setUsername(userData?.username || '');
    setEmail(userData?.email || '');
  }, [userData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ fullName: name, username, email });
  };

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <h3><FaUserEdit /> اطلاعات پروفایل</h3>
      <div className="form-group">
        <label htmlFor="fullName">نام کامل</label>
        <input type="text" id="fullName" value={name} onChange={(e) => setName(e.target.value)} required />
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

const ProfilePictureUpload = ({ currentPictureUrl, onUpload, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(currentPictureUrl);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(currentPictureUrl);
  }, [currentPictureUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="settings-form profile-picture-section">
      <h3><FaCamera /> عکس پروفایل</h3>
      <div className="profile-picture-preview-container">
        <img 
            src={preview || '/default-avatar.png'} // یک آواتار پیش‌فرض قرار دهید
            alt="عکس پروفایل" 
            className="profile-picture-preview" 
        />
      </div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        ref={fileInputRef}
      />
      <div className="profile-picture-actions">
        <button type="button" className="secondary-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
          انتخاب عکس
        </button>
        {selectedFile && (
          <button type="button" className="submit-btn" onClick={handleUpload} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinner" /> : <FaSave />} آپلود عکس
          </button>
        )}
      </div>
    </div>
  );
};


const AccountSettingsPage = () => {
  // این اطلاعات باید از API یا context خوانده شوند
  const [userData, setUserData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingPicture, setIsLoadingPicture] = useState(false);

  useEffect(() => {
    // شبیه‌سازی دریافت اطلاعات کاربر
    const fetchUserData = async () => {
      // در اینجا باید اطلاعات کاربر از API یا localStorage خوانده شود
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        } else {
          // اگر اطلاعات کاربر در localStorage نیست، ممکن است از API خوانده شود
          // یا کاربر به لاگین هدایت شود اگر این صفحه محافظت شده است
          console.log("اطلاعات کاربر یافت نشد، نیاز به لاگین مجدد یا واکشی از API");
        }
      } catch (e) {
        console.error("خطا در خواندن اطلاعات کاربر:", e);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdateProfileInfo = async (updatedInfo) => {
    setIsLoadingProfile(true);
    console.log("به‌روزرسانی اطلاعات پروفایل:", updatedInfo);
    // TODO: اینجا باید با API برای به‌روزرسانی اطلاعات تماس بگیرید
    // شبیه‌سازی آپدیت
    await new Promise(resolve => setTimeout(resolve, 1500));
    // آپدیت localStorage (مثال)
    const newUserData = { ...userData, ...updatedInfo };
    localStorage.setItem('userData', JSON.stringify(newUserData));
    setUserData(newUserData);
    setIsLoadingProfile(false);
    alert("اطلاعات پروفایل با موفقیت به‌روز شد!");
  };

  const handleChangePassword = async (passwordData) => {
    setIsLoadingPassword(true);
    console.log("تغییر رمز عبور:", passwordData);
    // TODO: اینجا باید با API برای تغییر رمز تماس بگیرید
    // شبیه‌سازی تغییر رمز
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoadingPassword(false);
    // بر اساس پاسخ API، success یا error را برگردانید
    // return { success: true };
    return { success: false, message: "رمز عبور فعلی صحیح نیست (مثال خطا)." };
  };

  const handleUploadProfilePicture = async (file) => {
    setIsLoadingPicture(true);
    console.log("آپلود عکس پروفایل:", file.name);
    // TODO: اینجا باید با API برای آپلود عکس تماس بگیرید
    // شبیه‌سازی آپلود
    const formData = new FormData();
    formData.append('profilePicture', file);
    // const response = await fetch('/api/upload-profile-picture', { method: 'POST', body: formData });
    // const data = await response.json();
    await new Promise(resolve => setTimeout(resolve, 2000));
    const newPictureUrl = URL.createObjectURL(file); // فقط برای پیش‌نمایش موقت
    
    const updatedUserData = { ...userData, profilePictureUrl: newPictureUrl };
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    setUserData(updatedUserData);

    setIsLoadingPicture(false);
    alert("عکس پروفایل با موفقیت آپلود شد (شبیه‌سازی شده)!");
  };


  if (!userData) {
    // یا یک صفحه لودینگ بهتر نمایش دهید
    return <div className="page-container"><div className="loading-spinner-container"><FaSpinner className="spinner" /> در حال بارگذاری اطلاعات کاربر...</div></div>;
  }

  return (
    <div className="page-container account-settings-page">
      <header className="page-header">
        <h1>تنظیمات حساب کاربری</h1>
        <p>اطلاعات شخصی، رمز عبور و عکس پروفایل خود را مدیریت کنید.</p>
      </header>
      <div className="settings-sections-grid">
        <ProfileInfoForm 
            userData={userData} 
            onUpdate={handleUpdateProfileInfo} 
            isLoading={isLoadingProfile} 
        />
        <ProfilePictureUpload 
            currentPictureUrl={userData.profilePictureUrl} 
            onUpload={handleUploadProfilePicture}
            isLoading={isLoadingPicture}
        />
        <ChangePasswordForm 
            onChangePassword={handleChangePassword} 
            isLoading={isLoadingPassword} 
        />
        {/* می‌توانید بخش‌های دیگری مانند تنظیمات نوتیفیکیشن و ... را اینجا اضافه کنید */}
      </div>
    </div>
  );
};

export default AccountSettingsPage;