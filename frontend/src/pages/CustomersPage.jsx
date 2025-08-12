import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// 'message' از ایمپورت اصلی حذف و 'App' اضافه شده است
import { Table, Button, Input, Space, Typography, Alert, Modal, Form, Upload, App } from 'antd';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { UploadOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title } = Typography;

// ۱. تابع دریافت داده‌ها از بک‌اند شما
const fetchCustomers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('برای دسترسی به این بخش، لطفا ابتدا وارد شوید.');
    }
    
    // ⭐ آدرس API Gateway برای دریافت لیست مشتریان
    const API_BASE_URL = 'http://localhost:8080'; 
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `خطای سرور: ${response.status}` }));
        throw new Error(errorData.message || `خطای سرور: ${response.status}`);
    }
    
    return response.json();
};

// ۲. تابع ارسال داده‌ها به بک‌اند برای ذخیره‌سازی
const createCustomersBatch = async (newCustomers) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('برای دسترسی به این بخش، لطفا ابتدا وارد شوید.');
    }

    const API_BASE_URL = 'http://localhost:8080';
    const response = await fetch(`${API_BASE_URL}/api/v1/crm/customers/import-excel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(newCustomers),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `خطای سرور: ${response.status}` }));
        throw new Error(errorData.message || `خطای سرور: ${response.status}`);
    }

    // بررسی اینکه آیا پاسخ محتوایی برای پردازش دارد یا خیر
    const responseText = await response.text();
    if (responseText) {
        try {
            return JSON.parse(responseText);
        } catch (e) {
            // اگر پاسخ JSON معتبر نباشد، متن پاسخ را به عنوان پیام برمی‌گردانیم
            return { message: responseText };
        }
    }

    // اگر پاسخ موفقیت‌آمیز بود اما بدنه خالی داشت
    return { message: 'مشتریان با موفقیت وارد شدند.' };
};

function CustomersPage() {
    // ✅ استفاده از هوک useApp برای دریافت نمونه message
    const { message } = App.useApp();

    const { data: customers = [], error, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: fetchCustomers,
        staleTime: 5 * 60 * 1000,
    });

    const queryClient = useQueryClient();

    const { mutate: createCustomers, isLoading: isCreating } = useMutation({
        mutationFn: createCustomersBatch,
        onSuccess: (data) => {
            message.success(data.message || 'مشتریان جدید با موفقیت در پایگاه داده ذخیره شدند.');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onError: (error) => {
            message.error(`خطا در ذخیره مشتریان: ${error.message}`);
        },
    });

    const [searchText, setSearchText] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form] = Form.useForm();
    const [excelData, setExcelData] = useState([]);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

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

    const handleOk = () => {
        form.validateFields().then(values => {
            const updatedCustomers = customers.map(c =>
                c.ID === editingCustomer.ID ? { ...c, ...values } : c
            );
            setCustomers(updatedCustomers);
            setIsEditModalVisible(false);
            setEditingCustomer(null);
            message.success('مشتری با موفقیت ویرایش شد. (تغییرات موقتی است)');
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

    const handleConfirmImport = async () => {
        if (excelData.length > 0) {
            try {
                await createCustomers(excelData);
                // پیام موفقیت از طریق `onSuccess` در `useMutation` نمایش داده می‌شود.
                setIsConfirmModalVisible(false);
                setExcelData([]);
            } catch (error) {
                // خطا نیز از طریق `onError` در `useMutation` مدیریت می‌شود.
                // در صورت نیاز می‌توانید مدیریت خطای بیشتری در اینجا اضافه کنید.
                console.error("خطا در ارسال دسته‌ای مشتریان:", error);
            }
        } else {
            setIsConfirmModalVisible(false);
        }
    };

    const uploadProps = {
        name: 'file',
        accept: ".xlsx, .xls",
        showUploadList: false,
        beforeUpload: file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);

                    const existingCodes = new Set(customers.map(c => c.code).filter(Boolean));
                    const existingShenasemeli = new Set(customers.map(c => c.shenasemeli).filter(c => c && c.toString().trim() !== ''));

                    const customersToCreate = [];
                    const duplicates = [];

                    json.forEach(item => {
                        const code = item.code ? item.code.toString().trim() : null;
                        const shenasemeli = item.shenasemeli ? item.shenasemeli.toString().trim() : null;

                        const isDuplicate = (code && existingCodes.has(code)) || (shenasemeli && shenasemeli !== '' && existingShenasemeli.has(shenasemeli));

                        if (isDuplicate) {
                            duplicates.push(item);
                        } else if (item.name && item.familyName) {
                            customersToCreate.push({
                                name: item.name,
                                familyName: item.familyName,
                                nikename: item.nikename || item.name,
                                code: code,
                                shenasemeli: shenasemeli,
                            });
                        }
                    });

                    if (duplicates.length > 0) {
                        message.warning(`${duplicates.length} مشتری به دلیل کد یا شناسه ملی تکراری، وارد نشدند.`);
                    }

                    if (customersToCreate.length > 0) {
                        setExcelData(customersToCreate);
                        setIsConfirmModalVisible(true);
                    } else if (duplicates.length === 0) {
                        message.info('هیچ مشتری جدیدی برای افزودن یافت نشد.');
                    }

                } catch (error) {
                    message.error('خطا در پردازش فایل اکسل. لطفاً از صحت ساختار فایل (ستون‌های name, familyName, code, shenasemeli) مطمئن شوید.');
                    console.error("Error processing excel file:", error);
                }
            };
            reader.readAsArrayBuffer(file);
            return false;
        }
    };

    const columns = [
        { title: 'شناسه', dataIndex: 'ID', key: 'ID', sorter: (a, b) => a.ID - b.ID },
        { title: 'کد مشتری', dataIndex: 'code', key: 'code' },
        { title: 'نام مستعار', dataIndex: 'nikename', key: 'nikename', sorter: (a, b) => a.nikename.localeCompare(b.nikename) },
        { title: 'نام', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'نام خانوادگی', dataIndex: 'familyName', key: 'familyName', sorter: (a, b) => (a.familyName || '').localeCompare(b.familyName || '') },
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
                        <Button icon={<UploadOutlined />} loading={isCreating}>ورود از اکسل</Button>
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
                placeholder="جستجو بر اساس نام، نام خانوادگی، کد ملی یا کد مشتری..."
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
            <Modal title="ویرایش مشتری" open={isEditModalVisible} onOk={handleOk} onCancel={handleCancel} okText="ذخیره" cancelText="انصراف">
                <Form form={form} layout="vertical" name="edit_customer_form">
                    <Form.Item name="name" label="نام" rules={[{ required: true, message: 'لطفاً نام را وارد کنید!' }]}><Input /></Form.Item>
                    <Form.Item name="familyName" label="نام خانوادگی"><Input /></Form.Item>
                    <Form.Item name="nikename" label="نام مستعار"><Input /></Form.Item>
                    <Form.Item name="code" label="کد مشتری"><Input /></Form.Item>
                    <Form.Item name="shenasemeli" label="کد ملی"><Input /></Form.Item>
                </Form>
            </Modal>
            <Modal
                title="تایید ورود اطلاعات از اکسل"
                open={isConfirmModalVisible}
                onOk={handleConfirmImport}
                onCancel={() => {
                    setIsConfirmModalVisible(false);
                    setExcelData([]);
                }}
                okText="تایید و ذخیره"
                cancelText="انصراف"
                confirmLoading={isCreating}
            >
                <p><b>{excelData.length}</b> مشتری جدید آماده اضافه شدن است. آیا تایید می‌کنید؟</p>
                <Table
                    size="small"
                    columns={[
                        { title: 'نام', dataIndex: 'name', key: 'name' },
                        { title: 'نام خانوادگی', dataIndex: 'familyName', key: 'familyName' },
                        { title: 'کد مشتری', dataIndex: 'code', key: 'code' },
                        { title: 'کد ملی', dataIndex: 'shenasemeli', key: 'shenasemeli' },
                    ]}
                    dataSource={excelData}
                    rowKey={(record, index) => index}
                    pagination={{ pageSize: 5 }}
                />
            </Modal>
        </div>
    );
}

// ✅ یک کامپوننت Wrapper برای فراهم کردن Context لازم از Ant Design
const CustomersPageWrapper = () => (
    <App>
        <CustomersPage />
    </App>
);

export default CustomersPageWrapper;