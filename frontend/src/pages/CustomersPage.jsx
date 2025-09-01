import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Input, Space, Typography, Alert, Modal, Form, Upload, App } from 'antd';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { UploadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ===================================================================
// بخش API: توابع برای تمام ارتباطات با سرور
// ===================================================================

const fetchCustomers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) throw new Error('برای دسترسی به این بخش، لطفا ابتدا وارد شوید.');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `خطای سرور: ${response.status}` }));
        throw new Error(errorData.message || `خطای سرور: ${response.status}`);
    }
    return response.json();
};

// اضافه شد: تابع API برای ویرایش مشتری
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

// ===================================================================


function CustomersPage() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const { data: customers = [], error, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
        staleTime: 5 * 60 * 1000,
    });

    // اضافه شد: تعریف useMutation برای ویرایش مشتری
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
    
    const filteredData = customers.filter(customer =>
        (customer.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (customer.familyName?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (customer.shenasemeli?.toString() || '').includes(searchText) ||
        (customer.code?.toLowerCase() || '').includes(searchText.toLowerCase())
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
        if (filteredData.length === 0) {
            message.warning('داده‌ای برای خروجی گرفتن وجود ندارد.');
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
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
        accept: ".xlsx, .xls",
        showUploadList: false,
        onChange(info) {
            if (info.file.status === 'uploading') {
                setIsUploading(true);
                return;
            }
            if (info.file.status === 'done') {
                setIsUploading(false);
                const response = info.file.response;
                message.success(`${response.successCount} مشتری با موفقیت اضافه شد.`);
                if (response.failureCount > 0) {
                    message.warning(`${response.failureCount} ردیف با خطا مواجه شد. برای جزئیات کنسول را ببینید.`);
                    console.warn("ردیف‌های ناموفق:", response.failedRows);
                }
                queryClient.invalidateQueries({ queryKey: ['customers'] });
            } else if (info.file.status === 'error') {
                setIsUploading(false);
                const errorMsg = info.file.response?.message || 'خطا در آپلود فایل';
                message.error(`خطا: ${errorMsg}`);
                console.error("خطای آپلود:", info.file.response);
            }
        },
    };

    const columns = [
        { title: 'شناسه', dataIndex: 'ID', key: 'ID', sorter: (a, b) => a.ID - b.ID },
        { title: 'کد مشتری', dataIndex: 'code', key: 'code' },
        { title: 'نام مستعار', dataIndex: 'nikename', key: 'nikename' },
        { title: 'نام', dataIndex: 'name', key: 'name' },
        { title: 'نام خانوادگی', dataIndex: 'familyName', key: 'familyName' },
        { title: 'کد ملی', dataIndex: 'shenasemeli', key: 'shenasemeli' },
        {
            title: 'عملیات',
            key: 'actions',
            render: (text, record) => (
                <Space>
                    <Button type="primary" ghost icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        ویرایش
                    </Button>
                    <Link to={`/customer/${record.ID}`}>
                        <Button>مشاهده جزئیات</Button>
                    </Link>
                </Space>
            ),
        },
    ];

    if (error) {
        return <Alert message="خطا در دریافت اطلاعات" description={error.message} type="error" showIcon />;
    }

    return (
        <div>
            <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>لیست طرف حساب‌ها و مشتریان</Title>                
                <Space>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />} loading={isUploading}>ورود از اکسل</Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>خروجی اکسل</Button>
                    <Link to="/customers/new">
                        <Button type="primary" icon={<FaPlus style={{ marginLeft: 8 }} />}>
                            مشتری جدید
                        </Button>
                    </Link>
                </Space>
            </Space>
            <Input
                placeholder="جستجو..."
                prefix={<FaSearch style={{ color: 'rgba(0,0,0,.25)' }} />}
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
                pagination={{ pageSize: 10 }}
            />
            <Modal 
                title="ویرایش مشتری" 
                open={isEditModalVisible} 
                onOk={handleOk} 
                onCancel={handleCancel}
                confirmLoading={isUpdating} // اضافه شد: نمایش لودینگ هنگام ذخیره
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="نام" rules={[{ required: true, message: 'لطفاً نام را وارد کنید!' }]}><Input /></Form.Item>
                    <Form.Item name="familyName" label="نام خانوادگی"><Input /></Form.Item>
                    <Form.Item name="nikename" label="نام مستعار"><Input /></Form.Item>
                    <Form.Item name="code" label="کد مشتری"><Input /></Form.Item>
                    <Form.Item name="shenasemeli" label="کد ملی"><Input /></Form.Item>
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
