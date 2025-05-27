// src/components/JalaliCalendar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import jalaali from 'jalaali-js';
import './JalaliCalendar.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SAMPLE_EVENTS_DATA = {
  '1403/3/5': [{ type: 'official', text: 'رحلت امام خمینی (ره)' }],
  '1403/3/6': [{ type: 'official', text: 'قیام ۱۵ خرداد' }],
  '1403/3/29': [{ type: 'personal', text: 'تولد یک دوست' }, { type: 'official', text: 'عید قربان' }],
  '1403/4/7': [{ type: 'official', text: 'عید غدیر خم' }],
  '1403/4/15': [{ type: 'personal', text: 'سالگرد ازدواج' }],
  '1403/5/5': [{ type: 'official', text: 'تاسوعای حسینی' }],
  '1403/5/6': [{ type: 'official', text: 'عاشورای حسینی' }],
};

const JALAALI_MONTH_NAMES = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

const MonthHeader = ({ currentMonthJ, onPrevMonth, onNextMonth }) => {
  return (
    <div className="calendar-header">
      <button onClick={onPrevMonth} className="nav-button" aria-label="ماه قبل">
        <FaChevronRight />
      </button>
      <div className="month-year-container">
        <span className="month-name">{JALAALI_MONTH_NAMES[currentMonthJ.jm - 1]}</span>
        <span className="year-name">{currentMonthJ.jy.toLocaleString('fa-IR', { useGrouping: false })}</span>
      </div>
      <button onClick={onNextMonth} className="nav-button" aria-label="ماه بعد">
        <FaChevronLeft />
      </button>
    </div>
  );
};

const DaysOfWeek = () => {
  const dayNames = ["ش", "ی", "د", "س", "چ", "پ", "ج"]; // شنبه اول هفته
  return (
    <div className="days-of-week">
      {dayNames.map(day => <div key={day} className="day-name">{day}</div>)}
    </div>
  );
};

const CalendarDays = ({ currentMonthJ, todayJ, eventsData, onDayClick }) => {
  const monthInfo = jalaali.jalaaliMonthLength(currentMonthJ.jy, currentMonthJ.jm);
  const firstDayOfMonthGregorian = jalaali.toGregorian(currentMonthJ.jy, currentMonthJ.jm, 1);
  // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  let firstDayWeekday = new Date(firstDayOfMonthGregorian.gy, firstDayOfMonthGregorian.gm - 1, firstDayOfMonthGregorian.gd).getDay();
  
  // Adjust for Saturday start in Persian calendar (0 for Saturday, 1 for Sunday, ..., 6 for Friday)
  firstDayWeekday = (firstDayWeekday + 1) % 7;

  const daysInMonth = Array.from({ length: monthInfo }, (_, i) => i + 1);
  const leadingEmptyDays = Array.from({ length: firstDayWeekday }, (_, i) => `empty-start-${i}`);

  const totalCells = firstDayWeekday + monthInfo;
  const trailingEmptyDaysCount = (7 - (totalCells % 7)) % 7;
  const trailingEmptyDays = Array.from({ length: trailingEmptyDaysCount }, (_, i) => `empty-end-${i}`);

  return (
    <div className="calendar-grid">
      {leadingEmptyDays.map(dayKey => <div key={dayKey} className="day-cell empty"></div>)}
      {daysInMonth.map(day => {
        const dayKey = `${currentMonthJ.jy}/${currentMonthJ.jm}/${day}`;
        const isToday = day === todayJ.jd && currentMonthJ.jm === todayJ.jm && currentMonthJ.jy === todayJ.jy;
        const dayEvents = eventsData[dayKey] || [];
        const hasOfficialHoliday = dayEvents.some(event => event.type === 'official');
        const eventTextForTooltip = dayEvents.map(e => e.text).join('، ');

        return (
          <div
            key={day}
            className={`day-cell ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-event' : ''} ${hasOfficialHoliday ? 'official-holiday' : ''}`}
            onClick={() => onDayClick(day, eventTextForTooltip)}
            role="button"
            tabIndex={0}
            aria-label={`${day} ${JALAALI_MONTH_NAMES[currentMonthJ.jm - 1]}${eventTextForTooltip ? ', رویداد: ' + eventTextForTooltip : ''}`}
            onKeyPress={(e) => e.key === 'Enter' && onDayClick(day, eventTextForTooltip)}
          >
            <span className="day-number">{day.toLocaleString('fa-IR', { useGrouping: false })}</span>
          </div>
        );
      })}
      {trailingEmptyDays.map(dayKey => <div key={dayKey} className="day-cell empty"></div>)}
    </div>
  );
};

const MonthEventsList = ({ currentMonthJ, eventsData }) => {
  const eventsInMonth = Object.entries(eventsData)
    .filter(([dateKey]) => {
      const [jy, jm] = dateKey.split('/').map(Number);
      return jy === currentMonthJ.jy && jm === currentMonthJ.jm;
    })
    .flatMap(([dateKey, events]) =>
      events.map(event => ({ ...event, day: parseInt(dateKey.split('/')[2], 10) }))
    )
    .sort((a, b) => a.day - b.day);

  if (eventsInMonth.length === 0) {
    return <div className="month-events-list" style={{ textAlign: 'center', fontSize: '0.9em', color: '#777', paddingTop: '10px' }}>رویدادی برای این ماه ثبت نشده است.</div>;
  }

  return (
    <div className="month-events-list">
      <h4>رویدادهای {JALAALI_MONTH_NAMES[currentMonthJ.jm - 1]}</h4>
      <ul>
        {eventsInMonth.map((event, index) => (
          <li key={index} className={event.type === 'official' ? 'official-holiday-text' : ''}>
            <span className="event-day">{event.day.toLocaleString('fa-IR')}:</span> {event.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

// کامپوننت اصلی تقویم
function JalaliCalendar({ styleId = 'full', themeId = 'default' }) { // اضافه شدن پراپ themeId
  const todayJalaali = jalaali.toJalaali(new Date());
  const [currentMonth, setCurrentMonth] = useState({ jy: todayJalaali.jy, jm: todayJalaali.jm });
  const [activeDayEvent, setActiveDayEvent] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [eventsData, setEventsData] = useState(SAMPLE_EVENTS_DATA); // رویدادها می‌توانند از props یا API دریافت شوند

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      let newJy = prev.jy;
      let newJm = prev.jm - 1;
      if (newJm < 1) {
        newJm = 12;
        newJy -= 1;
      }
      return { jy: newJy, jm: newJm };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      let newJy = prev.jy;
      let newJm = prev.jm + 1;
      if (newJm > 12) {
        newJm = 1;
        newJy += 1;
      }
      return { jy: newJy, jm: newJm };
    });
  };
  
  const handleDayClick = (day, eventText) => {
    // console.log(`Day clicked: ${day}, Event: ${eventText}`);
    if (eventText) {
      setActiveDayEvent(eventText);
    } else {
      setActiveDayEvent(''); // Clear if no event
    }
  };

  useEffect(() => {
    if (activeDayEvent) {
      const timer = setTimeout(() => setActiveDayEvent(''), 3000); // Auto-hide tooltip after 3s
      return () => clearTimeout(timer);
    }
  }, [activeDayEvent]);

  const showHeader = styleId === 'full' || styleId === 'compact';
  const showEventsList = styleId === 'full';

  return (
    // اضافه کردن کلاس بر اساس styleId و themeId
    <div className={`jalali-calendar-widget calendar-style-${styleId} calendar-theme-${themeId}`}>
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
        <div className="day-tooltip">
          {activeDayEvent}
        </div>
      )}
    </div>
  );
}

export default JalaliCalendar;