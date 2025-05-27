// src/components/JalaliCalendar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import jalaali from 'jalaali-js';
import './JalaliCalendar.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SAMPLE_EVENTS_DATA = { /* ... (بدون تغییر) ... */ }; // همان داده‌های نمونه قبلی

const MonthHeader = ({ currentMonthJ, onPrevMonth, onNextMonth }) => { /* ... (بدون تغییر) ... */ };
const DaysOfWeek = () => { /* ... (بدون تغییر) ... */ };
const CalendarDays = ({ currentMonthJ, todayJ, eventsData, onDayClick }) => { /* ... (بدون تغییر) ... */ };
const MonthEventsList = ({ currentMonthJ, eventsData }) => { /* ... (بدون تغییر) ... */ };

// کامپوننت اصلی تقویم
function JalaliCalendar({ styleId = 'full' }) { // اضافه شدن پراپ styleId با مقدار پیش‌فرض
  const todayJalaali = jalaali.toJalaali(new Date());
  const [currentMonth, setCurrentMonth] = useState({ jy: todayJalaali.jy, jm: todayJalaali.jm });
  const [activeDayEvent, setActiveDayEvent] = useState('');
  const [eventsData, setEventsData] = useState(SAMPLE_EVENTS_DATA);

  const handlePrevMonth = () => { /* ... (بدون تغییر) ... */ };
  const handleNextMonth = () => { /* ... (بدون تغییر) ... */ };
  const handleDayClick = (day, eventText) => { /* ... (بدون تغییر) ... */ };

  useEffect(() => { /* ... (افکت بستن tooltip بدون تغییر) ... */ }, [activeDayEvent]);

  const showHeader = styleId === 'full' || styleId === 'compact';
  const showEventsList = styleId === 'full';

  return (
    // اضافه کردن کلاس بر اساس styleId
    <div className={`jalali-calendar-widget calendar-style-${styleId}`}>
      {showHeader && (
        <MonthHeader
          currentMonthJ={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      )}
      <DaysOfWeek />
      <CalendarDays
        currentMonthJ={currentMonth}
        todayJ={todayJalaali}
        eventsData={eventsData}
        onDayClick={handleDayClick}
      />
      {showEventsList && (
        <MonthEventsList currentMonthJ={currentMonth} eventsData={eventsData} />
      )}
      {activeDayEvent && (
        <div className={`selected-day-event-tooltip ${activeDayEvent ? 'active' : ''}`}>
          {activeDayEvent}
        </div>
      )}
    </div>
  );
}

export default JalaliCalendar;