import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tabs, Table, Select, message, Spin, Alert, Tag } from 'antd';
import { FaUsersCog, FaPrint, FaCogs, FaMoneyBillWave } from 'react-icons/fa';
import './SettingsPage.css';

const { Option } = Select;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

//================================================================
// کامپوننت جدید برای مدیریت کاربران
//================================================================
const UserManagementPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser, token } = useAuth(); // کاربر لاگین کرده

  // تابع برای دریافت لیست کاربران از سرور
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        // **نکته:** شما باید این API را در بک‌اند خود بسازید
        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('خطا در دریافت اطلاعات کاربران از سرور');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  // تابع برای تغییر نقش کاربر
  const handleRoleChange = async (userId, newRole) => {
    // جلوگیری از تغییر نقش توسط کاربر فعلی برای خودش
    if (userId === currentUser.id) {
        message.error("شما نمی‌توانید نقش خود را تغییر دهید.");
        return;
    }

    try {
      // **نکته:** شما باید این API را در بک‌اند خود بسازید
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('خطا در به‌روزرسانی نقش کاربر');
      }
      
      // آپدیت لیست کاربران در فرانت‌اند بدون نیاز به رفرش
      setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      message.success(`نقش کاربر با موفقیت به ${newRole} تغییر یافت.`);

    } catch (err) {
      message.error(err.message);
    }
  };
  
  // تعریف ستون‌های جدول Ant Design
  const columns = [
    { title: 'نام کاربری', dataIndex: 'username', key: 'username', },
    { title: 'ایمیل', dataIndex: 'email', key: 'email', },
    { 
      title: 'نقش فعلی', 
      dataIndex: 'role', 
      key: 'role',
      render: role => <Tag color={role === 'مدیر ارشد سیستم' ? 'volcano' : role === 'مدیر' ? 'geekblue' : 'green'}>{role}</Tag>
    },
    {
      title: 'تغییر نقش',
      key: 'action',
      render: (text, record) => (
        <Select
          defaultValue={record.role}
          style={{ width: 150 }}
          onChange={(newRole) => handleRoleChange(record.id, newRole)}
          // ادمین اصلی سیستم نباید قابل تغییر باشد
          disabled={record.username === 'admin_user1' || record.id === currentUser.id}
        >
          <Option value="مدیر ارشد سیستم">مدیر ارشد سیستم</Option>
          <Option value="مدیر">مدیر</Option>
          <Option value="حسابدار">حسابدار</Option>
          <Option value="فروشنده">فروشنده</Option>
        </Select>
      ),
    },
  ];

  if (loading) {
    return <Spin tip="در حال بارگذاری لیست کاربران..." size="large" />;
  }

  if (error) {
    return <Alert message="خطا" description={error} type="error" showIcon />;
  }

  return (
    <div className="user-management-panel">
      <p>در این بخش می‌توانید نقش کاربران سیستم را مشاهده و ویرایش کنید.</p>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};


// کامپوننت‌های موقت برای سایر تب‌ها
const GeneralSettingsPanel = () => <div>تنظیمات عمومی سیستم در اینجا قرار می‌گیرد.</div>;
const FinancialSettingsPanel = () => <div>تنظیمات مالی و حسابداری در اینجا قرار می‌گیرد.</div>;
const PrintSettingsPanel = () => <div>تنظیمات مربوط به چاپ فاکتور و اتیکت در اینجا قرار می‌گیرد.</div>;


//================================================================
// کامپوننت اصلی صفحه تنظیمات
//================================================================
const SettingsPage = () => {
    const { user } = useAuth();
    
    // نقش‌هایی که به مدیریت کاربران دسترسی دارند
    const canManageUsers = user && ['مدیر ارشد سیستم', 'مدیر'].includes(user.role);

    // تعریف تب‌ها
    const items = [
        ...(canManageUsers ? [{
            key: 'user-management',
            label: <span><FaUsersCog /> مدیریت کاربران</span>,
            children: <UserManagementPanel />,
        }] : []),
        {
            key: 'general',
            label: <span><FaCogs /> تنظیمات عمومی</span>,
            children: <GeneralSettingsPanel />,
        },
        {
            key: 'financial',
            label: <span><FaMoneyBillWave /> تنظیمات مالی</span>,
            children: <FinancialSettingsPanel />,
        },
        {
            key: 'print',
            label: <span><FaPrint /> تنظیمات چاپ</span>,
            children: <PrintSettingsPanel />,
        },
    ];

    return (
        <div className="settings-container">
            <h1 className="page-title">تنظیمات سیستم</h1>
            <Tabs defaultActiveKey="general" type="card" items={items} />
        </div>
    );
};

export default SettingsPage;