import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Typography, Tag, notification } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const UserRolls = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/user/get/users/of/business/' + localStorage.getItem('activeBid'));
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            notification.error({
                message: 'خطا',
                description: 'خطا در دریافت لیست کاربران',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (values) => {
        try {
            const response = await axios.post("/api/business/add/user", {
                'bid': localStorage.getItem('activeBid'),
                'email': values.email
            });
            if (response.data.result === 0) {
                notification.error({ message: 'خطا', description: 'کاربری با این پست الکترونیکی یافت نشد.' });
            } else if (response.data.result === 1) {
                notification.warning({ message: 'توجه', description: 'قبلا این کاربر به کسب و کار افزوده شده است.' });
            } else {
                setUsers([...users, response.data.data]);
                notification.success({ message: 'موفق', description: 'کاربر با موفقیت عضو کسب و کار شد.' });
                form.resetFields();
            }
        } catch (error) {
            notification.error({ message: 'خطا', description: 'خطا در افزودن کاربر' });
        }
    };

    const showDeleteModal = (user) => {
        setUserToDelete(user);
        setIsModalVisible(true);
    };

    const handleDelete = async () => {
        try {
            await axios.post('/api/business/delete/user', {
                'bid': localStorage.getItem('activeBid'),
                'email': userToDelete.email
            });
            setUsers(users.filter(user => user.email !== userToDelete.email));
            notification.success({ message: 'موفق', description: 'کاربر با موفقیت حذف شد.' });
        } catch (error) {
            notification.error({ message: 'خطا', description: 'خطا در حذف کاربر' });
        } finally {
            setIsModalVisible(false);
            setUserToDelete(null);
        }
    };

    const columns = [
        {
            title: '#',
            key: 'index',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'نام / نام خانوادگی',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'پست الکترونیکی',
            dataIndex: 'email',
            key: 'email',
            render: email => <Tag color="blue">{email}</Tag>,
        },
        {
            title: 'شماره موبایل',
            dataIndex: 'mobile',
            key: 'mobile',
            render: mobile => mobile || '-',
        },
        {
            title: 'عملیات',
            key: 'actions',
            render: (text, record) => (
                record.owner !== 1 ? (
                    <Space size="middle">
                        <Button type="primary" ghost href={`/path/to/edit/user/${record.email}`}>ویرایش دسترسی</Button>
                        <Button type="primary" danger ghost onClick={() => showDeleteModal(record)}>حذف</Button>
                    </Space>
                ) : (
                    <Tag color="success">مدیر کل</Tag>
                )
            ),
        },
    ];

    return (
        <div>
            <Title level={4}>افزودن کاربر جدید</Title>
            <Form form={form} layout="inline" onFinish={handleAddUser} style={{ marginBottom: 24 }}>
                <Form.Item
                    name="email"
                    rules={[{ required: true, type: 'email', message: 'لطفا یک ایمیل معتبر وارد کنید' }]}
                    style={{ flex: 1 }}
                >
                    <Input placeholder="پست الکترونیکی کاربر را وارد کنید" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        افزودن
                    </Button>
                </Form.Item>
            </Form>

            <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                rowKey="email"
                bordered
            />

            <Modal
                title="تایید حذف کاربر"
                visible={isModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsModalVisible(false)}
                okText="حذف"
                cancelText="انصراف"
                okButtonProps={{ danger: true }}
            >
                <p>آیا از حذف کاربر "{userToDelete?.name}" اطمینان دارید؟</p>
            </Modal>
        </div>
    );
};

export default UserRolls;