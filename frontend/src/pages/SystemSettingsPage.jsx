// frontend/src/pages/SystemSettingsPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Tabs,
  Spin,
  Typography,
  App,
  Divider,
} from 'antd';
import axios from 'axios';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

// A helper function to get the auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Create an Axios instance with default headers
const axiosInstance = axios.create({
  baseURL: '/api/v1' // Assuming all API calls go to this base path
});

// Add a request interceptor to include the token in all requests
axiosInstance.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


const GeneralTabContent = () => (
  <>
    <Form.Item
      label="نام فروشگاه"
      name="store_name" // Corrected to match the model field
      rules={[{ required: true, message: 'لطفاً نام فروشگاه را وارد کنید!' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item label="کد اقتصادی" name="economic_code">
        <Input />
    </Form.Item>
    <Form.Item label="شماره تماس" name="phone_number">
        <Input />
    </Form.Item>
    <Form.Item label="آدرس کامل" name="full_address">
      <TextArea rows={3} placeholder="آدرس کامل فروشگاه" />
    </Form.Item>
  </>
);

const FinancialTabContent = () => (
  <>
    <Form.Item
        label="ارز پایه"
        name="base_currency"
    >
        <Input placeholder="مثال: ریال" />
    </Form.Item>
    <Form.Item label="مالیات بر ارزش افزوده پیش‌فرض (%)" name="default_vat_percentage">
      <Input type="number" placeholder="مثال: 9" />
    </Form.Item>
    <Form.Item label="اجرت پیش‌فرض (%)" name="default_wage_percentage">
      <Input type="number" placeholder="مثال: 7" />
    </Form.Item>
  </>
);

const PrintTabContent = () => (
    <>
        <Form.Item label="متن سربرگ فاکتور" name="invoice_header">
            <TextArea rows={4} placeholder="متنی که در بالای تمام فاکتورها چاپ می‌شود." />
        </Form.Item>
        <Form.Item label="متن پاورقی فاکتور" name="invoice_footer">
            <TextArea rows={4} placeholder="متنی که در پایین تمام فاکتورها چاپ می‌شود." />
        </Form.Item>
    </>
);

function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const { notification } = App.useApp();

  // دریافت تنظیمات
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/settings');
        if (response.data) {
          form.setFieldsValue(response.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        notification.error({
          message: 'خطا در دریافت اطلاعات',
          description: 'ارتباط با سرور برای دریافت تنظیمات برقرار نشد.',
          placement: 'bottomLeft',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [form, notification]);

  // ذخیره تنظیمات
  const handleSave = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.post('/settings', values);
      notification.success({
        message: 'انجام شد',
        description: 'تنظیمات با موفقیت ذخیره شد.',
        placement: 'bottomLeft',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      notification.error({
        message: 'خطا در ذخیره‌سازی',
        description: 'مشکلی در ذخیره تنظیمات رخ داد. لطفاً دوباره تلاش کنید.',
        placement: 'bottomLeft',
      });
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { key: '1', label: 'عمومی', children: <GeneralTabContent /> },
    { key: '2', label: 'مالی', children: <FinancialTabContent /> },
    { key: '3', label: 'چاپ', children: <PrintTabContent /> },
  ];

  return (
    <Spin spinning={loading} tip="در حال بارگذاری..." size="large">
      <div style={{ backgroundColor: '#fff', padding: '16px 24px', border: '1px solid #e8e8e8', borderRadius: '8px' }}>
        <Title level={4} style={{ marginBottom: '4px' }}>
          تنظیمات سیستم
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: '0' }}>
          مدیریت تنظیمات کلی، مالی و چاپ فروشگاه
        </Paragraph>
      </div>
      <Form
        form={form}
        onFinish={handleSave}
        layout="vertical"
        style={{ padding: '24px', marginTop: '16px', backgroundColor: '#fff', border: '1px solid #e8e8e8', borderRadius: '8px' }}
      >
        <Tabs defaultActiveKey="1" items={tabItems} />
        <Divider />
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            ذخیره تغییرات
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}

// Wrap the export with Ant Design's App component to provide context
const SystemSettingsPageWithAppContext = () => (
  <App>
    <SystemSettingsPage />
  </App>
);

export default SystemSettingsPageWithAppContext;