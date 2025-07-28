// frontend/src/components/AdvancedFilter.jsx
import React from 'react';
import { Card, Row, Col, Form, Input, Select, Button, DatePicker } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdvancedFilter = ({ onFilter }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    // تابع onFilter را با مقادیر فرم فراخوانی می‌کنیم
    onFilter(values);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({}); // فیلترها را پاک می‌کنیم
  };

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="searchTerm" label="جستجو در نام یا شماره">
              <Input placeholder="مثلاً نام مشتری یا شماره فاکتور" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="status" label="وضعیت">
              <Select placeholder="انتخاب وضعیت" allowClear>
                <Option value="paid">پرداخت شده</Option>
                <Option value="pending">در انتظار پرداخت</Option>
                <Option value="overdue">سررسید گذشته</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="dateRange" label="بازه تاریخی">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              اعمال فیلتر
            </Button>
            <Button style={{ margin: '0 8px' }} onClick={handleReset} icon={<ClearOutlined />}>
              پاک کردن فیلترها
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default AdvancedFilter;