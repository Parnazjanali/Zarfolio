// src/pages/NewIssuedChequePage.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Select, DatePicker, InputNumber, Row, Col, message, Space } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const NewIssuedChequePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const isEditMode = Boolean(id);

    useEffect(() => {
        if (isEditMode) {
             const sampleCheque = { id: 3, number: 'CK-501', sayadNumber: '2000000000000001', amount: 3200000, dueDate: moment('1403/06/20', 'jYYYY/jMM/jDD'), personName: 'آقای محمدی', bankName: 'پاسارگاد', description: 'پرداخت به تامین کننده' };
            form.setFieldsValue(sampleCheque);
        }
    }, [id, form]);

    const onFinish = (values) => {
        console.log('اطلاعات فرم:', values);
        message.success(`چک پرداختی با موفقیت ${isEditMode ? 'ویرایش' : 'ثبت'} شد.`);
        navigate('/cheques');
    };

    return (
        <Card>
            <Title level={3}>{isEditMode ? 'ویرایش چک پرداختی' : 'ثبت چک پرداختی جدید'}</Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={24}>
                     <Col xs={24} md={12}>
                        <Form.Item name="personName" label="در وجه" rules={[{ required: true }]}>
                           <Select showSearch placeholder="جستجو یا انتخاب شخص...">
                                <Option value="آقای محمدی">آقای محمدی</Option>
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

export default NewIssuedChequePage;