// frontend/src/pages/MyPluginsPage.jsx

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Switch, Button, Tag, Modal } from 'antd';
import { FaClipboardList, FaCog, FaTrash } from 'react-icons/fa'; // آیکون جدید

const { Title, Paragraph } = Typography;

// شبیه‌سازی افزونه‌های نصب شده
const initialInstalledPlugins = [
  {
    id: 'price-board-pro',
    title: 'افزونه تابلوی قیمت پیشرفته',
    description: 'قالب‌های متنوع، سفارشی‌سازی کامل و اتصال به دامنه شخصی.',
    version: '2.0.0',
    active: true,
    icon: <FaClipboardList style={{ fontSize: '32px', color: '#1890ff' }} />
  }
];

const MyPluginsPage = () => {
  const [installedPlugins, setInstalledPlugins] = useState([]);

  useEffect(() => {
    const savedPlugins = localStorage.getItem('installedPlugins');
    if (savedPlugins) {
      setInstalledPlugins(JSON.parse(savedPlugins));
    } else {
      setInstalledPlugins(initialInstalledPlugins);
      localStorage.setItem('installedPlugins', JSON.stringify(initialInstalledPlugins));
    }
  }, []);

  const handleToggle = (pluginId, checked) => {
    const updatedPlugins = installedPlugins.map(p =>
      p.id === pluginId ? { ...p, active: checked } : p
    );
    setInstalledPlugins(updatedPlugins);
    localStorage.setItem('installedPlugins', JSON.stringify(updatedPlugins));
  };

  const handleUninstall = (pluginId) => {
     Modal.confirm({
      title: 'آیا از حذف این افزونه مطمئن هستید؟',
      content: 'با حذف افزونه، تمام تنظیمات پیشرفته آن غیرفعال خواهد شد.',
      okText: 'بله، حذف کن',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: () => {
        const updatedPlugins = installedPlugins.filter(p => p.id !== pluginId);
        setInstalledPlugins(updatedPlugins);
        localStorage.setItem('installedPlugins', JSON.stringify(updatedPlugins));
      }
    });
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>افزونه‌های نصب شده</Title>
      
      <Row gutter={[24, 24]}>
        {installedPlugins.map(plugin => (
          <Col key={plugin.id} xs={24} sm={12} md={8}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                {plugin.icon}
                <div style={{ marginRight: 16 }}>
                  <Title level={5} style={{ marginBottom: 0 }}>{plugin.title}</Title>
                  <Tag>نسخه {plugin.version}</Tag>
                </div>
              </div>
              <Paragraph type="secondary">{plugin.description}</Paragraph>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                <div>
                  <Switch
                    checkedChildren="فعال"
                    unCheckedChildren="غیرفعال"
                    checked={plugin.active}
                    onChange={(checked) => handleToggle(plugin.id, checked)}
                  />
                </div>
                <div>
                  {/* دکمه تنظیمات به صفحه اصلی تنظیمات تابلوی قیمت لینک می‌شود */}
                  <Button icon={<FaCog />} style={{ marginLeft: 8 }} href="/settings/price-board">تنظیمات</Button>
                  <Button type="primary" danger icon={<FaTrash />} style={{ marginRight: 8 }} onClick={() => handleUninstall(plugin.id)}>
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
         {installedPlugins.length === 0 && (
          <Col span={24}>
            <Card>
              <Paragraph style={{textAlign: 'center'}}>هیچ افزونه‌ای نصب نشده است.</Paragraph>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default MyPluginsPage;