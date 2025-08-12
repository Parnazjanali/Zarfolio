// frontend/src/components/CustomerList.jsx
import React, { useState } from 'react';
import { List, Avatar, Button, Tag, Space, Modal, Form, Input, Select, Upload, message } from 'antd';
import { UserOutlined, MessageOutlined, EditOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import './CustomerList.css'; // فایل استایل سفارشی

const { Option } = Select;

// داده‌های نمونه
const initialCustomers = [
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
    avatar: '',
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
  const [customers, setCustomers] = useState(initialCustomers);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  const getStatusTag = (status) => {
    if (status === 'active') return <Tag color="success">فعال</Tag>;
    if (status === 'vip') return <Tag color="gold">ویژه</Tag>;
    if (status === 'banned') return <Tag color="error">مسدود</Tag>;
    return <Tag>نا مشخص</Tag>;
  };

  // تابع برای نمایش مودال ویرایش
  const showEditModal = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer); // پر کردن فرم با اطلاعات مشتری
    setIsEditModalVisible(true);
  };

  // تابع برای بستن مودال ویرایش
  const handleCancel = () => {
    setIsEditModalVisible(false);
    setEditingCustomer(null);
  };

  // تابع برای ذخیره تغییرات ویرایش
  const handleOk = () => {
    form.validateFields().then(values => {
      const updatedCustomers = customers.map(c => 
        c.id === editingCustomer.id ? { ...c, ...values } : c
      );
      setCustomers(updatedCustomers);
      setIsEditModalVisible(false);
      setEditingCustomer(null);
      message.success('مشتری با موفقیت ویرایش شد!');
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  // تابع برای خروجی گرفتن به اکسل
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(customers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
    message.success('خروجی اکسل با موفقیت ایجاد شد.');
  };

  // تنظیمات مربوط به آپلود فایل اکسل
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

          // پیدا کردن بزرگترین id موجود برای تولید id های جدید
          const maxId = customers.reduce((max, c) => c.id > max ? c.id : max, 0);

          const newCustomers = json.map((item, index) => ({
            id: maxId + index + 1,
            name: item.name || 'بدون نام',
            email: item.email || 'بدون ایمیل',
            status: item.status || 'active',
            avatar: '',
          }));

          setCustomers(prev => [...prev, ...newCustomers]);
          message.success(`${newCustomers.length} مشتری جدید با موفقیت از فایل اکسل وارد شد.`);
        } catch (error) {
          message.error('خطا در پردازش فایل اکسل. لطفاً از صحت ساختار فایل مطمئن شوید.');
          console.error("Error processing excel file:", error);
        }
      };
      reader.readAsArrayBuffer(file);
      return false; // جلوگیری از آپلود خودکار
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>ورود از اکسل</Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>خروجی اکسل</Button>
      </Space>

      <List
        className="customer-list"
        itemLayout="horizontal"
        dataSource={customers}
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

      <Modal title="ویرایش مشتری" visible={isEditModalVisible} onOk={handleOk} onCancel={handleCancel} okText="ذخیره" cancelText="انصراف">
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

export default CustomerList;