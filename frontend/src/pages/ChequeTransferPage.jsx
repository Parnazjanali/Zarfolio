// src/pages/ChequeTransferPage.jsx
import React, { useState, useEffect } from 'react';
// ***** خط زیر اصلاح شد: کامپوننت Input اضافه شد *****
import { Form, Button, Card, Typography, Select, DatePicker, Row, Col, message, Space, Descriptions, Switch, Input } from 'antd';
import { SaveOutlined, ArrowRightOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const ChequeTransferPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [chequeInfo, setChequeInfo] = useState(null);
    const [sendSms, setSendSms] = useState(false);

    useEffect(() => {
        // در حالت واقعی، اطلاعات چک از سرور گرفته می‌شود
        const sampleCheque = { id: 1, number: '123456', sayadNumber: '1000000000000001', amount: 5000000, dueDate: '1403/06/15', personName: 'شرکت نوین', bankName: 'ملت' };
        setChequeInfo(sampleCheque);
        
        const smsPref = localStorage.getItem('chequeTransferSmsNotification') === 'true';
        setSendSms(smsPref);
    }, [id]);
    
     const handleSmsChange = (checked) => {
        setSendSms(checked);
        localStorage.setItem('chequeTransferSmsNotification', checked);
    };

    const onFinish = (values) => {
        console.log('اطلاعات واگذاری:', { ...values, sendSms, chequeId: id });
        message.success('چک با موفقیت واگذار شد.');
        navigate('/cheques');
    };

    if (!chequeInfo) {
        return <Card>در حال بارگذاری اطلاعات چک...</Card>;
    }

    return (
        <Card>
            <Title level={3}>واگذاری چک</Title>
            <Descriptions bordered column={2} style={{marginBottom: 24}}>
                <Descriptions.Item label="شماره چک">{chequeInfo.number}</Descriptions.Item>
                <Descriptions.Item label="شماره صیاد">{chequeInfo.sayadNumber}</Descriptions.Item>
                <Descriptions.Item label="مبلغ">{chequeInfo.amount.toLocaleString('fa-IR')} ریال</Descriptions.Item>
                <Descriptions.Item label="تاریخ سررسید">{chequeInfo.dueDate}</Descriptions.Item>
                <Descriptions.Item label="پرداخت کننده">{chequeInfo.personName}</Descriptions.Item>
                <Descriptions.Item label="بانک">{chequeInfo.bankName}</Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <Form.Item name="personId" label="واگذاری به" rules={[{ required: true, message: 'لطفا شخص گیرنده را انتخاب کنید!' }]}>
                             <Select showSearch placeholder="جستجو یا انتخاب شخص...">
                               <Option value="شرکت الف">شرکت الف</Option>
                               <Option value="فروشگاه ب">فروشگاه ب</Option>
                           </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="transferDate" label="تاریخ واگذاری" rules={[{ required: true, message: 'لطفا تاریخ واگذاری را مشخص کنید!' }]}>
                            <DatePicker style={{ width: '100%' }} format="jYYYY/jMM/jDD" />
                        </Form.Item>
                    </Col>
                     <Col span={24}>
                        <Form.Item name="description" label="توضیحات">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                    </Col>
                     <Col span={24}>
                        <Form.Item label="ارسال پیامک به گیرنده">
                           <Switch checked={sendSms} onChange={handleSmsChange} checkedChildren={<MessageOutlined />} unCheckedChildren={<MessageOutlined />} />
                        </Form.Item>
                    </Col>
                </Row>
                 <Form.Item style={{ marginTop: 24 }}>
                    <Space>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>ثبت واگذاری</Button>
                        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/cheques')}>انصراف</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default ChequeTransferPage;