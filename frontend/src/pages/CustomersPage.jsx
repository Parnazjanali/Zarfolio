// src/pages/CustomersPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Input, Space, Typography, notification, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';

const { Title } = Typography;

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
    // ۲. از هوک useQuery برای دریافت و کش داده‌ها استفاده می‌کنیم
    const { data: customers = [], error, isLoading } = useQuery({
        queryKey: ['customers'], // یک کلید منحصر به فرد برای این داده
        queryFn: fetchCustomers, // تابعی که برای دریافت داده استفاده می‌شود
        staleTime: 5 * 60 * 1000, // داده‌ها تا ۵ دقیقه تازه در نظر گرفته می‌شوند
    });

    const [searchText, setSearchText] = useState('');

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
        {
            title: 'عملیات',
            key: 'actions',
            render: (text, record) => (
                <Space>
                    <Link to={`/customers/edit/${record.id}`}>
                        <Button type="primary" ghost>ویرایش</Button>
                    </Link>
                    <Link to={`/customer/${record.id}`}>
                        <Button>مشاهده جزئیات</Button>
                    </Link>
                </Space>
            ),
        },
    ];

    // ۵. اگر خطایی در دریافت داده رخ دهد، با کامپوننت Alert نمایش داده می‌شود
    if (error) {
        return <Alert message="خطا در دریافت اطلاعات" description={error.message} type="error" showIcon />;
    }

    // ۶. کامپوننت نهایی با ترکیب ظاهر حرفه‌ای و منطق داده قدرتمند
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
                placeholder="جستجو بر اساس نام، نام خانوادگی یا کد ملی..."
                prefix={<FaSearch style={{ color: 'rgba(0,0,0,.25)' }} />}
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
            />
            <Table
                columns={columns}
                dataSource={filteredData}
                loading={isLoading} // وضعیت لودینگ به جدول وصل شده است
                rowKey="id"
                bordered
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}

export default CustomersPage;