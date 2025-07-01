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

// کامپوننت‌های تب‌ها (بدون تغییر)
const GeneralTabContent = () => (
  <>
    <Form.Item
      label="نام فروشگاه"
      name="shopName"
      rules={[{ required: true, message: 'لطفاً نام فروشگاه را وارد کنید!' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item label="توضیحات" name="description">
      <TextArea rows={4} placeholder="توضیحات مختصری درباره فروشگاه" />
    </Form.Item>
  </>
);

const FinancialTabContent = () => (
  <>
    <Form.Item
      label="کد اقتصادی"
      name="economicCode"
      rules={[{ required: true, message: 'لطفاً کد اقتصادی را وارد کنید!' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item label="شماره ثبت" name="registrationNumber">
      <Input placeholder="اختیاری" />
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
        // <<<< اصلاحیه اصلی اینجا اعمال شد >>>>
        const response = await axios.get('/api/v1/settings');
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
      // <<<< اصلاحیه اصلی اینجا اعمال شد >>>>
      await axios.post('/api/v1/settings', values);
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
  ];

  return (
    <Spin spinning={loading} tip="در حال بارگذاری..." size="large">
      <div style={{ backgroundColor: '#f5f5f5', padding: '16px 24px', borderBottom: '1px solid #e8e8e8' }}>
        <Title level={4} style={{ marginBottom: '4px' }}>
          تنظیمات سیستم
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: '0' }}>
          مدیریت تنظیمات کلی و مالی فروشگاه
        </Paragraph>
      </div>
      <Form
        form={form}
        onFinish={handleSave}
        layout="vertical"
        style={{ padding: '24px' }}
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

export default SystemSettingsPage;