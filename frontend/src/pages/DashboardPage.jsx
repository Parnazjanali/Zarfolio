import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Skeleton } from 'antd';
import DigitalClock from '../components/DigitalClock';
import JalaliCalendar from '../components/JalaliCalendar';
import ChequeAlertWidget from '../components/ChequeAlertWidget';
import './DashboardPage.css';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);

  // شبیه‌سازی بارگذاری داده‌ها از سرور
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 ثانیه تاخیر برای نمایش حالت لودینگ
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-page-optimized">
      <Row gutter={[24, 24]}>
        {/* ستون تقویم */}
        <Col xs={24} md={12} lg={8}>
          {/* 'bordered={false}' با 'variant="borderless"' جایگزین شد */}
          <Card variant="borderless" className="widget-card">
            <Skeleton loading={loading} active>
              <JalaliCalendar />
            </Skeleton>
          </Card>
        </Col>

        {/* ستون ساعت دیجیتال */}
        <Col xs={24} md={12} lg={8}>
          {/* 'bordered={false}' با 'variant="borderless"' جایگزین شد 
            'bodyStyle={{ padding: 0 }}' با 'styles={{ body: { padding: 0 } }}' جایگزین شد 
          */}
          <Card variant="borderless" className="widget-card" styles={{ body: { padding: 0 } }}>
            <Skeleton loading={loading} active>
              <DigitalClock />
            </Skeleton>
          </Card>
        </Col>
        
        {/* ستون یادآوری چک */}
        <Col xs={24} md={24} lg={8}>
          {/* 'bordered={false}' با 'variant="borderless"' جایگزین شد */}
          <Card variant="borderless" className="widget-card" title="یادآوری چک‌ها">
            {/* کامپوننت چک خودش حالت لودینگ و خالی را مدیریت می‌کند */}
            <ChequeAlertWidget loading={loading} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;