import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Tag, Typography, Spin, Input } from 'antd';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const { Title } = Typography;
const { Search } = Input;

const PluginInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    axios.post('/api/plugin/get/paids')
      .then(response => {
        // افزودن یک کلید منحصر به فرد به هر رکورد برای استفاده در جدول
        const data = response.data.map((item, index) => ({ ...item, key: index }));
        setInvoices(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching paid plugins:", error);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      title: 'نام افزونه',
      dataIndex: 'des',
      key: 'des',
      sorter: (a, b) => a.des.localeCompare(b.des),
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'dateSubmit',
      key: 'dateSubmit',
      sorter: (a, b) => new Date(a.dateSubmit) - new Date(b.dateSubmit),
    },
    {
      title: 'تاریخ اعتبار',
      dataIndex: 'dateExpire',
      key: 'dateExpire',
    },
    {
      title: 'قیمت (تومان)',
      dataIndex: 'price',
      key: 'price',
      render: price => new Intl.NumberFormat('fa-IR').format(price),
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        status === 100 ? (
          <Tag icon={<FaCheckCircle />} color="success">پرداخت موفق</Tag>
        ) : (
          <Tag icon={<FaTimesCircle />} color="error">پرداخت ناموفق</Tag>
        )
      ),
      filters: [
        { text: 'پرداخت موفق', value: 100 },
        { text: 'پرداخت ناموفق', value: 0 }, // مقدار ناموفق را مطابق با API خود تنظیم کنید
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];
  
  const filteredData = invoices.filter(item =>
    item.des.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Card>
      <Title level={4}>تاریخچه خرید افزونه‌ها</Title>
      <Search
        placeholder="جستجو در نام افزونه..."
        onChange={e => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="key"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default PluginInvoicesPage;