import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, List, Avatar, Typography, Spin, Empty, Tag, Button } from 'antd';
import { FaPlug } from 'react-icons/fa';

const { Title, Text } = Typography;

const MyPluginsPage = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.post('/api/plugin/get/actives')
      .then(response => {
        setPlugins(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching active plugins:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <Title level={4}>افزونه‌های فعال من</Title>
      {plugins.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={plugins}
          renderItem={plugin => (
            <List.Item
              actions={[
                <Link to={`/plugins/${plugin.name}/intro`}>
                  <Button type="link">مدیریت</Button>
                </Link>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FaPlug />} style={{ backgroundColor: '#1890ff' }} />}
                title={<Text strong>{plugin.des}</Text>}
                description={
                  <Tag color="green">
                    تاریخ پایان اعتبار: {plugin.dateExpire}
                  </Tag>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="شما هیچ افزونه فعالی ندارید." />
      )}
    </Card>
  );
};

export default MyPluginsPage;