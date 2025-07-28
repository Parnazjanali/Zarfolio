// frontend/src/components/ActivityFeed.jsx
import React from 'react';
import { List, Avatar, Typography, Card } from 'antd';
import {
  UserAddOutlined,
  FileAddOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import './ActivityFeed.css'; // فایل استایل سفارشی

const { Text } = Typography;

// داده‌های نمونه
const activities = [
  {
    id: 1,
    user: 'مدیر سیستم',
    action: 'یک فاکتور جدید برای "مشتری ویژه" ثبت کرد.',
    time: '۵ دقیقه پیش',
    icon: <FileAddOutlined />,
    color: '#1890ff',
  },
  {
    id: 2,
    user: 'پرویز شمالی',
    action: 'یک مشتری جدید با نام "فروشگاه مرکزی" اضافه کرد.',
    time: '۱ ساعت پیش',
    icon: <UserAddOutlined />,
    color: '#52c41a',
  },
  {
    id: 3,
    user: 'مدیر سیستم',
    action: 'پرداخت فاکتور شماره ۱۰۲۳ را تایید کرد.',
    time: '۳ ساعت پیش',
    icon: <DollarCircleOutlined />,
    color: '#faad14',
  },
];

const ActivityFeed = () => {
  return (
    <Card title="آخرین فعالیت‌ها">
      <List
        className="activity-feed"
        itemLayout="horizontal"
        dataSource={activities}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: item.color }}
                  icon={item.icon}
                />
              }
              title={
                <span>
                  <strong>{item.user}</strong> {item.action}
                </span>
              }
              description={<Text type="secondary">{item.time}</Text>}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default ActivityFeed;