// frontend/src/components/SalesChart.jsx

import React from 'react';
import { Card, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title } = Typography;

// این داده‌ها به عنوان نمونه هستند و در آینده از سرور دریافت خواهند شد
const salesData = [
  { name: 'شنبه', "فروش": 4000000 },
  { name: 'یکشنبه', "فروش": 3000000 },
  { name: 'دوشنبه', "فروش": 2000000 },
  { name: 'سه‌شنبه', "فروش": 2780000 },
  { name: 'چهارشنبه', "فروش": 1890000 },
  { name: 'پنجشنبه', "فروش": 2390000 },
  { name: 'جمعه', "فروش": 3490000 },
];

const SalesChart = () => {
  return (
    <Card>
      <Title level={5}>روند فروش هفتگی</Title>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={salesData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => new Intl.NumberFormat('fa-IR').format(value) + ' تومان'} />
          <Legend />
          <Line type="monotone" dataKey="فروش" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SalesChart;