// src/components/JalaliCalendar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import jalaali from 'jalaali-js';
import './JalaliCalendar.css'; //
import { FaChevronLeft, FaChevronRight, FaCalendarDay } from 'react-icons/fa'; // FaCalendarDay اضافه شد

// ... (بقیه کد SAMPLE_EVENTS_DATA و JALAALI_MONTH_NAMES بدون تغییر)
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


// کامپوننت MonthHeader
const MonthHeader = ({ currentMonthJ, onPrevMonth, onNextMonth, onGoToToday }) => ( // onGoToToday اضافه شد
  <div className="calendar-header">
    <button onClick={onPrevMonth} className="nav-button" title="ماه قبل">
      <FaChevronRight />
    </button>
    <div className="month-year-container">
      <span className="month-name">{JALAALI_MONTH_NAMES[currentMonthJ.jm - 1]}</span>
      <span className="year-name">{currentMonthJ.jy.toLocaleString('fa').replace(/٬/g, '')}</span>
    </div>
    {/* دکمه "رفتن به امروز" */}
    <button onClick={onGoToToday} className="nav-button today-button" title="رفتن به امروز">
      <FaCalendarDay />
    </button>
    <button onClick={onNextMonth} className="nav-button" title="ماه بعد">
      <FaChevronLeft />
    </button>
  </div>
);

// ... (کامپوننت DaysOfWeek بدون تغییر)
const DaysOfWeek = () => (
  <div className="days-of-week">
    {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(day => (
      <div key={day} className="day-name">{day}</div>
    ))}
  </div>
);


// کامپوننت CalendarDays
const CalendarDays = ({ currentMonthJ, todayJ, eventsData, onDayClick, onDayHover, activeDayEvent }) => {
  // ... (منطق داخلی generateCalendarDays بدون تغییر باقی می‌ماند، فقط startDayOffset را بررسی کنید)
  const generateCalendarDays = () => {
    const daysArray = [];
    const { jy, jm } = currentMonthJ;
    const daysInMonth = jalaali.jalaaliMonthLength(jy, jm);
    
    // محاسبه صحیح آفست برای شروع هفته از شنبه
    const firstDayGregorian = jalaali.toGregorian(jy, jm, 1);
    const firstDayDateObject = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
    let dayOfWeek = firstDayDateObject.getDay(); // 0 = یکشنبه, ..., 6 = شنبه
    const startDayOffset = (dayOfWeek === 6) ? 0 : dayOfWeek + 1; // شنبه ایندکس 0

    for (let i = 0; i < startDayOffset; i++) {
      daysArray.push({ type: 'empty', key: `empty-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${jy}/${jm}/${day}`;
      const isToday = jy === todayJ.jy && jm === todayJ.jm && day === todayJ.jd;
      const dayEvents = eventsData[dateStr] || [];
      const isHoliday = dayEvents.some(event => event.type === 'official');
      
      daysArray.push({
        type: 'day',
        key: dateStr,
        number: day,
        isToday,
        isHoliday,
        hasEvent: dayEvents.length > 0,
        eventText: dayEvents.map(e => e.text).join('، ')
      });
    }
    // پر کردن سلول‌های خالی انتهای ماه برای داشتن ۶ ردیف کامل (اختیاری، اما برای ظاهر بهتر)
    const totalCells = 42; // 6 ردیف * 7 روز
    while (daysArray.length < totalCells && daysArray.length % 7 !== 0) {
         daysArray.push({ type: 'empty', key: `empty-end-${daysArray.length}` });
    }
    // اگر می‌خواهید همیشه ۶ ردیف باشد، حتی اگر ماه ۵ ردیف را پر کند:
    // while (daysArray.length < 42) { // 6 * 7
    //    daysArray.push({ type: 'empty', key: `empty-end-${daysArray.length}` });
    // }


    return daysArray;
  };

  const days = generateCalendarDays();

  return (
    <div className="calendar-grid">
      {days.map((dayInfo) => {
        if (dayInfo.type === 'empty') {
          return <div key={dayInfo.key} className="day-cell empty"></div>;
        }
        return (
          <div
            key={dayInfo.key}
            className={`day-cell 
              ${dayInfo.isToday ? 'today' : ''} 
              ${dayInfo.isHoliday ? 'official-holiday' : ''}
              ${dayInfo.hasEvent ? 'has-event' : ''}
            `}
            onClick={() => onDayClick(dayInfo.number, dayInfo.eventText)}
            onMouseEnter={() => onDayHover(dayInfo.eventText)}
            onMouseLeave={() => onDayHover('')}
          >
            <span className="day-number">{dayInfo.number.toLocaleString('fa').replace(/٬/g, '')}</span>
            {activeDayEvent && dayInfo.eventText === activeDayEvent && (
              <div className="day-tooltip">{activeDayEvent}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ... (کامپوننت MonthEventsList بدون تغییر)
const MonthEventsList = ({ events, currentMonthName }) => {
  if (!events || events.length === 0) {
    return (
      <div className="month-events-list no-events">
        <p>رویدادی برای ماه {currentMonthName} ثبت نشده است.</p>
      </div>
    );
  }
  return (
    <div className="month-events-list">
      <h4>رویدادهای ماه {currentMonthName}</h4>
      <ul>
        {events.map((event, index) => (
          <li key={index} className={event.isHoliday ? 'official-holiday-text' : ''}>
            <span className="event-day">{event.day.toLocaleString('fa').replace(/٬/g, '')}</span>
            {event.text}
          </li>
        ))}
      </ul>
    </div>
  );
};


// کامپوننت اصلی JalaliCalendar
const JalaliCalendar = ({ styleId = 'full', themeId = 'default', eventsData = SAMPLE_EVENTS_DATA }) => {
  const todayJalaali = useMemo(() => jalaali.toJalaali(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState({ jy: todayJalaali.jy, jm: todayJalaali.jm });
  const [activeDayEvent, setActiveDayEvent] = useState('');

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

  // <<<< تابع جدید برای بازگشت به امروز >>>>
  const handleGoToToday = () => {
    setCurrentMonth({ jy: todayJalaali.jy, jm: todayJalaali.jm });
  };
  
  const handleDayClick = (day, eventText) => {
    if (eventText) {
      setActiveDayEvent(eventText);
    } else {
      setActiveDayEvent('');
    }
  };

  useEffect(() => {
    if (activeDayEvent) {
      const timer = setTimeout(() => setActiveDayEvent(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [activeDayEvent]);

  const showHeader = styleId === 'full' || styleId === 'compact';
  const showEventsList = styleId === 'full';

  const monthEvents = useMemo(() => {
    if (!showEventsList) return [];
    const events = [];
    for (let day = 1; day <= 31; day++) {
      const dateStr = `${currentMonth.jy}/${currentMonth.jm}/${day}`;
      if (eventsData[dateStr]) {
        eventsData[dateStr].forEach(event => {
          events.push({ day, text: event.text, isHoliday: event.type === 'official' });
        });
      }
    }
    return events;
  }, [currentMonth, eventsData, showEventsList]);

  return (
    <div className={`jalali-calendar-widget calendar-style-${styleId} calendar-theme-${themeId}`}>
      {showHeader && (
        <MonthHeader
          currentMonthJ={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToToday={handleGoToToday} // <<<< پاس دادن تابع به هدر >>>>
        />
      )}
      <DaysOfWeek />
      <CalendarDays
        currentMonthJ={currentMonth}
        todayJ={todayJalaali}
        eventsData={eventsData}
        onDayClick={handleDayClick}
        onDayHover={setActiveDayEvent} // ساده‌سازی برای نمایش tooltip
        activeDayEvent={activeDayEvent}
      />
      {showEventsList && (
        <MonthEventsList 
          events={monthEvents} 
          currentMonthName={JALAALI_MONTH_NAMES[currentMonth.jm - 1]} 
        />
      )}
    </div>
  );
};

export default JalaliCalendar;