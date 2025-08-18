import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography } from '@mui/material';

const data = [
  { name: 'کالای الف', 'تعداد فروش': 4000 },
  { name: 'کالای ب', 'تعداد فروش': 3000 },
  { name: 'کالای ج', 'تعداد فروش': 2000 },
  { name: 'کالای د', 'تعداد فروش': 2780 },
  { name: 'کالای ه', 'تعداد فروش': 1890 },
];

const TopCommoditiesChart = () => {
  return (
    <Paper elevation={3} sx={{ padding: '16px', direction: 'rtl' }}>
      <Typography variant="h6" gutterBottom>
        کالاهای پرفروش
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip wrapperStyle={{ direction: 'rtl' }}/>
          <Legend />
          <Bar dataKey="تعداد فروش" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default TopCommoditiesChart;