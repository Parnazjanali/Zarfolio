// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css'; // Ensure this path is correct
import loginPageImage from '../assets/login.jpg'; // Ensure this path is correct
import {
  FaInstagram, FaTelegramPlane, FaWhatsapp, FaHeart,
  FaUserPlus, FaSignInAlt, FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaKey, FaShieldAlt,
} from 'react-icons/fa';
import Portal from '../components/Portal';

// استفاده از این تعریف که دارای مقدار پیش‌فرض است
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const generateStrongPassword = (length = 16) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

const PasswordStrengthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <Portal>
      <div className="password-strength-modal-overlay" onClick={onClose}>
        <div className="password-strength-modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>
            <FaShieldAlt /> چرا رمز عبور قوی مهم است؟
          </h3>
          <p>
            یک رمز عبور قوی و منحصر به فرد، اولین و یکی از مهم‌ترین خطوط دفاعی شما در برابر دسترسی‌های غیرمجاز به حساب کاربریتان است.
          </p>
          <ul>
            <li><strong>محافظت از اطلاعات شخصی:</strong> از اطلاعات حساس شما در برابر هکرها محافظت می‌کند.</li>
            <li><strong>جلوگیری از سرقت هویت:</strong> احتمال سوءاستفاده از هویت دیجیتال شما را کاهش می‌دهد.</li>
            <li><strong>امنیت چندگانه:</strong> حتی اگر اطلاعات ورود شما از یک سرویس دیگر به سرقت برود، استفاده از رمزهای متفاوت امنیت سایر حساب‌های شما را حفظ می‌کند.</li>
          </ul>
          <p>
            رمز عبور پیشنهادی ما شامل حروف بزرگ و کوچک، اعداد و نمادها است تا حداکثر امنیت را برای شما فراهم آورد. همیشه از رمزهای عبور متفاوت برای حساب‌های مختلف خود استفاده کنید.
          </p>
          <div className="password-strength-modal-actions">
            <button onClick={onClose} className="password-strength-modal-button">
              متوجه شدم، ادامه می‌دهم
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [emailForRegister, setEmailForRegister] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  // حذف تعریف API_BASE_URL از اینجا، چون در سطح ماژول تعریف شده است

  const socialLinks = [
    { platform: 'instagram', icon: <FaInstagram />, text: '@YourInstaID', color: '#E1306C', hoverColor: '#c13584', href: 'https://instagram.com/YourInstaID' },
    { platform: 'telegram', icon: <FaTelegramPlane />, text: '@YourTelegramID', color: '#0088cc', hoverColor: '#0077b5', href: 'https://t.me/YourTelegramID' },
    { platform: 'whatsapp', icon: <FaWhatsapp />, text: '+989120000000', color: '#25D366', hoverColor: '#1DA851', href: 'https://wa.me/989120000000' },
  ];
  const [hoveredSocial, setHoveredSocial] = useState(null);

  const displayMessage = (msg, error = false, duration = 5000) => {
    setMessage(msg);
    setIsError(error);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  };

  const handleSuggestPassword = () => {
    const newPassword = generateStrongPassword(16);
    setPassword(newPassword);
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    displayMessage('رمز عبور قوی در فیلد قرار گرفت. آن را به خاطر بسپارید یا در مکانی امن ذخیره کنید.', false, 4000);
  }

  // فقط یک تعریف از handleLogin باقی بماند
  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setShowMessage(false);

    // نکته: اگر ورود ادمین موقت دیگر لازم نیست، این بخش را حذف کنید.
    if (identifier === 'admin' && password === 'admin') {
      localStorage.setItem('authToken', 'dummy-admin-token');
      // برای ادمین موقت، یک نام کاربری موقت هم ذخیره می‌کنیم
      const adminUserData = { username: 'ادمین موقت', role: 'admin' };
      localStorage.setItem('userData', JSON.stringify(adminUserData));
      localStorage.setItem('showReleaseNotes', 'true');
      setIsLoading(false);
      navigate('/dashboard');
      return;
    }

    const loginPayload = { username: identifier, password: password };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { // API_BASE_URL از سطح ماژول استفاده می‌شود
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token);
        if (data.user) { // اطمینان از وجود data.user
          const userDataToStore = {
            id: data.user.id, // دیگر نیازی به ?. نیست چون وجود data.user بررسی شده
            username: data.user.username,
            email: data.user.email,
            role: data.user.role,
            // fullName: data.user.fullName // اگر در بک‌اند fullName اضافه شود
          };
          localStorage.setItem('userData', JSON.stringify(userDataToStore));
        } else {
          // اگر data.user وجود نداشت، حداقل نام کاربری که کاربر وارد کرده را ذخیره کنیم (اختیاری)
          localStorage.setItem('userData', JSON.stringify({ username: identifier }));
          console.warn("Login successful but user object was not returned in response data.");
        }
        localStorage.setItem('showReleaseNotes', 'true');
        displayMessage('ورود با موفقیت انجام شد! در حال انتقال به داشبورد...', false);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        displayMessage(data.message || 'نام کاربری یا رمز عبور نامعتبر است.', true);
      }
    } catch (error) {
      console.error('Login error:', error);
      displayMessage('خطا در برقراری ارتباط با سرور. لطفاً بعداً تلاش کنید.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setShowMessage(false);

    if (password.length < 8 ) {
        displayMessage('رمز عبور باید حداقل ۸ کاراکتر باشد. می‌توانید از گزینه "پیشنهاد رمز" استفاده کنید.', true, 7000);
        setIsLoading(false);
        return;
    }
    if (!name.trim()) {
        displayMessage('وارد کردن نام و نام خانوادگی الزامی است.', true);
        setIsLoading(false);
        return;
    }
    if (!emailForRegister.includes('@')) {
        displayMessage('لطفاً یک ایمیل معتبر وارد کنید.', true);
        setIsLoading(false);
        return;
    }

    try {
      // نکته: اندپوینت register/user در فایل‌های بک‌اند شما (apiGateway) تعریف نشده بود.
      // فرض می‌کنیم این اندپوینت در profileManager با مسیر /register وجود دارد و apiGateway آن را پروکسی نمی‌کند.
      // یا اینکه باید در apiGateway روت `/api/v1/register/user` به profileManager مپ شود.
      // در حال حاضر، با توجه به فایل‌های apiGateway، روت رجیستر به شکل `/api/v1/register/user` است.
      const response = await fetch(`${API_BASE_URL}/register/user`, { // API_BASE_URL از سطح ماژول
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // در بک‌اند profileManager، مدل RegisterRequest فیلدهای Username, Password, Email دارد.
        // نام فیلدها باید مطابقت داشته باشد.
        body: JSON.stringify({ username: emailForRegister, password: password, email: emailForRegister /* name در مدل بک‌اند نیست */ }),
      });
      const data = await response.json();
      if (response.ok) { // یا response.status === 201 اگر بک‌اند 201 برمی‌گرداند
        displayMessage('ثبت‌نام با موفقیت انجام شد! اکنون می‌توانید وارد شوید.', false, 7000);
        setMode('login');
        setIdentifier(emailForRegister);
        setPassword('');
        setName('');
        setEmailForRegister('');
      } else {
        displayMessage(data.message || 'خطا در ثبت‌نام. ممکن است این ایمیل قبلاً استفاده شده باشد.', true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      displayMessage('خطا در برقراری ارتباط با سرور برای ثبت‌نام. لطفاً بعداً تلاش کنید.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialMouseEnter = (platform) => setHoveredSocial(platform);
  const handleSocialMouseLeave = () => setHoveredSocial(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && window.location.pathname === '/login') {
      // navigate('/dashboard'); // این خط کامنت شده بود، در صورت نیاز فعال کنید
    }
  }, [navigate]);


  return (
    // ... JSX بدون تغییر ...
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-form-section">
          <div className="auth-container">
            <div className="auth-header">
              <FaUserCircle className="auth-header-icon" />
              <h2>{mode === 'login' ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری جدید'}</h2>
            </div>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'برای دسترسی به پنل مدیریت زرفولیو وارد شوید.'
                : 'با ثبت‌نام در زرفولیو، مدیریت کسب و کار طلا و جواهر خود را آغاز کنید.'}
            </p>
            {showMessage && (
              <div className={`message-banner ${isError ? 'error' : 'success'} ${showMessage ? 'visible' : ''}`}>
                {message}
                <button type="button" onClick={() => setShowMessage(false)} className="close-message-btn">&times;</button>
              </div>
            )}
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
               {mode === 'register' && (
                <div className="form-group">
                  <label htmlFor="register-name">
                    <FaUserPlus style={{ marginLeft: '8px', fontSize: '0.9em' }} />
                    نام و نام خانوادگی:
                  </label>
                  <input
                    type="text"
                    id="register-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="مثال: حسن دردشتی"
                    className="form-control"
                  />
                </div>
              )}
              <div className="form-group">
                <label htmlFor={mode === 'login' ? "login-identifier" : "register-email"}>
                  {mode === 'login' ? (
                    <>
                      <FaUserCircle style={{ marginLeft: '8px', fontSize: '0.9em' }} />
                       نام کاربری یا ایمیل:
                    </>
                  ) : (
                    <>
                      <FaEnvelope style={{ marginLeft: '8px', fontSize: '0.9em' }} />
                       ایمیل (به عنوان نام کاربری):
                    </>
                  )}
                </label>
                <input
                  type={mode === 'login' ? "text" : "email"}
                  id={mode === 'login' ? "login-identifier" : "register-email"}
                  value={mode === 'login' ? identifier : emailForRegister}
                  onChange={(e) => mode === 'login' ? setIdentifier(e.target.value) : setEmailForRegister(e.target.value)}
                  required
                  placeholder={mode === 'login' ? "نام کاربری یا example@domain.com" : "example@domain.com"}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <div className="password-options">
                  <label htmlFor="password">
                    <FaLock style={{ marginLeft: '8px', fontSize: '0.9em' }} />
                    رمز عبور:
                  </label>
                  {mode === 'register' && (
                    <button
                      type="button"
                      onClick={handleSuggestPassword}
                      className="generate-password-button"
                      title="پیشنهاد رمز عبور قوی ۱۶ رقمی"
                    >
                      <FaKey /> پیشنهاد رمز
                    </button>
                  )}
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={mode === 'register' ? "حداقل ۸ کاراکتر یا از پیشنهاد استفاده کنید" : "رمز عبور"}
                    className="form-control"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password-visibility"
                    aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? (
                  <div className="spinner-sm-container">
                    <div className="spinner-sm" role="status"></div>
                    <span>{mode === 'login' ? 'در حال ورود...' : 'در حال ثبت‌نام...'}</span>
                  </div>
                ) : (mode === 'login' ? 'ورود' : 'ثبت‌نام')}
              </button>
            </form>
            <div className="auth-toggle-section">
              {mode === 'login' ? (
                <>
                  حساب کاربری ندارید؟{' '}
                  <button type="button" onClick={() => { setMode('register'); setShowMessage(false); setPassword('');}} className="toggle-auth-button">
                    <FaUserPlus style={{ marginLeft: '5px' }} /> ایجاد حساب جدید
                  </button>
                </>
              ) : (
                <>
                  قبلاً ثبت‌نام کرده‌اید؟{' '}
                  <button type="button" onClick={() => { setMode('login'); setShowMessage(false); setPassword('');}} className="toggle-auth-button">
                    <FaSignInAlt style={{ marginLeft: '5px' }} /> ورود به حساب کاربری
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="contact-us-section">
            <h4 className="contact-us-title">با ما در ارتباط باشید...</h4>
            <div className="social-buttons-container">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`social-button ${social.platform} ${hoveredSocial === social.platform ? 'hovered' : ''}`}
                  onMouseEnter={() => handleSocialMouseEnter(social.platform)}
                  onMouseLeave={handleSocialMouseLeave}
                  style={{
                    '--social-color': social.color,
                    '--social-hover-color': social.hoverColor
                  }}
                  aria-label={social.platform}
                >
                  <span className="social-icon">{social.icon}</span>
                  <span className="social-text">
                    {hoveredSocial === social.platform ? social.text : ''}
                  </span>
                </a>
              ))}
            </div>
          </div>
          <div className="made-with-love">
            MADE WITH <FaHeart className="heart-icon" />{'  '}BY Parza Team
          </div>
          <div className="app-version">
            نسخه 0.0.4 beta
          </div>
        </div>
        <div className="login-image-section">
          <img src={loginPageImage} alt="نمای کلی برنامه زرفولیو" />
        </div>
      </div>
      <PasswordStrengthModal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
      />
    </div>
  );
}

export default LoginPage;
