// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import ReleaseNotesModal from '../components/ReleaseNotesModal'; // Import the modal
import {
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaTag,
  FaFileInvoiceDollar, FaUserPlus, FaChartPie, FaCog
} from 'react-icons/fa';

function DashboardPage({ isSidebarCollapsed }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    const shouldShow = localStorage.getItem('showReleaseNotes');
    if (shouldShow === 'true') {
      setShowReleaseNotes(true);
      localStorage.removeItem('showReleaseNotes'); // Show only once per login
    }
  }, []);

  const handleCloseReleaseNotes = () => {
    setShowReleaseNotes(false);
  };

  const summaryData = {
    goldBalance: 1250.75,
    estimatedValue: 4500000000,
    todayInvoices: 5,
    lastGoldPrice: 3850000,
  };

  const recentTransactions = [
    { id: 1, type: 'فروش', date: '۱۴۰۳/۰۳/۰۵', amount: '۵۰ گرم', customer: 'جناب آقای رضایی' },
    { id: 2, type: 'خرید', date: '۱۴۰۳/۰۳/۰۴', amount: '۲ سکه تمام', customer: 'سرکار خانم محمدی' },
    { id: 3, type: 'فروش', date: '۱۴۰۳/۰۳/۰۳', amount: '۱۵.۵ گرم طلای ۱۸', customer: 'جواهری نگین' },
  ];

  return (
    <>
      {showReleaseNotes && <ReleaseNotesModal onClose={handleCloseReleaseNotes} />}
      <div className={`dashboard-page-content ${showReleaseNotes ? 'content-blurred' : ''}`}>
        <main className="dashboard-main-content">
          <section className={`summary-cards-section ${isSidebarCollapsed ? 'sidebar-is-collapsed' : 'sidebar-is-expanded'}`}>
            <div className="summary-card">
              <div className="card-icon-container gold"><FaBalanceScale className="card-icon" /></div>
              <div className="card-content"><h3>موجودی کل طلا</h3><p>{summaryData.goldBalance.toLocaleString('fa-IR')} گرم</p></div>
            </div>
            <div className="summary-card">
              <div className="card-icon-container value"><FaMoneyBillWave className="card-icon" /></div>
              <div className="card-content"><h3>ارزش تخمینی موجودی</h3><p>{summaryData.estimatedValue.toLocaleString('fa-IR')} ریال</p></div>
            </div>
            <div className="summary-card">
              <div className="card-icon-container invoices"><FaFileAlt className="card-icon" /></div>
              <div className="card-content"><h3>فاکتورهای امروز</h3><p>{summaryData.todayInvoices.toLocaleString('fa-IR')}</p></div>
            </div>
            <div className="summary-card">
              <div className="card-icon-container price"><FaTag className="card-icon" /></div>
              <div className="card-content"><h3>آخرین قیمت طلا (هر گرم)</h3><p>{summaryData.lastGoldPrice.toLocaleString('fa-IR')} ریال</p></div>
            </div>
          </section>

          <div className="dashboard-columns">
            <section className="quick-actions-section card-style">
              <h2>دسترسی سریع</h2>
              <button type="button" className="action-button"><FaFileInvoiceDollar className="action-icon" /> ثبت فاکتور جدید</button>
              <button type="button" className="action-button"><FaUserPlus className="action-icon" /> افزودن مشتری</button>
              <button type="button" className="action-button"><FaChartPie className="action-icon" /> مشاهده گزارشات</button>
              <button type="button" className="action-button"><FaCog className="action-icon" /> تنظیمات سیستم</button>
            </section>

            <section className="recent-transactions-section card-style">
              <h2>آخرین تراکنش‌ها</h2>
              {recentTransactions.length > 0 ? (
                <table>
                   <thead>
                    <tr>
                      <th>ردیف</th>
                      <th>نوع</th>
                      <th>تاریخ</th>
                      <th>مقدار/مبلغ</th>
                      <th>مشتری</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx, index) => (
                      <tr key={tx.id}>
                        <td>{(index + 1).toLocaleString('fa-IR')}</td>
                        <td>{tx.type}</td>
                        <td>{tx.date}</td>
                        <td>{tx.amount}</td>
                        <td>{tx.customer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data-message">تراکنشی برای نمایش وجود ندارد.</p>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

export default DashboardPage;