// frontend/src/components/CustomerList.jsx
import React from 'react';
import { List, Avatar, Button, Tag, Space } from 'antd';
import { UserOutlined, MessageOutlined, EditOutlined } from '@ant-design/icons';
import './CustomerList.css'; // فایل استایل سفارشی

// داده‌های نمونه
const customers = [
  {
    id: 1,
    name: 'پرویز شمالی',
    email: 'parviz.shomali@example.com',
    avatar: '', // می‌توانید آدرس عکس را اینجا قرار دهید
    status: 'active',
  },
  {
    id: 2,
    name: 'مشتری ویژه',
    email: 'vip.customer@example.com',
    avatar: 'https://joeschmoe.io/api/v1/random',
    status: 'vip',
  },
  {
    id: 3,
    name: 'کاربر مسدود',
    email: 'banned.user@example.com',
    avatar: '',
    status: 'banned',
  },
];

const CustomerList = () => {
  const getStatusTag = (status) => {
    if (status === 'active') return <Tag color="success">فعال</Tag>;
    if (status === 'vip') return <Tag color="gold">ویژه</Tag>;
    if (status === 'banned') return <Tag color="error">مسدود</Tag>;
    return <Tag>نا مشخص</Tag>;
  };

  return (
    <List
      className="customer-list"
      itemLayout="horizontal"
      dataSource={customers}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button type="text" shape="circle" icon={<MessageOutlined />} title="ارسال پیام" />,
            <Button type="text" shape="circle" icon={<EditOutlined />} title="ویرایش" />,
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar src={item.avatar} icon={<UserOutlined />} size="large" />
            }
            title={<a href="#">{item.name}</a>}
            description={
              <div>
                {item.email}
                <div style={{ marginTop: '4px' }}>{getStatusTag(item.status)}</div>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
};

export default CustomerList;