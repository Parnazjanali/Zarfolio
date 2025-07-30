// frontend/src/components/AddCardModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Row, Col } from 'antd';
import CreditCard from './CreditCard'; // کامپوننت کارت را برای پیش‌نمایش وارد می‌کنیم

const AddCardModal = ({ visible, onCancel, onOk }) => {
  const [form] = Form.useForm();
  const [cardDetails, setCardDetails] = useState({});
  const [isFlipped, setIsFlipped] = useState(false);

  // وقتی فرم تغییر می‌کند، پیش‌نمایش کارت را به‌روز کن
  const handleValuesChange = (_, allValues) => {
    // شماره کارت را برای نمایش بهتر فرمت می‌کنیم
    const formattedNumber = (allValues.number || '')
        .replace(/\s/g, '')
        .replace(/(.{4})/g, '$1 ')
        .trim()
        .slice(0, 19);
    
    // فرمت تاریخ انقضا
    const formattedExpiry = (allValues.expiry || '')
        .replace(/\s/g, '')
        .replace(/(\d{2})(\d{0,2})/, '$1/$2')
        .slice(0, 5);
        
    form.setFieldsValue({ number: formattedNumber, expiry: formattedExpiry });

    setCardDetails({ ...allValues, number: formattedNumber, expiry: formattedExpiry });
  };

  const handleFinish = (values) => {
    onOk(values); // ارسال اطلاعات به صفحه اصلی
    form.resetFields(); // خالی کردن فرم
  };
  
  // با فوکوس روی CVV، کارت برعکس شود
  const handleCvvFocus = () => setIsFlipped(true);
  const handleCvvBlur = () => setIsFlipped(false);

  return (
    <Modal
      title="افزودن کارت بانکی جدید"
      visible={visible}
      onCancel={onCancel}
      footer={null} // دکمه‌های فوتر را حذف می‌کنیم تا خودمان بسازیم
      centered
    >
      <div style={{ padding: '20px 0' }}>
        <CreditCard card={cardDetails} isFlipped={isFlipped} />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          name="number"
          label="شماره کارت"
          rules={[{ required: true, message: 'لطفا شماره 16 رقمی کارت را وارد کنید' }]}
        >
          <Input placeholder="•••• •••• •••• ••••" style={{ direction: 'ltr' }} />
        </Form.Item>

        <Form.Item
          name="name"
          label="نام صاحب کارت"
          rules={[{ required: true, message: 'لطفا نام صاحب کارت را وارد کنید' }]}
        >
          <Input placeholder="مثال: رضا محمدی" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="expiry"
              label="تاریخ انقضا"
              rules={[{ required: true, message: 'مثال: 12/28' }]}
            >
              <Input placeholder="MM/YY" style={{ direction: 'ltr' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="cvv"
              label="CVV2"
              rules={[{ required: true, message: 'کد 3 یا 4 رقمی' }]}
            >
              <Input 
                placeholder="•••" 
                style={{ direction: 'ltr' }} 
                onFocus={handleCvvFocus}
                onBlur={handleCvvBlur}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: '24px', textAlign: 'left' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            لغو
          </Button>
          <Button type="primary" htmlType="submit">
            ذخیره کارت
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCardModal;