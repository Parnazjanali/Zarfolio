// src/pages/settings/PriceBoardPage.jsx
import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const PriceBoardPage = () => {
  return (
    <Card>
      <Title level={2}>تابلوی قیمت</Title>
      <Paragraph>
        این صفحه برای مدیریت و نمایش تابلوی قیمت محصولات و خدمات شما در نظر گرفته شده است.
        محتوای اصلی این بخش در مراحل بعدی پیاده‌سازی خواهد شد.
      </Paragraph>
    </Card>
  );
};

export default PriceBoardPage;