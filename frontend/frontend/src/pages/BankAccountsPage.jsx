import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BankAccountsPage.css';

const BankAccountsPage = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // این بخش برای دریافت اطلاعات از سرور است
  useEffect(() => {
    // چون فعلا سرور را نساخته‌ایم، از اطلاعات نمونه استفاده می‌کنیم
    const sampleData = [
      { id: 1, name: 'بانک ملت', owner: 'شرکت زرنگار', accountNumber: '۱۲۳۴۵۶۷۸۹' },
      { id: 2, name: 'بانک ملی', owner: 'شرکت زرنگار', accountNumber: '۹۸۷۶۵۴۳۲۱' },
      { id: 3, name: 'بانک پاسارگاد', owner: 'شرکت زرنگار', accountNumber: '۵۵۵۵۵۵۵۵۵' },
    ];
    setBankAccounts(sampleData);
    setLoading(false);

    /*
    // کد اصلی برای خواندن اطلاعات از سرور واقعی
    axios.get('/api/banks')
      .then(response => {
        setBankAccounts(response.data);
        setLoading(false);
      })
      .catch(err => {
        setError('خطا در دریافت اطلاعات. لطفاً بعداً تلاش کنید.');
        setLoading(false);
        console.error(err);
      });
    */
  }, []);

  const handleRowClick = (id) => {
    navigate(`/bank-accounts/detail/${id}`);
  };
  
  const handleEditClick = (e, id) => {
    e.stopPropagation(); // جلوگیری از کلیک روی کل ردیف
    navigate(`/bank-accounts/edit/${id}`);
  }

  if (loading) {
    return <div className="loading">در حال بارگذاری...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>حساب‌های بانکی</h1>
        <Link to="/bank-accounts/new" className="btn btn-primary">
          + افزودن حساب جدید
        </Link>
      </header>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>نام بانک</th>
              <th>صاحب حساب</th>
              <th>شماره حساب</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {bankAccounts.map((account) => (
              <tr key={account.id} onClick={() => handleRowClick(account.id)}>
                <td>{account.name}</td>
                <td>{account.owner}</td>
                <td>{account.accountNumber}</td>
                <td>
                  <button 
                    className="btn btn-secondary"
                    onClick={(e) => handleEditClick(e, account.id)}
                  >
                    ویرایش
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankAccountsPage;