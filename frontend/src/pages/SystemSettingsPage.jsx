import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Spin,
  notification,
  Card,
  Row,
  Col,
  Typography,
  Switch,
  Tabs,
} from 'antd';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // مسیر فرضی AuthContext

const { Title } = Typography;
const { TabPane } = Tabs;

const SystemSettingsPage = () => {
  const [form] = Form.useForm();
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(true); // For initial data load
  const [saving, setSaving] = useState(false);  // For save operation
  const [initialValues, setInitialValues] = useState({}); // To store fetched settings

  const apiBaseUrl = '/api'; 

  const fetchSettings = useCallback(async () => {
    if (!authToken) {
      notification.error({ message: 'خطا', description: 'توکن احراز هویت یافت نشد. لطفاً مجدداً وارد شوید.' });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/settings`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const fetchedData = response.data;
      // Ensure boolean fields are correctly interpreted for Switch components
      fetchedData.enable_email_notifications = !!fetchedData.enable_email_notifications;
      fetchedData.send_daily_summary_email = !!fetchedData.send_daily_summary_email;
      
      setInitialValues(fetchedData);
      form.setFieldsValue(fetchedData); // Set form fields after data is fetched
      // notification.success({ message: 'موفق', description: 'تنظیمات با موفقیت بارگذاری شد.' });
    } catch (error) {
      console.error('Error fetching settings:', error);
      notification.error({
        message: 'خطا در بارگذاری تنظیمات',
        description: error.response?.data?.error || error.message || 'مشکلی در ارتباط با سرور رخ داده است.',
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onFinish = async (values) => {
    if (!authToken) {
      notification.error({ message: 'خطا', description: 'توکن احراز هویت یافت نشد. لطفاً مجدداً وارد شوید.' });
      return;
    }
    setSaving(true);
    
    const payload = {
      ...initialValues, // Start with existing settings to preserve all fields
      ...values, // Override with form values
      // Ensure boolean values from Switch are correctly sent as booleans
      enable_email_notifications: !!values.enable_email_notifications,
      send_daily_summary_email: !!values.send_daily_summary_email,
      // Ensure numeric values are numbers
      default_vat_percentage: Number(values.default_vat_percentage) || 0,
      default_wage_percentage: Number(values.default_wage_percentage) || 0,
    };
    // Remove GORM specific fields if they exist in payload, as they are not needed for update
    delete payload.ID;
    delete payload.CreatedAt;
    delete payload.UpdatedAt;
    delete payload.DeletedAt;

    try {
      await axios.post(`${apiBaseUrl}/settings`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      notification.success({ message: 'موفق', description: 'تنظیمات با موفقیت ذخیره شد.' });
      fetchSettings(); // Refresh settings from server
    } catch (error) {
      console.error('Error saving settings:', error);
      notification.error({
        message: 'خطا در ذخیره تنظیمات',
        description: error.response?.data?.error || error.message || 'مشکلی در ارتباط با سرور رخ داده است.',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Show main loading spinner only if initialValues are not yet loaded.
  if (loading && Object.keys(initialValues).length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip="در حال بارگذاری تنظیمات اولیه..." />
      </div>
    );
  }

  return (
    <Card title={<Title level={3} style={{ margin: 0 }}>تنظیمات سیستم</Title>} style={{ margin: '24px' }}>
      <Spin spinning={saving || (loading && Object.keys(initialValues).length > 0)} tip={saving ? "در حال ذخیره..." : "در حال به‌روزرسانی اطلاعات..."}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={initialValues} // Set initial values for the form
          key={JSON.stringify(initialValues)} // Force re-render of form when initialValues change
        >
          <Tabs defaultActiveKey="1" type="card">
            <TabPane tab="اطلاعات پایه" key="1">
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="store_name"
                    label="نام فروشگاه"
                    rules={[{ required: true, message: 'لطفاً نام فروشگاه را وارد کنید' }]}
                  >
                    <Input placeholder="مثال: گالری طلای زرفام" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="economic_code" label="کد اقتصادی">
                    <Input placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item name="phone_number" label="شماره تلفن">
                    <Input placeholder="مثال: ۰۲۱-۱۲۳۴۵۶۷۸" style={{direction: 'ltr'}}/>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="logo_url" label="آدرس اینترنتی لوگو (URL)">
                    <Input placeholder="مثال: https://example.com/logo.png" style={{direction: 'ltr'}}/>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="full_address" label="آدرس کامل">
                <Input.TextArea rows={3} placeholder="مثال: تهران، خیابان اصلی، کوچه فرعی، پلاک ۱۰" />
              </Form.Item>
            </TabPane>

            <TabPane tab="مالی و تخصصی طلا" key="2">
              <Row gutter={24}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="base_currency"
                    label="واحد پول پایه"
                    rules={[{ required: true, message: 'لطفاً واحد پول را انتخاب کنید' }]}
                  >
                    <Select placeholder="انتخاب کنید">
                      <Select.Option value="ریال">ریال</Select.Option>
                      <Select.Option value="تومان">تومان</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="default_vat_percentage"
                    label="مالیات بر ارزش افزوده پیش‌فرض"
                    rules={[{ type: 'number', min: 0, max: 100, message: 'مقدار باید بین ۰ و ۱۰۰ باشد' }]}
                  >
                    <InputNumber style={{ width: '100%' }} addonAfter="%" placeholder="مثال: 9" min={0} max={100}/>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="default_wage_percentage"
                    label="اجرت ساخت پیش‌فرض"
                    rules={[{ type: 'number', min: 0, max: 100, message: 'مقدار باید بین ۰ و ۱۰۰ باشد' }]}
                  >
                    <InputNumber style={{ width: '100%' }} addonAfter="%" placeholder="مثال: 7" min={0} max={100}/>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="gold_api_key" label="کلید API نرخ زنده طلا (اختیاری)">
                <Input.Password placeholder="کلید API خود را وارد کنید (محرمانه)" style={{direction: 'ltr'}}/>
              </Form.Item>
            </TabPane>

            <TabPane tab="تنظیمات چاپ" key="3">
              <Form.Item name="invoice_header" label="متن سربرگ فاکتور">
                <Input.TextArea rows={4} placeholder="متنی که در بالای تمام فاکتورها نمایش داده می‌شود. می‌توانید از متغیرهایی مانند {store_name} یا {date} استفاده کنید." />
              </Form.Item>
              <Form.Item name="invoice_footer" label="متن پاورقی فاکتور">
                <Input.TextArea rows={4} placeholder="اطلاعاتی مانند آدرس وب‌سایت، تشکر از خرید، قوانین و مقررات و ..." />
              </Form.Item>
            </TabPane>

            <TabPane tab="اعلان‌ها" key="4">
              <Form.Item name="enable_email_notifications" label="فعال‌سازی اعلان‌های ایمیلی برای رویدادهای مهم" valuePropName="checked" >
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
              </Form.Item>
              <Form.Item name="send_daily_summary_email" label="ارسال خلاصه گزارش روزانه به ایمیل مدیر" valuePropName="checked" >
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
              </Form.Item>
            </TabPane>
          </Tabs>

          <Form.Item style={{ marginTop: '30px', textAlign: 'left' }}>
            <Button type="primary" htmlType="submit" loading={saving} size="large">
              ذخیره تغییرات
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default SystemSettingsPage;