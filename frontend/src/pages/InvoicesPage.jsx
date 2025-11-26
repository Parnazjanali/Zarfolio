// frontend/src/pages/InvoicesPage.jsx
import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, message } from 'antd';
import axios from 'axios';
import AdvancedFilter from '../components/AdvancedFilter.jsx';

const { Title } = Typography;

// URL پایه API
const API_BASE_URL = 'http://localhost:8080/api/v1/tr/transactions';

const InvoicesPage = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

 const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  console.log('توکن لود شده:', token ? 'موجود' : 'ندارد');
  return token || '';
};
  // دریافت لیست تراکنش‌ها از API
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      setFilteredData(response.data); // فرض می‌کنیم API آرایه‌ای از تراکنش‌ها برمی‌گرداند
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('خطا در دریافت فاکتورها');
    } finally {
      setLoading(false);
    }
  };

  // اجرای درخواست هنگام لود شدن کامپوننت
  useEffect(() => {
    fetchTransactions();
  }, []);

  // مدیریت فیلترها
  const handleFilter = async (filters) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/search`, filters, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      setFilteredData(response.data); // به‌روزرسانی داده‌ها با نتیجه فیلتر
      message.success('فیلتر با موفقیت اعمال شد');
    } catch (error) {
      console.error('Error applying filters:', error);
      message.error('خطا در اعمال فیلترها');
    } finally {
      setLoading(false);
    }
  };

  // تعریف ستون‌های جدول
  const columns = [
    {
      title: 'شماره فاکتور',
      dataIndex: 'invoice_code',
      key: 'invoice_code',
    },
    {
      title: 'مشتری/تامین‌کننده',
      dataIndex: 'party_id',
      key: 'party_id',
      render: (partyId) => partyId || 'نامشخص', // در صورت نیاز، باید نام مشتری را از API دیگری بگیرید
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'confirmed') return <Tag color="success">تأیید شده</Tag>;
        if (status === 'pending') return <Tag color="warning">در انتظار</Tag>;
        if (status === 'cancelled') return <Tag color="error">لغو شده</Tag>;
        return <Tag color="default">{status}</Tag>;
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('fa-IR'),
    },
    {
      title: 'مبلغ (تومان)',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => amount.toLocaleString('fa-IR'),
    },
    {
      title: 'نوع تراکنش',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        if (type === 'sale') return 'فروش';
        if (type === 'purchase') return 'خرید';
        return type;
      },
    },
  ];

  return (
    <div>
      <Title level={2}>مدیریت فاکتورها</Title>
      <AdvancedFilter onFilter={handleFilter} />
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default InvoicesPage;