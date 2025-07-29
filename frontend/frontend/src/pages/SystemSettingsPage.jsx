import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Row, Col, Select,
  Typography, Divider, Spin, message
} from 'antd';
import {
  FaBuilding, FaCoins, FaSms, FaSave
} from 'react-icons/fa';
import { SaveOutlined, SignalFilled } from '@ant-design/icons';
import axios from 'axios';
import './SettingsPage.css'; // اطمینان حاصل کنید که این فایل استایل وجود دارد

const { Title, Paragraph } = Typography;
const { Option } = Select;

// کامپوننت فرم تنظیمات پیامک (منتقل شده به اینجا)
const SmsSettingsForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await axios.post('/api/admin/sms/plan/info');
        if (response.data) {
          form.setFieldsValue(response.data);
        }
      } catch (error) {
        message.error('خطا در دریافت تنظیمات قبلی پیامک!');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/admin/sms/plan/info/save', values);
      if (response.data.error === 0) {
        message.success('تنظیمات پیامک با موفقیت ذخیره شد.');
      } else {
        message.error(response.data.message || 'خطایی در ذخیره‌سازی رخ داد.');
      }
    } catch (error) {
      message.error('خطای ارتباط با سرور!');
    } finally {
      setLoading(false);
    }
  };

  const renderTextField = (name, label) => (
    <Col xs={24} sm={12} md={8} lg={6} key={Array.isArray(name) ? name.join('.') : name}>
      <Form.Item name={name} label={label} rules={[{ required: true, message: 'این فیلد الزامی است' }]}>
        <Input placeholder={`شناسه الگوی ${label}`} />
      </Form.Item>
    </Col>
  );

  const smsProviders = [
    { label: 'ملی پیامک', value: 'melipayamak' },
    { label: 'ایده پیام', value: 'idepayam' },
    { label: 'IPPanel فراز اس ام اس', value: 'ippanel' }
  ];

  return (
    <Spin spinning={loading}>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Title level={4} style={{ color: '#1890ff' }}>اطلاعات اپراتور پیامک</Title>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="plan" label="اپراتور پیامک" rules={[{ required: true }]}>
              <Select placeholder="انتخاب کنید" suffixIcon={<SignalFilled />}>
                {smsProviders.map(p => (
                  <Option key={p.value} value={p.value}>{p.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="username" label="نام کاربری" rules={[{ required: true }]}>
              <Input placeholder="نام کاربری پنل پیامک" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="password" label="کلمه عبور" rules={[{ required: true }]}>
              <Input.Password placeholder="کلمه عبور پنل پیامک" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="token" label="توکن (در صورت وجود)">
              <Input placeholder="توکن API" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="fromNum" label="شماره خط ارسال کننده" rules={[{ required: true }]}>
              <Input placeholder="مثال: 300012345" />
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Title level={4} style={{ color: '#1890ff' }}>شناسه الگوهای پیامک</Title>
        <Row gutter={[16, 0]}>
            {renderTextField('f2a', 'کد تایید دو مرحله‌ای')}
            {renderTextField('recPassword', 'بازیابی رمز عبور')}
            {/* ... سایر فیلدهای الگو ... */}
        </Row>
        <Divider />
        <Title level={4} style={{color: '#1890ff'}}>افزونه حسابداری پیشرفته</Title>
        <Row gutter={[16, 0]}>
            {renderTextField(['plugAccpro', 'sharefaktor'], 'اشتراک‌گذاری فاکتور (حسابداری)')}
            {/* ... سایر فیلدهای حسابداری ... */}
        </Row>
        <Divider />
        <Title level={4} style={{color: '#1890ff'}}>افزونه تعمیرکاران</Title>
        <Row gutter={[16, 0]}>
            {renderTextField(['plugRepservice', 'get'], 'دریافت کالا برای تعمیر')}
            {/* ... سایر فیلدهای تعمیرکاران ... */}
        </Row>
        <Form.Item style={{ marginTop: '24px' }}>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            ذخیره تنظیمات پیامک
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
};

// کامپوننت اصلی تنظیمات سیستم
const SystemSettingsPage = () => {
  // تعریف تب‌ها. هر تب می‌تواند یک کامپوننت برای رندر شدن داشته باشد
  const settingsTabs = [
    {
      id: 'basicInfo',
      label: 'اطلاعات پایه',
      icon: <FaBuilding />,
      description: 'مدیریت اطلاعات پایه کسب‌وکار مانند نام، آدرس و لوگو.',
      component: <p>فرم تنظیمات پایه در اینجا قرار خواهد گرفت.</p> // یک کامپوننت مشابه SmsSettingsForm بسازید
    },
    {
      id: 'sms',
      label: 'تنظیمات پیامک',
      icon: <FaSms />,
      description: 'پیکربندی پنل پیامک، شناسه‌های الگو و سایر موارد مربوط به ارسال پیامک.',
      component: <SmsSettingsForm /> // کامپوننت فرم پیامک را اینجا قرار می‌دهیم
    },
    {
      id: 'financial',
      label: 'تنظیمات مالی',
      icon: <FaCoins />,
      description: 'تنظیمات مربوط به امور مالی، مالیات و واحدهای پولی.',
      component: <p>فرم تنظیمات مالی در اینجا قرار خواهد گرفت.</p>
    },
  ];

  const [activeTab, setActiveTab] = useState(settingsTabs[0].id);
  const currentTabConfig = settingsTabs.find(tab => tab.id === activeTab);

  return (
    <div className="settings-page-container">
      <div className="settings-page-header">
        <Title level={2}>تنظیمات سیستم</Title>
      </div>
      <div className="settings-layout">
        <aside className="settings-tabs-menu">
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="settings-content-area">
          <section className="settings-section">
            <div className="settings-section-header">
              <h2 className="settings-section-title">{currentTabConfig.label}</h2>
              <p className="settings-section-description">{currentTabConfig.description}</p>
            </div>
            <Divider />
            {/* رندر کردن کامپوننت مربوط به تب فعال */}
            {currentTabConfig.component}
          </section>
        </main>
      </div>
    </div>
  );
};

export default SystemSettingsPage;