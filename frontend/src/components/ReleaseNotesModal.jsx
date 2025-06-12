// src/components/ReleaseNotesModal.jsx
import React, { useEffect } from 'react';
import './ReleaseNotesModal.css';
import Portal from './Portal';
import {
  FaTimes, FaGift, FaBug, FaThLarge, FaWrench, FaPalette,
  FaExchangeAlt, FaPlusCircle, FaListUl, FaClock, FaCalendarAlt,
  FaGripVertical, FaEdit as FaEditIcon, FaLock, FaBorderAll,
  FaThList, FaTh as FaThIcon
} from 'react-icons/fa';

const APP_VERSION = "0.0.3 beta";

const releaseNotesData = [
  {
    version: "0.0.3 beta",
    date: "۱۴۰۴/۰۳/۰۶", // تاریخ به‌روز شده
    title: "بهبودهای گسترده در چیدمان، ظاهر داشبورد، و قابلیت‌های جدید",
    changes: [
      { text: "بازطراحی و بهینه‌سازی کامل ظاهر ویجت تقویم جلالی برای افزایش چشمگیر خوانایی اعداد، بهبود فونت و نمایش بی‌نقص در اندازه‌های مختلف ویجت بدون نیاز به اسکرول داخلی.", icon: <FaPalette /> },
      { text: "اضافه شدن قابلیت انتخاب تعداد ستون‌های گرید داشبورد (۳، ۴ یا ۵ ستونه) از طریق کنترل دراپ‌داون جدید.", icon: <FaThList /> },
      { text: "بهبود اندازه و واکنش‌گرایی چهار کارت خلاصه اصلی داشبورد برای تناسب بهتر با محتوا و جلوگیری از بزرگی یا کوچکی بیش از حد.", icon: <FaThIcon /> },
      { text: "بهبود تضاد رنگ دسته جابجایی (Drag Handle) ویجت ساعت با پس‌زمینه آن.", icon: <FaGripVertical /> },
      { text: "رفع مشکل عملکرد کنترل دراپ‌داون گریدبندی هنگام باز بودن سایدبار با تنظیم صحیح z-index.", icon: <FaWrench /> },
      { text: "بهبود رفتار درگ آیتم‌ها: نمایش محو آیتم در حال جابجایی و جلوگیری از پراکندگی سایر آیتم‌ها قبل از رها کردن.", icon: <FaExchangeAlt />},
      { text: "اضافه شدن قابلیت قفل کردن المان‌های داشبورد برای جلوگیری از جابجایی ناخواسته.", icon: <FaLock /> },
      { text: "نمایش خطوط گرید راهنما در پس‌زمینه داشبورد بر اساس تعداد ستون‌های انتخابی.", icon: <FaBorderAll /> },
    ]
  },
  {
    version: "0.0.2 beta",
    date: "۱۴۰۳/۰۲/۱۵",
    title: "افزایش قابلیت‌های شخصی‌سازی و بهبودهای رابط کاربری",
    changes: [
      { text: "امکان فعال/غیرفعال کردن نمایش کارت‌های خلاصه در داشبورد از طریق مودال شخصی‌سازی.", icon: <FaWrench /> },
      { text: "بهبود رابط کاربری مودال شخصی‌سازی داشبورد.", icon: <FaEditIcon /> },
      { text: "رفع ایرادات جزئی نمایش در کارت ارزش تخمینی.", icon: <FaBug /> }
    ]
  },
  {
    version: "0.0.1 beta",
    date: "۱۴۰۳/۰۲/۰۱",
    title: "انتشار اولیه نرم‌افزار حسابداری زرفولیو",
    changes: [
      { text: "ارائه داشبورد اصلی با نمایش کارت‌های خلاصه عملکرد.", icon: <FaPlusCircle /> },
      { text: "ایجاد بخش دسترسی سریع و نمایش آخرین تراکنش‌ها.", icon: <FaListUl /> },
      { text: "افزودن قابلیت نمایش یادداشت‌های انتشار نسخه‌های نرم‌افزار.", icon: <FaGift /> }
    ]
  }
];

function ReleaseNotesModal({ onClose }) {
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
    };
  }, []);

  const handleReportBug = () => {
    window.location.href = `mailto:parnaz.janali@example.com?subject=گزارش ایراد - نسخه ${APP_VERSION} نرم افزار زرفولیو&body=لطفاً ایراد مشاهده شده را با جزئیات شرح دهید:%0D%0A%0D%0A`;
    onClose();
  };

  return (
    <Portal>
      <div className="modal-overlay release-notes-overlay" onClick={onClose}>
        <div className="modal-content release-notes-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2><FaGift style={{ marginLeft: '10px', color: '#e67e22' }} /> تازه‌های زرفولیو</h2>
            <button type="button" className="modal-close-button" onClick={onClose} aria-label="بستن">
              <FaTimes />
            </button>
          </div>
          <div className="modal-body">
            <p className="release-intro-text">
              از اینکه از آخرین نسخه نرم‌افزار حسابداری زرفولیو (نسخه <strong>{APP_VERSION}</strong>) استفاده می‌کنید، بسیار خرسندیم! تیم ما همواره در تلاش است تا با ارائه به‌روزرسانی‌های منظم، تجربه کاربری شما را بهبود بخشیده و امکانات جدیدی را فراهم آورد. در ادامه، لیست تغییرات و بهبودهای اعمال شده در نسخه‌های اخیر را مشاهده می‌کنید.
            </p>
            {releaseNotesData.map((release, index) => (
              <div key={index} className="release-entry">
                <div className="release-version-header">
                  <h3>نسخه {release.version}</h3>
                  {release.date && <span className="release-date">تاریخ انتشار: {release.date}</span>}
                </div>
                {release.title && <p className="release-main-title">{release.title}</p>}
                <ul>
                  {release.changes.map((change, idx) => (
                    <li key={idx}>
                      {change.icon && <span className="release-change-icon">{change.icon}</span>}
                      {change.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="release-feedback-text">
              ما به نظرات شما اهمیت زیادی می‌دهیم. در صورت مشاهده هرگونه ایراد یا داشتن پیشنهاد برای بهبود زرفولیو، لطفاً از طریق دکمه "گزارش ایراد" ما را مطلع سازید. مشارکت شما ما را در ساختن نرم‌افزاری هرچه بهتر یاری خواهد کرد.
              <br />
              با تشکر، تیم توسعه زرفولیو
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-action-button report-bug-button" onClick={handleReportBug}>
              <FaBug style={{ marginLeft: '8px' }}/> گزارش ایراد
            </button>
            <button type="button" className="modal-action-button primary" onClick={onClose}>
              متوجه شدم
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export default ReleaseNotesModal;