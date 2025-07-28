// frontend/src/pages/AccountManagementPage.jsx
import React from 'react';
import { Typography } from 'antd';
import UserProfileBlock from '../components/UserProfileBlock.jsx'; // 1. وارد کردن کامپوننت

const { Title } = Typography;

const AccountManagementPage = () => {
  return (
    <div>
      <Title level={2}>مدیریت حساب کاربری</Title>
      <p>اطلاعات حساب کاربری و تنظیمات امنیتی خود را در اینجا مدیریت کنید.</p>

      {/* 2. استفاده از کامپوننت */}
      <UserProfileBlock />

      {/* می‌توانید بلوک‌های دیگری برای تنظیمات دیگر در اینجا اضافه کنید */}
      {/* <ChangePasswordBlock /> */}
    </div>
  );
};

export default AccountManagementPage;