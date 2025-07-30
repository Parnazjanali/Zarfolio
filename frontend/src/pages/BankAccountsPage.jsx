// frontend/src/pages/BankAccountsPage.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { List, Button, Typography, message, Space, Card, Statistic, Row, Col, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, DollarCircleOutlined, EuroCircleOutlined, MoneyCollectOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// داده‌های نمونه
const sampleAccounts = [
  { id: 1, bankName: 'بانک ملت', accountNumber: '1234567890', iban: 'IR123456789012345678901234', balance: 5250000, currency: 'IRR' },
  { id: 2, bankName: 'بانک سامان', accountNumber: '0987654321', iban: 'IR098765432109876543210987', balance: 12300, currency: 'USD' },
  { id: 3, bankName: 'بانک پاسارگاد', accountNumber: '1122334455', iban: 'IR112233445511223344551122', balance: 15000000, currency: 'IRR' },
  { id: 4, bankName: 'حساب ارزی', accountNumber: '9988776655', iban: 'DE12345678901234567890', balance: 8400, currency: 'EUR' },
];

// =============== آبجکت برای مدیریت ظاهر هر واحد پول ===============
const currencyStyles = {
  IRR: { icon: <MoneyCollectOutlined />, color: 'green', name: 'ریال ایران' },
  USD: { icon: <DollarCircleOutlined />, color: 'blue', name: 'دلار آمریکا' },
  EUR: { icon: <EuroCircleOutlined />, color: 'gold', name: 'یورو' },
  DEFAULT: { icon: <MoneyCollectOutlined />, color: 'default', name: '' },
};
// ==============================================================

const BankAccountsPage = () => {
  const [accounts, setAccounts] = useState(sampleAccounts);

  const handleDeleteAccount = (accountIdToDelete) => {
    if (window.confirm("آیا از حذف این حساب بانکی مطمئن هستید؟")) {
      const updatedAccounts = accounts.filter(acc => acc.id !== accountIdToDelete);
      setAccounts(updatedAccounts);
      message.warning('حساب بانکی با موفقیت حذف شد.');
    }
  };

  const totalBalances = useMemo(() => {
    const totals = {};
    accounts.forEach(account => {
      if (totals[account.currency]) {
        totals[account.currency] += account.balance;
      } else {
        totals[account.currency] = account.balance;
      }
    });
    return totals;
  }, [accounts]);

  // تابع برای فرمت کردن اعداد (اضافه کردن کاما)
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>مدیریت حساب‌های بانکی</Title>
        <Link to="/bank-accounts/new">
          <Button type="primary" icon={<PlusOutlined />}>
            افزودن حساب جدید
          </Button>
        </Link>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
        dataSource={accounts}
        renderItem={item => (
          <List.Item>
            <Card
              hoverable
              actions={[
                <Link to={`/bank-accounts/edit/${item.id}`}><Button type="text" icon={<EditOutlined />} key="edit">ویرایش</Button></Link>,
                <Button type="text" danger icon={<DeleteOutlined />} key="delete" onClick={() => handleDeleteAccount(item.id)}>حذف</Button>
              ]}
            >
              <Statistic
                title={item.bankName}
                value={formatNumber(item.balance)} // استفاده از تابع فرمت‌کننده
                precision={0}
                suffix={<Tag color={(currencyStyles[item.currency] || currencyStyles.DEFAULT).color} style={{ marginLeft: 8 }}>{item.currency}</Tag>}
              />
              <Paragraph copyable={{ text: item.accountNumber }} style={{ marginTop: '16px', marginBottom: '8px' }}>
                <Text type="secondary">شماره حساب: {item.accountNumber}</Text>
              </Paragraph>
              <Paragraph copyable={{ text: item.iban }}>
                <Text type="secondary">شماره شبا: {item.iban}</Text>
              </Paragraph>
            </Card>
          </List.Item>
        )}
      />

      {/* ========== بخش جدید و بهینه‌شده جمع کل موجودی‌ها ========== */}
      <div style={{ marginTop: '40px' }}>
        <Title level={3} style={{ marginBottom: '20px' }}>جمع کل موجودی‌ها</Title>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={Object.keys(totalBalances)}
          renderItem={currency => {
            const style = currencyStyles[currency] || currencyStyles.DEFAULT;
            return (
              <List.Item>
                <Card bordered={false} style={{ background: '#f9f9f9', textAlign: 'center' }}>
                    <Statistic
                        title={
                            <Space>
                                {style.icon}
                                {style.name}
                            </Space>
                        }
                        value={formatNumber(totalBalances[currency])}
                        valueStyle={{ color: style.color, fontSize: '2em' }}
                        suffix={<Tag style={{ marginLeft: 8 }}>{currency}</Tag>}
                    />
                </Card>
              </List.Item>
            );
          }}
        />
      </div>
      {/* ============================================================== */}
    </div>
  );
};

export default BankAccountsPage;