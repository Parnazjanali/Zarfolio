// frontend/src/components/CustomerList.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List, Avatar, Button, Tag, Space, Modal, Form, Input, Select, Upload, message, Alert, App } from 'antd';
import { UserOutlined, MessageOutlined, EditOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import './CustomerList.css'; 

const { Option } = Select;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ===================================================================
// بخش API: توابع برای تمام ارتباطات با سرور
// ===================================================================

const fetchCustomers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) throw new Error('احراز هویت انجام نشده است. لطفا دوباره وارد شوید.');
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!response.ok) throw new Error('خطا در دریافت لیست مشتریان از سرور');
    return response.json();
};

const updateCustomerAPI = async (customerData) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) throw new Error('احراز هویت انجام نشده است.');
    
    // این تابع اکنون به درستی ID را از آبجکت ورودی می‌خواند
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers/${customerData.ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(customerData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'خطا در ویرایش مشتری' }));
        throw new Error(errorData.message);
    }
    return response.json();
};

// ===================================================================

const CustomerList = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [form] = Form.useForm();

    const { data: customers = [], error, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
    });

    const { mutate: updateCustomer, isLoading: isUpdating } = useMutation({
        mutationFn: updateCustomerAPI,
        onSuccess: () => {
            message.success('مشتری با موفقیت ویرایش شد.');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsEditModalVisible(false);
            setEditingCustomer(null);
        },
        onError: (err) => {
            message.error(`خطا در ویرایش: ${err.message}`);
        },
    });

    const getStatusTag = (status) => {
        if (status === 'active') return <Tag color="success">فعال</Tag>;
        if (status === 'vip') return <Tag color="gold">ویژه</Tag>;
        if (status === 'banned') return <Tag color="error">مسدود</Tag>;
        return <Tag>نا مشخص</Tag>;
    };
    
    const showEditModal = (customer) => {
        setEditingCustomer(customer);
        form.setFieldsValue(customer);
        setIsEditModalVisible(true);
    };

    const handleCancel = () => {
        setIsEditModalVisible(false);
        setEditingCustomer(null);
    };

    // اصلاح شد: handleOk اکنون تابع mutate یعنی updateCustomer را فراخوانی می‌کند
    const handleOk = () => {
        form.validateFields().then(values => {
            // از editingCustomer.ID (حروف بزرگ) استفاده می‌کنیم تا با داده بک‌اند هماهنگ باشد
            updateCustomer({ ID: editingCustomer.ID, ...values });
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleExport = () => {
        if (!customers || customers.length === 0) {
            message.warning('داده‌ای برای خروجی گرفتن وجود ندارد.');
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(customers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
        XLSX.writeFile(workbook, "customers.xlsx");
        message.success('خروجی اکسل با موفقیت ایجاد شد.');
    };

    const uploadProps = {
        name: 'excelFile',
        action: `${API_BASE_URL}/api/v1/crm/customers/import-excel`,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        showUploadList: false,
        accept: ".xlsx, .xls",
        onChange(info) {
            if (info.file.status === 'uploading') {
                setIsUploading(true);
                return;
            }
            if (info.file.status === 'done') {
                setIsUploading(false);
                const response = info.file.response;
                message.success(`${response.successCount} مشتری با موفقیت وارد شد.`);
                if (response.failureCount > 0) {
                    message.warning(`${response.failureCount} ردیف با خطا مواجه شد.`);
                }
                queryClient.invalidateQueries({ queryKey: ['customers'] });
            } else if (info.file.status === 'error') {
                setIsUploading(false);
                const errorMsg = info.file.response?.message || 'خطا در آپلود فایل';
                message.error(`خطا: ${errorMsg}`);
            }
        },
    };

    if (isLoading) {
        return <div>در حال بارگذاری لیست مشتریان...</div>;
    }

    if (error) {
        return <Alert message="خطا در دریافت اطلاعات" description={error.message} type="error" showIcon />;
    }

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />} loading={isUploading}>ورود از اکسل</Button>
                </Upload>
                <Button icon={<DownloadOutlined />} onClick={handleExport}>خروجی اکسل</Button>
            </Space>

            <List
                className="customer-list"
                itemLayout="horizontal"
                dataSource={customers}
                loading={isLoading}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Button type="text" shape="circle" icon={<MessageOutlined />} title="ارسال پیام" />,
                            <Button type="text" shape="circle" icon={<EditOutlined />} title="ویرایش" onClick={() => showEditModal(item)} />,
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={item.avatar} icon={<UserOutlined />} size="large" />}
                            title={<a href="#">{item.name}</a>}
                            description={<div>{item.email}<div style={{ marginTop: '4px' }}>{getStatusTag(item.status)}</div></div>}
                        />
                    </List.Item>
                )}
            />

            <Modal
                title="ویرایش مشتری"
                open={isEditModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={isUpdating}
                okText="ذخیره"
                cancelText="انصراف"
            >
                <Form form={form} layout="vertical" name="edit_customer_form">
                    <Form.Item name="name" label="نام" rules={[{ required: true, message: 'لطفاً نام مشتری را وارد کنید!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="ایمیل" rules={[{ required: true, type: 'email', message: 'لطفاً یک ایمیل معتبر وارد کنید!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label="وضعیت" rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید!' }]}>
                        <Select placeholder="انتخاب وضعیت">
                            <Option value="active">فعال</Option>
                            <Option value="vip">ویژه</Option>
                            <Option value="banned">مسدود</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

const CustomerListWrapper = () => (
    <App>
        <CustomerList />
    </App>
);

export default CustomerListWrapper;