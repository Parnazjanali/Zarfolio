// src/components/DigitalClock.jsx
import React, { useState, useEffect } from 'react';
import './DigitalClock.css';
import { FaSun, FaMoon } from 'react-icons/fa';

// استایل پیش‌فرض اگر هیچ پراپی پاس داده نشود یا اگر استایل نامعتبر باشد.
// این استایل ساعت، دقیقه و ثانیه را بدون تاریخ نمایش می‌دهد.
const DEFAULT_STYLE_ID = 'styleHMS';

const DigitalClock = ({ styleId }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStyleId = styleId || DEFAULT_STYLE_ID;

  const getFormattedTime = (date, currentStyle) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    switch (currentStyle) {
      case 'styleHMS':
        return `${hours}:${minutes}:${seconds}`;
      case 'style1': // "کامل" از CLOCK_STYLES_CONFIG
        return `${hours}:${minutes}:${seconds}`;
      case 'style2': // "ساده" از CLOCK_STYLES_CONFIG
        return `${hours}:${minutes}`;
      case 'style3': // "مینیمال" از CLOCK_STYLES_CONFIG
        return hours;
      default:
        return `${hours}:${minutes}:${seconds}`;
    }
  };

  const getFormattedDate = (date, currentStyle) => {
    if (currentStyle === 'style1') { // فقط استایل "کامل" تاریخ دارد
      return date.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return null;
  };

  const timeToDisplay = getFormattedTime(currentTime, activeStyleId);
  const dateToDisplay = getFormattedDate(currentTime, activeStyleId);

  const currentHour = currentTime.getHours();
  const isDayTime = currentHour >= 6 && currentHour < 18; // تعریف روز از ۶ صبح تا ۶ عصر

  return (
    // کلاس‌های تم روز/شب به ویجت اصلی اضافه می‌شوند
    <div className={`digital-clock-widget style-${activeStyleId} ${isDayTime ? 'day-theme' : 'night-theme'}`}>
      <div className="time-display">{timeToDisplay}</div>
      {dateToDisplay && <div className="date-display">{dateToDisplay}</div>}
      <div className="day-night-icon">
        {isDayTime ? <FaSun className="sun-icon" title="روز" /> : <FaMoon className="moon-icon" title="شب" />}
      </div>
    </div>
  );
};

export default DigitalClock;