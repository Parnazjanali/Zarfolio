// frontend/src/pages/CustomerDetailPage.jsx
import React from 'react';
import { Card, Tabs, Avatar, Typography, Table } from 'antd';
import { UserOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons';
import ActivityFeed from '../components/ActivityFeed'; // از کامپوننت قبلی استفاده می‌کنیم

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// داده‌های نمونه برای فاکتورهای این مشتری
const customerInvoices = [
    { key: '1', invoiceNumber: 'INV-002', status: 'pending', date: '1403-05-03', amount: '850,000' },
    { key: '2', invoiceNumber: 'INV-005', status: 'paid', date: '1403-03-20', amount: '1,200,000' },
];
const invoiceColumns = [
    { title: 'شماره فاکتور', dataIndex: 'invoiceNumber' },
    { title: 'وضعیت', dataIndex: 'status', render: status => status === 'paid' ? <Tag color="success">پرداخت شده</Tag> : <Tag color="warning">در انتظار</Tag> },
    { title: 'مبلغ (تومان)', dataIndex: 'amount' },
];

const CustomerDetailPage = () => {
  // در آینده، اطلاعات مشتری از طریق URL parameter و API دریافت می‌شود
  const customer = {
    name: 'مشتری ویژه',
    email: 'vip.customer@example.com',
    avatar: 'https://joeschmoe.io/api/v1/random'
  };

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={64} src={customer.avatar} icon={<UserOutlined />} />
          <div style={{ marginLeft: 16 }}>
            <Title level={4}>{customer.name}</Title>
            <Text type="secondary">{customer.email}</Text>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={<span><FileTextOutlined />فاکتورها</span>}
            key="1"
          >
            <Table columns={invoiceColumns} dataSource={customerInvoices} pagination={false} />
          </TabPane>
          <TabPane
            tab={<span><HistoryOutlined />تاریخچه فعالیت</span>}
            key="2"
          >
            {/* می‌توانید یک نسخه از ActivityFeed بسازید که فقط فعالیت‌های این مشتری را نشان دهد */}
            <ActivityFeed />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default CustomerDetailPage;