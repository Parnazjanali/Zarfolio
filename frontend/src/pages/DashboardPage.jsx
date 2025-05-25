// src/pages/DashboardPage.jsx
import React from 'react'; // Removed useState, useEffect, useRef as they are now in Sidebar
import './DashboardPage.css';
// Icons for summary cards are still needed if not passed as props
import {
  FaBalanceScale, FaMoneyBillWave, FaFileAlt, FaTag,
  FaFileInvoiceDollar, FaUserPlus, FaChartPie, FaCog // Icons for quick actions
} from 'react-icons/fa';


function DashboardPage() {
  // Dummy data
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
    // The .dashboard-container class can still be used for overall page padding/styling if needed,
    // but the header is gone.
    <div className="dashboard-page-content"> {/* Renamed for clarity, or use .dashboard-main-content directly */}
      {/* Optional: A specific header for the content area if needed, e.g., current page title */}
      {/* <div className="content-area-header">
        <h1>{currentPageTitleFromContextOrProps}</h1>
      </div> */}

      <main className="dashboard-main-content">
        <section className="summary-cards-section">
          <div className="summary-card">
            <div className="card-icon-container gold">
              <FaBalanceScale className="card-icon" />
            </div>
            <div className="card-content">
              <h3>موجودی کل طلا</h3>
              <p>{summaryData.goldBalance.toLocaleString('fa-IR')} گرم</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon-container value">
              <FaMoneyBillWave className="card-icon" />
            </div>
            <div className="card-content">
              <h3>ارزش تخمینی موجودی</h3>
              <p>{summaryData.estimatedValue.toLocaleString('fa-IR')} ریال</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon-container invoices">
              <FaFileAlt className="card-icon" />
            </div>
            <div className="card-content">
              <h3>فاکتورهای امروز</h3>
              <p>{summaryData.todayInvoices.toLocaleString('fa-IR')}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon-container price">
              <FaTag className="card-icon" />
            </div>
            <div className="card-content">
              <h3>آخرین قیمت طلا (هر گرم)</h3>
              <p>{summaryData.lastGoldPrice.toLocaleString('fa-IR')} ریال</p>
            </div>
          </div>
        </section>

        <div className="dashboard-columns">
          <section className="quick-actions-section card-style">
            <h2>دسترسی سریع</h2>
            <button className="action-button"><FaFileInvoiceDollar className="action-icon" /> ثبت فاکتور جدید</button>
            <button className="action-button"><FaUserPlus className="action-icon" /> افزودن مشتری</button>
            <button className="action-button"><FaChartPie className="action-icon" /> مشاهده گزارشات</button>
            <button className="action-button"><FaCog className="action-icon" /> تنظیمات سیستم</button>
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
  );
}

export default DashboardPage;