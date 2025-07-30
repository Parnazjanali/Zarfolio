// frontend/src/pages/BankAccountStatementPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Select,
  Row,
  Col,
  Typography,
  Space,
  Descriptions,
  Tag,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// داده‌های نمونه
const sampleBankAccounts = [
  { id: 1, code: '101', name: 'بانک ملت (شعبه مرکزی)', owner: 'شرکت زرنگار', cardNumber: '6104337712345678', shaba: 'IR123456789012345678901234', balance: 5250000, currency: 'IRR' },
  { id: 2, code: '102', name: 'بانک سامان (حساب ارزی)', owner: 'شرکت زرنگار', cardNumber: '6219861012345678', shaba: 'IR098765432109876543210987', balance: 12300, currency: 'USD' },
  { id: 3, code: '103', name: 'بانک پاسارگاد', owner: 'شرکت زرنگار', cardNumber: '5022291012345678', shaba: 'IR112233445511223344551122', balance: 15000000, currency: 'IRR' },
];

const sampleTransactions = {
  '101': [
    { key: '1', date: '1403/05/01', description: 'واریز حقوق', ref: 'شخصی', credit: 5000000, debit: 0, balance: 5000000 },
    { key: '2', date: '1403/05/03', description: 'خرید تجهیزات', ref: 'هزینه', credit: 0, debit: 1200000, balance: 3800000 },
    { key: '3', date: '1403/05/05', description: 'پرداخت مشتری', ref: 'مشتری ویژه', credit: 2650000, debit: 0, balance: 6450000 },
    { key: '4', date: '1402/11/20', description: 'پرداخت قدیمی', ref: 'مشتری قدیمی', credit: 1000000, debit: 0, balance: 5450000 },
  ],
  '102': [
    { key: '1', date: '1403/04/15', description: 'دریافت از مشتری خارجی', ref: 'صادرات', credit: 15000, debit: 0, balance: 15000 },
    { key: '2', date: '1403/04/20', description: 'هزینه حواله', ref: 'کارمزد', credit: 0, debit: 2700, balance: 12300 },
  ],
  '103': [],
};


const BankAccountStatementPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    setLoading(true);
    const accountCode = code || (sampleBankAccounts[0] ? sampleBankAccounts[0].code : null);
    if (accountCode) {
      const account = sampleBankAccounts.find(acc => acc.code === accountCode);
      setSelectedAccount(account);
      setTransactions(sampleTransactions[accountCode] || []);
    }
    setLoading(false);
  }, [code]);

  const filteredTransactions = useMemo(() => {
    if (!dateRange) return transactions;
    const [startDate, endDate] = dateRange;
    return transactions.filter(t => {
      const transactionDate = t.date.replace(/\//g, '');
      const start = startDate.format('YYYYMMDD');
      const end = endDate.format('YYYYMMDD');
      return transactionDate >= start && transactionDate <= end;
    });
  }, [transactions, dateRange]);

  const { totalCredit, totalDebit } = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      acc.totalCredit += curr.credit;
      acc.totalDebit += curr.debit;
      return acc;
    }, { totalCredit: 0, totalDebit: 0 });
  }, [filteredTransactions]);

  const handleAccountChange = (newCode) => {
    navigate(`/reports/bank-statement/${newCode}`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.addFont('Vazirmatn-Regular.ttf', 'Vazirmatn', 'normal');
    doc.setFont('Vazirmatn');
    doc.text(`گردش حساب: ${selectedAccount.name}`, 14, 15);
    
    const tableColumn = ["مانده", "برداشت", "واریز", "تفضیل", "شرح", "تاریخ"];
    const tableRows = [];

    filteredTransactions.forEach(item => {
      const rowData = [
        item.balance.toLocaleString('fa-IR'),
        item.debit > 0 ? item.debit.toLocaleString('fa-IR') : '-',
        item.credit > 0 ? item.credit.toLocaleString('fa-IR') : '-',
        item.ref,
        item.description,
        item.date,
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn], body: tableRows, startY: 20,
      styles: { font: 'Vazirmatn', halign: 'center' },
      headStyles: { fillColor: [22, 160, 133] },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    doc.save(`گردش حساب ${selectedAccount.name}.pdf`);
  };
  
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions.map(t => ({
      'تاریخ': t.date, 'شرح': t.description, 'تفضیل': t.ref,
      'واریز': t.credit, 'برداشت': t.debit, 'مانده': t.balance,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "گردش حساب");
    XLSX.writeFile(workbook, `گردش حساب ${selectedAccount.name}.xlsx`);
  };

  const transactionColumns = [
    { title: 'تاریخ', dataIndex: 'date', key: 'date', align: 'center' },
    { title: 'شرح', dataIndex: 'description', key: 'description', align: 'right' },
    { title: 'تفضیل', dataIndex: 'ref', key: 'ref', align: 'center' },
    { title: 'واریز (بستانکار)', dataIndex: 'credit', key: 'credit', align: 'center', render: (text) => text > 0 ? <Text type="success">{text.toLocaleString('fa-IR')}</Text> : '-' },
    { title: 'برداشت (بدهکار)', dataIndex: 'debit', key: 'debit', align: 'center', render: (text) => text > 0 ? <Text type="danger">{text.toLocaleString('fa-IR')}</Text> : '-' },
    { title: 'مانده', dataIndex: 'balance', key: 'balance', align: 'center', render: (text) => <Text strong>{text.toLocaleString('fa-IR')}</Text> },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col><Title level={3} style={{ margin: 0 }}>گردش حساب بانک</Title></Col>
        <Col>
          <Space>
            <Tooltip title="خروجی PDF"><Button type="primary" danger icon={<FilePdfOutlined />} onClick={handleExportPDF} /></Tooltip>
            <Tooltip title="خروجی Excel"><Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ background: '#52c41a', borderColor: '#52c41a' }} /></Tooltip>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')}>بازگشت به گزارشات</Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: '24px' }}>
        {/* ========== چیدمان جدید فیلترها ========== */}
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Text>انتخاب حساب بانکی:</Text>
            <Select showSearch value={selectedAccount?.code} onChange={handleAccountChange} loading={loading} style={{ width: '100%', marginTop: '8px' }} placeholder="یک حساب را انتخاب کنید" suffixIcon={<SearchOutlined />}>
              {sampleBankAccounts.map(acc => (<Option key={acc.code} value={acc.code}>{acc.name}</Option>))}
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <Text>بازه زمانی:</Text>
            <RangePicker onChange={(dates) => setDateRange(dates)} style={{ width: '100%', marginTop: '8px' }} />
          </Col>
        </Row>
        
        {selectedAccount && (
          <Row style={{ marginTop: '20px' }}>
            <Col span={24}>
              <Descriptions size="small" bordered column={2}>
                <Descriptions.Item label="صاحب حساب">{selectedAccount.owner}</Descriptions.Item>
                <Descriptions.Item label="مانده فعلی">
                  <Tag color={selectedAccount.balance >= 0 ? 'green' : 'red'}>{Math.abs(selectedAccount.balance).toLocaleString('fa-IR')} {selectedAccount.currency}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        )}
        {/* ========================================= */}
      </Card>

      <Table
        columns={transactionColumns}
        dataSource={filteredTransactions}
        loading={loading}
        bordered
        title={() => `تراکنش‌های حساب: ${selectedAccount?.name || ''}`}
        rowKey="key"
        summary={() => (
          <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
            <Table.Summary.Cell index={0} colSpan={3} align="center">جمع کل</Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="center"><Text type="success">{totalCredit.toLocaleString('fa-IR')}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="center"><Text type="danger">{totalDebit.toLocaleString('fa-IR')}</Text></Table.Summary.Cell>
            <Table.Summary.Cell index={5}></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </div>
  );
};

export default BankAccountStatementPage;