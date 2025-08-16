// frontend/src/pages/PluginMarketplacePage.jsx

import React from 'react';
import { Card, Row, Col, Typography, Button, Tag, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaCalculator, FaRobot } from 'react-icons/fa'; // آیکون تابلوی قیمت
import './PluginMarketplacePage.css';

const { Title, Paragraph } = Typography;
const { Meta } = Card;

const availablePlugins = [
  {
    id: 'price-board-pro', // شناسه جدید
    title: 'افزونه تابلوی قیمت پیشرفته',
    description: 'تابلوی قیمت خود را حرفه‌ای‌تر کنید! با قالب‌های متنوع، سفارشی‌سازی کامل و اتصال به دامنه شخصی، مشتریان خود را تحت تاثیر قرار دهید.',
    version: '2.0.0',
    author: 'تیم زرفولیو',
    price: '3,450,000 تومان',
    icon: <FaClipboardList style={{ fontSize: '48px', color: '#1890ff' }} />,
    tags: ['قیمت', 'نمایش آنلاین', 'سفارشی‌سازی'],
    features: [
      'قالب‌های نمایش متنوع و زیبا',
      'بارگذاری لوگو و بنر اختصاصی',
      'ایجاد QR Code برای دسترسی سریع',
      'اتصال به دامنه شخصی (White-labeling)'
    ]
  },
  {
    id: 'advanced-accounting',
    title: 'حسابداری پیشرفته',
    description: 'ابزارهای پیشرفته برای مدیریت اسناد حسابداری، گزارشات مالی و دفاتر قانونی.',
    version: '1.2.0',
    author: 'توسعه‌دهنده ثالث',
    price: '850,000 تومان',
    icon: <FaCalculator style={{ fontSize: '48px', color: '#52c41a' }} />,
    tags: ['حسابداری', 'مالی', 'گزارش'],
    features: [
        'صدور سند دستی و خودکار',
        'گزارش تراز آزمایشی',
        'مدیریت دفاتر کل، معین و تفصیلی'
    ]
  },
  {
    id: 'ai-assistant-pro',
    title: 'دستیار هوشمند پرو',
    description: 'نسخه پیشرفته دستیار هوشمند با قابلیت‌های تحلیل داده و پیش‌بینی فروش.',
    version: '1.5.0',
    author: 'تیم زرفولیو',
    price: 'تماس بگیرید',
    icon: <FaRobot style={{ fontSize: '48px', color: '#faad14' }} />,
    tags: ['هوش مصنوعی', 'تحلیل داده', 'پیش‌بینی'],
    features: [
      'تحلیل رفتار مشتریان',
      'پیش‌بینی روند فروش',
      'تولید گزارشات مدیریتی هوشمند'
    ]
  }
];

const PluginMarketplacePage = () => {
  const navigate = useNavigate();

  const handlePurchase = (pluginId) => {
    navigate(`/purchase-plugin/${pluginId}`);
  };

  return (
    <div className="plugin-marketplace-container">
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        فروشگاه افزونه‌های زرفولیو
      </Title>
      <Paragraph style={{ textAlign: 'center', marginBottom: '40px' }}>
        با نصب افزونه‌های قدرتمند، امکانات جدیدی به نرم‌افزار خود اضافه کرده و کسب و کارتان را توسعه دهید.
      </Paragraph>

      <Row gutter={[32, 32]}>
        {availablePlugins.map((plugin) => (
          <Col key={plugin.id} xs={24} sm={24} md={12} lg={8}>
            <Card
              hoverable
              className="plugin-card"
              actions={[
                <Button type="primary" key="purchase" onClick={() => handlePurchase(plugin.id)}>
                  مشاهده و خرید
                </Button>,
              ]}
            >
              <Meta
                avatar={plugin.icon}
                title={<Title level={4}>{plugin.title}</Title>}
                description={
                  <Paragraph ellipsis={{ rows: 2 }}>{plugin.description}</Paragraph>
                }
              />
              <Divider />
              <div className="plugin-card-body">
                <Paragraph><strong>ویژگی‌های کلیدی:</strong></Paragraph>
                <ul>
                  {plugin.features.map(feature => <li key={feature}>{feature}</li>)}
                </ul>
              </div>
              <div className="plugin-card-footer">
                <Tag color="blue">نسخه {plugin.version}</Tag>
                <Paragraph style={{ margin: 0 }}><strong>قیمت: {plugin.price}</strong></Paragraph>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PluginMarketplacePage;