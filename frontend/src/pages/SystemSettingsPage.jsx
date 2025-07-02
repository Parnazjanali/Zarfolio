import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import React from 'react'; // Removed useState, useEffect as they are not used directly in this page anymore for UserManagement
import { useAuth } from '../context/AuthContext';
import { Tabs } from 'antd'; // Removed Table, Select, message, Spin, Alert, Tag as they are now in UserManagementPanel
import { FaUsersCog, FaPrint, FaCogs, FaMoneyBillWave } from 'react-icons/fa';
import './SettingsPage.css';
import UserManagementPanel from '../components/admin/UserManagementPanel'; // Import the new panel

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'; 
// This is now expected to be handled by an apiClient used within UserManagementPanel

// The old UserManagementPanel component (defined inline) is removed.

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