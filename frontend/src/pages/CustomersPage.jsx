<<<<<<< HEAD
// src/pages/CustomersPage.jsx
=======
>>>>>>> parnaz-changes
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Input, Space, Typography, notification, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';

const { Title } = Typography;

<<<<<<< HEAD
// ۱. تابع دریافت داده‌ها از کد شما گرفته شده و بهینه شده است
// این تابع وظیفه ارسال درخواست به API با توکن و برگرداندن داده‌ها را دارد
const fetchCustomers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        // این خطا به useQuery ارسال می‌شود و در کامپوننت مدیریت می‌شود
        throw new Error('برای دسترسی به این بخش، لطفا ابتدا وارد شوید.');
    }

    // آدرس API شما برای دریافت لیست مشتریان
    const response = await fetch('/api/v1/profiles', {
=======
// ۱. تابع دریافت داده‌ها از بک‌اند شما
const fetchCustomers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('برای دسترسی به این بخش، لطفا ابتدا وارد شوید.');
    }
    
    // ⭐ آدرس API Gateway برای دریافت لیست مشتریان
    const API_BASE_URL = 'http://localhost:8080'; 
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers`, {
>>>>>>> parnaz-changes
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `خطای سرور: ${response.status}` }));
        throw new Error(errorData.message || `خطای سرور: ${response.status}`);
    }
    
    return response.json();
};

function CustomersPage() {
<<<<<<< HEAD
    // ۲. از هوک useQuery برای دریافت و کش داده‌ها استفاده می‌کنیم
    const { data: customers = [], error, isLoading } = useQuery({
        queryKey: ['customers'], // یک کلید منحصر به فرد برای این داده
        queryFn: fetchCustomers, // تابعی که برای دریافت داده استفاده می‌شود
        staleTime: 5 * 60 * 1000, // داده‌ها تا ۵ دقیقه تازه در نظر گرفته می‌شوند
=======
    // ۲. استفاده از useQuery برای مدیریت داده‌ها
    const { data: customers = [], error, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
        staleTime: 5 * 60 * 1000,
>>>>>>> parnaz-changes
    });

    const [searchText, setSearchText] = useState('');

<<<<<<< HEAD
    // ۳. فیلتر کردن داده‌ها برای جستجو
    const filteredData = customers.filter(customer =>
        (customer.first_name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (customer.last_name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (customer.national_id?.toString() || '').includes(searchText)
    );

    // ۴. ستون‌های جدول با استفاده از کامپوننت‌های Ant Design تعریف شده‌اند
    const columns = [
        { title: 'کد مشتری', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        { title: 'نام', dataIndex: 'first_name', key: 'first_name', sorter: (a, b) => a.first_name.localeCompare(b.first_name) },
        { title: 'نام خانوادگی', dataIndex: 'last_name', key: 'last_name', sorter: (a, b) => a.last_name.localeCompare(b.last_name) },
        { title: 'کد ملی', dataIndex: 'national_id', key: 'national_id' },
=======
    // ⭐ ۳. فیلتر کردن داده‌ها با استفاده از فیلدهای جدید
    const filteredData = customers.filter(customer =>
        (customer.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (customer.familyName?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (customer.shenasemeli?.toString() || '').includes(searchText) ||
        (customer.code?.toLowerCase() || '').includes(searchText.toLowerCase())
    );

    // ⭐ ۴. ستون‌های جدول با نام فیلدهای جدید
    const columns = [
        { title: 'شناسه', dataIndex: 'ID', key: 'ID', sorter: (a, b) => a.ID - b.ID },
        { title: 'کد مشتری', dataIndex: 'code', key: 'code' },
        { title: 'نام مستعار', dataIndex: 'nikename', key: 'nikename', sorter: (a, b) => a.nikename.localeCompare(b.nikename) },
        { title: 'نام', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'نام خانوادگی', dataIndex: 'familyName', key: 'familyName', sorter: (a, b) => (a.familyName || '').localeCompare(b.familyName || '') },
        { title: 'کد ملی', dataIndex: 'shenasemeli', key: 'shenasemeli' },
>>>>>>> parnaz-changes
        {
            title: 'عملیات',
            key: 'actions',
            render: (text, record) => (
                <Space>
<<<<<<< HEAD
                    <Link to={`/customers/edit/${record.id}`}>
                        <Button type="primary" ghost>ویرایش</Button>
                    </Link>
                    <Link to={`/customer/${record.id}`}>
=======
                    <Link to={`/customers/edit/${record.ID}`}>
                        <Button type="primary" ghost>ویرایش</Button>
                    </Link>
                    <Link to={`/customer/${record.ID}`}>
>>>>>>> parnaz-changes
                        <Button>مشاهده جزئیات</Button>
                    </Link>
                </Space>
            ),
        },
    ];

<<<<<<< HEAD
    // ۵. اگر خطایی در دریافت داده رخ دهد، با کامپوننت Alert نمایش داده می‌شود
=======
>>>>>>> parnaz-changes
    if (error) {
        return <Alert message="خطا در دریافت اطلاعات" description={error.message} type="error" showIcon />;
    }

<<<<<<< HEAD
    // ۶. کامپوننت نهایی با ترکیب ظاهر حرفه‌ای و منطق داده قدرتمند
=======
>>>>>>> parnaz-changes
    return (
        <div>
            <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>لیست طرف حساب‌ها و مشتریان</Title>
                <Link to="/customers/new">
                    <Button type="primary" icon={<FaPlus style={{ marginLeft: 8 }} />}>
                        مشتری جدید
                    </Button>
                </Link>
            </Space>
            <Input
<<<<<<< HEAD
                placeholder="جستجو بر اساس نام، نام خانوادگی یا کد ملی..."
=======
                placeholder="جستجو بر اساس نام، نام خانوادگی، کد ملی یا کد مشتری..."
>>>>>>> parnaz-changes
                prefix={<FaSearch style={{ color: 'rgba(0,0,0,.25)' }} />}
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
            />
            <Table
                columns={columns}
                dataSource={filteredData}
<<<<<<< HEAD
                loading={isLoading} // وضعیت لودینگ به جدول وصل شده است
                rowKey="id"
=======
                loading={isLoading}
                rowKey="ID" // ⭐ تغییر rowKey به ID
>>>>>>> parnaz-changes
                bordered
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}

export default CustomersPage;