import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography } from '@mui/material';

const data = [
  { name: 'حمل و نقل', value: 400 },
  { name: 'حقوق', value: 300 },
  { name: 'اجاره', value: 300 },
  { name: 'تبلیغات', value: 200 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TopCostCentersChart = () => {
  return (
    <Paper elevation={3} sx={{ padding: '16px' }}>
      <Typography variant="h6" gutterBottom align="center">
        مراکز هزینه
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

export default TopCostCentersChart;