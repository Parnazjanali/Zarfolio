// src/components/ReleaseNotesModal.jsx
import React from 'react';
import './ReleaseNotesModal.css';
import { FaTimes, FaRocket, FaCheckCircle, FaBug } from 'react-icons/fa'; // Added FaBug

function ReleaseNotesModal({ onClose }) {
  const releaseNotes = [
    "بهبود عملکرد کلی سیستم و افزایش سرعت بارگذاری.",
    "اضافه شدن بخش تنظیمات جامع با قابلیت سفارشی‌سازی فاکتور.",
    "طراحی جدید صفحه ورود با امکان نمایش عکس و لینک‌های اجتماعی.",
    "بهبود رابط کاربری نوار کناری با قابلیت باز و بسته شدن و زیرمنوها.",
    "رفع برخی ایرادات جزئی گزارش شده."
  ];

  const handleReportBug = () => {
    // Option 1: Open mail client
    window.location.href = "mailto:parnaz.janali@example.com?subject=گزارش ایراد در نسخه 0.0.2 beta&body=لطفاً ایراد مشاهده شده را با جزئیات شرح دهید:%0D%0A%0D%0A";
    // Option 2: Navigate to a bug report page (if you have one)
    // navigate('/report-bug');
    // Option 3: Open a different modal for bug reporting
    // alert("قابلیت گزارش ایراد به زودی اضافه خواهد شد!");
    onClose(); // Close the current modal after action
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="بستن">
          <FaTimes />
        </button>
        <div className="modal-header">
          <FaRocket className="modal-header-icon" />
          <h2>به‌روزرسانی جدید زرفولیو (نسخه 0.0.2 beta)</h2>
        </div>
        <div className="modal-body">
          <p>از اینکه از زرفولیو استفاده می‌کنید سپاسگزاریم! در این نسخه تغییرات و بهبودهای زیر اعمال شده است:</p>
          <ul>
            {releaseNotes.map((note, index) => (
              <li key={index}><FaCheckCircle className="list-icon" /> {note}</li>
            ))}
          </ul>
          <p>امیدواریم از کار با نسخه جدید لذت ببرید.</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="modal-action-button report-bug-button" onClick={handleReportBug}>
            <FaBug style={{ marginLeft: '8px', fontSize:'0.9em' }}/> گزارش ایراد
          </button>
          <button type="button" className="modal-action-button primary" onClick={onClose}>
            متوجه شدم!
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReleaseNotesModal;