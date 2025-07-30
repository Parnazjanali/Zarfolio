// frontend/src/pages/FundsPage.jsx
import React, { useState } from 'react';
import { Table, Button, Input, Space, Typography, Tag, Card, Modal, message } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;

// داده‌های نمونه برای نمایش اولیه
const sampleFunds = [
  { id: 1, code: '101', name: 'صندوق اصلی', balance: 12500000, currency: 'IRR', description: 'صندوق فروش روزانه' },
  { id: 2, code: '102', name: 'صندوق ارزی', balance: 500, currency: 'USD', description: 'صندوق دلاری فروشگاه' },
  { id: 3, code: '103', name: 'صندوق تنخواه', balance: -250000, currency: 'IRR', description: 'تنخواه گردان برای هزینه‌های جاری' },
];

const FundsPage = () => {
    const [funds, setFunds] = useState(sampleFunds);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDelete = (fundId) => {
        Modal.confirm({
            title: 'آیا از حذف این صندوق مطمئن هستید؟',
            content: 'این عملیات قابل بازگشت نیست.',
            okText: 'بله، حذف کن',
            cancelText: 'انصراف',
            onOk: () => {
                setFunds(funds.filter(fund => fund.id !== fundId));
                message.success('صندوق با موفقیت حذف شد.');
            },
        });
    };

    const filteredData = funds.filter(fund =>
        fund.name.toLowerCase().includes(searchText.toLowerCase()) ||
        fund.code.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'کد',
            dataIndex: 'code',
            key: 'code',
            sorter: (a, b) => a.code.localeCompare(b.code),
        },
        {
            title: 'نام صندوق',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => <Link to={`/funds/statement/${record.code}`}>{text}</Link>,
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'موجودی',
            dataIndex: 'balance',
            key: 'balance',
            render: (balance, record) => (
                <Tag color={balance >= 0 ? 'green' : 'red'}>
                    {Math.abs(balance).toLocaleString('fa-IR')} {record.currency}
                </Tag>
            ),
            sorter: (a, b) => a.balance - b.balance,
        },
        {
            title: 'توضیحات',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (text, record) => (
                <Space>
                    <Link to={`/funds/statement/${record.code}`}>
                        <Button type="text" icon={<EyeOutlined />} title="مشاهده گردش" />
                    </Link>
                    <Link to={`/funds/edit/${record.id}`}>
                        <Button type="text" icon={<EditOutlined />} title="ویرایش" />
                    </Link>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} title="حذف" />
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>مدیریت صندوق‌ها</Title>
                <Link to="/funds/new">
                    <Button type="primary" icon={<PlusOutlined />}>
                        صندوق جدید
                    </Button>
                </Link>
            </div>
            <Input
                placeholder="جستجو در نام یا کد صندوق..."
                prefix={<SearchOutlined />}
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
                allowClear
            />
            <Table
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                bordered
            />
        </Card>
    );
};

export default FundsPage;