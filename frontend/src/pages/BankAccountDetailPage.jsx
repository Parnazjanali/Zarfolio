import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './BankAccountDetailPage.css'; // فایل استایل

const BankAccountDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // استفاده از اطلاعات نمونه چون سرور را نساخته‌ایم
        const sampleAccount = { 
            id: 1, 
            name: 'بانک ملت', 
            owner: 'شرکت زرنگار', 
            accountNumber: '۱۲۳۴۵۶۷۸۹', 
            cardNumber: '۶۱۰۴-۳۳۷۷-۱۲۳۴-۵۶۷۸', 
            shabaNumber: 'IR123456789012345678901234', 
            branch: 'شعبه مرکزی', 
            balance: '۱۲۵,۴۵۰,۰۰۰ ریال' 
        };
        const sampleTransactions = [
            { id: 101, date: '۱۴۰۲/۱۲/۰۵', type: 'واریز', amount: '۵۰,۰۰۰,۰۰۰', description: 'واریز حقوق ماهانه' },
            { id: 102, date: '۱۴۰۲/۱۲/۰۷', type: 'برداشت', amount: '۲,۵۰۰,۰۰۰', description: 'خرید تجهیزات اداری' },
            { id: 103, date: '۱۴۰۲/۱۲/۱۰', type: 'واریز', amount: '۸۰,۰۰۰,۰۰۰', description: 'پرداخت از مشتری شماره ۷۴' },
            { id: 104, date: '۱۴۰۲/۱۲/۱۱', type: 'برداشت', amount: '۱,۱۲۰,۰۰۰', description: 'پرداخت قبض اینترنت' },
        ];

        setAccount(sampleAccount);
        setTransactions(sampleTransactions);
        setLoading(false);
    }, [id]);

    if (loading) {
        return <div className="loading">در حال بارگذاری...</div>;
    }

    if (!account) {
        return <div className="error">حساب بانکی یافت نشد.</div>;
    }

    return (
        <div className="detail-page-container">
            <header className="page-header">
                <h1>جزئیات حساب: {account.name}</h1>
                <div>
                    <button className="btn btn-secondary" onClick={() => navigate(`/bank-accounts/edit/${id}`)}>ویرایش</button>
                    <Link to="/bank-accounts" className="btn btn-default">بازگشت به لیست</Link>
                </div>
            </header>

            <div className="account-details-card">
                <h2>اطلاعات حساب</h2>
                <div className="details-grid">
                    <p><strong>صاحب حساب:</strong> {account.owner}</p>
                    <p><strong>شماره حساب:</strong> {account.accountNumber}</p>
                    <p><strong>شماره کارت:</strong> {account.cardNumber}</p>
                    <p><strong>شماره شبا:</strong> {account.shabaNumber}</p>
                    <p><strong>شعبه:</strong> {account.branch}</p>
                    <p><strong>موجودی فعلی:</strong> {account.balance}</p>
                </div>
            </div>

            <div className="transactions-card">
                <h2>لیست تراکنش‌ها</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>تاریخ</th>
                            <th>نوع</th>
                            <th>مبلغ (ریال)</th>
                            <th>توضیحات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id}>
                                <td>{tx.date}</td>
                                <td className={tx.type === 'واریز' ? 'deposit' : 'withdrawal'}>{tx.type}</td>
                                <td>{tx.amount}</td>
                                <td>{tx.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BankAccountDetailPage;