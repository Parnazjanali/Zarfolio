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
    Switch,
    Tabs
} from 'antd';
import { SyncOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApiData } from '../../context/ApiDataProvider';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// ✅ افزودن دو پالت رنگی سفید
const colorPalettes = [
    { label: 'آبی تیره (پیش‌فرض)', value: 'theme-default' },
    { label: 'زمرد سبز', value: 'theme-emerald' },
    { label: 'یاقوت سرخ', value: 'theme-ruby' },
    { label: 'کهربای طلایی', value: 'theme-amber' },
    { label: 'بنفش نیمه‌شب', value: 'theme-midnight-purple' },
    { label: 'سفید کریستالی', value: 'theme-crystal-white' },
    { label: 'سفید شیری', value: 'theme-milky-white' },
];

const PriceBoardPage = () => {
    const [form] = Form.useForm();
    const { apiData, loading, error, lastUpdated, countdown, forceFetch } = useApiData();
    const [activeItems, setActiveItems] = useState([]);

    useEffect(() => {
        const savedConfig = JSON.parse(localStorage.getItem('priceBoardConfig')) || {};
        form.setFieldsValue({
            apiUrl: savedConfig.apiUrl || "https://brsapi.ir/Api/Market/Gold_Currency.php?key=FreeTB2jJTDzANcCGSnLsaxPZxmWoj7C",
            weatherApiUrl: savedConfig.weatherApiUrl || "https://api.weatherapi.com/v1/current.json?key=352696f4a53a4545aa9104158253107&q=tehran",
            galleryName: savedConfig.galleryName || 'گالری شما',
            showAnalogClock: savedConfig.showAnalogClock !== false,
            showWeatherWidget: savedConfig.showWeatherWidget !== false,
            showPriceChangePopup: savedConfig.showPriceChangePopup !== false,
            popupDuration: savedConfig.popupDuration || 5,
            colorPalette: savedConfig.colorPalette || 'theme-default',
        });
        const initialItems = savedConfig.activeItems || [];
        initialItems.forEach(item => {
            item.showBuySell = item.showBuySell || false;
            item.buyAdjustmentPercent = item.buyAdjustmentPercent || 0;
            item.buyAdjustmentValue = item.buyAdjustmentValue || 0;
            item.sellAdjustmentPercent = item.sellAdjustmentPercent || 0;
            item.sellAdjustmentValue = item.sellAdjustmentValue || 0;
        });
        setActiveItems(initialItems);
    }, [form]);

    const handleSaveConfig = () => {
        const configToSave = {
            ...form.getFieldsValue(),
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
                    showBuySell: false,
                    buyAdjustmentPercent: 0,
                    buyAdjustmentValue: 0,
                    sellAdjustmentPercent: 0,
                    sellAdjustmentValue: 0,
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
                <Title level={4}>۱. تنظیمات کلی و ظاهری</Title>
                <Row gutter={16}>
                    <Col xs={24} md={12}><Form.Item label="نام گالری" name="galleryName"><Input /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="پالت رنگی" name="colorPalette"><Select options={colorPalettes} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="آدرس API قیمت" name="apiUrl"><Input addonAfter={<Button type="primary" onClick={forceFetch} loading={loading} icon={<SyncOutlined />}>به‌روزرسانی</Button>} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item label="آدرس API هواشناسی" name="weatherApiUrl"><Input /></Form.Item></Col>
                </Row>
                
                <Row gutter={16} align="bottom">
                    <Col><Form.Item label="ساعت آنالوگ" name="showAnalogClock" valuePropName="checked"><Switch defaultChecked /></Form.Item></Col>
                    <Col><Form.Item label="ویجت آب و هوا" name="showWeatherWidget" valuePropName="checked"><Switch defaultChecked /></Form.Item></Col>
                    <Col><Form.Item label="پاپ‌آپ تغییر قیمت" name="showPriceChangePopup" valuePropName="checked"><Switch defaultChecked /></Form.Item></Col>
                    <Col><Form.Item label="مدت پاپ‌آپ (ثانیه)" name="popupDuration"><InputNumber min={1} max={60} style={{ width: '100%' }} /></Form.Item></Col>
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
                    placeholder="یک آیتم برای افزودن انتخاب کنید..."
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
                            <Col xs={24} md={12}>
                                <Form.Item label="نمایش قیمت خرید/فروش" style={{marginBottom: '8px'}}>
                                   <Switch checked={item.showBuySell} onChange={(checked) => handleItemChange(item.symbol, 'showBuySell', checked)} />
                                </Form.Item>

                                {item.showBuySell ? (
                                    <Tabs defaultActiveKey="sell">
                                        <TabPane tab="تنظیمات قیمت فروش" key="sell">
                                            <Row gutter={8}>
                                                <Col span={12}><InputNumber addonAfter="%" value={item.sellAdjustmentPercent} onChange={(val) => handleItemChange(item.symbol, 'sellAdjustmentPercent', val)} style={{ width: '100%' }} placeholder="سود درصدی" /></Col>
                                                <Col span={12}><InputNumber addonAfter="تومان" value={item.sellAdjustmentValue} onChange={(val) => handleItemChange(item.symbol, 'sellAdjustmentValue', val)} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} placeholder="سود ثابت" /></Col>
                                            </Row>
                                        </TabPane>
                                        <TabPane tab="تنظیمات قیمت خرید" key="buy">
                                             <Row gutter={8}>
                                                <Col span={12}><InputNumber addonAfter="%" value={item.buyAdjustmentPercent} onChange={(val) => handleItemChange(item.symbol, 'buyAdjustmentPercent', val)} style={{ width: '100%' }} placeholder="سود درصدی" /></Col>
                                                <Col span={12}><InputNumber addonAfter="تومان" value={item.buyAdjustmentValue} onChange={(val) => handleItemChange(item.symbol, 'buyAdjustmentValue', val)} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} placeholder="سود ثابت" /></Col>
                                            </Row>
                                        </TabPane>
                                    </Tabs>
                                ) : (
                                    <Row gutter={8}>
                                        <Col span={12}><InputNumber addonAfter="%" value={item.adjustmentPercent} onChange={(val) => handleItemChange(item.symbol, 'adjustmentPercent', val)} style={{ width: '100%' }} placeholder="افزایش درصدی" /></Col>
                                        <Col span={12}><InputNumber addonAfter="تومان" value={item.adjustmentValue} onChange={(val) => handleItemChange(item.symbol, 'adjustmentValue', val)} style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} placeholder="افزایش عددی"/></Col>
                                    </Row>
                                )}
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