// src/components/ChequeAlertWidget.jsx
import React from 'react';
import { FaMoneyCheckAlt } from 'react-icons/fa';
import './ChequeAlertWidget.css'; // فایل CSS مخصوص این کامپوننت را ایجاد و ایمپورت کنید

const ChequeAlertWidget = () => {
    const upcomingCheques = [
        { id: 1, amount: '۵,۰۰۰,۰۰۰ تومان', dueDate: '۱۴۰۳/۰۳/۱۰', party: 'شرکت الف' },
        { id: 2, amount: '۱۲,۳۰۰,۰۰۰ تومان', dueDate: '۱۴۰۳/۰۳/۱۵', party: 'فروشگاه ب' },
      ];
      return (
        <div className="cheque-alert-widget">
          <h4><FaMoneyCheckAlt />چک‌های نزدیک به سررسید</h4> {/* استایل آیکون به CSS منتقل شود */}
          {upcomingCheques.length > 0 ? (
            <ul>
              {upcomingCheques.map(cheque => (
                <li key={cheque.id}>
                  <span className="cheque-amount">{cheque.amount}</span>
                  <span className="cheque-party"> - {cheque.party}</span>
                  <span className="cheque-due-date">سررسید: {cheque.dueDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>چک نزدیک به سررسیدی وجود ندارد.</p>
          )}
        </div>
      );
};

export default ChequeAlertWidget;