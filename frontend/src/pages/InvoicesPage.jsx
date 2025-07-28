// frontend/src/pages/InvoicesPage.jsx
import React, { useState } from 'react';
import { Table, Tag, Typography } from 'antd';
import AdvancedFilter from '../components/AdvancedFilter.jsx'; // 1. وارد کردن کامپوننت

const { Title } = Typography;

// داده‌های نمونه
const allInvoices = [
  { key: '1', invoiceNumber: 'INV-001', customer: 'پرویز شمالی', status: 'paid', date: '1403-05-01', amount: '1,500,000' },
  { key: '2', invoiceNumber: 'INV-002', customer: 'مشتری ویژه', status: 'pending', date: '1403-05-03', amount: '850,000' },
  { key: '3', invoiceNumber: 'INV-003', customer: 'فروشگاه مرکزی', status: 'overdue', date: '1403-04-15', amount: '2,300,000' },
];

const InvoicesPage = () => {
  const [filteredData, setFilteredData] = useState(allInvoices);

  const handleFilter = (filters) => {
    // در یک پروژه واقعی، این منطق در سمت سرور انجام می‌شود
    console.log('Applying filters:', filters);
    // اینجا می‌توانید داده‌ها را بر اساس فیلترها در سمت کلاینت فیلتر کنید یا یک درخواست جدید به API بفرستید
    // فعلا فقط فیلترها را در کنسول نمایش می‌دهیم
  };

  const columns = [
    { title: 'شماره فاکتور', dataIndex: 'invoiceNumber' },
    { title: 'مشتری', dataIndex: 'customer' },
    { title: 'وضعیت', dataIndex: 'status', render: status => {
      if (status === 'paid') return <Tag color="success">پرداخت شده</Tag>;
      if (status === 'pending') return <Tag color="warning">در انتظار</Tag>;
      return <Tag color="error">سررسید گذشته</Tag>;
    }},
    { title: 'تاریخ', dataIndex: 'date' },
    { title: 'مبلغ (تومان)', dataIndex: 'amount' },
  ];

  return (
    <div>
      <Title level={2}>مدیریت فاکتورها</Title>
      {/* 2. استفاده از کامپوننت فیلتر */}
      <AdvancedFilter onFilter={handleFilter} />
      <Table columns={columns} dataSource={filteredData} />
    </div>
  );
};

export default InvoicesPage;