// src/components/DigitalClock.jsx
import React, { useState, useEffect } from 'react';
import './DigitalClock.css'; // استایل برای این کامپوننت

function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fa-IR', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div className="digital-clock-widget">
      <div className="time-display">{formatTime(time)}</div>
      <div className="date-display">{formatDate(time)}</div>
    </div>
  );
}

export default DigitalClock;