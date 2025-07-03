// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Skeleton, Row, Col, Typography } from 'antd';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import ChequeAlertWidget from '../components/ChequeAlertWidget';
import './DashboardPage.css'; // می‌توانید استایل‌های لازم را در این فایل اضافه کنید

const { Title } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // شبیه‌سازی بارگذاری داده‌ها
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-page-optimized">
      <Title level={2} style={{ marginBottom: '24px' }}>داشبورد مدیریتی</Title>
      
      {/* ردیف اول داشبورد */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={12} lg={8}>
          <Card className="widget-card" bordered={false}>
            <Skeleton loading={loading} active>
              <JalaliCalendar />
            </Skeleton>
          </Card>
        </Col>
        
        <Col xs={24} sm={24} md={12} lg={8}>
          <Card className="widget-card" styles={{ body: { padding: 0, height: '100%' } }} bordered={false}>
            <Skeleton loading={loading} active>
              <DigitalClock />
            </Skeleton>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={24} lg={8}>
          <Card className="widget-card" title="یادآوری چک‌ها" bordered={false}>
            <Skeleton loading={loading} active>
              <ChequeAlertWidget />
            </Skeleton>
          </Card>
        </Col>
      </Row>

      {/* می‌توانید ردیف‌های دیگری برای سایر ویجت‌ها اضافه کنید */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="آمار و گزارشات" bordered={false}>
             <Skeleton loading={loading} active>
                <p>این بخش برای نمایش گزارشات و نمودارها در آینده است.</p>
             </Skeleton>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;