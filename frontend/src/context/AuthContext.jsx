import React, { createContext, useContext, useState, useEffect } from 'react';

// ۱. ایجاد کانتکست
const AuthContext = createContext(null);

// ۲. ایجاد پروایدر (فراهم‌کننده)
export const AuthProvider = ({ children }) => {
    // وضعیت توکن را از localStorage می‌خوانیم تا با رفرش صفحه از بین نرود
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));

    // این افکت به تغییرات localStorage در تب‌های دیگر گوش می‌دهد
    useEffect(() => {
        const handleStorageChange = () => {
            setAuthToken(localStorage.getItem('authToken'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const login = () => {
        // پس از لاگین موفق، توکن جدید را از localStorage می‌خوانیم
        // چون این تابع بعد از تنظیم توکن در LoginPage فراخوانی می‌شود
        const token = localStorage.getItem('authToken');
        setAuthToken(token);
    };

    const logout = () => {
        // حذف تمام اطلاعات مربوط به کاربر از localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('2fa_user_id'); // پاک کردن وضعیت 2FA در صورت وجود
        setAuthToken(null);
        // برای اطمینان از خروج کامل، کاربر را به صفحه لاگین هدایت می‌کنیم
        window.location.href = '/login'; 
    };

    // مقدار isAuthenticated به صورت بولین (true/false) از وجود توکن مشتق می‌شود
    const isAuthenticated = !!authToken;

    const value = {
        authToken,
        isAuthenticated,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ۳. ایجاد یک هوک سفارشی برای استفاده آسان
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};