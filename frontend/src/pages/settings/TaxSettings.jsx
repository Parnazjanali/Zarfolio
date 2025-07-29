import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, Row, Col, notification, Alert, Space, Typography } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

const TaxSettings = () => {
    const [form] = Form.useForm();
    const [csrForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [csrLoading, setCsrLoading] = useState(false);
    const [isCsrModalVisible, setIsCsrModalVisible] = useState(false);
    const [isResultModalVisible, setIsResultModalVisible] = useState(false);
    const [resultData, setResultData] = useState({});

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/plugins/tax-settings/get');
                form.setFieldsValue(response.data);
            } catch (error) {
                notification.error({ message: 'خطا', description: 'خطا در بارگذاری تنظیمات' });
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [form]);

    const handleSave = async (values) => {
        setLoading(true);
        try {
            await axios.post('/api/plugins/tax-settings/save', values);
            notification.success({ message: 'موفق', description: 'تنظیمات با موفقیت ذخیره شد.' });
        } catch (error) {
            notification.error({ message: 'خطا', description: 'خطا در ذخیره تنظیمات' });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCSR = async (values) => {
        setCsrLoading(true);
        try {
            const response = await axios.post('/api/plugins/tax-settings/generate-csr', values);
            if (response.data.success) {
                setResultData(response.data);
                setIsResultModalVisible(true);
                setIsCsrModalVisible(false);
                // Optionally set the private key in the main form
                form.setFieldsValue({ privateKey: response.data.privateKey });
            } else {
                notification.error({ message: 'خطا', description: response.data.message || 'خطا در تولید CSR' });
            }
        } catch (error) {
            notification.error({ message: 'خطا', description: 'یک خطای غیرمنتظره رخ داد.' });
        } finally {
            setCsrLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        notification.success({ message: 'موفق', description: 'در کلیپ‌بورد کپی شد!'});
    }

    return (
        <div>
            <Title level={4}>تنظیمات مالیاتی</Title>
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="taxMemoryId" label="شناسه یکتای حافظه مالیاتی">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="economicCode" label="کد اقتصادی">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="privateKey" label="Private Key">
                    <TextArea rows={10} placeholder="کلید خصوصی اینجا قرار می‌گیرد..." />
                </Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>ذخیره تنظیمات</Button>
                    <Button onClick={() => setIsCsrModalVisible(true)}>ساخت کلید و CSR</Button>
                </Space>
            </Form>

            {/* CSR Generation Modal */}
            <Modal
                title="ساخت کلید و CSR"
                visible={isCsrModalVisible}
                onCancel={() => setIsCsrModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsCsrModalVisible(false)}>انصراف</Button>,
                    <Button key="submit" type="primary" loading={csrLoading} onClick={() => csrForm.submit()}>تولید</Button>,
                ]}
            >
                <Form form={csrForm} layout="vertical" onFinish={handleGenerateCSR}>
                    <Form.Item name="nameFa" label="نام (فارسی)" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="nationalId" label="شناسه ملی" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    {/* Add other fields like nameEn, email, personType as needed */}
                </Form>
            </Modal>

             {/* Result Modal */}
            <Modal
                title="نتیجه تولید کلید و CSR"
                visible={isResultModalVisible}
                onCancel={() => setIsResultModalVisible(false)}
                width={800}
                footer={<Button onClick={() => setIsResultModalVisible(false)}>بستن</Button>}
            >
                <Alert
                    message="توجه مهم"
                    description="لطفا این اطلاعات را در یک جای امن نگهداری کنید. این اطلاعات پس از بسته شدن این پنجره دیگر قابل بازیابی نیست."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                 <Row gutter={16}>
                    <Col span={8}>
                        <Title level={5}>CSR</Title>
                        <TextArea readOnly rows={8} value={resultData.csr} />
                        <Button style={{marginTop: 8}} onClick={() => copyToClipboard(resultData.csr)}>کپی</Button>
                    </Col>
                     <Col span={8}>
                        <Title level={5}>Public Key</Title>
                        <TextArea readOnly rows={8} value={resultData.publicKey} />
                         <Button style={{marginTop: 8}} onClick={() => copyToClipboard(resultData.publicKey)}>کپی</Button>
                    </Col>
                    <Col span={8}>
                        <Title level={5}>Private Key</Title>
                        <TextArea readOnly rows={8} value={resultData.privateKey} />
                         <Button style={{marginTop: 8}} onClick={() => copyToClipboard(resultData.privateKey)}>کپی</Button>
                    </Col>
                </Row>
            </Modal>
        </div>
    );
};

export default TaxSettings;