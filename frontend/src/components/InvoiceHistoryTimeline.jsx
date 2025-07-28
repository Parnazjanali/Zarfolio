// frontend/src/components/InvoiceHistoryTimeline.jsx
import React from 'react';
import { Timeline, Card, Typography } from 'antd';
import {
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const InvoiceHistoryTimeline = () => {
  // در آینده، شما می‌توانید داده‌های تایم‌لاین را از props دریافت کنید
  const timelineItems = [
      {
        dot: <EditOutlined style={{ fontSize: '16px' }} />,
        color: 'blue',
        children: (
          <>
            <p><strong>ایجاد فاکتور</strong></p>
            <Text type="secondary">توسط: مدیر سیستم</Text><br/>
            <Text type="secondary">25 تیر 1403، ساعت 10:30</Text>
          </>
        ),
      },
      // ... سایر رویدادها
  ];

  return (
    <Card title="تاریخچه فاکتور">
      <Timeline mode="alternate" items={timelineItems} />
    </Card>
  );
};

export default InvoiceHistoryTimeline;