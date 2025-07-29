import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Select, Button, Row, Col, notification, DatePicker, Switch } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;

const BusinessSettings = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [listBanks, setListBanks] = useState([]);
    const [walletEnabled, setWalletEnabled] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch banks
                const bankResponse = await axios.post('/api/bank/list');
                setListBanks(bankResponse.data);

                // Fetch business info
                const infoResponse = await axios.post('/api/business/get/info/' + localStorage.getItem('activeBid'));
                const businessData = infoResponse.data;
                
                // Format dates for Ant Design DatePicker
                if (businessData.year) {
                    businessData.year.startShamsi = businessData.year.startShamsi ? moment(businessData.year.startShamsi, 'YYYY/MM/DD') : null;
                    businessData.year.endShamsi = businessData.year.endShamsi ? moment(businessData.year.endShamsi, 'YYYY/MM/DD') : null;
                }
                
                form.setFieldsValue(businessData);
                setWalletEnabled(businessData.walletEnabled);

            } catch (error) {
                notification.error({ message: 'خطا', description: 'خطا در بارگذاری اطلاعات' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        // Format dates back to string if they are moment objects
        if (values.year) {
            values.year.startShamsi = values.year.startShamsi?.format('YYYY/MM/DD');
            values.year.endShamsi = values.year.endShamsi?.format('YYYY/MM/DD');
        }

        const dataToSubmit = {
            ...values,
            bid: localStorage.getItem('activeBid'),
        };

        try {
            await axios.post('/api/business/insert', dataToSubmit);
            notification.success({ message: 'موفق', description: 'اطلاعات با موفقیت ثبت شد.' });
        } catch (error) {
            notification.error({ message: 'خطا', description: 'خطا در ثبت اطلاعات' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Tabs defaultActiveKey="1">
                <TabPane tab="اطلاعات پایه" key="1">
                    <Row gutter={24}>
                        {/* Business Info */}
                        <Col span={12}><Form.Item name="name" label="نام کسب و کار" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="legal_name" label="نام قانونی کسب و کار" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="field" label="زمینه فعالیت"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="type" label="نوع فعالیت"><Select>
                            {['شرکت', 'مغازه', 'فروشگاه', 'اتحادیه', 'باشگاه', 'موسسه', 'شخصی'].map(t => <Option key={t} value={t}>{t}</Option>)}
                        </Select></Form.Item></Col>

                        {/* Economic Info */}
                         <Col span={24}><h3 style={{marginTop: 16}}>اطلاعات اقتصادی</h3></Col>
                        <Col span={8}><Form.Item name="shenasemeli" label="شناسه ملی"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="codeeqtesadi" label="کد اقتصادی"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="shomaresabt" label="شماره ثبت"><Input /></Form.Item></Col>
                         
                         {/* Contact Info can be added similarly */}
                    </Row>
                </TabPane>

                <TabPane tab="سال مالی" key="2">
                    <Row gutter={24}>
                        <Col span={12}><Form.Item name={['year', 'startShamsi']} label="شروع سال مالی" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="YYYY/MM/DD" /></Form.Item></Col>
                        <Col span={12}><Form.Item name={['year', 'endShamsi']} label="پایان سال مالی" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="YYYY/MM/DD" /></Form.Item></Col>
                        <Col span={24}><Form.Item name={['year', 'label']} label="عنوان سال مالی" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                </TabPane>

                <TabPane tab="تنظیمات کلی" key="3">
                    <Form.Item name="shortlinks" label="فعال‌سازی پیوندهای یکتا" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                     <Form.Item name="walletEnabled" label="فعال‌سازی دریافت آنلاین از طریق کیف پول" valuePropName="checked">
                        <Switch onChange={setWalletEnabled} />
                    </Form.Item>
                    {walletEnabled && (
                        <Form.Item name="walletMatchBank" label="حساب بانکی متصل به کیف پول" rules={[{ required: true }]}>
                            <Select placeholder="انتخاب کنید">
                                {listBanks.map(bank => <Option key={bank.id} value={bank.id}>{bank.name}</Option>)}
                            </Select>
                        </Form.Item>
                    )}
                    {/* Other settings can be added here */}
                </TabPane>
            </Tabs>

            <Form.Item style={{ marginTop: 24 }}>
                <Button type="primary" htmlType="submit" loading={loading}>
                    ذخیره تغییرات
                </Button>
            </Form.Item>
        </Form>
    );
};

export default BusinessSettings;