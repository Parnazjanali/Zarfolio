// frontend/src/pages/NewTransferPage.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Select, DatePicker, InputNumber, Row, Col, message, Space, Radio, Divider, Upload } from 'antd';
import { SaveOutlined, ArrowRightOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const sampleAccounts = {
    bank: [{ id: 1, name: 'بانک ملت' }, { id: 2, name: 'بانک سامان' }],
    fund: [{ id: 1, name: 'صندوق اصلی' }, { id: 2, name: 'صندوق فروشگاه' }],
    pettyCash: [{ id: 1, name: 'تنخواه اداری' }],
};

const NewTransferPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const isEditMode = Boolean(id);
    const [fromType, setFromType] = useState('bank');
    const [toType, setToType] = useState('bank');

    useEffect(() => { /* ... */ }, []);

    const onFinish = (values) => {
        console.log('اطلاعات فرم:', values);
        message.success(`انتقال با موفقیت ${isEditMode ? 'ویرایش' : 'ثبت'} شد.`);
        navigate('/transfers');
    };

    return (
        <Card>
            <Title level={3}>{isEditMode ? 'ویرایش انتقال' : 'ایجاد انتقال جدید'}</Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={24}>
                    <Col xs={24} md={8}>
                        <Form.Item name="date" label="تاریخ" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} format="jYYYY/jMM/jDD" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="amount" label="مبلغ انتقال (ریال)" rules={[{ required: true }]}>
                            <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        {/* +++ فیلد شماره ارجاع +++ */}
                        <Form.Item name="reference" label="شماره ارجاع/پیگیری">
                            <Input placeholder="اختیاری" />
                        </Form.Item>
                    </Col>
                </Row>
                <Divider />
                <Row gutter={32}>
                    <Col xs={24} md={12}>
                        <Title level={5} style={{ color: '#ff4d4f' }}>از:</Title>
                        <Radio.Group onChange={(e) => setFromType(e.target.value)} value={fromType} style={{ marginBottom: 16 }}>
                            <Radio.Button value="bank">بانک</Radio.Button>
                            <Radio.Button value="fund">صندوق</Radio.Button>
                            <Radio.Button value="pettyCash">تنخواه</Radio.Button>
                        </Radio.Group>
                        <Form.Item name="fromAccountId" rules={[{ required: true }]}>
                            <Select placeholder="انتخاب حساب مبدا...">
                                {(sampleAccounts[fromType] || []).map(acc => <Option key={acc.id} value={acc.id}>{acc.name}</Option>)}
                            </Select>
                        </Form.Item>
                        {fromType === 'bank' && (
                           <Form.Item name="fee" label="کارمزد بانکی (ریال)">
                                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')} defaultValue={0} />
                            </Form.Item>
                        )}
                    </Col>
                    <Col xs={24} md={12}>
                        <Title level={5} style={{ color: '#52c41a' }}>به:</Title>
                        <Radio.Group onChange={(e) => setToType(e.target.value)} value={toType} style={{ marginBottom: 16 }}>
                            <Radio.Button value="bank">بانک</Radio.Button>
                            <Radio.Button value="fund">صندوق</Radio.Button>
                            <Radio.Button value="pettyCash">تنخواه</Radio.Button>
                        </Radio.Group>
                        <Form.Item name="toAccountId" rules={[{ required: true }]}>
                            <Select placeholder="انتخاب حساب مقصد...">
                                {(sampleAccounts[toType] || []).map(acc => <Option key={acc.id} value={acc.id}>{acc.name}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="description" label="شرح کلی انتقال">
                    <Input.TextArea rows={2} />
                </Form.Item>
                {/* +++ دکمه پیوست فایل +++ */}
                <Form.Item name="attachment" label="پیوست فایل">
                    <Upload beforeUpload={() => { message.info('آپلود در نسخه نمایشی غیرفعال است.'); return false; }}>
                        <Button icon={<UploadOutlined />}>انتخاب فایل (مثلا رسید)</Button>
                    </Upload>
                </Form.Item>
                <Form.Item style={{ marginTop: 24 }}>
                    <Space>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>ذخیره</Button>
                        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/transfers')}>انصراف</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default NewTransferPage;