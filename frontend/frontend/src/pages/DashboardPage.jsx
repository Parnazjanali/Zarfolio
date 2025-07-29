// frontend/src/pages/DashboardPage.jsx

import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { ArrowUpOutlined, UserOutlined, ShoppingCartOutlined, DollarCircleOutlined } from '@ant-design/icons';

// 1. وارد کردن کامپوننت‌های جدید
import SalesChart from '../components/SalesChart.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import CustomerList from '../components/CustomerList.jsx';

import './DashboardPage.css'; // اطمینان حاصل کنید که این فایل استایل وجود دارد

const DashboardPage = () => {
  return (
    <div>
      {/* بخش کارت‌های آمار */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-primary">
            <Statistic
              title="فروش امروز"
              value={112893}
              precision={0}
              valueStyle={{ color: '#fff', fontSize: '2rem' }}
              prefix={<DollarCircleOutlined />}
              suffix="تومان"
            />
            <div className="stat-card-footer">
              <ArrowUpOutlined />
              <span style={{ margin: '0 5px' }}>3.5%</span>
              <span>نسبت به دیروز</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-success">
            <Statistic
              title="مشتریان جدید"
              value={45}
              valueStyle={{ color: '#fff', fontSize: '2rem' }}
              prefix={<UserOutlined />}
            />
            <div className="stat-card-footer">
              <ArrowUpOutlined />
              <span style={{ margin: '0 5px' }}>10%</span>
              <span>در این ماه</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6}>
          <Card className="stat-card stat-card-warning">
            <Statistic
              title="سفارشات جدید"
              value={12}
              valueStyle={{ color: '#fff', fontSize: '2rem' }}
              prefix={<ShoppingCartOutlined />}
            />
             <div className="stat-card-footer">
               <span>امروز</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* بخش نمودار */}
      <Row style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <SalesChart />
        </Col>
      </Row>

      {/* 2. بخش جدید برای فید فعالیت‌ها و لیست مشتریان */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          {/* نمایش کامپوننت فید فعالیت‌ها */}
          <ActivityFeed />
        </Col>
        <Col xs={24} lg={12}>
          {/* نمایش کامپوننت لیست مشتریان */}
          <CustomerList />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;