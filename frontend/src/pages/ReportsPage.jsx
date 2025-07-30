// frontend/src/pages/ReportsPage.jsx

import React from 'react';
import { Card, Row, Col, Typography, List, Space } from 'antd';
import { Link } from 'react-router-dom';
import {
  UserOutlined,
  BankOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  LeftOutlined,
  SolutionOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TransactionOutlined,
  PieChartOutlined,
  HistoryOutlined,
  CreditCardOutlined,
  SwapOutlined,
  BoxPlotOutlined
} from '@ant-design/icons';
import './ReportsPage.css';

const { Title } = Typography;

const reportsData = {
  persons: {
    title: 'اشخاص',
    icon: <UserOutlined />,
    className: 'google-blue',
    items: [
      { key: 'account-card', label: 'کارت حساب', link: '/reports/account-card', icon: <SolutionOutlined /> },
      { key: 'debtors', label: 'بدهکاران', link: '/reports/debtors', icon: <ArrowUpOutlined /> },
      { key: 'creditors', label: 'بستانکاران', link: '/reports/creditors', icon: <ArrowDownOutlined /> },
      { key: 'person-sales', label: 'خرید و فروش اشخاص', link: '/reports/person-sales', icon: <TransactionOutlined /> },
    ],
  },
  banking: {
    title: 'بانکداری',
    icon: <BankOutlined />,
    className: 'google-red',
    items: [
      // <-- لینک اینجا اصلاح شد -->
      { key: 'bank-statement', label: 'گردش حساب بانک', link: '/reports/bank-statement', icon: <CreditCardOutlined /> },
      { key: 'fund-statement', label: 'گردش حساب صندوق', link: '/reports/fund-statement', icon: <BoxPlotOutlined /> },
      { key: 'petty-cash-statement', label: 'گردش حساب تنخواه', link: '/reports/petty-cash-statement', icon: <SwapOutlined /> },
    ],
  },
  products: {
    title: 'کالا و خدمات',
    icon: <ShoppingCartOutlined />,
    className: 'google-yellow',
    items: [
      { key: 'product-sales', label: 'خرید و فروش به تفکیک کالا', link: '/reports/product-sales', icon: <PieChartOutlined /> },
    ],
  },
  base: {
    title: 'گزارشات پایه',
    icon: <FileTextOutlined />,
    className: 'google-green',
    items: [
      { key: 'event-history', label: 'تاریخچه رویدادها', link: '/settings/logs', icon: <HistoryOutlined /> },
    ],
  },
};

const ReportCard = ({ title, icon, items, className }) => (
  <Card
    title={
      <Space>
        {icon}
        {title}
      </Space>
    }
    className={`report-category-card ${className}`}
  >
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item className="report-link-item">
          <Link to={item.link}>
            <Space className="report-item-label">
              {item.icon}
              {item.label}
            </Space>
            <LeftOutlined className="report-item-arrow" />
          </Link>
        </List.Item>
      )}
    />
  </Card>
);

function ReportsPage() {
  return (
    <div className="reports-page-container">
      <Title level={2} className="page-title">گزارشات</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12} lg={8}>
          <ReportCard {...reportsData.persons} />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <ReportCard {...reportsData.banking} />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <ReportCard {...reportsData.products} />
            </Col>
            <Col span={24}>
              <ReportCard {...reportsData.base} />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default ReportsPage;