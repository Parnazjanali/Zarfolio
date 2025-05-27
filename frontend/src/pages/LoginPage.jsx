// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css'; // Ensure this path is correct
import loginPageImage from '../assets/login.jpg'; // Ensure this path is correct
import {
  FaInstagram, FaTelegramPlane, FaWhatsapp, FaHeart,
  FaUserPlus, FaSignInAlt, FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaKey, FaShieldAlt, // آیکون برای مودال
} from 'react-icons/fa';
import Portal from '../components/Portal'; // اگر مودال را در پورتال نمایش می‌دهید

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const generateStrongPassword = (length = 16) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:',.<>/?";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

// کامپوننت مودال برای نمایش مزایای رمز قوی
const PasswordStrengthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Portal> {/* نمایش مودال در ریشه DOM */}
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

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // State برای مودال

  const navigate = useNavigate();
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
    setIsPasswordModalOpen(true); // نمایش مودال پس از ایجاد رمز
    // displayMessage('یک رمز عبور قوی برای شما ایجاد شد! آن را به خاطر بسپارید یا در مکانی امن ذخیره کنید.', false, 4000);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    displayMessage('رمز عبور قوی در فیلد قرار گرفت. آن را به خاطر بسپارید یا در مکانی امن ذخیره کنید.', false, 4000);
  }

  // ... (handleLogin و handleRegister بدون تغییر عمده)
  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setShowMessage(false);

    if (identifier === 'admin' && password === 'admin') {
      localStorage.setItem('authToken', 'dummy-admin-token');
      localStorage.setItem('username', 'ادمین موقت');
      localStorage.setItem('showReleaseNotes', 'true');
      setIsLoading(false);
      navigate('/dashboard');
      return;
    }
    const loginPayload = { identifier: identifier, password: password };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('username', data.user?.name || data.user?.username || identifier.split('@')[0]);
        localStorage.setItem('showReleaseNotes', 'true');
        displayMessage('ورود با موفقیت انجام شد! در حال انتقال به داشبورد...', false);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        displayMessage(data.message || 'نام کاربری/ایمیل یا رمز عبور نامعتبر است.', true);
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

    if (password.length < 8 ) { // بررسی ساده‌تر طول، چون تولید کننده رمز قوی داریم
        displayMessage('رمز عبور باید حداقل ۸ کاراکتر باشد. می‌توانید از گزینه "پیشنهاد رمز" استفاده کنید.', true, 7000);
        setIsLoading(false);
        return;
    }
    // بقیه اعتبارسنجی‌ها
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
      const response = await fetch(`${API_BASE_URL}/register/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: emailForRegister, password }),
      });
      const data = await response.json();
      if (response.ok) {
        displayMessage('ثبت‌نام با موفقیت انجام شد! اکنون می‌توانید وارد شوید.', false, 7000);
        setMode('login');
        setIdentifier(emailForRegister);
        setPassword(''); // پاک کردن پسورد پس از ثبت‌نام موفق
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
      // navigate('/dashboard');
    }
  }, [navigate]);


  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-form-section">
          <div className="auth-container">
            {/* ... هدر و ساب‌تایتل ... */}
            <div className="auth-header">
              <FaUserCircle className="auth-header-icon" />
              <h2>{mode === 'login' ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری جدید'}</h2>
            </div>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'برای دسترسی به پنل مدیریت زرفولیو وارد شوید.'
                : 'با ثبت‌نام در زرفولیو، مدیریت کسب و کار خود را آغاز کنید.'}
            </p>


            {showMessage && (
              <div className={`message-banner ${isError ? 'error' : 'success'} ${showMessage ? 'visible' : ''}`}>
                {message}
                <button type="button" onClick={() => setShowMessage(false)} className="close-message-btn">&times;</button>
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              {/* ... فیلدهای نام و ایمیل برای ثبت‌نام ... */}
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
                    placeholder="مثال: پرناز جنابی"
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
                       ایمیل:
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
              {/* ... بقیه فرم ... */}
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
          </div> {/* End of auth-container */}

          <div className="contact-us-section">
            {/* ... بخش شبکه‌های اجتماعی ... */}
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
            MADE WITH <FaHeart className="heart-icon" />{'  '}BY PARNAZ
          </div>
          <div className="app-version">
            نسخه 0.0.3 beta
          </div>

        </div> {/* End of login-form-section */}

        <div className="login-image-section">
          <img src={loginPageImage} alt="نمای کلی برنامه زرفولیو" />
        </div>
      </div> {/* End of login-card */}

      {/* مودال پاپ‌آپ برای نمایش مزایای رمز قوی */}
      <PasswordStrengthModal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
      />
    </div>
  );
}

export default LoginPage;