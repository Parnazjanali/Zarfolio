import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography } from '@mui/material';

const data = [
    { name: 'فروش محصول اصلی', value: 1200 },
    { name: 'خدمات پس از فروش', value: 500 },
    { name: 'نمایندگی‌ها', value: 800 },
];
const COLORS = ['#82ca9d', '#ffc658', '#8884d8'];

const TopIncomeCentersChart = () => {
  return (
    <Paper elevation={3} sx={{ padding: '16px' }}>
        <Typography variant="h6" gutterBottom align="center">
            مراکز درآمد
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => entry.name}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip wrapperStyle={{ direction: 'rtl' }}/>
            </PieChart>
        </ResponsiveContainer>
    </Paper>
  );
};

export default TopIncomeCentersChart;