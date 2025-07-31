// frontend/src/pages/settings/PriceBoardPage.jsx

import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    Select,
    Row,
    Col,
    Spin,
    Alert,
    Divider,
    message,
    Statistic,
    InputNumber,
    Popconfirm,
    Switch
} from 'antd';
import { SyncOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApiData } from '../../context/ApiDataProvider';

const { Title, Paragraph, Text } = Typography;

const PriceBoardPage = () => {
    const [form] = Form.useForm();
    const { apiData, loading, error, lastUpdated, countdown, forceFetch } = useApiData();
    const [activeItems, setActiveItems] = useState([]);

    useEffect(() => {
        const savedConfig = JSON.parse(localStorage.getItem('priceBoardConfig')) || {};
        form.setFieldsValue({
            apiUrl: savedConfig.apiUrl || "https://brsapi.ir/Api/Market/Gold_Currency.php?key=FreeTB2jJTDzANcCGSnLsaxPZxmWoj7C",
            galleryName: savedConfig.galleryName || 'گالری شما',
            showAnalogClock: savedConfig.showAnalogClock !== false,
            showWeatherWidget: savedConfig.showWeatherWidget !== false,
            showPriceDifference: savedConfig.showPriceDifference !== false,
            showPriceChangePopup: savedConfig.showPriceChangePopup !== false,
            // مقداردهی اولیه برای تنظیمات جدید
            popupDuration: savedConfig.popupDuration || 5,
        });
        setActiveItems(savedConfig.activeItems || []);
    }, [form]);

    const handleSaveConfig = () => {
        const configToSave = {
            galleryName: form.getFieldValue('galleryName'),
            apiUrl: form.getFieldValue('apiUrl'),
            showAnalogClock: form.getFieldValue('showAnalogClock'),
            showWeatherWidget: form.getFieldValue('showWeatherWidget'),
            showPriceDifference: form.getFieldValue('showPriceDifference'),
            showPriceChangePopup: form.getFieldValue('showPriceChangePopup'),
            // ذخیره مقدار جدید در تنظیمات
            popupDuration: form.getFieldValue('popupDuration'),
            activeItems: activeItems,
        };
        localStorage.setItem('priceBoardConfig', JSON.stringify(configToSave));
        message.success('تنظیمات تابلو با موفقیت ذخیره شد و در تابلوی عمومی اعمال گردید!');
    };

    const allApiOptions = apiData ?
        [...apiData.gold, ...apiData.currency, ...apiData.cryptocurrency].map(item => ({
            label: `${item.name} (${item.symbol})`,
            value: item.symbol,
        })) : [];

    const handleAddItem = (symbol) => {
        if (symbol && !activeItems.some(item => item.symbol === symbol)) {
            const apiItem = [...apiData.gold, ...apiData.currency, ...apiData.cryptocurrency].find(i => i.symbol === symbol);
            if(apiItem) {
                setActiveItems(prev => [...prev, {
                    symbol: apiItem.symbol,
                    name: apiItem.name,
                    unit: apiItem.unit,
                    adjustmentPercent: 0,
                    adjustmentValue: 0,
                }]);
            }
        }
    };

    const handleRemoveItem = (symbol) => {
        setActiveItems(prev => prev.filter(item => item.symbol !== symbol));
    };

    const handleItemChange = (symbol, field, value) => {
        setActiveItems(prev => prev.map(item =>
            item.symbol === symbol ? { ...item, [field]: value === null ? 0 : value } : item
        ));
    };

    const findRawPrice = (symbol) => {
        const item = apiData ? [...apiData.gold, ...apiData.currency, ...apiData.cryptocurrency].find(i => i.symbol === symbol) : null;
        return item ? item.price : 'N/A';
    };

    return (
        <Card>
            <Title level={2}>پنل مدیریت حرفه‌ای تابلو</Title>
            <Paragraph type="secondary">تغییرات در این بخش به صورت آنی در تابلوی قیمت عمومی (در صورت باز بودن در تب دیگر) اعمال خواهد شد.</Paragraph>
            <Divider />

            <Form form={form} layout="vertical">
                <Title level={4}>۱. منبع داده و تنظیمات کلی</Title>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item label="نام گالری" name="galleryName"><Input /></Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="آدرس API" name="apiUrl">
                            <Input addonAfter={<Button type="primary" onClick={forceFetch} loading={loading} icon={<SyncOutlined />}>به‌روزرسانی داده</Button>} />
                        </Form.Item>
                    </Col>
                </Row>
                
                <Row gutter={16} align="bottom">
                    <Col><Form.Item label="نمایش ساعت آنالوگ" name="showAnalogClock" valuePropName="checked"><Switch defaultChecked /></Form.Item></Col>
                    <Col><Form.Item label="نمایش ویجت آب و هوا" name="showWeatherWidget" valuePropName="checked"><Switch defaultChecked /></Form.Item></Col>
                    <Col><Form.Item label="نمایش اختلاف قیمت" name="showPriceDifference" valuePropName="checked"><Switch defaultChecked /></Form.Item></Col>
                    <Col><Form.Item label="پاپ‌آپ تغییر قیمت" name="showPriceChangePopup" valuePropName="checked"><Switch defaultChecked /></Form.Item></Col>
                    {/* فیلد جدید برای مدت زمان پاپ آپ */}
                    <Col>
                        <Form.Item label="مدت زمان پاپ‌آپ (ثانیه)" name="popupDuration">
                            <InputNumber min={1} max={60} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16} style={{marginBottom: '24px'}}>
                    <Col><Statistic title="زمان به‌روزرسانی بعدی" value={countdown} formatter={(val) => `${String(Math.floor(val/60)).padStart(2, '0')}:${String(val%60).padStart(2, '0')}`} /></Col>
                    <Col><Text type="secondary">آخرین دریافت موفق:</Text><br/><Text strong>{lastUpdated ? lastUpdated.toLocaleTimeString('fa-IR') : 'در انتظار...'}</Text></Col>
                </Row>
                {error && <Alert message={`خطا در دریافت داده: ${error}`} type="error" showIcon />}
                <Divider />

                <Title level={4}>۲. افزودن آیتم به تابلو</Title>
                <Select
                    showSearch
                    placeholder="یک آیتم از لیست API برای افزودن انتخاب کنید..."
                    style={{ width: '100%', marginBottom: '16px' }}
                    options={allApiOptions}
                    onSelect={handleAddItem}
                    loading={loading || !apiData}
                    disabled={loading || !!error}
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
                <Divider />

                <Title level={4}>۳. مدیریت آیتم‌های فعال</Title>
                {activeItems.map(item => (
                    <Card key={item.symbol} size="small" style={{ marginBottom: 16 }} title={item.name}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} md={6}>
                                <Text type="secondary">قیمت خام API:</Text><br/>
                                <Text strong>{new Intl.NumberFormat('fa-IR').format(findRawPrice(item.symbol))} {item.unit !== 'تومان' ? item.unit : ''}</Text>
                            </Col>
                            <Col xs={12} md={6}>
                                <InputNumber addonAfter="%" value={item.adjustmentPercent} onChange={(val) => handleItemChange(item.symbol, 'adjustmentPercent', val)} style={{ width: '100%' }} placeholder="افزایش درصدی" />
                            </Col>
                            <Col xs={12} md={6}>
                                <InputNumber addonAfter="تومان" value={item.adjustmentValue} onChange={(val) => handleItemChange(item.symbol, 'adjustmentValue', val)} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} placeholder="افزایش عددی"/>
                            </Col>
                            <Col xs={24} md={6}>
                                <Popconfirm title="آیا از حذف این آیتم مطمئن هستید؟" onConfirm={() => handleRemoveItem(item.symbol)} okText="بله" cancelText="خیر">
                                    <Button type="primary" danger icon={<DeleteOutlined />} block>حذف</Button>
                                </Popconfirm>
                            </Col>
                        </Row>
                    </Card>
                ))}

                <Divider />
                <Button type="primary" size="large" block onClick={handleSaveConfig} >ذخیره نهایی تنظیمات تابلو</Button>
            </Form>
        </Card>
    );
};

export default PriceBoardPage;