import React, { useState, useEffect } from 'react';
import { Switch, Row, Col, Card, Typography, notification, Spin } from 'antd';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const UserPermissions = () => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const { email } = useParams(); // Get email from URL

    useEffect(() => {
        const fetchPermissions = async () => {
            setLoading(true);
            try {
                const response = await axios.post('/api/business/get/user/permissions', {
                    'bid': localStorage.getItem('activeBid'),
                    'email': email
                });
                setPermissions(response.data);
            } catch (error) {
                notification.error({ message: 'خطا', description: 'خطا در دریافت دسترسی‌ها' });
            } finally {
                setLoading(false);
            }
        };
        fetchPermissions();
    }, [email]);

    const handlePermissionChange = async (key, value) => {
        const updatedPermissions = { ...permissions, [key]: value };
        setPermissions(updatedPermissions);
        
        try {
            await axios.post('/api/business/save/user/permissions', {
                ...updatedPermissions,
                email: email,
                bid: localStorage.getItem('activeBid')
            });
            notification.success({ message: 'موفق', description: `دسترسی ${key} به‌روزرسانی شد.` });
        } catch (error) {
            notification.error({ message: 'خطا', description: 'خطا در ذخیره دسترسی' });
            // Revert change on error
            setPermissions(prev => ({ ...prev, [key]: !value }));
        }
    };

    if (loading) {
        return <Spin size="large" />;
    }

    return (
        <div>
            <Title level={4}>تنظیم دسترسی‌های کاربر: {permissions.user}</Title>
            <Text type="secondary">{permissions.email}</Text>
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {Object.keys(permissions)
                    .filter(key => typeof permissions[key] === 'boolean')
                    .map(key => (
                        <Col xs={24} sm={12} md={8} key={key}>
                            <Card>
                                <Switch
                                    checked={permissions[key]}
                                    onChange={(checked) => handlePermissionChange(key, checked)}
                                />
                                <span style={{ marginLeft: 8 }}>{key}</span>
                            </Card>
                        </Col>
                ))}
            </Row>
        </div>
    );
};

export default UserPermissions;