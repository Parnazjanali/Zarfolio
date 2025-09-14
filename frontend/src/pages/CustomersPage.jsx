import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Input, Space, Typography, Alert, Modal, Form, Upload, App, Dropdown, Menu } from 'antd';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { UploadOutlined, DownloadOutlined, EditOutlined, DownOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// تابع برای واکشی لیست مشتریان از سرور
const fetchCustomers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) throw new Error('احراز هویت انجام نشده است. لطفا دوباره وارد شوید.');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `خطای سرور: ${response.status}` }));
        throw new Error(errorData.message || `خطای سرور: ${response.status}`);
    }
    return response.json();
};

// تابع API برای ویرایش مشتری
const updateCustomerAPI = async (customerData) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) throw new Error('احراز هویت انجام نشده است.');
    
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

function CustomersPage() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

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

    const [searchText, setSearchText] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form] = Form.useForm();
    const [isUploading, setIsUploading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const filteredData = customers.filter(customer =>
        (customer.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (customer.familyName?.toLowerCase() || '').includes(searchText.toLowerCase())
    );
    
    const showEditModal = (customer) => {
        setEditingCustomer(customer);
        form.setFieldsValue(customer);
        setIsEditModalVisible(true);
    };

    const handleCancel = () => {
        setIsEditModalVisible(false);
        setEditingCustomer(null);
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            updateCustomer({ ID: editingCustomer.ID, ...values });
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleDownload = async (fileType) => {
        if (customers.length === 0) {
            message.warning('هیچ مشتری برای اکسپورت وجود ندارد.');
            return;
        }

        const endpoint = fileType === 'excel' ? 'export-excel' : 'export-pdf';
        const filename = fileType === 'excel' ? 'customers.xlsx' : 'customers.pdf';
        
        setIsExporting(true);
        message.loading({ content: `در حال آماده‌سازی فایل ${fileType}...`, key: 'export' });

        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'خطا در ساخت فایل در سرور');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            message.success({ content: 'فایل با موفقیت دانلود شد!', key: 'export', duration: 2 });

        } catch (err) {
            message.error({ content: `خطا در دانلود فایل: ${err.message}`, key: 'export', duration: 2 });
        } finally {
            setIsExporting(false);
        }
    };
    
    const uploadProps = {
        name: 'excelFile',
        action: `${API_BASE_URL}/api/v1/crm/customers/import-excel`,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        showUploadList: false,
        onChange(info) {
            if (info.file.status === 'uploading') setIsUploading(true);
            if (info.file.status === 'done') {
                setIsUploading(false);
                const res = info.file.response;
                message.success(`${res.successCount} مشتری با موفقیت اضافه شد.`);
                if (res.failureCount > 0) {
                    message.warning(`${res.failureCount} ردیف با خطا مواجه شد.`);
                    console.warn("ردیف‌های ناموفق:", res.failedRows);
                }
                queryClient.invalidateQueries({ queryKey: ['customers'] });
            } else if (info.file.status === 'error') {
                setIsUploading(false);
                message.error(info.file.response?.message || 'خطا در آپلود فایل');
            }
        },
    };

    const columns = [
        { title: 'کد', dataIndex: 'code', key: 'code', sorter: (a, b) => (a.code || '').localeCompare(b.code || '') },
        { title: 'نام', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'نام خانوادگی', dataIndex: 'familyName', key: 'familyName', sorter: (a, b) => (a.familyName || '').localeCompare(b.familyName || '') },
        { title: 'موبایل', dataIndex: 'mobile', key: 'mobile' },
        { title: 'شناسه ملی', dataIndex: 'shenasemeli', key: 'shenasemeli' },
        {
            title: 'عملیات',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="primary" ghost icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        ویرایش
                    </Button>
                    <Link to={`/customers/${record.ID}`}>
                        <Button>مشاهده جزئیات</Button>
                    </Link>
                </Space>
            ),
        },
    ];

    if (error) return <Alert message="خطا در دریافت اطلاعات" description={error.message} type="error" showIcon />;

    // اضافه شد: منوی دراپ‌داون برای دکمه خروجی
    const exportMenu = (
        <Menu>
            <Menu.Item key="excel" icon={<FaFileExcel />} onClick={() => handleDownload('excel')}>
                خروجی اکسل
            </Menu.Item>
            <Menu.Item key="pdf" icon={<FaFilePdf />} onClick={() => handleDownload('pdf')}>
                خروجی PDF
            </Menu.Item>
        </Menu>
    );

    return (
        <div>
            <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>لیست مشتریان</Title>                
                <Space>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />} loading={isUploading}>ورود از اکسل</Button>
                    </Upload>
                    {/* اصلاح شد: دکمه خروجی به یک منوی دراپ‌داون تبدیل شد */}
                    <Dropdown overlay={exportMenu}>
                        <Button icon={<DownloadOutlined />} loading={isExporting}>
                            خروجی <DownOutlined />
                        </Button>
                    </Dropdown>
                    <Link to="/customers/new">
                        <Button type="primary" icon={<FaPlus />}>مشتری جدید</Button>
                    </Link>
                </Space>
            </Space>
            <Input
                placeholder="جستجو بر اساس نام و نام خانوادگی..."
                prefix={<FaSearch />}
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
                allowClear
            />
            <Table
                columns={columns}
                dataSource={filteredData}
                loading={isLoading}
                rowKey="ID"
                bordered
            />
            <Modal title="ویرایش مشتری" open={isEditModalVisible} onOk={handleOk} onCancel={handleCancel} confirmLoading={isUpdating}>
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="نام" rules={[{ required: true, message: 'لطفاً نام را وارد کنید!' }]}><Input /></Form.Item>
                    <Form.Item name="familyName" label="نام خانوادگی"><Input /></Form.Item>
                    <Form.Item name="nikename" label="نام مستعار"><Input /></Form.Item>
                    <Form.Item name="mobile" label="موبایل"><Input /></Form.Item>
                    <Form.Item name="shenasemeli" label="شناسه ملی"><Input /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

const CustomersPageWrapper = () => (
    <App>
        <CustomersPage />
    </App>
);

export default CustomersPageWrapper;

