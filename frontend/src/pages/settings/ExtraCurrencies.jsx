// src/pages/settings/ExtraCurrencies.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Select, notification, Space, Typography, Tag } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const ExtraCurrencies = () => {
    const [currencies, setCurrencies] = useState([]);
    const [allCurrencies, setAllCurrencies] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mainCurrency, setMainCurrency] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // دریافت ارزهای کسب و کار
            const businessInfo = await axios.post('/api/business/get/info/' + localStorage.getItem('activeBid'));
            setCurrencies(businessInfo.data.moneys || []);
            setMainCurrency(businessInfo.data.arzmain?.name || '');

            // دریافت لیست تمام ارزهای موجود
            const allMoneys = await axios.post('/api/money/get/all');
            setAllCurrencies(allMoneys.data.data || []);
            
        } catch (error) {
            notification.error({ message: 'خطا', description: 'خطا در بارگذاری اطلاعات ارزها' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddCurrency = async () => {
        if (!selectedCurrency) {
            notification.warning({ message: 'توجه', description: 'لطفا یک ارز را انتخاب کنید.' });
            return;
        }

        const isAlreadyAdded = currencies.some(c => c.name === selectedCurrency);
        if (isAlreadyAdded) {
            notification.error({ message: 'خطا', description: 'این ارز قبلاً اضافه شده است.' });
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/money/add/to/business', { name: selectedCurrency });
            notification.success({ message: 'موفق', description: 'ارز با موفقیت اضافه شد.' });
            setIsModalVisible(false);
            setSelectedCurrency(null);
            fetchData(); // بارگذاری مجدد داده‌ها
        } catch (error) {
            notification.error({ message: 'خطا', description: 'خطا در افزودن ارز جدید' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCurrency = (currencyName) => {
        Modal.confirm({
            title: 'آیا از حذف این ارز مطمئن هستید؟',
            content: 'این عملیات غیر قابل بازگشت است. ارز تنها در صورتی حذف می‌شود که در هیچ سندی استفاده نشده باشد.',
            okText: 'بله، حذف کن',
            cancelText: 'انصراف',
            onOk: async () => {
                try {
                    const response = await axios.post('/api/money/remove', { name: currencyName });
                    if (response.data.Success) {
                        notification.success({ message: 'موفق', description: 'ارز با موفقیت حذف شد.' });
                        fetchData();
                    } else {
                        notification.error({ message: 'خطا', description: response.data.message || 'حذف ارز امکان‌پذیر نیست.' });
                    }
                } catch (error) {
                    notification.error({ message: 'خطا', description: 'خطا در ارتباط با سرور' });
                }
            }
        });
    };

    const columns = [
        { title: '#', render: (text, record, index) => index + 1 },
        { title: 'واحد پولی', dataIndex: 'label', key: 'label' },
        { title: 'اختصار', dataIndex: 'name', key: 'name', render: name => (
            <Tag color={name === mainCurrency ? 'gold' : 'default'}>
                {name} {name === mainCurrency && '(ارز اصلی)'}
            </Tag>
        )},
        {
            title: 'عملیات',
            key: 'actions',
            render: (text, record) => (
                record.name !== mainCurrency ? (
                    <Button type="primary" danger ghost onClick={() => handleDeleteCurrency(record.name)}>
                        حذف
                    </Button>
                ) : null
            ),
        },
    ];

    return (
        <div>
            <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>مدیریت ارزهای جانبی</Title>
                <Button type="primary" onClick={() => setIsModalVisible(true)}>افزودن ارز جدید</Button>
            </Space>

            <Table
                columns={columns}
                dataSource={currencies}
                loading={loading}
                rowKey="name"
                bordered
            />

            <Modal
                title="افزودن واحد ارزی جدید"
                visible={isModalVisible}
                onOk={handleAddCurrency}
                onCancel={() => setIsModalVisible(false)}
                okText="افزودن"
                cancelText="بازگشت"
                confirmLoading={loading}
            >
                <Select
                    showSearch
                    style={{ width: '100%' }}
                    placeholder="یک ارز را انتخاب یا جستجو کنید"
                    onChange={value => setSelectedCurrency(value)}
                    filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {allCurrencies.map(currency => (
                        <Option key={currency.name} value={currency.name}>{currency.label} ({currency.name})</Option>
                    ))}
                </Select>
            </Modal>
        </div>
    );
};

export default ExtraCurrencies;