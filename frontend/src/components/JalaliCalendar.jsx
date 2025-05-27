// src/components/JalaliCalendar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import jalaali from 'jalaali-js';
import './JalaliCalendar.css'; // از CSS جدید استفاده می کند
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SAMPLE_EVENTS_DATA = {
  '1403': { 
    '3': { 
      '1': { text: 'ولادت حضرت معصومه (س) و روز دختران', type: 'event' },
      '14': { text: 'رحلت امام خمینی (ره)', type: 'holiday' },
      '15': { text: 'قیام خونین ۱۵ خرداد', type: 'holiday' },
    }, 
    '12': { 
        '29': { text: 'روز ملی شدن صنعت نفت', type: 'holiday'}
    }
  },
  '1404': { 
      '1': { 
          '1': { text: 'آغاز سال ۱۴۰۴ و عید نوروز', type: 'holiday'}
      }
  }
};

const MonthHeader = ({ currentMonthJ, onPrevMonth, onNextMonth }) => {
  const monthNames = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];
  return (
    <div className="calendar-header">
      <button onClick={onPrevMonth} className="nav-button prev-month" aria-label="ماه قبل">
        <FaChevronRight />
      </button>
      <div className="month-year-container">
        <span className="month-name">{monthNames[currentMonthJ.jm - 1]}</span>
        <span className="year-name">{currentMonthJ.jy.toLocaleString('fa-IR', {useGrouping: false})}</span>
      </div>
      <button onClick={onNextMonth} className="nav-button next-month" aria-label="ماه بعد">
        <FaChevronLeft />
      </button>
    </div>
  );
};

const DaysOfWeek = () => { /* ... (بدون تغییر از پاسخ قبلی) ... */ 
  const dayNames = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  return (
    <div className="days-of-week">
      {dayNames.map(day => <div key={day} className="day-name">{day}</div>)}
    </div>
  );
};


const CalendarDays = ({ currentMonthJ, todayJ, eventsData, onDayClick }) => { /* ... (بدون تغییر از پاسخ قبلی، فقط toLocaleString اصلاح شد) ... */ 
  const daysInMonth = jalaali.jalaaliMonthLength(currentMonthJ.jy, currentMonthJ.jm);
  const firstDayOfMonthJ = { jy: currentMonthJ.jy, jm: currentMonthJ.jm, jd: 1 };
  const firstDayOfMonthG = jalaali.toGregorian(firstDayOfMonthJ.jy, firstDayOfMonthJ.jm, 1);
  let startDayOfWeek = new Date(firstDayOfMonthG.gy, firstDayOfMonthG.gm - 1, firstDayOfMonthG.gd).getDay();
  startDayOfWeek = (startDayOfWeek + 1) % 7; 

  const blanks = Array(startDayOfWeek).fill(null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isToday = (day) => todayJ.jy === currentMonthJ.jy && todayJ.jm === currentMonthJ.jm && todayJ.jd === day;
  
  const getEventForDay = (day) => {
    const yearEvents = eventsData[currentMonthJ.jy.toString()];
    if (yearEvents) {
      const monthEvents = yearEvents[currentMonthJ.jm.toString()];
      if (monthEvents) {
        return monthEvents[day.toString()];
      }
    }
    return null;
  };

  return (
    <div className="calendar-grid">
      {blanks.map((_, i) => <div key={`blank-${i}`} className="day-cell empty"></div>)}
      {daysArray.map(day => {
        const eventInfo = getEventForDay(day);
        const eventText = eventInfo ? eventInfo.text : '';
        const eventType = eventInfo ? eventInfo.type : '';
        return (
          <div
            key={day}
            className={`day-cell ${isToday(day) ? 'today' : ''} ${eventText ? 'has-event' : ''} ${eventType === 'holiday' ? 'official-holiday' : ''}`}
            onClick={() => onDayClick(day, eventText)}
            title={eventText || `روز ${day.toLocaleString('fa-IR', {useGrouping: false})}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onDayClick(day, eventText);}}
          >
            <span className="day-number">{day.toLocaleString('fa-IR', {useGrouping: false})}</span>
          </div>
        );
      })}
    </div>
  );
};

const MonthEventsList = ({ currentMonthJ, eventsData }) => { /* ... (بدون تغییر از پاسخ قبلی، فقط toLocaleString اصلاح شد) ... */ 
  const monthEvents = useMemo(() => { 
    const yearStr = currentMonthJ.jy.toString();
    const monthStr = currentMonthJ.jm.toString();
    if (eventsData[yearStr] && eventsData[yearStr][monthStr]) {
      return Object.entries(eventsData[yearStr][monthStr])
        .map(([day, eventInfo]) => ({
          day: parseInt(day, 10),
          text: eventInfo.text,
          type: eventInfo.type,
        }))
        .sort((a, b) => a.day - b.day);
    }
    return [];
  }, [currentMonthJ, eventsData]);


  if (monthEvents.length === 0) {
    return (
        <div className="month-events-list empty">
             {/* <p>مناسبتی برای این ماه ثبت نشده است.</p> */}
        </div>
    );
  }

  const monthName = jalaali.jalaaliMonthLength(currentMonthJ.jy, currentMonthJ.jm) > 0 // برای جلوگیری از خطا اگر ماه نامعتبر باشد
    ? new Date(jalaali.toGregorian(currentMonthJ.jy, currentMonthJ.jm, 1).gy, currentMonthJ.jm-1).toLocaleDateString('fa-IR', { month: 'long'})
    : "";


  return (
    <div className="month-events-list">
      <h4>مناسبت‌های {monthName}</h4>
      <ul>
        {monthEvents.map(event => (
          <li key={event.day} className={event.type === 'holiday' ? 'official-holiday-text' : ''}>
            <span className="event-day">{event.day.toLocaleString('fa-IR', {useGrouping: false})}:</span> {event.text}
          </li>
        ))}
      </ul>
    </div>
  );
};


function JalaliCalendar() { /* ... (بدون تغییر از پاسخ قبلی که خطا نداشت) ... */ 
  const todayJalaali = jalaali.toJalaali(new Date());
  const [currentMonth, setCurrentMonth] = useState({ jy: todayJalaali.jy, jm: todayJalaali.jm });
  const [activeDayEvent, setActiveDayEvent] = useState('');

  const [eventsData, setEventsData] = useState(SAMPLE_EVENTS_DATA);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      let newJy = prev.jy;
      let newJm = prev.jm - 1;
      if (newJm < 1) { newJm = 12; newJy -= 1; }
      return { jy: newJy, jm: newJm };
    });
    setActiveDayEvent('');
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      let newJy = prev.jy;
      let newJm = prev.jm + 1;
      if (newJm > 12) { newJm = 1; newJy += 1; }
      return { jy: newJy, jm: newJm };
    });
    setActiveDayEvent('');
  };

  const handleDayClick = (day, eventText) => {
    if (eventText) {
        setActiveDayEvent(`روز ${day.toLocaleString('fa-IR', {useGrouping: false})}: ${eventText}`);
    } else {
        setActiveDayEvent('');
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      const calendarWidget = event.target.closest('.jalali-calendar-widget');
      if (activeDayEvent && !calendarWidget && !event.target.closest('.selected-day-event-tooltip')) { // بررسی اینکه روی خود tooltip هم کلیک نشده باشد
        setActiveDayEvent('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // window.addEventListener('scroll', () => setActiveDayEvent(''), true); // این ممکن است خیلی سریع tooltip را ببندد
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        // window.removeEventListener('scroll', () => setActiveDayEvent(''), true);
    };
  }, [activeDayEvent]);


  return (
    <div className="jalali-calendar-widget">
      <MonthHeader 
        currentMonthJ={currentMonth} 
        onPrevMonth={handlePrevMonth} 
        onNextMonth={handleNextMonth} 
      />
      <DaysOfWeek />
      <CalendarDays 
        currentMonthJ={currentMonth} 
        todayJ={todayJalaali} 
        eventsData={eventsData}
        onDayClick={handleDayClick}
      />
      <MonthEventsList currentMonthJ={currentMonth} eventsData={eventsData} />
      {activeDayEvent && (
        <div className={`selected-day-event-tooltip ${activeDayEvent ? 'active' : ''}`}>
          {activeDayEvent}
        </div>
      )}
    </div>
  );
}

export default JalaliCalendar;