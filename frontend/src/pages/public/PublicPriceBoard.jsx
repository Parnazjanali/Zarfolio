// frontend/src/pages/public/PublicPriceBoard.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Spin, Alert } from 'antd';
import { FaSun } from 'react-icons/fa';
import './PublicPriceBoard.css';

// کامپوننت‌های کمکی
const PriceBox = ({ title, finalPrice, trend }) => {
    const trendClass = trend === 'up' ? 'highlight-up' : trend === 'down' ? 'highlight-down' : '';
    return (
        <div className={`price-box ${trendClass}`}>
            <div className="price-title">{title}</div>
            <div className="price-values">
                <span className="price-value single">{finalPrice}</span>
            </div>
        </div>
    );
};

const AnalogClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    const seconds = time.getSeconds(), minutes = time.getMinutes(), hours = time.getHours();
    const secondsDegrees = ((seconds / 60) * 360) + 90;
    const minutesDegrees = ((minutes / 60) * 360) + ((seconds / 60) * 6) + 90;
    const hoursDegrees = ((hours / 12) * 360) + ((minutes / 60) * 30) + 90;
    return (
        <div className="analog-clock">
            <div className="hand hour-hand" style={{ transform: `rotate(${hoursDegrees}deg)` }}></div>
            <div className="hand minute-hand" style={{ transform: `rotate(${minutesDegrees}deg)` }}></div>
            <div className="hand second-hand" style={{ transform: `rotate(${secondsDegrees}deg)` }}></div>
            <div className="center-dot"></div>
        </div>
    );
};


const PublicPriceBoard = () => {
    const [displayItems, setDisplayItems] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState('');
    const previousPrices = useRef({});

    const formatPrice = (num, unit = '') => {
        const roundedNum = Math.round(num);
        const formatted = new Intl.NumberFormat('fa-IR').format(roundedNum);
        return `${formatted} ${unit}`.trim();
    };

    const prepareDisplayData = useCallback(() => {
        setLoading(true);
        setError(null);

        const savedConfig = JSON.parse(localStorage.getItem('priceBoardConfig'));
        const lastApiData = JSON.parse(localStorage.getItem('lastApiData'));

        if (!savedConfig) {
            setError("تنظیمات تابلو هنوز پیکربندی نشده است. لطفاً به پنل مدیریت مراجعه کنید.");
            setLoading(false);
            return;
        }
        if (!lastApiData) {
            setError("داده‌ای از سرور دریافت نشده است. لطفاً در پنل مدیریت، یکبار داده‌ها را دریافت کنید.");
            setLoading(false);
            return;
        }
        
        setConfig(savedConfig);
        const allApiItems = [...lastApiData.gold, ...lastApiData.currency, ...lastApiData.cryptocurrency];

        const itemsToDisplay = (savedConfig.activeItems || []).map(configItem => {
            const apiItem = allApiItems.find(i => i.symbol === configItem.symbol);
            if (!apiItem) return null;

            const basePrice = apiItem.price;
            const percentAdjustment = basePrice * (configItem.adjustmentPercent / 100);
            const valueAdjustment = configItem.adjustmentValue || 0;
            const finalPrice = basePrice + percentAdjustment + valueAdjustment;
            
            const oldPrice = previousPrices.current[configItem.symbol];
            let trend = '';
            if (oldPrice && oldPrice < finalPrice) trend = 'up';
            if (oldPrice && oldPrice > finalPrice) trend = 'down';
            previousPrices.current[configItem.symbol] = finalPrice;
            
            return {
                id: configItem.symbol,
                title: configItem.name,
                finalPrice: formatPrice(finalPrice, configItem.unit !== 'تومان' ? configItem.unit : ''),
                trend: trend
            };
        }).filter(Boolean);

        setDisplayItems(itemsToDisplay);
        setLoading(false);
    }, []);

    useEffect(() => {
        prepareDisplayData();

        const handleStorageChange = (event) => {
            if (event.key === 'lastApiData' || event.key === 'priceBoardConfig') {
                prepareDisplayData();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        const clockInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })), 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(clockInterval);
        };
    }, [prepareDisplayData]);

    if (loading) {
        return <div className="status-message"><Spin size="large" /></div>;
    }
    if (error) {
        return <Alert message="خطا" description={error} type="error" showIcon style={{ margin: '50px' }} />;
    }

    return (
        <div className="aramis-board-container">
             <aside className="left-sidebar">
                <div className="sidebar-header">
                    <div className="logo-title">{config?.galleryName || 'گالری'}</div>
                </div>
                <div className="time-container">
                    <div className="time-display">
                        <ClockCircleOutlined />
                        <span>{currentTime}</span>
                    </div>
                    {config?.showAnalogClock && <AnalogClock />}
                </div>
                {config?.showWeatherWidget && (
                    <div className="weather-widget">
                        <FaSun className="weather-icon" />
                        <div className="weather-temp">۳۷°C</div>
                    </div>
                )}
             </aside>
             <main className="main-grid">
                {displayItems.map(item => <PriceBox key={item.id} {...item} />)}
             </main>
        </div>
    );
};

export default PublicPriceBoard;