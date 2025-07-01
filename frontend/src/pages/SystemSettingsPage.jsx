import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Input,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Spin,
  notification,
  Layout,
  Space
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext'; // استفاده از هوک سفارشی برای احراز هویت

const { Title } = Typography;
const { Content } = Layout;

// کامپوننت داخلی برای فرم اطلاعات واحد تجاری
const BusinessInfoSettings = () => {
  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    phoneNumber: '',
    economicCode: '',
    logoUrl: '', // این فیلد برای آینده در نظر گرفته شده است
  });
  
  const [loading, setLoading] = useState(true); // برای بارگذاری اولیه اطلاعات
  const [saving, setSaving] = useState(false);  // برای وضعیت ذخیره‌سازی
  
  const { authToken } = useAuth(); // دریافت توکن از کانتکست
  const [api, contextHolder] = notification.useNotification(); // برای نمایش پیام‌های موفقیت و خطا

  // ۱. دریافت اطلاعات اولیه از بک‌اند هنگام بارگذاری کامپوننت
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!authToken) {
        setLoading(false);
        api.warning({
          message: 'نیاز به ورود',
          description: 'برای مشاهده این بخش باید ابتدا وارد حساب کاربری خود شوید.',
          placement: 'bottomRight',
        });
        return;
      }

      try {
        const response = await axios.get('/api/settings/business', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        // نام فیلدها باید با JSON tags مدل بک‌اند مطابقت داشته باشد
        if (response.data) {
          setFormData(response.data);
        }
      } catch (error) {
        console.error("Error fetching business info:", error);
        api.error({
          message: 'خطا',
          description: 'خطا در دریافت اطلاعات از سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
          placement: 'bottomRight',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessInfo();
  }, [authToken, api]); // وابستگی به توکن و api ناتیفیکیشن

  // مدیریت تغییرات در فرم‌ها
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ۲. ذخیره اطلاعات در بک‌اند
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings/business', formData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      api.success({
        message: 'موفقیت',
        description: 'اطلاعات با موفقیت ذخیره شد!',
        placement: 'bottomRight',
      });
    } catch (error) {
      console.error("Error saving business info:", error);
      api.error({
        message: 'خطا',
        description: 'خطا در هنگام ذخیره اطلاعات. لطفاً دوباره تلاش کنید.',
        placement: 'bottomRight',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {contextHolder} {/* این کامپوننت برای نمایش اعلان‌ها ضروری است */}
      <Spin spinning={loading} tip="در حال بارگذاری اطلاعات اولیه..." size="large">
        <Card title={<Title level={4}>اطلاعات واحد تجاری</Title>} style={{ marginTop: '24px' }}>
          <Row gutter={[16, 24]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text>نام فروشگاه</Typography.Text>
                <Input
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="مثال: جواهری زرفولیو"
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text>کد اقتصادی</Typography.Text>
                <Input
                  name="economicCode"
                  value={formData.economicCode}
                  onChange={handleChange}
                  placeholder="کد ۱۲ رقمی"
                />
              </Space>
            </Col>
            <Col xs={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text>آدرس</Typography.Text>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="آدرس کامل فروشگاه"
                  />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text>شماره تلفن</Typography.Text>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="مثال: 02112345678"
                  style={{ direction: 'ltr' }}
                />
              </Space>
            </Col>
          </Row>
          <Row justify="end" style={{ marginTop: '32px' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={loading} // تا زمانی که اطلاعات اولیه لود نشده، دکمه غیرفعال باشد
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </Row>
        </Card>
      </Spin>
    </>
  );
};


// کامپوننت اصلی و والد صفحه
const SystemSettingsPage = () => {
  return (
    <Content style={{ padding: '24px', background: '#f0f2f5' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        تنظیمات سیستم
      </Title>
      
      {/* کامپوننت فرم تنظیمات در اینجا قرار می‌گیرد */}
      <BusinessInfoSettings />

      {/* در آینده می‌توانید کارت‌های تنظیمات دیگر را در اینجا اضافه کنید */}
      {/* <Card title="تنظیمات مالیاتی" style={{ marginTop: '24px' }}>...</Card> */}
      {/* <Card title="تنظیمات اعلان‌ها" style={{ marginTop: '24px' }}>...</Card> */}
    </Content>
  );
};

export default SystemSettingsPage;