// frontend/src/pages/TransfersPage.jsx
import React, { useState } from 'react';
import { Table, Button, Input, Space, Typography, Tag, Card, Modal, message, Descriptions, Row, Col, Select, DatePicker } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SearchOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx'; // +++ کتابخانه جدید اکسل را وارد می‌کنیم +++

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const sampleTransfers = [
  { id: 1, code: 'TR-001', date: '1403/05/10', fromType: 'بانک', fromObject: 'ملت', toType: 'صندوق', toObject: 'صندوق اصلی', amount: 5000000, fee: 600, description: 'انتقال برای تنخواه' },
  { id: 2, code: 'TR-002', date: '1403/05/11', fromType: 'صندوق', fromObject: 'صندوق اصلی', toType: 'بانک', toObject: 'سامان', amount: 1250000, fee: 0, description: 'واریز به حساب' },
  { id: 3, code: 'TR-003', date: '1403/05/12', fromType: 'بانک', fromObject: 'ملت', toType: 'بانک', toObject: 'سامان', amount: 10000000, fee: 1200, description: 'انتقال بین بانکی' },
];

const TransfersPage = () => {
    const [transfers, setTransfers] = useState(sampleTransfers);
    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState({ fromType: null, toType: null, dateRange: null });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // +++ تابع خروجی اکسل با فرمت XLSX بازنویسی شد +++
    const handleExcelExport = () => {
        message.info('در حال ساخت فایل اکسل...');
        
        // 1. آماده‌سازی داده‌ها برای اکسل
        const dataForExport = filteredData.map(item => ({
            "شماره سند": item.code,
            "تاریخ": item.date,
            "از": `${item.fromType}: ${item.fromObject}`,
            "به": `${item.toType}: ${item.toObject}`,
            "مبلغ": item.amount,
            "کارمزد": item.fee,
            "شرح": item.description
        }));

        // 2. ساخت ورک‌شیت از روی داده‌ها
        const ws = XLSX.utils.json_to_sheet(dataForExport);
        
        // 3. ساخت ورک‌بوک (فایل اکسل)
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "گزارش انتقالات"); // نام شیت

        // 4. ایجاد و دانلود فایل
        XLSX.writeFile(wb, "گزارش_انتقالات.xlsx");
    };
    
    // فیلتر کردن داده‌ها
    const filteredData = transfers.filter(item => {
        const searchTextMatch = Object.values(item).some(val => String(val).toLowerCase().includes(searchText.toLowerCase()));
        const fromTypeMatch = !filters.fromType || item.fromType === filters.fromType;
        const toTypeMatch = !filters.toType || item.toType === filters.toType;
        return searchTextMatch && fromTypeMatch && toTypeMatch;
    });

    const columns = [
        { title: 'عملیات', key: 'actions', render: (_, record) => ( <Space> <Button type="text" icon={<EyeOutlined />} onClick={() => {setSelectedTransfer(record); setIsModalVisible(true);}} /> <Link to={`/transfers/edit/${record.id}`}><Button type="text" icon={<EditOutlined />} /></Link> <Button type="text" danger icon={<DeleteOutlined />} onClick={() => message.info('حذف در نسخه نمایشی غیرفعال است.')} /> </Space> )},
        { title: 'شماره سند', dataIndex: 'code', key: 'code' },
        { title: 'تاریخ', dataIndex: 'date', key: 'date' },
        { title: 'از', key: 'from', render: (_, r) => <Tag color="red">{`${r.fromType}: ${r.fromObject}`}</Tag> },
        { title: 'به', key: 'to', render: (_, r) => <Tag color="green">{`${r.toType}: ${r.toObject}`}</Tag> },
        { title: 'مبلغ', dataIndex: 'amount', key: 'amount', render: (val) => `${val.toLocaleString('fa-IR')} ریال` },
        { title: 'کارمزد', dataIndex: 'fee', key: 'fee', render: (val) => `${val.toLocaleString('fa-IR')} ریال` },
    ];

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>مدیریت انتقال‌ها</Title>
                <Space>
                    <Button icon={<FileExcelOutlined />} onClick={handleExcelExport}>خروجی Excel</Button>
                    <Link to="/transfers/new">
                        <Button type="primary" icon={<PlusOutlined />}>انتقال جدید</Button>
                    </Link>
                </Space>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                    <Input placeholder="جستجوی کلی..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} allowClear />
                </Col>
                <Col span={4}>
                    <Select placeholder="فیلتر از حساب" onChange={val => handleFilterChange('fromType', val)} allowClear style={{width: '100%'}}>
                        <Option value="بانک">بانک</Option>
                        <Option value="صندوق">صندوق</Option>
                        <Option value="تنخواه">تنخواه</Option>
                    </Select>
                </Col>
                <Col span={4}>
                     <Select placeholder="فیلتر به حساب" onChange={val => handleFilterChange('toType', val)} allowClear style={{width: '100%'}}>
                        <Option value="بانک">بانک</Option>
                        <Option value="صندوق">صندوق</Option>
                        <Option value="تنخواه">تنخواه</Option>
                    </Select>
                </Col>
                <Col span={8}>
                    <RangePicker style={{ width: '100%' }} format="jYYYY/jMM/jDD" onChange={dates => handleFilterChange('dateRange', dates)} />
                </Col>
            </Row>

            <Table columns={columns} dataSource={filteredData} rowKey="id" bordered />

            <Modal title="جزئیات انتقال" visible={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={<Button onClick={() => setIsModalVisible(false)}>بستن</Button>}>
                {selectedTransfer && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="شماره سند">{selectedTransfer.code}</Descriptions.Item>
                        <Descriptions.Item label="تاریخ">{selectedTransfer.date}</Descriptions.Item>
                        <Descriptions.Item label="از">{`${selectedTransfer.fromType}: ${selectedTransfer.fromObject}`}</Descriptions.Item>
                        <Descriptions.Item label="به">{`${selectedTransfer.toType}: ${selectedTransfer.toObject}`}</Descriptions.Item>
                        <Descriptions.Item label="مبلغ">{`${selectedTransfer.amount.toLocaleString('fa-IR')} ریال`}</Descriptions.Item>
                        <Descriptions.Item label="کارمزد">{`${selectedTransfer.fee.toLocaleString('fa-IR')} ریال`}</Descriptions.Item>
                        <Descriptions.Item label="شرح">{selectedTransfer.description}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </Card>
    );
};

export default TransfersPage;