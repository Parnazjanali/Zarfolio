// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForms.css'; 
import loginPageImage from '../assets/login.jpg'; 
import {
  FaInstagram, FaTelegramPlane, FaWhatsapp, FaHeart,
  FaUserPlus, FaSignInAlt, FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaKey, FaShieldAlt, FaTimes, FaCheckCircle // <<<< FaTimes و FaCheckCircle اضافه شدند >>>>
} from 'react-icons/fa';
import Portal from '../components/Portal';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const APP_VERSION = "0.0.4 beta"; 

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
          <h3><FaShieldAlt /> راهنمای انتخاب رمز عبور قوی</h3>
          <p>برای افزایش امنیت حساب کاربری خود، لطفاً در انتخاب رمز عبور به موارد زیر توجه فرمایید:</p>
          <ul>
            <li>رمز عبور باید حداقل ۸ کاراکتر باشد.</li>
            <li>شامل حروف بزرگ و کوچک انگلیسی باشد.</li>
            <li>شامل حداقل یک عدد باشد.</li>
            <li>شامل حداقل یک نماد خاص (مانند !@#$%^&*) باشد.</li>
            <li>از اطلاعات شخصی قابل حدس زدن (مانند تاریخ تولد یا نام) استفاده نکنید.</li>
          </ul>
          <div className="password-strength-modal-actions">
            <button type="button" className="password-strength-modal-button" onClick={onClose}>متوجه شدم</button>
          </div>
        </div>
      </div>
    </Portal>
  );
};


function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // این state برای مودال باقی می‌ماند
  const [hoveredSocial, setHoveredSocial] = useState(null);

  // State for 2FA login
  const [loginStep, setLoginStep] = useState('password'); // 'password' or '2fa'
  const [userIDFor2FA, setUserIDFor2FA] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSocialMouseEnter = (platform) => setHoveredSocial(platform);
  const handleSocialMouseLeave = () => setHoveredSocial(null);

  const socialLinks = [
    { platform: 'instagram', href: 'https://instagram.com/parnaz.janali', icon: <FaInstagram />, text: 'اینستاگرام', color: '#E1306C', hoverColor: '#c13584' },
    { platform: 'telegram', href: 'https://t.me/parnaz_janali', icon: <FaTelegramPlane />, text: 'تلگرام', color: '#0088cc', hoverColor: '#0077b5' },
    { platform: 'whatsapp', href: 'https://wa.me/989121234567', icon: <FaWhatsapp />, text: 'واتساپ', color: '#25D366', hoverColor: '#1DA851' },
  ];
  
  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages(); // Clears both error and success messages

    if (loginStep === 'password') {
        if (isLogin) {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    if (data.two_fa_required && data.user_id) {
                        setLoginStep('2fa');
                        setUserIDFor2FA(data.user_id);
                        setSuccessMessage('رمز عبور صحیح است. کد تایید دو مرحله‌ای خود را وارد کنید.');
                    } else if (data.token) {
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('userData', JSON.stringify(data.user));
                        setSuccessMessage('ورود با موفقیت انجام شد. در حال انتقال به داشبورد...');
                        setTimeout(() => navigate('/dashboard'), 1500);
                    } else {
                         setError(data.message || 'پاسخ سرور نامعتبر است.');
                    }
                } else {
                    setError(data.message || 'نام کاربری یا رمز عبور نامعتبر است.');
                }
            } catch (err) {
                setError('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
                console.error('Login error (password step):', err);
            }
        } else { // Registration logic
            if (password !== confirmPassword) {
                setError('رمز عبور و تکرار آن یکسان نیستند.');
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/register/user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });
                const data = await response.json();
                if (response.ok || response.status === 201) {
                    setSuccessMessage(data.message || 'ثبت نام با موفقیت انجام شد. اکنون می‌توانید وارد شوید.');
                    setIsLogin(true);
                    setUsername('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setLoginStep('password'); // Ensure it's back to password step
                } else {
                    setError(data.message || 'خطا در ثبت نام. لطفاً دوباره تلاش کنید.');
                }
            } catch (err) {
                setError('خطا در برقراری ارتباط با سرور.');
                console.error('Registration error:', err);
            }
        }
    } else if (loginStep === '2fa') {
        if (!totpCode) {
            setError('کد تایید دو مرحله‌ای را وارد کنید.');
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login/2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userIDFor2FA, totp_code: totpCode }),
            });
            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                setSuccessMessage('ورود با موفقیت انجام شد. در حال انتقال به داشبورد...');
                setTotpCode('');
                setUserIDFor2FA('');
                setLoginStep('password');
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setError(data.message || 'کد تایید دو مرحله‌ای نامعتبر است یا خطایی رخ داده.');
            }
        } catch (err) {
            setError('خطا در برقراری ارتباط با سرور برای تایید کد 2FA.');
            console.error('Login error (2FA step):', err);
        }
    }
    setIsLoading(false);
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    clearMessages();
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRememberMe(false);
    setIsPasswordModalOpen(false);
    setLoginStep('password'); // Reset to password step when toggling form type
    setTotpCode('');
    setUserIDFor2FA('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
    setIsPasswordModalOpen(true); // <<<< تغییر: مودال راهنما با کلیک روی دکمه پیشنهاد باز می‌شود >>>>
  };

  // onFocus و onBlur از فیلد رمز حذف می‌شوند اگر فقط با دکمه "پیشنهاد" مودال باز شود.
  // const handlePasswordFocus = () => setIsPasswordModalOpen(true); 
  // const handlePasswordBlur = () => setIsPasswordModalOpen(false);
  const handleClosePasswordModal = () => setIsPasswordModalOpen(false);


  const renderAuthForm = () => (
    <form onSubmit={handleSubmit} className="auth-form">
        {loginStep === 'password' && (
            <>
                <div className="form-group">
                    <label htmlFor={isLogin ? "login-username" : "register-username"}>
                        <FaUserCircle /> {isLogin ? "نام کاربری یا ایمیل" : "نام کاربری"}
                    </label>
                    <input
                        type="text"
                        id={isLogin ? "login-username" : "register-username"}
                        className="form-control"
                        placeholder={isLogin ? "نام کاربری یا ایمیل خود را وارد کنید" : "یک نام کاربری انتخاب کنید"}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={isLogin || !isLogin}
                    />
                </div>

                {!isLogin && (
                    <div className="form-group">
                        <label htmlFor="register-email"><FaEnvelope /> ایمیل</label>
                        <input
                            type="email"
                            id="register-email"
                            className="form-control"
                            placeholder="ایمیل خود را وارد کنید"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor={isLogin ? "login-password" : "register-password"}>
                        <FaLock /> {isLogin ? "رمز عبور" : "ایجاد رمز عبور"}
                    </label>
                    <div className="password-field-container">
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id={isLogin ? "login-password" : "register-password"}
                                className="form-control"
                                placeholder={isLogin ? "رمز عبور خود را وارد کنید" : "رمز عبور قدرتمندی انتخاب کنید"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {!isLogin && (
                            <button
                                type="button"
                                className="generate-password-button"
                                onClick={handleGeneratePassword}
                                title="پیشنهاد رمز عبور قوی و مشاهده راهنما"
                            >
                                <FaKey /> پیشنهاد
                            </button>
                        )}
                    </div>
                </div>

                {!isLogin && (
                    <div className="form-group">
                        <label htmlFor="register-confirm-password"><FaLock /> تکرار رمز عبور</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="register-confirm-password"
                                className="form-control"
                                placeholder="رمز عبور خود را مجدداً وارد کنید"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-visibility"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                title={showConfirmPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>
                )}

                {isLogin && (
                    <div className="password-options">
                        <label htmlFor="remember-me" className="remember-me-label">
                            <input
                                type="checkbox"
                                id="remember-me"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            مرا به خاطر بسپار
                        </label>
                        <Link to="/request-password-reset" className="forgot-password-link">فراموشی رمز عبور؟</Link>
                    </div>
                )}
            </>
        )}

        {loginStep === '2fa' && isLogin && (
            <div className="form-group">
                <label htmlFor="totp-code"><FaShieldAlt /> کد تایید دو مرحله‌ای</label>
                <input
                    type="text"
                    id="totp-code"
                    className="form-control"
                    placeholder="کد ۶ رقمی خود را وارد کنید"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    required
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '0.2em' }}
                />
            </div>
        )}

        {error && <div className="message-banner error visible"><FaTimes style={{ marginLeft: '7px' }} />{error}</div>}
        {successMessage && <div className="message-banner success visible"><FaCheckCircle style={{ marginLeft: '7px' }} />{successMessage}</div>}

        <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <span className="spinner-sm"></span> :
                (loginStep === '2fa' ? <FaShieldAlt /> : (isLogin ? <FaSignInAlt /> : <FaUserPlus />))
            }
            {isLoading ? (loginStep === '2fa' ? 'در حال تایید کد...' : (isLogin ? 'در حال ورود...' : 'در حال ثبت نام...')) :
                (loginStep === '2fa' ? 'تایید کد و ورود' : (isLogin ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری'))
            }
        </button>
    </form>
  );

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-form-section">
          <div className="auth-container">
            <header className="auth-header">
              <span className="auth-header-icon">
                {loginStep === '2fa' && isLogin ? <FaShieldAlt /> : (isLogin ? <FaSignInAlt /> : <FaUserPlus />)}
              </span>
              <h2>
                {loginStep === '2fa' && isLogin ? 'تایید دو مرحله‌ای' : (isLogin ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری جدید')}
              </h2>
            </header>
            <p className="auth-subtitle">
              {loginStep === '2fa' && isLogin
                ? 'کد ۶ رقمی تولید شده توسط برنامه Authenticator خود را وارد کنید.'
                : (isLogin
                    ? 'خوش آمدید! لطفاً اطلاعات ورود خود را برای دسترسی به پنل کاربری وارد نمایید.'
                    : 'با ایجاد حساب کاربری جدید، به تمامی امکانات پیشرفته زرفولیو دسترسی خواهید داشت.')
              }
            </p>
            {renderAuthForm()}
            <div className="auth-toggle-section">
              {isLogin ? 'هنوز حساب کاربری ندارید؟' : 'قبلاً ثبت نام کرده‌اید؟'}
              <button type="button" onClick={toggleForm} className="toggle-auth-button">
                {isLogin ? 'ایجاد حساب جدید' : 'ورود به حساب'}
                <FaUserCircle style={{ marginRight: '5px' }} />
              </button>
            </div>
            <div className="contact-us-section">
              <p className="contact-us-title">با ما در ارتباط باشید</p>
              <div className="social-buttons-container">
                {socialLinks.map(social => (
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
              نسخه {APP_VERSION}
            </div>
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