// frontend/src/pages/FundStatementPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Typography, Table, Tag, Button, Space, message } from 'antd';
import { ArrowRightOutlined, PrinterOutlined, FileExcelOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// داده‌های نمونه - در یک پروژه واقعی این داده‌ها از سرور (API) گرفته می‌شوند
const sampleFunds = [
    { id: 1, code: '101', name: 'صندوق اصلی', balance: 12250000, currency: 'IRR' },
    { id: 2, code: '102', name: 'صندوق ارزی', balance: 500, currency: 'USD' },
];
// داده‌های نمونه تراکنش‌ها با مقادیر مثبت برای واریز و منفی برای برداشت
const sampleTransactions = [
    { key: 1, date: '1403/05/01', description: 'فروش طبق فاکتور شماره 120', amount: 5000000, currency: 'IRR' },
    { key: 2, date: '1403/05/02', description: 'هزینه خرید ملزومات اداری', amount: -500000, currency: 'IRR' },
    { key: 3, date: '1403/05/03', description: 'واریز توسط مشتری آقای رضایی', amount: 8000000, currency: 'IRR' },
    { key: 4, date: '1403/05/04', description: 'هزینه پیک', amount: -250000, currency: 'IRR' },
];

const FundStatementPage = () => {
    const { code } = useParams();
    const fund = sampleFunds.find(f => f.code === code);

    // الهام از card.vue: تابع چاپ
    const handlePrint = () => {
        message.info('آماده‌سازی برای چاپ...');
        window.print();
    };
    
    // الهام از card.vue: تابع خروجی اکسل (CSV)
    const handleExcelExport = () => {
        message.success('خروجی اکسل (CSV) با موفقیت ایجاد شد.');
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "تاریخ,شرح,بدهکار,بستانکار\n"; // Header
        
        sampleTransactions.forEach(row => {
            const debit = row.amount < 0 ? Math.abs(row.amount) : 0;
            const credit = row.amount > 0 ? row.amount : 0;
            csvContent += `${row.date},"${row.description}",${debit},${credit}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `گردش_صندوق_${fund.name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!fund) {
        return <Title>صندوق یافت نشد!</Title>;
    }

    const columns = [
        { title: 'تاریخ', dataIndex: 'date', key: 'date', align: 'center' },
        { title: 'شرح عملیات', dataIndex: 'description', key: 'description' },
        {
            title: 'بدهکار (برداشت)',
            dataIndex: 'amount',
            key: 'debit',
            align: 'center',
            render: (amount) => (
                amount < 0 ? <Text type="danger">{Math.abs(amount).toLocaleString('fa-IR')}</Text> : '0'
            )
        },
        {
            title: 'بستانکار (واریز)',
            dataIndex: 'amount',
            key: 'credit',
            align: 'center',
            render: (amount) => (
                amount > 0 ? <Text type="success">{amount.toLocaleString('fa-IR')}</Text> : '0'
            )
        }
    ];

    // محاسبه مانده نهایی برای نمایش در فوتر جدول
    const finalBalance = sampleTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <Card>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>گردش حساب: {fund.name}</Title>
                    <Text type="secondary">کد صندوق: {fund.code}</Text>
                </div>
                <Link to="/funds">
                    <Button icon={<ArrowRightOutlined />}>بازگشت به لیست</Button>
                </Link>
            </div>

            <div className="no-print" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={5}>موجودی فعلی: <Tag color={fund.balance >= 0 ? 'success' : 'error'}>{fund.balance.toLocaleString('fa-IR')} {fund.currency}</Tag></Title>
                <Space>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>چاپ گزارش</Button>
                    <Button icon={<FileExcelOutlined />} onClick={handleExcelExport}>خروجی اکسل</Button>
                </Space>
            </div>
            
            <Table
                columns={columns}
                dataSource={sampleTransactions}
                bordered
                pagination={false} // غیرفعال کردن صفحه‌بندی برای گزارش‌ها بهتر است
                summary={() => (
                    <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={2}><Text strong>مانده نهایی</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="center">
                            <Text strong type="danger">
                                {Math.abs(sampleTransactions.filter(t => t.amount < 0).reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString('fa-IR')}
                            </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="center">
                            <Text strong type="success">
                                {sampleTransactions.filter(t => t.amount > 0).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('fa-IR')}
                            </Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </Card>
    );
};

export default FundStatementPage;