import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Input, Space, Typography, notification, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';

const { Title } = Typography;

// ۱. تابع دریافت داده‌ها از بک‌اند شما
const fetchCustomers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('برای دسترسی به این بخش، لطفا ابتدا وارد شوید.');
    }
    
    // ⭐ آدرس API Gateway برای دریافت لیست مشتریان
    const API_BASE_URL = 'http://localhost:8080'; 
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers`, {
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
    // ۲. استفاده از useQuery برای مدیریت داده‌ها
    const { data: customers = [], error, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
        staleTime: 5 * 60 * 1000,
    });

    const [searchText, setSearchText] = useState('');

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
        {
            title: 'عملیات',
            key: 'actions',
            render: (text, record) => (
                <Space>
                    <Link to={`/customers/edit/${record.ID}`}>
                        <Button type="primary" ghost>ویرایش</Button>
                    </Link>
                    <Link to={`/customer/${record.ID}`}>
                        <Button>مشاهده جزئیات</Button>
                    </Link>
                </Space>
            ),
        },
    ];

    if (error) {
        return <Alert message="خطا در دریافت اطلاعات" description={error.message} type="error" showIcon />;
    }

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
                placeholder="جستجو بر اساس نام، نام خانوادگی، کد ملی یا کد مشتری..."
                prefix={<FaSearch style={{ color: 'rgba(0,0,0,.25)' }} />}
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
            />
            <Table
                columns={columns}
                dataSource={filteredData}
                loading={isLoading}
                rowKey="ID" // ⭐ تغییر rowKey به ID
                bordered
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}

export default CustomersPage;