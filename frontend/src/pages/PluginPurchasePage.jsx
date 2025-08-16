// frontend/src/pages/PluginPurchasePage.jsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Typography, Button, Card, List, Tag, Divider } from 'antd';
import { FaClipboardList, FaCheckCircle, FaCalculator, FaRobot } from 'react-icons/fa'; // آیکون‌های لازم
import './PluginPurchasePage.css';

const { Title, Paragraph, Text } = Typography;

// داده‌های نمونه برای افزونه‌ها
const pluginDetails = {
  'price-board-pro': {
    id: 'price-board-pro',
    title: 'افزونه تابلوی قیمت پیشرفته',
    icon: <FaClipboardList className="plugin-icon" />,
    heroDescription: 'تابلوی قیمت آنلاین خود را به یک ابزار بازاریابی قدرتمند تبدیل کنید. با قالب‌های زیبا، امکانات سفارشی‌سازی کامل و قابلیت اتصال به دامنه شخصی، برند خود را به بهترین شکل به نمایش بگذارید.',
    price: '3,450,000 تومان',
    features: [
      'انتخاب از میان چندین قالب نمایش حرفه‌ای (مدرن، کلاسیک، تصویری)',
      'سفارشی‌سازی کامل رنگ‌بندی برای هماهنگی با هویت بصری برند شما',
      'قابلیت بارگذاری لوگوی کسب‌وکار و تصویر بنر در بالای صفحه',
      'ایجاد دسته‌بندی برای محصولات جهت دسترسی آسان‌تر مشتری',
      'تولید QR Code اختصاصی برای چاپ و اشتراک‌گذاری سریع',
      'امکان اتصال به دامنه یا زیردامنه شخصی (مانند prices.yourshop.com)',
      'حذف کامل نام و نشان زرفولیو از صفحه تابلوی قیمت (White-labeling)',
      'به‌روزرسانی خودکار قیمت‌ها بر اساس آخرین قیمت خرید یا فروش ثبت شده',
    ],
    gallery: [
      '/placeholders/priceboard-ss-1.png',
      '/placeholders/priceboard-ss-2.png',
      '/placeholders/priceboard-ss-3.png'
    ]
  },
  // اطلاعات سایر افزونه‌ها را هم می‌توان به همین شکل اضافه کرد
  'advanced-accounting': {
      id: 'advanced-accounting',
      title: 'حسابداری پیشرفته',
      icon: <FaCalculator className="plugin-icon" />,
      heroDescription: 'ابزارهای پیشرفته برای مدیریت اسناد حسابداری، گزارشات مالی و دفاتر قانونی.',
      price: '850,000 تومان',
      features: ['صدور سند دستی و خودکار', 'گزارش تراز آزمایشی', 'مدیریت دفاتر کل، معین و تفصیلی'],
      gallery: []
  },
  'ai-assistant-pro': {
      id: 'ai-assistant-pro',
      title: 'دستیار هوشمند پرو',
      icon: <FaRobot className="plugin-icon" />,
      heroDescription: 'نسخه پیشرفته دستیار هوشمند با قابلیت‌های تحلیل داده و پیش‌بینی فروش.',
      price: 'تماس بگیرید',
      features: ['تحلیل رفتار مشتریان', 'پیش‌بینی روند فروش', 'تولید گزارشات مدیریتی هوشمند'],
      gallery: []
  }
};


const PluginPurchasePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const plugin = pluginDetails[id];

  if (!plugin) {
    return <div>افزونه مورد نظر یافت نشد.</div>;
  }

  return (
    <div className="plugin-purchase-page">
      {/* بخش Hero */}
      <div className="hero-section">
        <Row align="middle" gutter={[32, 32]}>
          <Col xs={24} md={4} style={{ textAlign: 'center' }}>
            {plugin.icon}
          </Col>
          <Col xs={24} md={20}>
            <Title>{plugin.title}</Title>
            <Paragraph className="hero-paragraph">{plugin.heroDescription}</Paragraph>
          </Col>
        </Row>
      </div>

      <Row gutter={[32, 32]}>
        {/* ستون اصلی - ویژگی‌ها و تصاویر */}
        <Col xs={24} lg={16}>
          <Card>
            <Title level={3}>امکانات و آپشن‌ها</Title>
            <List
              dataSource={plugin.features}
              renderItem={(item) => (
                <List.Item>
                  <Text><FaCheckCircle style={{ color: '#52c41a', marginLeft: 8 }} /> {item}</Text>
                </List.Item>
              )}
            />
            {plugin.gallery.length > 0 && <Divider />}
            {plugin.gallery.length > 0 && <Title level={3}>نمایی از محیط افزونه</Title>}
             <Row gutter={[16, 16]}>
                {plugin.gallery.map((img, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                        <img src={img} alt={`screenshot ${index + 1}`} style={{ width: '100%', borderRadius: '8px', border: '1px solid #f0f0f0' }}/>
                    </Col>
                ))}
            </Row>
          </Card>
        </Col>

        {/* ستون کناری - خرید */}
        <Col xs={24} lg={8}>
          <Card className="purchase-card">
            <Title level={4}>خرید و فعال‌سازی</Title>
            <div className="price-section">
              <Text>قیمت افزونه:</Text>
              <Title level={2} style={{ margin: 0 }}>{plugin.price}</Title>
            </div>
            <Paragraph type="secondary">
              این هزینه تنها یک بار پرداخت می‌شود و شامل پشتیبانی و بروزرسانی‌های یک ساله است.
            </Paragraph>
            <Button type="primary" size="large" block>
              افزودن به سبد خرید
            </Button>
            <Button size="large" block style={{ marginTop: '16px' }} onClick={() => navigate('/plugins')}>
              بازگشت به فروشگاه
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PluginPurchasePage;