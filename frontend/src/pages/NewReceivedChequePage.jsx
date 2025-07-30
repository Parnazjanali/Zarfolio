// src/pages/NewReceivedChequePage.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Select, DatePicker, InputNumber, Row, Col, message, Space, Switch } from 'antd';
import { SaveOutlined, ArrowRightOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const NewReceivedChequePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const isEditMode = Boolean(id);
    const [sendSms, setSendSms] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            // در حالت واقعی، اطلاعات چک از سرور گرفته می‌شود
            const sampleCheque = { id: 1, number: '123456', sayadNumber: '1000000000000001', amount: 5000000, dueDate: moment('1403/06/15', 'jYYYY/jMM/jDD'), personName: 'شرکت نوین', bankName: 'ملت', description: 'بابت فاکتور ۱۰۲۲' };
            form.setFieldsValue(sampleCheque);
        }
         const smsPref = localStorage.getItem('chequeSendSms') === 'true';
         setSendSms(smsPref);
    }, [id, form]);
    
    const handleSmsChange = (checked) => {
        setSendSms(checked);
        localStorage.setItem('chequeSendSms', checked);
    };

    const onFinish = (values) => {
        console.log('اطلاعات فرم:', { ...values, sendSms });
        message.success(`چک دریافتی با موفقیت ${isEditMode ? 'ویرایش' : 'ثبت'} شد.`);
        navigate('/cheques');
    };

    return (
        <Card>
            <Title level={3}>{isEditMode ? 'ویرایش چک دریافتی' : 'ثبت چک دریافتی جدید'}</Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={24}>
                     <Col xs={24} md={12}>
                        <Form.Item name="personName" label="پرداخت کننده" rules={[{ required: true }]}>
                           <Select showSearch placeholder="جستجو یا انتخاب شخص...">
                               <Option value="شرکت نوین">شرکت نوین</Option>
                               <Option value="فروشگاه آفتاب">فروشگاه آفتاب</Option>
                           </Select>
                        </Form.Item>
                    </Col>
                     <Col xs={24} md={12}>
                        <Form.Item name="number" label="شماره چک" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="bankName" label="نام بانک" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                     <Col xs={24} md={12}>
                        <Form.Item name="amount" label="مبلغ (ریال)" rules={[{ required: true }]}>
                             <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')} />
                        </Form.Item>
                    </Col>
                     <Col xs={24} md={12}>
                        <Form.Item name="sayadNumber" label="شماره صیاد" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                     <Col xs={24} md={12}>
                        <Form.Item name="dueDate" label="تاریخ سررسید" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} format="jYYYY/jMM/jDD" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="description" label="توضیحات">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item label="اطلاع رسانی پیامک">
                           <Switch checked={sendSms} onChange={handleSmsChange} checkedChildren={<MessageOutlined />} unCheckedChildren={<MessageOutlined />} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item style={{ marginTop: 24 }}>
                    <Space>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>ذخیره</Button>
                        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/cheques')}>انصراف</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default NewReceivedChequePage;