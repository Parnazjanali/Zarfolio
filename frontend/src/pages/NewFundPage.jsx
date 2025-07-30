// frontend/src/pages/NewFundPage.jsx
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

// داده‌های نمونه - در یک پروژه واقعی این داده‌ها از سرور گرفته می‌شوند
const sampleFunds = [
    { id: 1, code: '101', name: 'صندوق اصلی', balance: 12500000, currency: 'IRR', description: 'صندوق فروش روزانه' },
    { id: 2, code: '102', name: 'صندوق ارزی', balance: 500, currency: 'USD', description: 'صندوق دلاری فروشگاه' },
    { id: 3, code: '103', name: 'صندوق تنخواه', balance: -250000, currency: 'IRR', description: 'تنخواه گردان برای هزینه‌های جاری' },
];

const NewFundPage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // گرفتن آیدی صندوق از آدرس URL
    const [form] = Form.useForm(); // دسترسی به فرم برای ست کردن مقادیر
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            const fundId = parseInt(id, 10);
            const fundToEdit = sampleFunds.find(fund => fund.id === fundId);
            if (fundToEdit) {
                // مقادیر صندوق پیدا شده را در فرم قرار می‌دهیم
                form.setFieldsValue({
                    name: fundToEdit.name,
                    description: fundToEdit.description,
                    currency: fundToEdit.currency,
                });
            } else {
                message.error('صندوق مورد نظر پیدا نشد!');
                navigate('/funds');
            }
        }
    }, [id, form, navigate]);


    const onFinish = (values) => {
        console.log('اطلاعات صندوق برای ذخیره:', values);
        if (isEditMode) {
            message.success('صندوق با موفقیت ویرایش شد!');
        } else {
            message.success('صندوق جدید با موفقیت ایجاد شد!');
        }
        navigate('/funds');
    };

    return (
        <Card>
            <Title level={3}>{isEditMode ? 'ویرایش صندوق' : 'ایجاد صندوق جدید'}</Title>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ currency: 'IRR' }}
            >
                <Form.Item
                    name="name"
                    label="نام صندوق"
                    rules={[{ required: true, message: 'لطفا نام صندوق را وارد کنید!' }]}
                >
                    <Input placeholder="مثال: صندوق اصلی" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="توضیحات"
                >
                    <Input.TextArea rows={3} placeholder="توضیحات مربوط به این صندوق" />
                </Form.Item>

                <Form.Item
                    name="currency"
                    label="واحد پولی"
                    rules={[{ required: true, message: 'لطفا واحد پولی را انتخاب کنید!' }]}
                >
                    <Select>
                        <Option value="IRR">ریال ایران</Option>
                        <Option value="USD">دلار آمریکا</Option>
                        <Option value="EUR">یورو</Option>
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                            ذخیره
                        </Button>
                        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/funds')}>
                            انصراف و بازگشت
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default NewFundPage;