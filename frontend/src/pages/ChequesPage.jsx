// src/pages/ChequesPage.jsx
import React, { useState } from 'react';
// 1. کامپوننت App را از 'antd' وارد کنید
import { Card, Table, Tabs, Button, Input, Space, Tag, Typography, App } from 'antd';
import { Link } from 'react-router-dom';
import { 
    PlusOutlined, 
    DeleteOutlined, 
    EditOutlined, 
    SearchOutlined, 
    SwapOutlined,
    CheckCircleOutlined,
    FileExcelOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title } = Typography;

// داده‌های نمونه
const sampleReceivedCheques = [
  { id: 1, number: '123456', sayadNumber: '1000000000000001', amount: 5000000, dueDate: '1403/06/15', personName: 'شرکت نوین', bankName: 'ملت', status: 'جاری' },
  { id: 2, number: '789012', sayadNumber: '1000000000000002', amount: 12500000, dueDate: '1403/07/01', personName: 'فروشگاه آفتاب', bankName: 'سامان', status: 'وصول شده' },
];

const sampleIssuedCheques = [
    { id: 3, number: 'CK-501', sayadNumber: '2000000000000001', amount: 3200000, dueDate: '1403/06/20', personName: 'آقای محمدی', bankName: 'پاسارگاد', status: 'جاری' },
];


const ChequesPage = () => {
    // 2. از هوک useApp برای گرفتن modal و message استفاده کنید
    const { modal, message } = App.useApp();

    const [receivedCheques, setReceivedCheques] = useState(sampleReceivedCheques);
    const [issuedCheques, setIssuedCheques] = useState(sampleIssuedCheques);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('1');

    const handleMarkAsCollected = (id, type) => {
        // 3. به جای Modal.confirm از modal.confirm استفاده کنید
        modal.confirm({
            title: 'آیا این چک وصول شده است؟',
            content: 'با تایید، وضعیت چک به "وصول شده" تغییر می‌کند.',
            okText: 'بله، وصول شد',
            cancelText: 'انصراف',
            onOk: () => {
                const updater = (cheques) => cheques.map(c => c.id === id ? { ...c, status: 'وصول شده' } : c);
                if (type === 'received') {
                    setReceivedCheques(updater);
                } else {
                    setIssuedCheques(updater);
                }
                message.success('وضعیت چک با موفقیت به "وصول شده" تغییر یافت.');
            },
        });
    };

    const handleDelete = (id, type) => {
        // 4. اینجا هم از modal.confirm استفاده کنید
        modal.confirm({
            title: 'آیا از حذف این چک مطمئن هستید؟',
            content: 'این عملیات قابل بازگشت نیست.',
            okText: 'بله، حذف کن',
            cancelText: 'انصراف',
            onOk: () => {
                if (type === 'received') {
                    setReceivedCheques(prev => prev.filter(c => c.id !== id));
                } else {
                    setIssuedCheques(prev => prev.filter(c => c.id !== id));
                }
                message.success('چک با موفقیت حذف شد.');
            },
        });
    };
    
    const handleExportToExcel = () => {
        const dataToExport = activeTab === '1' ? receivedCheques : issuedCheques;
        const sheetName = activeTab === '1' ? 'Cheques_Received' : 'Cheques_Issued';
        const fileName = activeTab === '1' ? 'چک‌های_دریافتی' : 'چک‌های_پرداختی';

        if (dataToExport.length === 0) {
            message.warning('داده‌ای برای خروجی گرفتن وجود ندارد.');
            return;
        }

        const formattedData = dataToExport.map(item => ({
            'شماره چک': item.number, 'شماره صیاد': item.sayadNumber, 'مبلغ': item.amount,
            'تاریخ سررسید': item.dueDate, 'طرف حساب': item.personName, 'بانک': item.bankName, 'وضعیت': item.status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'جاری': return <Tag color="blue">جاری</Tag>;
            case 'وصول شده': return <Tag color="success">وصول شده</Tag>;
            case 'واگذار شده': return <Tag color="purple">واگذار شده</Tag>;
            case 'برگشتی': return <Tag color="error">برگشتی</Tag>;
            default: return <Tag>{status}</Tag>;
        }
    };

    const columns = (type) => [
        { title: 'شماره چک', dataIndex: 'number', key: 'number' },
        { title: 'شماره صیاد', dataIndex: 'sayadNumber', key: 'sayadNumber' },
        { title: 'مبلغ (ریال)', dataIndex: 'amount', key: 'amount', render: (amount) => amount.toLocaleString('fa-IR') },
        { title: 'تاریخ سررسید', dataIndex: 'dueDate', key: 'dueDate' },
        { title: 'طرف حساب', dataIndex: 'personName', key: 'personName' },
        { title: 'بانک', dataIndex: 'bankName', key: 'bankName' },
        { title: 'وضعیت', dataIndex: 'status', key: 'status', render: getStatusTag },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'جاری' && (
                        <Button type="text" icon={<CheckCircleOutlined style={{ color: 'green' }} />} onClick={() => handleMarkAsCollected(record.id, type)} title="وصول چک" />
                    )}
                    <Link to={`/cheques/received/edit/${record.id}`}>
                        <Button type="text" icon={<EditOutlined />} title="ویرایش" />
                    </Link>
                    {type === 'received' && record.status === 'جاری' && (
                         <Link to={`/cheques/transfer/${record.id}`}>
                            <Button type="text" icon={<SwapOutlined />} title="واگذاری" />
                        </Link>
                    )}
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id, type)} title="حذف" />
                </Space>
            ),
        },
    ];

    const tabItems = [
        { key: '1', label: 'چک‌های دریافتی', children: <Table columns={columns('received')} dataSource={receivedCheques.filter(c => JSON.stringify(c).toLowerCase().includes(searchText.toLowerCase()))} rowKey="id" bordered size="small"/> },
        { key: '2', label: 'چک‌های پرداختی', children: <Table columns={columns('issued')} dataSource={issuedCheques.filter(c => JSON.stringify(c).toLowerCase().includes(searchText.toLowerCase()))} rowKey="id" bordered size="small"/> },
    ];

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>مدیریت چک‌ها</Title>
                <Space>
                    <Button icon={<FileExcelOutlined />} onClick={handleExportToExcel}>خروجی اکسل</Button>
                    <Link to="/cheques/received/new"><Button type="primary" icon={<PlusOutlined />}>چک دریافتی جدید</Button></Link>
                    <Link to="/cheques/issued/new"><Button icon={<PlusOutlined />}>چک پرداختی جدید</Button></Link>
                </Space>
            </div>
             <Input placeholder="جستجو در چک‌ها..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} style={{ marginBottom: 16 }} allowClear/>
            <Tabs defaultActiveKey="1" items={tabItems} onChange={(key) => setActiveTab(key)} />
        </Card>
    );
};

export default ChequesPage;